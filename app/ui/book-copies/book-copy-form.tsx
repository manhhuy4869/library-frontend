'use client';

import { useState } from 'react';
import { Button } from '../button';
import { Input } from '../input';
import { Select } from '../select';
import type { BookCopy, BookCopyStatus } from '../../lib/types';

export interface BookCopyFormValues {
  copyCode: string;
  quantity: number;
  shelfRow: string;
  shelfColumn: string;
  shelfLevel: string;
  status: BookCopyStatus;
}

const emptyValues: BookCopyFormValues = {
  copyCode: '',
  quantity: 1,
  shelfRow: '',
  shelfColumn: '',
  shelfLevel: '',
  status: 'available',
};

interface BookCopyFormProps {
  editing: BookCopy | null;
  fieldErrors: Record<string, string[]>;
  onSubmit: (values: BookCopyFormValues) => void;
  onCancel: () => void;
}

export function BookCopyForm({ editing, fieldErrors, onSubmit, onCancel }: BookCopyFormProps) {
  const [values, setValues] = useState<BookCopyFormValues>(
    editing
      ? {
          copyCode: editing.copyCode,
          quantity: 1,
          shelfRow: editing.shelfRow,
          shelfColumn: editing.shelfColumn,
          shelfLevel: editing.shelfLevel,
          status: editing.status,
        }
      : emptyValues,
  );

  function set<K extends keyof BookCopyFormValues>(key: K, value: BookCopyFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(values);
      }}
      className="flex flex-col gap-4"
    >
      <Input
        placeholder="Mã bản sao (VD: IT001)"
        value={values.copyCode}
        onChange={(e) => set('copyCode', e.target.value)}
        error={fieldErrors.copyCode?.join(', ')}
      />
      {!editing && (
        <Input
          label="Số lượng"
          type="number"
          min={1}
          max={500}
          value={values.quantity}
          onChange={(e) => set('quantity', Number(e.target.value))}
          error={fieldErrors.quantity?.join(', ')}
        />
      )}
      <div className="grid grid-cols-3 gap-3">
        <Input
          placeholder="Hàng (VD: A)"
          value={values.shelfRow}
          onChange={(e) => set('shelfRow', e.target.value)}
          error={fieldErrors.shelfRow?.join(', ')}
        />
        <Input
          placeholder="Cột (VD: 1)"
          value={values.shelfColumn}
          onChange={(e) => set('shelfColumn', e.target.value)}
          error={fieldErrors.shelfColumn?.join(', ')}
        />
        <Input
          placeholder="Ngăn (VD: 2)"
          value={values.shelfLevel}
          onChange={(e) => set('shelfLevel', e.target.value)}
          error={fieldErrors.shelfLevel?.join(', ')}
        />
      </div>
      {editing && (
        <Select
          label="Trạng thái"
          value={values.status}
          onChange={(e) => set('status', e.target.value as BookCopyStatus)}
        >
          <option value="available">Có sẵn</option>
          <option value="borrowed">Đang mượn</option>
          <option value="lost">Mất</option>
          <option value="damaged">Hỏng</option>
        </Select>
      )}
      <div className="flex gap-2">
        <Button variant="primary" type="submit">
          Lưu
        </Button>
        <Button type="button" onClick={onCancel}>
          Hủy
        </Button>
      </div>
    </form>
  );
}
