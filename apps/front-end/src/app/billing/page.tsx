"use client";

import { Button, Card, CardContent, CardHeader } from "@yt/ui";
import { useQuery } from "@tanstack/react-query";
import { billsApi } from "@/apis/client";
import { useMemo, useState } from "react";

// Mock user address - in production this would come from wallet connection
const CURRENT_USER_ADDRESS = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1";

interface MonthlyBill {
  month: string;
  amount: number;
  count: number;
}

const Billing = () => {
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null); // null means "all months"

  // Fetch all bills for the current user
  const { data: bills, isLoading, error } = useQuery({
    queryKey: ["bills"],
    queryFn: () => billsApi.list(),
  });

  // Calculate totals and monthly aggregations
  const { totalIncome, totalSpent, monthlyIncome, availableMonths } = useMemo(() => {
    if (!bills) return { totalIncome: 0, totalSpent: 0, monthlyIncome: [], availableMonths: [] };

    // Calculate total income (where user is payee)
    const income = bills
      .filter((bill) => bill.payeeAddress === CURRENT_USER_ADDRESS && bill.status === "PAID")
      .reduce((sum, bill) => sum + bill.amount, 0);

    // Calculate total spent (where user is payer)
    const spent = bills
      .filter((bill) => bill.payerAddress === CURRENT_USER_ADDRESS && bill.status === "PAID")
      .reduce((sum, bill) => sum + bill.amount, 0);

    // Aggregate by month for income bills
    const monthlyMap = new Map<string, MonthlyBill>();
    bills
      .filter((bill) => bill.payeeAddress === CURRENT_USER_ADDRESS && bill.status === "PAID")
      .forEach((bill) => {
        const date = new Date(bill.createdAt);
        const month = `${date.getFullYear()}年${date.getMonth() + 1}月`;

        if (!monthlyMap.has(month)) {
          monthlyMap.set(month, { month, amount: 0, count: 0 });
        }

        const data = monthlyMap.get(month)!;
        data.amount += bill.amount;
        data.count += 1;
      });

    // Sort by date descending (most recent first)
    const monthly = Array.from(monthlyMap.values()).sort((a, b) => {
      const dateA = new Date(a.month.replace("年", "-").replace("月", ""));
      const dateB = new Date(b.month.replace("年", "-").replace("月", ""));
      return dateB.getTime() - dateA.getTime();
    });

    // Get list of available months for filter
    const months = monthly.map((m) => m.month);

    return { totalIncome: income, totalSpent: spent, monthlyIncome: monthly, availableMonths: months };
  }, [bills]);

  // Get detailed bills for selected month
  const detailedBills = useMemo(() => {
    if (!bills || !selectedMonth) return [];

    return bills
      .filter((bill) => {
        if (bill.payeeAddress !== CURRENT_USER_ADDRESS || bill.status !== "PAID") return false;
        const date = new Date(bill.createdAt);
        const month = `${date.getFullYear()}年${date.getMonth() + 1}月`;
        return month === selectedMonth;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [bills, selectedMonth]);

  // Filter monthly data based on selected month
  const filteredMonthlyIncome = useMemo(() => {
    if (!selectedMonth) return monthlyIncome; // Show all months
    return monthlyIncome.filter((item) => item.month === selectedMonth);
  }, [monthlyIncome, selectedMonth]);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  if (error) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 pb-20">
        <div className="p-8 bg-rose-500/10 border border-rose-500/20 rounded-xl">
          <h3 className="text-xl font-bold text-rose-400">加载失败</h3>
          <p className="text-slate-400 mt-2">无法获取账单数据，请稍后重试。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="text-4xl font-black neon-text">账单号账簿</h1>
        <p className="text-slate-400">追踪您在生态系统中的每一笔收入与支出细节。</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-emerald-500/5">
          <CardHeader>
            <h4 className="font-black text-xs uppercase">累计总额</h4>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-9 bg-slate-700/50 rounded animate-pulse" />
            ) : (
              <p className="text-3xl font-black text-emerald-400">
                {totalIncome.toFixed(2)} ETH
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="bg-rose-500/5">
          <CardHeader>
            <h4 className="font-black text-xs uppercase">账单总数</h4>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-9 bg-slate-700/50 rounded animate-pulse" />
            ) : (
              <p className="text-3xl font-black text-rose-400">
                {totalSpent.toFixed(2)} ETH
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-sm uppercase">月账单总费用</h3>
              <Button size="sm" variant="outline">
                下载 PDF 报告
              </Button>
            </div>

            {/* Month Filter */}
            {!isLoading && availableMonths.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={selectedMonth === null ? "primary" : "outline"}
                  onClick={() => setSelectedMonth(null)}
                  className="transition-all"
                >
                  全部月份
                </Button>
                {availableMonths.map((month) => (
                  <Button
                    key={month}
                    size="sm"
                    variant={selectedMonth === month ? "primary" : "outline"}
                    onClick={() => setSelectedMonth(month)}
                    className="transition-all"
                  >
                    {month}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 bg-slate-700/50 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : selectedMonth ? (
            // Show detailed bills for selected month
            detailedBills.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <p>该月暂无账单记录</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
                  <p className="text-sm text-slate-400">共 {detailedBills.length} 条账单</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedMonth(null)}
                    className="text-xs"
                  >
                    ← 返回月度汇总
                  </Button>
                </div>
                {detailedBills.map((bill) => (
                  <div
                    key={bill.id}
                    className="flex items-center justify-between p-4 bg-white/2 rounded-xl border border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-bold text-sm">任务 #{bill.jobId.slice(-6)}</h4>
                        <span className="px-2 py-0.5 text-[10px] bg-emerald-500/20 text-emerald-400 rounded-full uppercase font-bold">
                          {bill.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {formatDate(bill.createdAt)}
                      </p>
                      <p className="text-[10px] text-slate-600 mt-1">
                        账单 ID: {bill.id.slice(0, 16)}...
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-lg text-blue-400">
                        +{bill.amount.toFixed(2)} ETH
                      </p>
                      <p className="text-[10px] text-slate-600 uppercase">
                        {bill.paidAt ? `已支付 ${formatDate(bill.paidAt)}` : "待支付"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            // Show monthly summary (default view)
            filteredMonthlyIncome.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <p>暂无账单记录</p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredMonthlyIncome.map((item) => (
                  <div
                    key={item.month}
                    className="flex items-center justify-between p-4 bg-white/2 rounded-xl border border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => setSelectedMonth(item.month)}
                  >
                    <div>
                      <h4 className="font-bold">{item.month}</h4>
                      <p className="text-xs text-slate-500">
                        {item.count} 个已完成任务
                      </p>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <div>
                        <p className="font-black text-blue-400">
                          {item.amount.toFixed(2)} ETH
                        </p>
                        <p className="text-[10px] text-slate-600 uppercase">已入账</p>
                      </div>
                      <span className="text-slate-500">→</span>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Billing;
