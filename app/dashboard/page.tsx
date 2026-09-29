'use client';

import { useEffect, useState } from 'react';
import { RequireAuth } from '../ui/require-auth';
import { StatCard } from '../ui/dashboard/stat-card';
import { ErrorText } from '../ui/notice';
import { Pagination } from '../ui/pagination';
import { Input } from '../ui/input';
import { borrowRecordsApi, statisticsApi, ApiError } from '../lib/api';
import type { BorrowerStatistic, BorrowRecord, PaginatedResult, StatisticsOverview } from '../lib/types';
import { BorrowRecordDetailModal } from '../ui/borrow/borrow-record-detail-modal';

function DashboardContent() {
  const [stats, setStats] = useState<StatisticsOverview | null>(null);
  const [borrowers, setBorrowers] = useState<PaginatedResult<BorrowerStatistic> | null>(null);
  const [borrowerPage, setBorrowerPage] = useState(1);
  const [borrowerSearch, setBorrowerSearch] = useState('');
  const [selectedBorrower, setSelectedBorrower] = useState<BorrowerStatistic | null>(null);
  const [borrowerRecords, setBorrowerRecords] = useState<BorrowRecord[]>([]);
  const [loadingBorrowerRecords, setLoadingBorrowerRecords] = useState(false);
  const [popularBooks, setPopularBooks] = useState<{ id: number; title: string; author: string; borrowedCount: number }[]>([]);
  const [monthly, setMonthly] = useState<{ month: string; borrowed: number; returned: number }[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([statisticsApi.overview(), statisticsApi.popularBooks(), statisticsApi.monthly()])
      .then(([overview, popular, monthlyReport]) => { setStats(overview); setPopularBooks(popular); setMonthly(monthlyReport); })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Lỗi tải thống kê'));
  }, []);

  useEffect(() => {
    let current = true;
    const timeout = window.setTimeout(() => {
      statisticsApi
        .borrowers({ search: borrowerSearch || undefined, page: borrowerPage, pageSize: 10 })
        .then((result) => { if (current) setBorrowers(result); })
        .catch((err) => { if (current) setError(err instanceof ApiError ? err.message : 'Lỗi tải thống kê độc giả'); });
    }, 300);
    return () => {
      current = false;
      window.clearTimeout(timeout);
    };
  }, [borrowerPage, borrowerSearch]);

  async function showBorrowerDetails(reader: BorrowerStatistic) {
    setSelectedBorrower(reader);
    setBorrowerRecords([]);
    setLoadingBorrowerRecords(true);
    try {
      const result = await borrowRecordsApi.list({ readerId: reader.id, page: 1, pageSize: 200 });
      setBorrowerRecords(result.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tải được chi tiết phiếu mượn');
    } finally {
      setLoadingBorrowerRecords(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <h1>Tổng quan</h1>
      <p className="mt-1 text-sm text-ink-soft">Thống kê nhanh tình hình thư viện</p>

      <ErrorText>{error}</ErrorText>

      {!stats ? (
        <p className="mt-6 text-sm text-ink-soft">Đang tải...</p>
      ) : (
        <>
          <h2 className="mt-8">Sách</h2>
          <div className="mt-3 grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard label="Đầu sách" value={stats.books.total} />
            <StatCard label="Tổng bản sao" value={stats.copies.total} />
            <StatCard label="Đang có sẵn" value={stats.copies.available} />
            <StatCard label="Đang được mượn" value={stats.copies.borrowed} />
          </div>

          <h2 className="mt-8">Mượn / Trả</h2>
          <div className="mt-3 grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard label="Độc giả" value={stats.readers.total} />
            <StatCard label="Đã từng mượn" value={stats.readers.borrowed} />
            <StatCard label="Đang mượn sách" value={stats.readers.currentlyBorrowing} />
            <StatCard label="Đang mượn" value={stats.borrowing.current} />
            <StatCard label="Quá hạn" value={stats.borrowing.overdue} tone="warning" />
            <StatCard label="Bản sao mất/hỏng" value={stats.copies.lostOrDamaged} tone="warning" />
          </div>

          <h2 className="mt-8">Tháng này</h2>
          <div className="mt-3 grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard label="Lượt mượn" value={stats.borrowing.borrowedThisMonth} />
            <StatCard label="Lượt trả" value={stats.borrowing.returnedThisMonth} />
          </div>

          <h2 className="mt-8">Độc giả đang mượn</h2>
          <div className="mt-3 max-w-sm">
            <Input
              aria-label="Tìm độc giả đang mượn"
              placeholder="Tìm theo tên hoặc mã sinh viên..."
              value={borrowerSearch}
              onChange={(event) => {
                setBorrowerSearch(event.target.value);
                setBorrowerPage(1);
              }}
            />
          </div>
          <div className="mt-3 overflow-x-auto border-y border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-paper text-xs uppercase text-ink-soft">
                <tr>
                  <th className="px-4 py-3">Độc giả</th>
                  <th className="px-4 py-3">Lớp</th>
                  <th className="px-4 py-3">Đang giữ</th>
                  <th className="px-4 py-3">Quá hạn</th>
                  <th className="px-4 py-3">Tổng lượt mượn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {borrowers?.items.map((reader) => (
                  <tr key={reader.id}>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className="text-left hover:text-brass focus-visible:outline-2 focus-visible:outline-brass"
                        onClick={() => showBorrowerDetails(reader)}
                      >
                        <span className="block font-medium underline">{reader.fullName}</span>
                        <span className="block text-xs text-ink-soft">{reader.studentCode}</span>
                      </button>
                    </td>
                    <td className="px-4 py-3">{reader.className || '—'}</td>
                    <td className="px-4 py-3">{reader.currentlyBorrowing}</td>
                    <td className={`px-4 py-3 ${reader.overdue ? 'font-medium text-danger' : ''}`}>{reader.overdue}</td>
                    <td className="px-4 py-3">{reader.totalBorrowed}</td>
                  </tr>
                ))}
                {borrowers?.items.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-ink-soft">
                    {borrowerSearch ? 'Không tìm thấy độc giả đang mượn' : 'Không có độc giả đang mượn'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            page={borrowerPage}
            totalPages={Math.max(1, Math.ceil((borrowers?.total ?? 0) / 10))}
            onChange={setBorrowerPage}
          />

          <div className="mt-8 grid gap-8 md:grid-cols-2">
            <section><h2>Sách được mượn nhiều</h2><div className="mt-3 border-y border-border"><table className="w-full text-left text-sm"><tbody className="divide-y divide-border">{popularBooks.map((book) => <tr key={book.id}><td className="px-3 py-3"><div className="font-medium">{book.title}</div><div className="text-xs text-ink-soft">{book.author}</div></td><td className="px-3 py-3 text-right">{book.borrowedCount} lượt</td></tr>)}{!popularBooks.length && <tr><td className="px-3 py-6 text-center text-ink-soft">Chưa có dữ liệu</td></tr>}</tbody></table></div></section>
            <section><h2>Xu hướng 6 tháng</h2><div className="mt-3 border-y border-border"><table className="w-full text-left text-sm"><thead className="bg-paper text-xs text-ink-soft"><tr><th className="px-3 py-2">Tháng</th><th className="px-3 py-2">Mượn</th><th className="px-3 py-2">Trả</th></tr></thead><tbody className="divide-y divide-border">{monthly.map((item) => <tr key={item.month}><td className="px-3 py-3">{item.month}</td><td className="px-3 py-3">{item.borrowed}</td><td className="px-3 py-3">{item.returned}</td></tr>)}</tbody></table></div></section>
          </div>
        </>
      )}

      {selectedBorrower && (
        <BorrowRecordDetailModal
          title={`Phiếu mượn · ${selectedBorrower.fullName}`}
          records={borrowerRecords}
          loading={loadingBorrowerRecords}
          onClose={() => setSelectedBorrower(null)}
        />
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardContent />
    </RequireAuth>
  );
}
