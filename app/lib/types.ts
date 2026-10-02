// Type khớp ĐÚNG response thật của library-backend (đã bọc ApiResponse qua
// TransformInterceptor + PaginatedResult qua helper/paginate.helper.ts).
// Đổi tay ở đây khi BE đổi field - hoặc generate lại từ Swagger
// (npx openapi-typescript http://localhost:3000/api/docs-json -o lib/api-types.ts).

export type BookCopyStatus = 'available' | 'reserved' | 'borrowed' | 'lost' | 'damaged';
export type BorrowStatus = 'borrowing' | 'returned' | 'overdue';
export type UserRole = string;
export type ReservationStatus = 'pending' | 'fulfilled' | 'cancelled';

export interface Book {
  id: number;
  title: string;
  author: string;
  category: string;
  publisher?: string | null;
  isbn?: string | null;
  createdAt: string;
  copies?: BookCopy[];
}

export interface BookCopy {
  id: number;
  bookId: number;
  copyCode: string;
  shelfRow: string;
  shelfColumn: string;
  shelfLevel: string;
  status: BookCopyStatus;
  conditionNote?: string | null;
  book?: Book;
}

export interface Reader {
  id: number;
  fullName: string;
  studentCode: string;
  className?: string | null;
  phone?: string | null;
  borrowRecords?: BorrowRecord[];
}

export interface BorrowRecord {
  id: number;
  copyId: number;
  readerId: number;
  borrowDate: string;
  dueDate: string;
  returnDate?: string | null;
  status: BorrowStatus;
  receiptCondition: 'pending' | 'good' | 'damaged';
  conditionNote?: string | null;
  conditionConfirmedAt?: string | null;
  staffIssueConfirmedAt?: string | null;
  copy?: BookCopy & { book: Book };
  reader?: Reader;
}

export interface Reservation {
  id: number;
  copyId: number;
  readerId: number;
  scheduledAt: string;
  status: ReservationStatus;
  createdAt: string;
  copy?: BookCopy & { book: Book };
  reader?: Reader;
}

export interface User {
  id: number;
  username: string;
  fullName: string;
  role: UserRole;
  approvalStatus: 'pending' | 'approved' | 'rejected';
}

export interface PermissionInfo {
  code: string;
  name: string;
  description?: string | null;
}

export interface AccessRole {
  code: string;
  name: string;
  description?: string | null;
  isSystem: boolean;
  permissions: { roleCode: string; permissionCode: string; permission: PermissionInfo }[];
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface StatisticsOverview {
  books: { total: number };
  copies: { total: number; available: number; borrowed: number; lostOrDamaged: number };
  readers: { total: number; borrowed: number; currentlyBorrowing: number };
  borrowing: { current: number; overdue: number; borrowedThisMonth: number; returnedThisMonth: number };
}

export interface BorrowerStatistic {
  id: number;
  fullName: string;
  studentCode: string;
  className?: string | null;
  currentlyBorrowing: number;
  overdue: number;
  totalBorrowed: number;
}

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  readAt?: string | null;
  createdAt: string;
}

export interface Fine {
  id: number;
  type: 'late_return' | 'damaged' | 'lost';
  reason?: string | null;
  amount: number;
  daysLate: number;
  status: 'unpaid' | 'paid';
  paidAt?: string | null;
  borrowRecord: BorrowRecord;
}

export interface FinePolicy {
  lateReturnPerDay: number;
  damagedBookFee: number;
  lostBookFee: number;
  updatedAt?: string;
}

export interface PopularBook { id: number; title: string; author: string; borrowedCount: number }
export interface MonthlyReport { month: string; borrowed: number; returned: number }

// Shape DUY NHẤT mọi response từ BE (xem common/interceptors/transform.interceptor.ts
// và common/filters/http-exception.filter.ts bên BE)
export interface ApiResponse<T = unknown> {
  code: number; // 0 = success, 1 = error
  errorCode?: number;
  message: string;
  data: T | null;
  timestamp: string;
}
