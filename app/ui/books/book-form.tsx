'use client';

import { useState } from 'react';
import { Button } from '../button';
import { Input } from '../input';
import type { Book } from '../../lib/types';

export interface BookFormValues {
  title: string;
  author: string;
  category: string;
  publisher: string;
  isbn: string;
}

const emptyValues: BookFormValues = { title: '', author: '', category: '', publisher: '', isbn: '' };

interface BookFormProps {
  editing: Book | null;
  fieldErrors: Record<string, string[]>;
  onSubmit: (values: BookFormValues) => void;
  onCancel: () => void;
}

export function BookForm({ editing, fieldErrors, onSubmit, onCancel }: BookFormProps) {
  const [values, setValues] = useState<BookFormValues>(
    editing
      ? {
          title: editing.title,
          author: editing.author,
          category: editing.category,
          publisher: editing.publisher ?? '',
          isbn: editing.isbn ?? '',
        }
      : emptyValues,
  );

  function set<K extends keyof BookFormValues>(key: K, value: BookFormValues[K]) {
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
        placeholder="Tên sách"
        value={values.title}
        onChange={(e) => set('title', e.target.value)}
        error={fieldErrors.title?.join(', ')}
      />
      <Input
        placeholder="Tác giả"
        value={values.author}
        onChange={(e) => set('author', e.target.value)}
        error={fieldErrors.author?.join(', ')}
      />
      <Input
        placeholder="Thể loại"
        value={values.category}
        onChange={(e) => set('category', e.target.value)}
        error={fieldErrors.category?.join(', ')}
      />
      <Input
        placeholder="Nhà xuất bản (tùy chọn)"
        value={values.publisher}
        onChange={(e) => set('publisher', e.target.value)}
      />
      <Input
        placeholder="ISBN (tùy chọn)"
        value={values.isbn}
        onChange={(e) => set('isbn', e.target.value)}
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
