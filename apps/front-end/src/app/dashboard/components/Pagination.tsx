"use client";

import { Button } from "@yt/ui";

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (nextPage: number) => void;
}

export const Pagination = ({ page, totalPages, onChange }: PaginationProps) => {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-between gap-4 pt-4">
      <Button
        variant="outline"
        className="border-white/10"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
      >
        上一页
      </Button>
      <span className="text-xs text-slate-500">
        第 {page} 页 / 共 {totalPages} 页
      </span>
      <Button
        variant="outline"
        className="border-white/10"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
      >
        下一页
      </Button>
    </div>
  );
};
