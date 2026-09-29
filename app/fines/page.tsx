'use client';

import { useEffect, useState } from 'react';
import { finesApi, ApiError } from '../lib/api';
import type { Fine } from '../lib/types';
import { RequireAuth } from '../ui/require-auth';
import { Button } from '../ui/button';
import { ErrorText } from '../ui/notice';

function FinesContent() {
  const [fines, setFines] = useState<Fine[]>([]);
  const [error, setError] = useState('');
  async function load() {
    try { setFines(await finesApi.list()); } catch (err) { setError(err instanceof ApiError ? err.message : 'Không tải được khoản phạt'); }
  }
  useEffect(() => { load(); }, []);
  async function pay(id: number) {
    try { await finesApi.pay(id); await load(); } catch (err) { setError(err instanceof ApiError ? err.message : 'Không cập nhật được khoản phạt'); }
  }
  return <div className="mx-auto max-w-6xl">
    <h1>Khoản phạt</h1>
    <p className="mt-1 text-sm text-ink-soft">Theo dõi và ghi nhận các khoản phạt quá hạn.</p>
    <ErrorText>{error}</ErrorText>
    <div className="mt-6 overflow-x-auto border-y border-border">
      <table className="w-full text-left text-sm"><thead className="bg-paper text-xs uppercase text-ink-soft"><tr>
        <th className="px-4 py-3">Độc giả</th><th className="px-4 py-3">Sách</th><th className="px-4 py-3">Ngày quá hạn</th><th className="px-4 py-3">Số tiền</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3"></th>
      </tr></thead><tbody className="divide-y divide-border">
        {fines.map((fine) => <tr key={fine.id}>
          <td className="px-4 py-3">{fine.borrowRecord.reader?.fullName}<div className="text-xs text-ink-soft">{fine.borrowRecord.reader?.studentCode}</div></td>
          <td className="px-4 py-3">{fine.borrowRecord.copy?.book.title}</td>
          <td className="px-4 py-3">{fine.daysLate} ngày</td>
          <td className="px-4 py-3 font-medium">{fine.amount.toLocaleString('vi-VN')}đ</td>
          <td className={`px-4 py-3 ${fine.status === 'unpaid' ? 'text-danger' : 'text-success'}`}>{fine.status === 'unpaid' ? 'Chưa thu' : 'Đã thu'}</td>
          <td className="px-4 py-3">{fine.status === 'unpaid' && <Button variant="primary" onClick={() => pay(fine.id)}>Ghi nhận đã thu</Button>}</td>
        </tr>)}
        {!fines.length && <tr><td colSpan={6} className="px-4 py-8 text-center text-ink-soft">Chưa có khoản phạt</td></tr>}
      </tbody></table>
    </div>
  </div>;
}

export default function FinesPage() { return <RequireAuth><FinesContent /></RequireAuth>; }