'use client';

import { Button } from '../button';
import { Select } from '../select';
import type { Book, Reader, BookCopy } from '../../lib/types';

function locationOf(copy: BookCopy) {
  return `${copy.shelfRow}-${copy.shelfColumn}-${copy.shelfLevel}`;
}

interface BorrowFormProps {
  books: Book[];
  readers: Reader[];
  copies: BookCopy[];
  selectedBookId: string;
  selectedCopyId: string;
  selectedReaderId: string;
  onSelectBook: (id: string) => void;
  onSelectCopy: (id: string) => void;
  onSelectReader: (id: string) => void;
  onSubmit: () => void;
}

export function BorrowForm({
  books,
  readers,
  copies,
  selectedBookId,
  selectedCopyId,
  selectedReaderId,
  onSelectBook,
  onSelectCopy,
  onSelectReader,
  onSubmit,
}: BorrowFormProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="mt-4 flex flex-wrap items-end gap-3"
    >
      <Select label="Độc giả" value={selectedReaderId} onChange={(e) => onSelectReader(e.target.value)} required>
        <option value="">-- Chọn --</option>
        {readers.map((r) => (
          <option key={r.id} value={r.id}>
            {r.fullName} ({r.studentCode})
          </option>
        ))}
      </Select>

      <Select label="Sách" value={selectedBookId} onChange={(e) => onSelectBook(e.target.value)} required>
        <option value="">-- Chọn --</option>
        {books.map((b) => (
          <option key={b.id} value={b.id}>
            {b.title}
          </option>
        ))}
      </Select>

      <Select
        label="Bản sao"
        value={selectedCopyId}
        onChange={(e) => onSelectCopy(e.target.value)}
        required
        disabled={!selectedBookId}
      >
        <option value="">{selectedBookId ? `${copies.length} còn sẵn` : '-- Chọn sách trước --'}</option>
        {copies.map((c) => (
          <option key={c.id} value={c.id}>
            {c.copyCode} — vị trí {locationOf(c)}
          </option>
        ))}
      </Select>

      <Button variant="primary" type="submit" disabled={!selectedCopyId || !selectedReaderId}>
        Cho mượn
      </Button>
    </form>
  );
}
