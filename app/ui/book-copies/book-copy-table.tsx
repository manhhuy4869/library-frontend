import { Button } from '../button';
import { Badge } from '../badge';
import { EmptyState } from '../empty-state';
import type { BookCopy } from '../../lib/types';

const statusLabel: Record<string, string> = {
  available: 'Có sẵn',
  reserved: 'Đã đặt trước',
  borrowed: 'Đang mượn',
  lost: 'Mất',
  damaged: 'Hỏng',
};

interface BookCopyTableProps {
  items: BookCopy[];
  loading: boolean;
  onEdit: (copy: BookCopy) => void;
  onDelete: (id: number) => void;
}

export function BookCopyTable({ items, loading, onEdit, onDelete }: BookCopyTableProps) {
  if (loading) return <p className="p-6 text-sm text-ink-soft">Đang tải...</p>;

  return (
    <table className="table-shell">
      <thead>
        <tr>
          <th>Mã bản sao</th>
          <th>Vị trí kệ</th>
          <th>Trạng thái</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {items.map((copy) => (
          <tr key={copy.id}>
            <td className="font-medium">{copy.copyCode}</td>
            <td>
              {copy.shelfRow}-{copy.shelfColumn}-{copy.shelfLevel}
            </td>
            <td>
              {copy.status === 'available' ? (
                <Badge variant="neutral">{statusLabel[copy.status]}</Badge>
              ) : (
                <Badge variant="warning">{statusLabel[copy.status]}</Badge>
              )}
              {copy.status === 'damaged' && copy.conditionNote && <p className="mt-1 max-w-xs text-xs text-danger">{copy.conditionNote}</p>}
            </td>
            <td>
              <div className="flex justify-end gap-2">
                <Button onClick={() => onEdit(copy)}>Sửa</Button>
                <Button variant="danger" onClick={() => onDelete(copy.id)}>
                  Xóa
                </Button>
              </div>
            </td>
          </tr>
        ))}
        {items.length === 0 && <EmptyState colSpan={4}>Sách này chưa có bản sao nào.</EmptyState>}
      </tbody>
    </table>
  );
}
