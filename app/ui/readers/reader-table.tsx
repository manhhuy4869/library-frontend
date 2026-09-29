import { Button } from '../button';
import { EmptyState } from '../empty-state';
import type { Reader } from '../../lib/types';

interface ReaderTableProps {
  items: Reader[];
  loading: boolean;
  onEdit: (reader: Reader) => void;
  onDelete: (id: number) => void;
}

export function ReaderTable({ items, loading, onEdit, onDelete }: ReaderTableProps) {
  if (loading) return <p className="p-6 text-sm text-ink-soft">Đang tải...</p>;

  return (
    <table className="table-shell">
      <thead>
        <tr>
          <th>Họ tên</th>
          <th>Mã SV</th>
          <th>Lớp</th>
          <th>SĐT</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {items.map((reader) => (
          <tr key={reader.id}>
            <td className="font-medium">{reader.fullName}</td>
            <td>{reader.studentCode}</td>
            <td>{reader.className ?? '—'}</td>
            <td>{reader.phone ?? '—'}</td>
            <td>
              <div className="flex justify-end gap-2">
                <Button onClick={() => onEdit(reader)}>Sửa</Button>
                <Button variant="danger" onClick={() => onDelete(reader.id)}>
                  Xóa
                </Button>
              </div>
            </td>
          </tr>
        ))}
        {items.length === 0 && <EmptyState colSpan={5}>Không có độc giả nào.</EmptyState>}
      </tbody>
    </table>
  );
}
