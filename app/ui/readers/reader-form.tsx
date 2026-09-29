'use client';

import { useState } from 'react';
import { Button } from '../button';
import { Input } from '../input';
import type { Reader } from '../../lib/types';

export interface ReaderFormValues {
  fullName: string;
  studentCode: string;
  className: string;
  phone: string;
}

const emptyValues: ReaderFormValues = { fullName: '', studentCode: '', className: '', phone: '' };

interface ReaderFormProps {
  editing: Reader | null;
  fieldErrors: Record<string, string[]>;
  onSubmit: (values: ReaderFormValues) => void;
  onCancel: () => void;
}

export function ReaderForm({ editing, fieldErrors, onSubmit, onCancel }: ReaderFormProps) {
  const [values, setValues] = useState<ReaderFormValues>(
    editing
      ? {
          fullName: editing.fullName,
          studentCode: editing.studentCode,
          className: editing.className ?? '',
          phone: editing.phone ?? '',
        }
      : emptyValues,
  );

  function set<K extends keyof ReaderFormValues>(key: K, value: ReaderFormValues[K]) {
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
        placeholder="Họ tên"
        value={values.fullName}
        onChange={(e) => set('fullName', e.target.value)}
        error={fieldErrors.fullName?.join(', ')}
      />
      <Input
        placeholder="Mã sinh viên"
        value={values.studentCode}
        onChange={(e) => set('studentCode', e.target.value)}
        error={fieldErrors.studentCode?.join(', ')}
      />
      <Input
        placeholder="Lớp (tùy chọn)"
        value={values.className}
        onChange={(e) => set('className', e.target.value)}
      />
      <Input
        placeholder="Số điện thoại (tùy chọn)"
        value={values.phone}
        onChange={(e) => set('phone', e.target.value)}
      />
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
