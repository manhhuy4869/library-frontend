import Link from 'next/link';
import { Button } from '../button';
import { EmptyState } from '../empty-state';
import type { Book } from '../../lib/types';

interface BookTableProps {
  items: Book[];
  loading: boolean;
  selectedIds: number[];
  onEdit: (book: Book) => void;
  onDelete: (id: number) => void;
  onToggle: (id: number) => void;
  onToggleAll: (ids: number[]) => void;
}

export function BookTable({ items, loading, selectedIds, onEdit, onDelete, onToggle, onToggleAll }: BookTableProps) {
  if (loading) return <p className="p-6 text-sm text-ink-soft">Đang tải...</p>;

  const selectableIds = items.map((book) => book.id);
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selectedIds.includes(id));

  return (
    <table className="table-shell">
      <thead>
        <tr>
          <th>
            <input
              type="checkbox"
              aria-label="Chọn tất cả sách trên trang này"
              checked={allSelected}
              disabled={!selectableIds.length}
              onChange={() => onToggleAll(selectableIds)}
            />
          </th>
          <th>Tên sách</th>
          <th>Tác giả</th>
          <th>Thể loại</th>
          <th>Bản sao</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {items.map((book) => (
          <tr key={book.id}>
            <td>
              <input
                type="checkbox"
                aria-label={`Chọn ${book.title} để xóa`}
                checked={selectedIds.includes(book.id)}
                onChange={() => onToggle(book.id)}
              />
            </td>
            <td className="font-medium">{book.title}</td>
            <td>{book.author}</td>
            <td>{book.category}</td>
            <td>
              <Link href={`/books/${book.id}/copies`} className="text-brass hover:underline">
                {book.copies?.length ?? 0} bản
              </Link>
            </td>
            <td>
              <div className="flex justify-end gap-2">
                <Button onClick={() => onEdit(book)}>Sửa</Button>
                <Button variant="danger" onClick={() => onDelete(book.id)}>
                  Xóa
                </Button>
              </div>
            </td>
          </tr>
        ))}
        {items.length === 0 && <EmptyState colSpan={6}>Không có sách nào.</EmptyState>}
      </tbody>
    </table>
  );
}
