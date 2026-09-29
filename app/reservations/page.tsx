'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth-context';
import { ApiError, bookCopiesApi, booksApi, borrowRecordsApi, notificationsApi, reservationsApi } from '../lib/api';
import type { Book, BookCopy, BorrowRecord, Notification, Reservation } from '../lib/types';
import { RequireAuth } from '../ui/require-auth';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { ErrorText } from '../ui/notice';
import { Modal } from '../ui/modal';

function localDateTimeMin() {
  const date = new Date(Date.now() + 60 * 60 * 1000);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function ReservationPageContent() {
  const { user } = useAuth();
  const isStudent = user?.role === 'student';
  const [books, setBooks] = useState<Book[]>([]);
  const [copies, setCopies] = useState<BookCopy[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [openLoans, setOpenLoans] = useState<BorrowRecord[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [bookId, setBookId] = useState('');
  const [copyId, setCopyId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  async function loadReservations() {
    const items = isStudent ? await reservationsApi.own() : await reservationsApi.list();
    setReservations(items);
  }

  async function loadOpenLoans() {
    if (isStudent) setOpenLoans(await borrowRecordsApi.own());
  }

  async function loadNotifications() {
    if (isStudent) setNotifications(await notificationsApi.own());
  }

  useEffect(() => {
    Promise.all([booksApi.list({ pageSize: 200 }), loadReservations(), loadOpenLoans(), loadNotifications()])
      .then(([bookResult]) => setBooks(bookResult.items))
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Không tải được dữ liệu'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStudent]);

  useEffect(() => {
    if (!isStudent) return;
    const interval = window.setInterval(() => {
      loadOpenLoans().catch((err) => setError(err instanceof ApiError ? err.message : 'Không tải được phiếu mượn'));
    }, 60_000);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStudent]);

  useEffect(() => {
    setCopies([]);
    setCopyId('');
    if (!bookId) return;
    bookCopiesApi.list({ bookId: Number(bookId), status: 'available', pageSize: 200 })
      .then((result) => setCopies(result.items))
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Không tải được bản sao'));
  }, [bookId]);

  async function submitReservation(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    try {
      await reservationsApi.create(Number(copyId), new Date(scheduledAt).toISOString());
      setShowForm(false);
      setCopyId('');
      setScheduledAt('');
      await Promise.all([loadReservations(), bookId ? bookCopiesApi.list({ bookId: Number(bookId), status: 'available', pageSize: 200 }).then((result) => setCopies(result.items)) : Promise.resolve()]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không đặt được lịch');
    }
  }

  async function actOnReservation(reservation: Reservation, action: 'cancel' | 'fulfill') {
    setError('');
    try {
      if (action === 'cancel') await reservationsApi.cancel(reservation.id);
      else await reservationsApi.fulfill(reservation.id);
      await loadReservations();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không thể cập nhật lịch đặt');
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center justify-between gap-4">
        <h1>{isStudent ? 'Đặt lịch mượn sách' : 'Lịch đặt của sinh viên'}</h1>
        {isStudent && <Button variant="primary" onClick={() => setShowForm(true)}>+ Đặt lịch mượn</Button>}
      </div>
      <div>
        <p className="mt-1 text-sm text-ink-soft">
          {isStudent ? 'Chọn bản sao còn sẵn và thời gian dự kiến đến nhận.' : 'Xác nhận lịch đặt khi sinh viên đến nhận sách.'}
        </p>
      </div>
      <ErrorText>{error}</ErrorText>

      {isStudent && openLoans.some((record) => new Date(record.dueDate).getTime() <= Date.now()) && (
        <div role="alert" className="mt-5 border-l-4 border-danger bg-danger/5 px-4 py-3">
          <p className="font-medium text-danger">Bạn có sách đã đến hạn nhưng chưa trả</p>
          <ul className="mt-2 space-y-1 text-sm text-ink">
            {openLoans.filter((record) => new Date(record.dueDate).getTime() <= Date.now()).map((record) => (
              <li key={record.id}>
                {record.copy?.book.title} ({record.copy?.copyCode}) · hạn trả {new Date(record.dueDate).toLocaleDateString('vi-VN')}
              </li>
            ))}
          </ul>
        </div>
      )}

      {isStudent && notifications.filter((item) => !item.readAt).map((item) => (
        <div key={item.id} className="mt-3 flex items-start justify-between gap-4 border-l-4 border-brass bg-brass-soft px-4 py-3 text-sm">
          <div><p className="font-medium">{item.title}</p><p>{item.message}</p></div>
          <Button onClick={async () => { await notificationsApi.markRead(item.id); await loadNotifications(); }}>Đã xem</Button>
        </div>
      ))}

      {showForm && isStudent && <Modal title="Đặt lịch mượn sách" onClose={() => setShowForm(false)}>
        {error && <ErrorText>{error}</ErrorText>}
        <form onSubmit={submitReservation} className="flex flex-wrap items-end gap-3">
          <Select label="Sách" value={bookId} onChange={(event) => setBookId(event.target.value)} required>
            <option value="">-- Chọn sách --</option>
            {books.map((book) => <option key={book.id} value={book.id}>{book.title}</option>)}
          </Select>
          <Select label="Bản sao" value={copyId} onChange={(event) => setCopyId(event.target.value)} required disabled={!bookId}>
            <option value="">{bookId ? 'Chọn bản sao còn sẵn' : 'Chọn sách trước'}</option>
            {copies.map((copy) => <option key={copy.id} value={copy.id}>{copy.copyCode} · kệ {copy.shelfRow}-{copy.shelfColumn}-{copy.shelfLevel}</option>)}
          </Select>
          <Input
            label="Thời gian đến nhận"
            type="datetime-local"
            min={localDateTimeMin()}
            value={scheduledAt}
            onChange={(event) => setScheduledAt(event.target.value)}
            required
          />
          <Button type="submit" variant="primary" disabled={!copyId || !scheduledAt}>Đặt lịch</Button>
        </form>
      </Modal>}

      <div className="mt-6 overflow-x-auto border-y border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-paper text-xs uppercase text-ink-soft">
            <tr>
              {!isStudent && <th className="px-4 py-3">Sinh viên</th>}
              <th className="px-4 py-3">Sách / Mã bản sao</th>
              <th className="px-4 py-3">Thời gian nhận</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {reservations.map((reservation) => (
              <tr key={reservation.id}>
                {!isStudent && <td className="px-4 py-3">{reservation.reader?.fullName} ({reservation.reader?.studentCode})</td>}
                <td className="px-4 py-3">
                  <div className="font-medium">{reservation.copy?.book.title}</div>
                  <div className="text-xs text-ink-soft">{reservation.copy?.copyCode}</div>
                </td>
                <td className="px-4 py-3">{new Date(reservation.scheduledAt).toLocaleString('vi-VN')}</td>
                <td className="px-4 py-3">{reservation.status === 'pending' ? 'Đang chờ' : reservation.status === 'fulfilled' ? 'Đã nhận sách' : 'Đã hủy'}</td>
                <td className="px-4 py-3">
                  {reservation.status === 'pending' && (isStudent
                    ? <Button onClick={() => actOnReservation(reservation, 'cancel')}>Hủy lịch</Button>
                    : <Button variant="primary" onClick={() => actOnReservation(reservation, 'fulfill')}>Xác nhận cho mượn</Button>)}
                </td>
              </tr>
            ))}
            {!loading && reservations.length === 0 && (
              <tr><td colSpan={isStudent ? 4 : 5} className="px-4 py-10 text-center text-ink-soft">Chưa có lịch đặt</td></tr>
            )}
            {loading && <tr><td colSpan={isStudent ? 4 : 5} className="px-4 py-10 text-center text-ink-soft">Đang tải...</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ReservationsPage() {
  return <RequireAuth><ReservationPageContent /></RequireAuth>;
}