'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { RequireAuth } from '../../../ui/require-auth';
import { Button } from '../../../ui/button';
import { ErrorText } from '../../../ui/notice';
import { BookCopyTable } from '../../../ui/book-copies/book-copy-table';
import { BookCopyForm, BookCopyFormValues } from '../../../ui/book-copies/book-copy-form';
import { Modal } from '../../../ui/modal';
import { ExcelColumn, ExcelImport } from '../../../ui/excel-import';
import { booksApi, bookCopiesApi, ApiError } from '../../../lib/api';
import type { Book, BookCopy } from '../../../lib/types';

const COPY_EXCEL_COLUMNS: ExcelColumn[] = [
  { key: 'copyCode', label: 'Mã bản sao', required: true, description: 'Mã bản sao phải duy nhất' },
  { key: 'shelfRow', label: 'Hàng kệ', required: true, description: 'Ví dụ: A' },
  { key: 'shelfColumn', label: 'Cột kệ', required: true, description: 'Ví dụ: 1' },
  { key: 'shelfLevel', label: 'Tầng kệ', required: true, description: 'Ví dụ: 2' },
];

function BookCopiesPageContent() {
  const params = useParams();
  const router = useRouter();
  const bookId = Number(params.id);

  const [book, setBook] = useState<Book | null>(null);
  const [items, setItems] = useState<BookCopy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [editing, setEditing] = useState<BookCopy | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [bookRes, copiesRes] = await Promise.all([
        booksApi.get(bookId),
        bookCopiesApi.list({ bookId, pageSize: 200 }),
      ]);
      setBook(bookRes);
      setItems(copiesRes.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId]);

  async function handleSubmit(values: BookCopyFormValues) {
    setFieldErrors({});
    try {
      if (editing) {
        const { quantity: _quantity, ...updateValues } = values;
        await bookCopiesApi.update(editing.id, updateValues);
      }
      else await bookCopiesApi.create({ ...values, bookId });
      setShowForm(false);
      load();
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) setFieldErrors(err.fieldErrors);
      else setError(err instanceof ApiError ? err.message : 'Lỗi lưu bản sao');
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Xóa bản sao này?')) return;
    try {
      await bookCopiesApi.remove(id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không xóa được bản sao');
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <button onClick={() => router.push('/books')} className="text-sm text-ink-soft hover:text-ink">
        ← Quay lại danh sách sách
      </button>

      <div className="mt-3 flex items-center justify-between">
        <div>
          <h1>{loading ? 'Đang tải...' : book?.title}</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {loading ? '' : `${book?.author} — quản lý bản sao vật lý`}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <ExcelImport
            columns={COPY_EXCEL_COLUMNS}
            fileName="mau-nhap-ban-sao.xlsx"
            onImport={(rows) => bookCopiesApi.importRows(bookId, rows)}
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
            + Thêm bản sao
          </Button>
        </div>
      </div>

      <ErrorText>{error}</ErrorText>

      {showForm && <Modal title={editing ? 'Sửa bản sao' : 'Thêm bản sao'} onClose={() => setShowForm(false)}>
        {error && <ErrorText>{error}</ErrorText>}
        <BookCopyForm editing={editing} fieldErrors={fieldErrors} onSubmit={handleSubmit} onCancel={() => setShowForm(false)} />
      </Modal>}

      <div className="mt-6 overflow-x-auto rounded-lg border border-border">
        <BookCopyTable
          items={items}
          loading={loading}
          onEdit={(copy) => {
            setEditing(copy);
            setFieldErrors({});
            setShowForm(true);
          }}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}

export default function BookCopiesPage() {
  return (
    <RequireAuth>
      <BookCopiesPageContent />
    </RequireAuth>
  );
}
