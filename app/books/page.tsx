'use client';

import { useEffect, useState } from 'react';
import { RequireAuth } from '../ui/require-auth';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Pagination } from '../ui/pagination';
import { ErrorText } from '../ui/notice';
import { BookTable } from '../ui/books/book-table';
import { BookForm, BookFormValues } from '../ui/books/book-form';
import { Modal } from '../ui/modal';
import { ExcelColumn, ExcelImport } from '../ui/excel-import';
import { booksApi, ApiError } from '../lib/api';
import type { Book } from '../lib/types';

const PAGE_SIZE = 10;
const BOOK_EXCEL_COLUMNS: ExcelColumn[] = [
  { key: 'title', label: 'Tên sách', required: true, description: 'Tên đầy đủ của đầu sách' },
  { key: 'author', label: 'Tác giả', required: true, description: 'Tên tác giả' },
  { key: 'category', label: 'Thể loại', required: true, description: 'Thể loại sách' },
  { key: 'publisher', label: 'Nhà xuất bản', required: false, description: 'Có thể để trống' },
  { key: 'isbn', label: 'ISBN', required: false, description: 'ISBN phải duy nhất nếu có' },
  { key: 'copyQuantity', label: 'Số lượng bản sao', required: false, description: 'Để trống hoặc 0 nếu chưa nhập bản sao; tối đa 500 cho mỗi đầu sách' },
  { key: 'copyCodePrefix', label: 'Mã gốc bản sao', required: false, description: 'Bắt buộc khi số lượng bản sao lớn hơn 0; nhiều bản sẽ có hậu tố -001, -002...' },
  { key: 'shelfRow', label: 'Hàng kệ', required: false, description: 'Bắt buộc khi nhập bản sao' },
  { key: 'shelfColumn', label: 'Cột kệ', required: false, description: 'Bắt buộc khi nhập bản sao' },
  { key: 'shelfLevel', label: 'Tầng kệ', required: false, description: 'Bắt buộc khi nhập bản sao' },
];

function BooksPageContent() {
  const [items, setItems] = useState<Book[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('');
  const [selectedBookIds, setSelectedBookIds] = useState<number[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [editing, setEditing] = useState<Book | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await booksApi.list({
        search: search || undefined,
        author: author || undefined,
        category: category || undefined,
        page,
        pageSize: PAGE_SIZE,
      });
      setItems(res.items);
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    load();
  }

  async function handleSubmit(values: BookFormValues) {
    setFieldErrors({});
    const payload = { ...values, publisher: values.publisher || undefined, isbn: values.isbn || undefined };
    try {
      if (editing) await booksApi.update(editing.id, payload);
      else await booksApi.create(payload);
      setShowForm(false);
      load();
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) setFieldErrors(err.fieldErrors);
      else setError(err instanceof ApiError ? err.message : 'Lỗi lưu sách');
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Xóa sách này? (chỉ xóa được nếu không còn bản sao nào)')) return;
    try {
      await booksApi.remove(id);
      setSelectedBookIds((selected) => selected.filter((selectedId) => selectedId !== id));
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không xóa được sách');
    }
  }

  function toggleAllBooks(ids: number[]) {
    const allSelected = ids.every((id) => selectedBookIds.includes(id));
    setSelectedBookIds((selected) => allSelected
      ? selected.filter((id) => !ids.includes(id))
      : [...new Set([...selected, ...ids])]);
  }

  async function handleBulkDelete() {
    if (!selectedBookIds.length || !confirm(`Xóa ${selectedBookIds.length} sách đã chọn cùng bản sao chưa có lịch sử mượn/đặt trước? Sách có lịch sử sẽ được giữ lại.`)) return;
    setBulkDeleting(true);
    try {
      const result = await booksApi.removeMany(selectedBookIds);
      setSelectedBookIds([]);
      await load();
      alert(`Đã xóa ${result.deleted} sách và ${result.copiesDeleted} bản sao.${result.skipped ? ` Bỏ qua ${result.skipped} sách có lịch sử mượn/đặt trước hoặc không còn tồn tại.` : ''}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không thể xóa các sách đã chọn');
    } finally {
      setBulkDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1>Sách</h1>
          <p className="mt-1 text-sm text-ink-soft">{total} đầu sách trong thư viện</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {selectedBookIds.length > 0 && (
            <Button variant="danger" type="button" disabled={bulkDeleting} onClick={handleBulkDelete}>
              Xóa đã chọn ({selectedBookIds.length})
            </Button>
          )}
          <ExcelImport
            columns={BOOK_EXCEL_COLUMNS}
            fileName="mau-nhap-sach.xlsx"
            onImport={booksApi.importRows}
            onImported={load}
          />
          <Button
            variant="primary"
            onClick={() => {
              setEditing(null);
              setFieldErrors({});
              setShowForm(true);
            }}
          >
            + Thêm sách
          </Button>
        </div>
      </div>

      <form onSubmit={handleSearchSubmit} className="mt-6 flex flex-wrap gap-2">
        <Input
          className="w-48"
          placeholder="Tìm theo tên sách..."
          aria-label="Tìm theo tên sách"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Input
          className="w-48"
          placeholder="Tìm theo tác giả..."
          aria-label="Tìm theo tác giả"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
        />
        <Input
          className="w-48"
          placeholder="Tìm theo thể loại..."
          aria-label="Tìm theo thể loại"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <Button type="submit">Tìm</Button>
      </form>

      <ErrorText>{error}</ErrorText>

      {showForm && <Modal title={editing ? 'Sửa sách' : 'Thêm sách'} onClose={() => setShowForm(false)}>
        {error && <ErrorText>{error}</ErrorText>}
        <BookForm editing={editing} fieldErrors={fieldErrors} onSubmit={handleSubmit} onCancel={() => setShowForm(false)} />
      </Modal>}

      <div className="mt-6 overflow-x-auto rounded-lg border border-border">
        <BookTable
          items={items}
          loading={loading}
          selectedIds={selectedBookIds}
          onToggle={(id) => setSelectedBookIds((selected) => selected.includes(id)
            ? selected.filter((selectedId) => selectedId !== id)
            : [...selected, id])}
          onToggleAll={toggleAllBooks}
          onEdit={(book) => {
            setEditing(book);
            setFieldErrors({});
            setShowForm(true);
          }}
          onDelete={handleDelete}
        />
      </div>

      <Pagination page={page} totalPages={Math.max(1, Math.ceil(total / PAGE_SIZE))} onChange={setPage} />
    </div>
  );
}

export default function BooksPage() {
  return (
    <RequireAuth>
      <BooksPageContent />
    </RequireAuth>
  );
}
