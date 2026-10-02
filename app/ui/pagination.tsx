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
  const visiblePages: Array<number | 'ellipsis'> =
    totalPages <= 7
      ? Array.from({ length: totalPages }, (_, index) => index + 1)
      : page <= 4
        ? [1, 2, 3, 4, 5, 'ellipsis', totalPages]
        : page >= totalPages - 3
          ? [1, 'ellipsis', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
          : [1, 'ellipsis', page - 1, page, page + 1, 'ellipsis', totalPages];

  return (
    <div className="mt-4 flex items-center gap-3 text-sm">
      <Button disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Trước
      </Button>
      <nav aria-label="Phân trang" className="flex items-center gap-1">
        {visiblePages.map((pageNumber, index) =>
          pageNumber === 'ellipsis' ? (
            <span key={`ellipsis-${index}`} aria-hidden="true" className="px-1 text-ink-soft">
              ...
            </span>
          ) : (
            <Button
              key={pageNumber}
              aria-current={pageNumber === page ? 'page' : undefined}
              aria-label={`Trang ${pageNumber}`}
              className="h-9 w-9 px-0 py-2"
              onClick={() => onChange(pageNumber)}
              variant={pageNumber === page ? 'primary' : 'secondary'}
            >
              {pageNumber}
            </Button>
          ),
        )}
      </nav>
      <Button disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Sau
      </Button>
    </div>
  );
}
