'use client';

import { Button } from './button';

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

// Dùng chung cho mọi trang danh sách (books, readers...) - tránh lặp lại 3 dòng
// nút Trước/Sau + hiển thị "Trang X/Y" ở từng page.
export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  return (
    <div className="mt-4 flex items-center gap-3 text-sm">
      <Button disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Trước
      </Button>
      <span className="text-ink-soft">
        Trang {page}/{totalPages}
      </span>
      <Button disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Sau
      </Button>
    </div>
  );
}
