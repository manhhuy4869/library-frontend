'use client';

import { Modal } from '../modal';
import type { BorrowRecord } from '../../lib/types';

interface BorrowRecordDetailModalProps {
  title: string;
  records: BorrowRecord[];
  loading?: boolean;
  onClose: () => void;
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleString('vi-VN') : '—';
}

function statusLabel(status: BorrowRecord['status']) {
  if (status === 'overdue') return 'Quá hạn';
  if (status === 'returned') return 'Đã trả';
  return 'Đang mượn';
}

export function BorrowRecordDetailModal({ title, records, loading = false, onClose }: BorrowRecordDetailModalProps) {
  return (
    <Modal title={title} onClose={onClose} size="lg">
      {loading ? (
        <p className="py-8 text-center text-sm text-ink-soft">Đang tải chi tiết...</p>
      ) : records.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink-soft">Không có phiếu mượn.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-paper text-xs uppercase text-ink-soft">
              <tr>
                <th className="px-3 py-3">Sách / bản sao</th>
                <th className="px-3 py-3">Độc giả</th>
                <th className="px-3 py-3">Ngày mượn</th>
                <th className="px-3 py-3">Hạn trả</th>
                <th className="px-3 py-3">Ngày trả</th>
                <th className="px-3 py-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {records.map((record) => (
                <tr key={record.id}>
                  <td className="px-3 py-3">
                    <div className="font-medium">{record.copy?.book.title ?? '—'}</div>
                    <div className="text-xs text-ink-soft">{record.copy?.copyCode ?? '—'}</div>
                  </td>
                  <td className="px-3 py-3">
                    <div>{record.reader?.fullName ?? '—'}</div>
                    <div className="text-xs text-ink-soft">{record.reader?.studentCode ?? '—'}</div>
                  </td>
                  <td className="px-3 py-3">{formatDate(record.borrowDate)}</td>
                  <td className="px-3 py-3">{formatDate(record.dueDate)}</td>
                  <td className="px-3 py-3">{formatDate(record.returnDate)}</td>
                  <td className={record.status === 'overdue' ? 'px-3 py-3 font-medium text-danger' : 'px-3 py-3'}>
                    {statusLabel(record.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}