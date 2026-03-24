"use client";
import { useChainId, useWallet } from "@/hooks/web3";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@yt/ui";
import { useUserStore } from "@/store/useUserStore";
import { useCBT } from "@/hooks/contracts/useCBT";
import { formatUnits } from "viem";
import { fetchCbtTransfersByAddress } from "@/apis/chain-status";
import { addTokenToWallet } from "@/utils/addTokenToWallet";
import { getContracts } from "@yt/libs";
import { useTokenAllowance } from "@/hooks/useTokenAllowance";

const Wallet = () => {
  const {
    address,
    isConnected,
    balance,
    connect,
    disconnect,
    isConnecting,
    error,
  } = useWallet();
  const chainId = useChainId();
  const contracts = getContracts(chainId);
  const { user, setUser, clearUser } = useUserStore();
  const [showBuyCBT, setShowBuyCBT] = useState(false);
  const [ethAmount, setEthAmount] = useState("");
  const [mounted, setMounted] = useState(false);
  const [transactions, setTransactions] = useState<
    Array<{
      id: string;
      agentName: string;
      agentId: string;
      jobId?: string;
      status: string;
      amount: string;
      isPositive: boolean;
      date: string;
    }>
  >([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [transactionsError, setTransactionsError] = useState<string | null>(
    null,
  );

  // 使用 CBT Hook
  const {
    rate,
    buyCBT,
    isBuyPending,
    isBuyConfirming,
    isBuySuccess,
    buyError,
    estimateCBT,
    formatBalance,
    refetchBalance,
  } = useCBT();

  // Phase 5: Token Allowance Management
  const { allowances, revokeAllowance, isRevoking } = useTokenAllowance([
    { name: "AgentHiring", address: contracts.AgentHiring },
    { name: "Escrow", address: contracts.Escrow },
    { name: "DisputeDAO", address: contracts.DisputeDAO },
  ]);

  useEffect(() => {
    if (isConnected && address) {
      setUser({ address });
    } else {
      clearUser();
    }
  }, [isConnected, address, setUser, clearUser]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 购买成功后刷新余额
  useEffect(() => {
    if (isBuySuccess) {
      refetchBalance();
      setShowBuyCBT(false);
      setEthAmount("");
      // Phase 3: Automatically suggest adding token to wallet
      addTokenToWallet({
        address: contracts.CBT,
        symbol: "CBT",
        decimals: 18,
      });
    }
  }, [isBuySuccess, refetchBalance, contracts.CBT]);

  useEffect(() => {
    const loadTransactions = async () => {
      if (!address) {
        setTransactions([]);
        return;
      }
      setTransactionsLoading(true);
      setTransactionsError(null);
      try {
        const { transfers } = await fetchCbtTransfersByAddress(address, {
          first: 50,
        });
        const normalizedAddress = address.toLowerCase();
        const mapped = transfers.map((transfer) => {
          const isIncoming = transfer.to.toLowerCase() === normalizedAddress;
          const counterparty = isIncoming ? transfer.from : transfer.to;
          const amount = BigInt(transfer.amount);
          const dateLabel = new Date(
            Number(transfer.timestamp) * 1000,
          ).toLocaleString("zh-CN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          });
          return {
            id: transfer.id,
            agentName: counterparty,
            agentId: counterparty,
            jobId: undefined,
            status: isIncoming ? "IN" : "OUT",
            amount: `${isIncoming ? "+" : "-"}${formatUnits(amount, 18)} CBT`,
            isPositive: isIncoming,
            date: dateLabel,
          };
        });
        setTransactions(mapped);
      } catch (err) {
        setTransactionsError(
          err instanceof Error ? err.message : "加载交易记录失败",
        );
      } finally {
        setTransactionsLoading(false);
      }
    };

    void loadTransactions();
  }, [address]);

  const handleBuyCBT = async () => {
    if (!ethAmount || Number.parseFloat(ethAmount) <= 0) {
      alert("请输入有效的 ETH 数量");
      return;
    }

    try {
      await buyCBT(ethAmount);
    } catch (error) {
      console.error("购买失败:", error);
    }
  };

  const estimatedCBT = estimateCBT(ethAmount);

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20">
      {/* 购买 CBT 对话框 */}
      {showBuyCBT && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          role="button"
          tabIndex={0}
          onClick={() => setShowBuyCBT(false)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              setShowBuyCBT(false);
            }
          }}
        >
          <Card
            className="w-full max-w-md m-4"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black">购买 CBT 代币</h3>
                <button
                  type="button"
                  onClick={() => setShowBuyCBT(false)}
                  className="text-slate-500 hover:text-slate-300"
                >
                  ✕
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 block mb-2">
                  输入 ETH 数量
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={ethAmount}
                  onChange={(e) => setEthAmount(e.target.value)}
                  placeholder="0.1"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  disabled={isBuyPending || isBuyConfirming}
                />
              </div>

              {rate && (
                <div className="text-sm text-slate-400">
                  <p>兑换汇率: 1 ETH = {rate.toString()} CBT</p>
                  {estimatedCBT && (
                    <p className="mt-1 text-lg text-white font-bold">
                      预计获得: {formatUnits(estimatedCBT, 18)} CBT
                    </p>
                  )}
                </div>
              )}

              {buyError && (
                <p className="text-sm text-red-400">错误: {buyError.message}</p>
              )}

              {isBuySuccess && (
                <p className="text-sm text-green-400">购买成功！</p>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={handleBuyCBT}
                  className="flex-1 neon-glow"
                  disabled={isBuyPending || isBuyConfirming || !ethAmount}
                >
                  {isBuyPending || isBuyConfirming ? "交易中..." : "购买 CBT"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowBuyCBT(false)}
                  disabled={isBuyPending || isBuyConfirming}
                >
                  取消
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="bg-slate-900/60 border-blue-500/20">
        <CardHeader>
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-500">
            钱包连接
          </h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase">
                当前账户
              </p>
              <p className="text-lg font-black">
                {mounted ? (address ?? "未连接") : "未连接"}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                {mounted && balance
                  ? `${balance.formatted} ${balance.symbol}`
                  : "余额暂不可用"}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => {
                  void connect().catch(() => { });
                }}
                className="neon-glow"
                disabled={isConnecting || isConnected}
              >
                {isConnecting ? "连接中..." : "连接钱包"}
              </Button>
              <Button
                variant="outline"
                onClick={() => disconnect()}
                disabled={!isConnected}
              >
                断开连接
              </Button>
            </div>
          </div>

          {error ? (
            <p className="text-xs text-rose-400">{error.message}</p>
          ) : null}

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className="font-bold">用户状态:</span>
            <Badge variant={user ? "green" : "outline"}>
              {user ? "已登录" : "未登录"}
            </Badge>
            {user?.address ? (
              <span className="font-mono">{user.address}</span>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <h1 className="text-4xl font-black neon-text">资产钱包</h1>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShowBuyCBT(true)}
            disabled={!isConnected}
          >
            充值 CBT
          </Button>
          <Button className="neon-glow">提现</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 bg-gradient-to-br from-blue-600/10 to-purple-600/10">
          <CardContent className="p-8 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-black uppercase text-slate-500 tracking-widest">
                总价值 (USD)
              </p>
              <h2 className="text-5xl font-black tracking-tighter">
                $12,402.00
              </h2>
            </div>
            <div className="size-20 bg-white/5 rounded-full flex items-center justify-center">
              <svg
                className="w-10 h-10 text-blue-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-8 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500 font-bold uppercase">
                可用余额
              </span>
              <Badge variant="green">SAFE</Badge>
            </div>
            <p className="text-2xl font-black">
              {balance
                ? `${Number(formatUnits(balance.value, balance.decimals)).toFixed(4)} ${balance.symbol}`
                : "0 ETH"}
            </p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-black">{formatBalance()} CBT</p>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() =>
                  addTokenToWallet({
                    address: contracts.CBT,
                    symbol: "CBT",
                    decimals: 18,
                  })
                }
              >
                添加到钱包
              </Button>
            </div>
            <Link href="/billing">
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2 text-blue-400"
              >
                查看详细账单
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h3 className="font-black text-sm uppercase tracking-widest">
            授权管理 (CBT)
          </h3>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>合约名称</TH>
                <TH>已授权额度</TH>
                <TH className="text-right">操作</TH>
              </TR>
            </THead>
            <TBody>
              {allowances.map((item) => (
                <TR key={item.spenderAddress}>
                  <TD className="font-bold">{item.spenderName}</TD>
                  <TD className="font-mono text-blue-400">
                    {formatUnits(item.allowance, 18)} CBT
                  </TD>
                  <TD className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={item.allowance === 0n || isRevoking}
                      onClick={() => revokeAllowance(item.spenderAddress)}
                    >
                      撤销授权
                    </Button>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="font-black text-sm uppercase tracking-widest">
            最近交易记录
          </h3>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>时间</TH>
                <TH>转入地址</TH>
                <TH>状态</TH>
                <TH className="text-right">金额</TH>
              </TR>
            </THead>
            <TBody>
              {transactions.map((tx) => (
                <TR key={tx.id}>
                  <TD className="text-slate-500 font-mono">{tx.date}</TD>
                  <TD className="font-bold">{tx.agentName}</TD>

                  <TD>
                    <Badge variant={tx.isPositive ? "green" : "blue"}>
                      {tx.status}
                    </Badge>
                  </TD>
                  <TD
                    className={`text-right font-black ${tx.isPositive ? "text-emerald-400" : "text-rose-400"
                      }`}
                  >
                    {tx.amount}
                  </TD>
                </TR>
              ))}
              {transactions.length === 0 && !transactionsLoading && (
                <TR>
                  <TD colSpan={4} className="text-center text-slate-500">
                    暂无交易记录
                  </TD>
                </TR>
              )}
              {transactionsLoading && (
                <TR>
                  <TD colSpan={4} className="text-center text-slate-500">
                    加载中...
                  </TD>
                </TR>
              )}
            </TBody>
          </Table>
          {transactionsError && (
            <p className="text-xs text-rose-400 px-6 pb-6">
              {transactionsError}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Wallet;
