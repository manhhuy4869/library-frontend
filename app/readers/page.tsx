'use client';

import { useEffect, useState } from 'react';
import { RequireAuth } from '../ui/require-auth';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Pagination } from '../ui/pagination';
import { ErrorText } from '../ui/notice';
import { ReaderTable } from '../ui/readers/reader-table';
import { ReaderForm, ReaderFormValues } from '../ui/readers/reader-form';
import { Modal } from '../ui/modal';
import { ExcelColumn, ExcelImport } from '../ui/excel-import';
import { readersApi, ApiError } from '../lib/api';
import type { Reader } from '../lib/types';

const PAGE_SIZE = 10;
const READER_EXCEL_COLUMNS: ExcelColumn[] = [
  { key: 'fullName', label: 'Họ tên', required: true, description: 'Họ tên độc giả' },
  { key: 'studentCode', label: 'Mã sinh viên', required: true, description: 'Mã sinh viên duy nhất' },
  { key: 'className', label: 'Lớp', required: false, description: 'Có thể để trống' },
  { key: 'phone', label: 'Số điện thoại', required: false, description: 'Có thể để trống' },
];

function ReadersPageContent() {
  const [items, setItems] = useState<Reader[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [editing, setEditing] = useState<Reader | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await readersApi.list({ search: search || undefined, page, pageSize: PAGE_SIZE });
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

  async function handleSubmit(values: ReaderFormValues) {
    setFieldErrors({});
    const payload = { ...values, className: values.className || undefined, phone: values.phone || undefined };
    try {
      if (editing) await readersApi.update(editing.id, payload);
      else await readersApi.create(payload);
      setShowForm(false);
      load();
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) setFieldErrors(err.fieldErrors);
      else setError(err instanceof ApiError ? err.message : 'Lỗi lưu độc giả');
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Xóa độc giả này?')) return;
    try {
      await readersApi.remove(id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không xóa được độc giả');
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1>Độc giả</h1>
          <p className="mt-1 text-sm text-ink-soft">{total} độc giả đã đăng ký</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <ExcelImport
            columns={READER_EXCEL_COLUMNS}
            fileName="mau-nhap-doc-gia.xlsx"
            onImport={readersApi.importRows}
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
            + Thêm độc giả
          </Button>
        </div>
      </div>

      <form onSubmit={handleSearchSubmit} className="mt-6 flex gap-2">
        <Input
          className="max-w-xs"
          placeholder="Tìm theo tên hoặc mã SV..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button type="submit">Tìm</Button>
      </form>

      <ErrorText>{error}</ErrorText>

      {showForm && <Modal title={editing ? 'Sửa độc giả' : 'Thêm độc giả'} onClose={() => setShowForm(false)}>
        {error && <ErrorText>{error}</ErrorText>}
        <ReaderForm editing={editing} fieldErrors={fieldErrors} onSubmit={handleSubmit} onCancel={() => setShowForm(false)} />
      </Modal>}

      <div className="mt-6 overflow-x-auto rounded-lg border border-border">
        <ReaderTable
          items={items}
          loading={loading}
          onEdit={(reader) => {
            setEditing(reader);
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

export default function ReadersPage() {
  return (
    <RequireAuth>
      <ReadersPageContent />
    </RequireAuth>
  );
}
