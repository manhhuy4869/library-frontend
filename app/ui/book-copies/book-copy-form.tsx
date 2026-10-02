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
  conditionNote: string;
}

const emptyValues: BookCopyFormValues = {
  copyCode: '',
  quantity: 1,
  shelfRow: '',
  shelfColumn: '',
  shelfLevel: '',
  status: 'available',
  conditionNote: '',
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
          conditionNote: editing.conditionNote ?? '',
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
      {editing && values.status === 'damaged' && (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-ink-soft" htmlFor="copy-condition-note">Mô tả hư hỏng</label>
          <textarea
            id="copy-condition-note"
            className="input min-h-24"
            maxLength={500}
            value={values.conditionNote}
            onChange={(event) => set('conditionNote', event.target.value)}
            placeholder="Ví dụ: rách bìa, thiếu trang, dính nước..."
            required
          />
          {fieldErrors.conditionNote && <p className="field-error">{fieldErrors.conditionNote.join(', ')}</p>}
        </div>
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
