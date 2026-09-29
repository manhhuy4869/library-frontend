'use client';

import { ChangeEvent, useRef, useState } from 'react';
import { readSheet } from 'read-excel-file/browser';
import writeExcelFile from 'write-excel-file/browser';
import { ApiError } from '../lib/api';
import { Button } from './button';

export interface ExcelColumn {
  key: string;
  label: string;
  required: boolean;
  description: string;
}

type ExcelRow = Record<string, string>;
interface ImportResult {
  created: number;
  skipped: number;
  copiesCreated?: number;
}

interface ExcelImportProps {
  columns: ExcelColumn[];
  fileName: string;
  onImport: (rows: ExcelRow[]) => Promise<ImportResult>;
  onImported: () => void | Promise<void>;
}

function normalizeHeader(value: unknown) {
  return String(value ?? '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('vi')
    .replace(/[^a-z0-9]/g, '');
}

async function parseWorkbook(file: File, columns: ExcelColumn[]): Promise<ExcelRow[]> {
  if (file.size > 5 * 1024 * 1024) throw new Error('File Excel tối đa 5 MB.');
  const sheet = await readSheet(file);
  if (!sheet.length) throw new Error('File Excel chưa có dòng tiêu đề.');

  const headers = sheet[0].map(normalizeHeader);
  const indexes = columns.map((column) => headers.indexOf(normalizeHeader(column.label)));
  const missingHeaders = columns.filter((column, index) => column.required && indexes[index] < 0);
  if (missingHeaders.length) {
    throw new Error(`Thiếu cột bắt buộc: ${missingHeaders.map(({ label }) => label).join(', ')}`);
  }

  const rows: ExcelRow[] = [];
  const errors: string[] = [];
  let totalCopies = 0;
  sheet.slice(1).forEach((cells, rowIndex) => {
    const row: ExcelRow = {};
    columns.forEach((column, columnIndex) => {
      const cellIndex = indexes[columnIndex];
      row[column.key] = cellIndex < 0 ? '' : String(cells[cellIndex] ?? '').trim();
    });
    if (Object.values(row).every((value) => !value)) return;

    const missing = columns.filter((column) => column.required && !row[column.key]);
    const copyQuantity = row.copyQuantity ? Number(row.copyQuantity) : 0;
    if ('copyQuantity' in row && row.copyQuantity && (!Number.isInteger(copyQuantity) || copyQuantity < 0 || copyQuantity > 500)) {
      errors.push(`Dòng ${rowIndex + 2}: số lượng bản sao phải là số nguyên từ 0 đến 500`);
    }
    if (copyQuantity > 0) {
      totalCopies += copyQuantity;
      const missingCopyFields = ['copyCodePrefix', 'shelfRow', 'shelfColumn', 'shelfLevel'].filter((key) => !row[key]);
      if (missingCopyFields.length) {
        errors.push(`Dòng ${rowIndex + 2}: cần mã gốc và đầy đủ vị trí kệ khi nhập bản sao`);
      }
    }
    if (missing.length) {
      errors.push(`Dòng ${rowIndex + 2}: thiếu ${missing.map(({ label }) => label).join(', ')}`);
    } else {
      rows.push(row);
    }
  });

  if (errors.length) throw new Error(errors.slice(0, 8).join('; '));
  if (!rows.length) throw new Error('File không có dòng dữ liệu hợp lệ.');
  if (rows.length > 500) throw new Error('Mỗi lần chỉ nhập tối đa 500 dòng.');
  if (totalCopies > 2000) throw new Error('Mỗi lần chỉ nhập tối đa 2.000 bản sao.');
  return rows;
}

async function downloadTemplate(fileName: string, columns: ExcelColumn[]) {
  const workbook = [
    {
      sheet: 'Du lieu',
      data: [columns.map(({ label }) => label)],
      columns: columns.map(() => ({ width: 24 })),
    },
    {
      sheet: 'Huong dan',
      data: [
        ['Tên cột', 'Bắt buộc', 'Mô tả'],
        ...columns.map(({ label, required, description }) => [label, required ? 'Có' : 'Không', description]),
      ],
      columns: [{ width: 24 }, { width: 14 }, { width: 60 }],
    },
  ];
  const blob = await writeExcelFile(workbook).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function ExcelImport({ columns, fileName, onImport, onImported }: ExcelImportProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const rows = await parseWorkbook(file, columns);
      const result = await onImport(rows);
      setMessage(
        result.copiesCreated === undefined
          ? `Đã nhập ${result.created} dòng; bỏ qua ${result.skipped} dòng trùng.`
          : `Đã nhập ${result.created} đầu sách và ${result.copiesCreated} bản sao; bỏ qua ${result.skipped} dòng trùng.`,
      );
      await onImported();
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : 'Không đọc được file Excel.');
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" onClick={() => downloadTemplate(fileName, columns)}>Tải mẫu Excel</Button>
      <label className={`btn-secondary cursor-pointer ${loading ? 'pointer-events-none opacity-50' : ''}`}>
        {loading ? 'Đang nhập...' : 'Nhập Excel'}
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="sr-only"
          onChange={handleFileChange}
          disabled={loading}
        />
      </label>
      {(message || error) && <span className={`text-xs ${error ? 'text-danger' : 'text-success'}`} role="status">{error || message}</span>}
    </div>
  );
}