import { Button } from '../button';
import { Badge } from '../badge';
import { EmptyState } from '../empty-state';
import type { BorrowRecord, BookCopy } from '../../lib/types';

function locationOf(copy?: BookCopy) {
  if (!copy) return '—';
  return `${copy.shelfRow}-${copy.shelfColumn}-${copy.shelfLevel}`;
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('vi-VN');
}

interface ActiveBorrowTableProps {
  items: BorrowRecord[];
  onReturn: (copyId: number) => void;
  onDetails: (record: BorrowRecord) => void;
}

export function ActiveBorrowTable({ items, onReturn, onDetails }: ActiveBorrowTableProps) {
  return (
    <table className="table-shell">
      <thead>
        <tr>
          <th>Sách</th>
          <th>Mã bản sao</th>
          <th>Vị trí kệ</th>
          <th>Độc giả</th>
          <th>Hạn trả</th>
          <th>Trạng thái</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {items.map((r) => (
          <tr key={r.id}>
            <td className="font-medium">{r.copy?.book.title}</td>
            <td>{r.copy?.copyCode}</td>
            <td>{locationOf(r.copy)}</td>
            <td>{r.reader?.fullName}</td>
            <td>{fmtDate(r.dueDate)}</td>
            <td>
              {r.status === 'overdue' ? (
                <Badge variant="warning">Quá hạn</Badge>
              ) : (
                <Badge variant="neutral">Đang mượn</Badge>
              )}
            </td>
            <td>
              <div className="flex gap-2">
                <Button onClick={() => onDetails(r)}>Chi tiết</Button>
                <Button variant="primary" onClick={() => onReturn(r.copyId)}>Trả sách</Button>
              </div>
            </td>
          </tr>
        ))}
        {items.length === 0 && <EmptyState colSpan={7}>Không có sách nào đang được mượn.</EmptyState>}
      </tbody>
    </table>
  );
}
