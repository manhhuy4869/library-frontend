import { Button } from '../button';
import { Badge } from '../badge';
import { EmptyState } from '../empty-state';
import type { BorrowRecord, BookCopy } from '../../lib/types';
import { useState } from 'react';

type ReturnCondition = 'available' | 'damaged' | 'lost';

function locationOf(copy?: BookCopy) {
  if (!copy) return '—';
  return `${copy.shelfRow}-${copy.shelfColumn}-${copy.shelfLevel}`;
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('vi-VN');
}

interface ActiveBorrowTableProps {
  items: BorrowRecord[];
  onReturn: (copyId: number, condition: ReturnCondition, damageNote?: string) => void;
  onDetails: (record: BorrowRecord) => void;
}

export function ActiveBorrowTable({ items, onReturn, onDetails }: ActiveBorrowTableProps) {
  const [conditions, setConditions] = useState<Record<number, ReturnCondition>>({});
  const [damageNotes, setDamageNotes] = useState<Record<number, string>>({});

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
          <th>Xác nhận nhận sách</th>
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
              {r.receiptCondition === 'pending' ? <Badge variant="warning">Chờ sinh viên</Badge> : r.receiptCondition === 'damaged' ? (
                <div><Badge variant="warning">Đã báo hỏng</Badge>{r.conditionNote && <p className="mt-1 text-xs text-ink-soft">{r.conditionNote}</p>}</div>
              ) : <Badge variant="neutral">Đã xác nhận tốt</Badge>}
            </td>
            <td>
              <div className="flex gap-2">
                <Button onClick={() => onDetails(r)}>Chi tiết</Button>
                <select
                  className="input min-w-32"
                  aria-label={`Tình trạng trả ${r.copy?.book.title ?? 'sách'}`}
                  value={conditions[r.id] ?? 'available'}
                  onChange={(event) => setConditions((current) => ({ ...current, [r.id]: event.target.value as ReturnCondition }))}
                >
                  <option value="available">Còn tốt</option>
                  <option value="damaged">Bị hỏng</option>
                  <option value="lost">Bị mất</option>
                </select>
                {conditions[r.id] === 'damaged' && (
                  <textarea
                    className="input min-w-48"
                    aria-label={`Mô tả sách hỏng ${r.copy?.book.title ?? ''}`}
                    placeholder="Mô tả sách hỏng thế nào..."
                    maxLength={500}
                    value={damageNotes[r.id] ?? ''}
                    onChange={(event) => setDamageNotes((current) => ({ ...current, [r.id]: event.target.value }))}
                    required
                  />
                )}
                <Button
                  variant="primary"
                  onClick={() => {
                    const condition = conditions[r.id] ?? 'available';
                    const damageNote = damageNotes[r.id]?.trim();
                    if (condition === 'damaged' && !damageNote) {
                      alert('Vui lòng mô tả cụ thể tình trạng hỏng của sách.');
                      return;
                    }
                    if (condition !== 'available' && !confirm(`Xác nhận ghi nhận sách ${condition === 'lost' ? 'bị mất' : 'bị hỏng'}?`)) return;
                    onReturn(r.copyId, condition, damageNote);
                  }}
                >
                  Xác nhận trả
                </Button>
              </div>
            </td>
          </tr>
        ))}
        {items.length === 0 && <EmptyState colSpan={8}>Không có sách nào đang được mượn.</EmptyState>}
      </tbody>
    </table>
  );
}
