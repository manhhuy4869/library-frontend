'use client';

import { useEffect, useState } from 'react';
import { RequireAuth } from '../ui/require-auth';
import { ErrorText, SuccessNotice } from '../ui/notice';
import { BorrowForm } from '../ui/borrow/borrow-form';
import { ActiveBorrowTable } from '../ui/borrow/active-borrow-table';
import { BorrowRecordDetailModal } from '../ui/borrow/borrow-record-detail-modal';
import { Button } from '../ui/button';
import { Modal } from '../ui/modal';
import { Input } from '../ui/input';
import { Pagination } from '../ui/pagination';
import { booksApi, readersApi, bookCopiesApi, borrowRecordsApi, ApiError } from '../lib/api';
import type { Book, Reader, BookCopy, BorrowRecord } from '../lib/types';

function locationOf(copy?: BookCopy) {
  if (!copy) return '—';
  return `${copy.shelfRow}-${copy.shelfColumn}-${copy.shelfLevel}`;
}

function BorrowPageContent() {
  const [books, setBooks] = useState<Book[]>([]);
  const [readers, setReaders] = useState<Reader[]>([]);
  const [copies, setCopies] = useState<BookCopy[]>([]);
  const [selectedBookId, setSelectedBookId] = useState('');
  const [selectedCopyId, setSelectedCopyId] = useState('');
  const [selectedReaderId, setSelectedReaderId] = useState('');
  const [activeRecords, setActiveRecords] = useState<BorrowRecord[]>([]);
  const [activeTotal, setActiveTotal] = useState(0);
  const [activeSearchInput, setActiveSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [activePage, setActivePage] = useState(1);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showBorrowForm, setShowBorrowForm] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<BorrowRecord | null>(null);

  async function loadDropdownData() {
    const [b, r] = await Promise.all([booksApi.list({ pageSize: 200 }), readersApi.list({ pageSize: 500 })]);
    setBooks(b.items);
    setReaders(r.items);
  }

  async function loadActiveRecords() {
    const res = await borrowRecordsApi.list({
      activeOnly: true,
      search: activeSearch || undefined,
      page: activePage,
      pageSize: 10,
    });
    setActiveRecords(res.items);
    setActiveTotal(res.total);
  }

  useEffect(() => {
    loadDropdownData();
  }, []);

  useEffect(() => {
    loadActiveRecords().catch((err) => setError(err instanceof ApiError ? err.message : 'Lỗi tải danh sách đang mượn'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePage, activeSearch]);

  useEffect(() => {
    if (!selectedBookId) {
      setCopies([]);
      return;
    }
    bookCopiesApi
      .list({ bookId: Number(selectedBookId), status: 'available', pageSize: 100 })
      .then((res) => setCopies(res.items));
    setSelectedCopyId('');
  }, [selectedBookId]);

  async function handleBorrow() {
    setError('');
    setNotice('');
    try {
      await borrowRecordsApi.borrow(Number(selectedCopyId), Number(selectedReaderId));
      setNotice('Cho mượn thành công.');
      setShowBorrowForm(false);
      setSelectedBookId('');
      setSelectedCopyId('');
      setSelectedReaderId('');
      loadActiveRecords();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Lỗi khi cho mượn');
    }
  }

  async function handleReturn(copyId: number) {
    setError('');
    setNotice('');
    try {
      const record = await borrowRecordsApi.return(copyId);
      setNotice(`Đã trả sách "${record.copy?.book.title}". Đặt về vị trí: ${locationOf(record.copy)}.`);
      loadActiveRecords();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Lỗi khi trả sách');
    }
  }

  function handleSearchSubmit(event: React.FormEvent) {
    event.preventDefault();
    setActivePage(1);
    setActiveSearch(activeSearchInput.trim());
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center justify-between">
        <h1>Mượn / Trả sách</h1>
        <Button variant="primary" onClick={() => setShowBorrowForm(true)}>+ Lập phiếu mượn</Button>
      </div>

      <ErrorText>{error}</ErrorText>
      <SuccessNotice>{notice}</SuccessNotice>

      {showBorrowForm && <Modal title="Cho mượn sách" onClose={() => setShowBorrowForm(false)}>
        {error && <ErrorText>{error}</ErrorText>}
        <BorrowForm
          books={books}
          readers={readers}
          copies={copies}
          selectedBookId={selectedBookId}
          selectedCopyId={selectedCopyId}
          selectedReaderId={selectedReaderId}
          onSelectBook={setSelectedBookId}
          onSelectCopy={setSelectedCopyId}
          onSelectReader={setSelectedReaderId}
          onSubmit={handleBorrow}
        />
      </Modal>}

      <div className="mt-8">
        <h2>Đang mượn ({activeTotal})</h2>
        <form onSubmit={handleSearchSubmit} className="mt-4 flex max-w-xl gap-2">
          <Input
            aria-label="Tìm phiếu đang mượn"
            placeholder="Tên độc giả, mã sinh viên, tên sách hoặc mã bản sao..."
            value={activeSearchInput}
            onChange={(event) => setActiveSearchInput(event.target.value)}
          />
          <Button type="submit">Tìm</Button>
          {activeSearch && (
            <Button type="button" onClick={() => { setActiveSearchInput(''); setActiveSearch(''); setActivePage(1); }}>
              Xóa
            </Button>
          )}
        </form>
        <div className="mt-4 overflow-x-auto rounded-lg border border-border">
          <ActiveBorrowTable items={activeRecords} onReturn={handleReturn} onDetails={setSelectedRecord} />
        </div>
        <Pagination
          page={activePage}
          totalPages={Math.max(1, Math.ceil(activeTotal / 10))}
          onChange={setActivePage}
        />
      </div>

      {selectedRecord && (
        <BorrowRecordDetailModal
          title={`Chi tiết phiếu mượn #${selectedRecord.id}`}
          records={[selectedRecord]}
          onClose={() => setSelectedRecord(null)}
        />
      )}
    </div>
  );
}

export default function BorrowPage() {
  return (
    <RequireAuth>
      <BorrowPageContent />
    </RequireAuth>
  );
}
