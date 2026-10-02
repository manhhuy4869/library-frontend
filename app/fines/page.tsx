'use client';

import { useEffect, useState } from 'react';
import { finesApi, ApiError } from '../lib/api';
import type { Fine } from '../lib/types';
import { RequireAuth } from '../ui/require-auth';
import { Button } from '../ui/button';
import { ErrorText } from '../ui/notice';
import { Input } from '../ui/input';
import { useAuth } from '../lib/auth-context';
import type { FinePolicy } from '../lib/types';

function policySummary(policy?: FinePolicy) {
  if (!policy) return '—';
  return `Trễ: ${policy.lateReturnPerDay?.toLocaleString('vi-VN')}đ/ngày · Hỏng: ${policy.damagedBookFee?.toLocaleString('vi-VN')}đ · Mất: ${policy.lostBookFee?.toLocaleString('vi-VN')}đ`;
}

function FinesContent() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [fines, setFines] = useState<Fine[]>([]);
  const [policy, setPolicy] = useState<FinePolicy | null>(null);
  const [draft, setDraft] = useState<FinePolicy | null>(null);
  const [history, setHistory] = useState<Awaited<ReturnType<typeof finesApi.policyHistory>>>([]);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  async function load() {
    try {
      const [items, currentPolicy, changes] = await Promise.all([
        finesApi.list(),
        finesApi.policy(),
        isAdmin ? finesApi.policyHistory() : Promise.resolve([]),
      ]);
      setFines(items);
      setPolicy(currentPolicy);
      setDraft(currentPolicy);
      setHistory(changes);
    } catch (err) { setError(err instanceof ApiError ? err.message : 'Không tải được khoản phạt'); }
  }
  useEffect(() => { if (user) load(); }, [isAdmin]);
  async function pay(id: number) {
    try { await finesApi.pay(id); await load(); } catch (err) { setError(err instanceof ApiError ? err.message : 'Không cập nhật được khoản phạt'); }
  }
  async function savePolicy(event: React.FormEvent) {
    event.preventDefault();
    if (!draft) return;
    setError('');
    setSaved('');
    try {
      await finesApi.updatePolicy(draft);
      setSaved('Đã lưu quy định và ghi lịch sử thay đổi.');
      await load();
    } catch (err) { setError(err instanceof ApiError ? err.message : 'Không cập nhật được quy định phạt'); }
  }
  function setAmount(field: keyof FinePolicy, value: string) {
    setDraft((current) => current ? { ...current, [field]: Number(value) } : current);
  }
  return <div className="mx-auto max-w-6xl">
    <h1>Khoản phạt</h1>
    <p className="mt-1 text-sm text-ink-soft">Theo dõi khoản phạt và quy định áp dụng cho sinh viên.</p>
    <ErrorText>{error}</ErrorText>
    {saved && <p role="status" className="mt-3 text-sm text-success">{saved}</p>}
    {policy && <section className="mt-6 border-y border-border py-4">
      <h2 className="text-base font-semibold">Quy định phạt hiện hành</h2>
      {isAdmin && draft ? <form onSubmit={savePolicy} className="mt-3 flex flex-wrap items-end gap-4">
        <Input label="Trễ hạn (đ/ngày)" type="number" min="0" max="10000000" step="1000" value={draft.lateReturnPerDay} onChange={(event) => setAmount('lateReturnPerDay', event.target.value)} required />
        <Input label="Sách hỏng (đ)" type="number" min="0" max="10000000" step="1000" value={draft.damagedBookFee} onChange={(event) => setAmount('damagedBookFee', event.target.value)} required />
        <Input label="Sách mất (đ)" type="number" min="0" max="10000000" step="1000" value={draft.lostBookFee} onChange={(event) => setAmount('lostBookFee', event.target.value)} required />
        <Button variant="primary" type="submit">Lưu quy định</Button>
      </form> : <p className="mt-2 text-sm text-ink-soft">
        Trễ hạn: {policy.lateReturnPerDay.toLocaleString('vi-VN')}đ/ngày · Hỏng: {policy.damagedBookFee.toLocaleString('vi-VN')}đ · Mất: {policy.lostBookFee.toLocaleString('vi-VN')}đ
      </p>}
    </section>}
    {isAdmin && <section className="mt-8">
      <h2 className="text-base font-semibold">Lịch sử điều chỉnh quy định</h2>
      <div className="mt-3 overflow-x-auto border-y border-border">
        <table className="w-full text-left text-sm"><thead className="bg-paper text-xs uppercase text-ink-soft"><tr>
          <th className="px-4 py-3">Thời gian</th><th className="px-4 py-3">Người sửa</th><th className="px-4 py-3">Trước</th><th className="px-4 py-3">Sau</th>
        </tr></thead><tbody className="divide-y divide-border">
          {history.map((change) => <tr key={change.id}>
            <td className="px-4 py-3">{new Date(change.createdAt).toLocaleString('vi-VN')}</td>
            <td className="px-4 py-3">{change.user?.fullName ?? 'Tài khoản đã xóa'}</td>
            <td className="px-4 py-3">{policySummary(change.metadata.before)}</td>
            <td className="px-4 py-3">{policySummary(change.metadata.after)}</td>
          </tr>)}
          {!history.length && <tr><td colSpan={4} className="px-4 py-6 text-center text-ink-soft">Chưa có lần điều chỉnh nào.</td></tr>}
        </tbody></table>
      </div>
    </section>}
    <div className="mt-6 overflow-x-auto border-y border-border">
      <table className="w-full text-left text-sm"><thead className="bg-paper text-xs uppercase text-ink-soft"><tr>
        <th className="px-4 py-3">Độc giả</th><th className="px-4 py-3">Sách</th><th className="px-4 py-3">Loại phạt</th><th className="px-4 py-3">Số ngày trễ</th><th className="px-4 py-3">Số tiền</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3"></th>
      </tr></thead><tbody className="divide-y divide-border">
        {fines.map((fine) => <tr key={fine.id}>
          <td className="px-4 py-3">{fine.borrowRecord.reader?.fullName}<div className="text-xs text-ink-soft">{fine.borrowRecord.reader?.studentCode}</div></td>
          <td className="px-4 py-3">{fine.borrowRecord.copy?.book.title}</td>
          <td className="px-4 py-3">{fine.type === 'late_return' ? 'Trễ hạn' : fine.type === 'damaged' ? 'Sách hỏng' : 'Sách mất'}{fine.reason && <div className="text-xs text-ink-soft">{fine.reason}</div>}</td>
          <td className="px-4 py-3">{fine.daysLate ? `${fine.daysLate} ngày` : '—'}</td>
          <td className="px-4 py-3 font-medium">{fine.amount.toLocaleString('vi-VN')}đ</td>
          <td className={`px-4 py-3 ${fine.status === 'unpaid' ? 'text-danger' : 'text-success'}`}>{fine.status === 'unpaid' ? 'Chưa thu' : 'Đã thu'}</td>
          <td className="px-4 py-3">{fine.status === 'unpaid' && <Button variant="primary" onClick={() => pay(fine.id)}>Ghi nhận đã thu</Button>}</td>
        </tr>)}
        {!fines.length && <tr><td colSpan={7} className="px-4 py-8 text-center text-ink-soft">Chưa có khoản phạt</td></tr>}
      </tbody></table>
    </div>
  </div>;
}

export default function FinesPage() { return <RequireAuth><FinesContent /></RequireAuth>; }