'use client';

import { useEffect, useState } from 'react';
import { RequireAuth } from '../ui/require-auth';
import { ErrorText } from '../ui/notice';
import { auditApi, ApiError } from '../lib/api';
import type { AuditItem } from '../lib/api';

function AuditContent() {
  const [items, setItems] = useState<AuditItem[]>([]);
  const [error, setError] = useState('');
  useEffect(() => { auditApi.list().then(setItems).catch((err) => setError(err instanceof ApiError ? err.message : 'Không tải được nhật ký')); }, []);
  return <div className="mx-auto max-w-6xl"><h1>Nhật ký hoạt động</h1><p className="mt-1 text-sm text-ink-soft">Theo dõi thao tác mượn, trả và xử lý lịch đặt.</p><ErrorText>{error}</ErrorText><div className="mt-6 overflow-x-auto border-y border-border"><table className="w-full text-left text-sm"><thead className="bg-paper text-xs uppercase text-ink-soft"><tr><th className="px-4 py-3">Thời gian</th><th className="px-4 py-3">Người thực hiện</th><th className="px-4 py-3">Hành động</th><th className="px-4 py-3">Đối tượng</th></tr></thead><tbody className="divide-y divide-border">{items.map((item) => <tr key={item.id}><td className="px-4 py-3">{new Date(item.createdAt).toLocaleString('vi-VN')}</td><td className="px-4 py-3">{item.user?.fullName || 'Đã xóa'}</td><td className="px-4 py-3">{item.action}</td><td className="px-4 py-3">{item.entity} #{item.entityId ?? '—'}</td></tr>)}{!items.length && <tr><td colSpan={4} className="px-4 py-8 text-center text-ink-soft">Chưa có nhật ký</td></tr>}</tbody></table></div></div>;
}
export default function AuditPage() { return <RequireAuth><AuditContent /></RequireAuth>; }