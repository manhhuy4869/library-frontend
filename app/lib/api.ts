import type {
  ApiResponse,
  Book,
  BookCopy,
  Reader,
  BorrowRecord,
  PaginatedResult,
  User,
  StatisticsOverview,
  Reservation,
  AccessRole,
  PermissionInfo,
  BorrowerStatistic,
  Notification,
  Fine,
  PopularBook,
  MonthlyReport,
} from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

export interface AuditItem {
  id: number;
  action: string;
  entity: string;
  entityId?: number;
  createdAt: string;
  user?: { username: string; fullName: string };
}

function getAccessToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
}

function clearTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

// new URLSearchParams({ a: undefined }) KHÔNG bỏ field - nó biến undefined thành
// chuỗi "undefined" literal trong query string (?a=undefined), khiến BE nhận giá
// trị filter sai (VD: search="undefined" thay vì không lọc gì, trả về rỗng oan).
// Phải tự lọc bỏ undefined/null trước khi đưa vào URLSearchParams.
function toQueryString(params: Record<string, unknown> = {}): string {
  const filtered: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') filtered[key] = String(value);
  }
  const qs = new URLSearchParams(filtered).toString();
  return qs ? `?${qs}` : '';
}

export class ApiError extends Error {
  constructor(
    message: string,
    public errorCode?: number,
    public fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
  }
}

// true khi đang refresh - tránh nhiều request 401 cùng lúc đều tự gọi refresh
// riêng lẻ (mỗi request hết hạn gần như đồng thời khi accessToken sống có 15 phút).
let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
  if (!refreshToken) return false;

  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async (res) => {
        if (!res.ok) return false;
        const body: ApiResponse<{ accessToken: string; refreshToken: string }> = await res.json();
        if (!body.data) return false;
        setTokens(body.data.accessToken, body.data.refreshToken);
        return true;
      })
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

async function apiFetch<T>(path: string, options: RequestInit = {}, isRetry = false): Promise<T> {
  const token = getAccessToken();

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  // 401 = accessToken hết hạn - thử refresh 1 LẦN rồi gọi lại request gốc, tránh
  // vòng lặp vô hạn nếu refreshToken cũng đã hết hạn/bị thu hồi
  if (res.status === 401 && !isRetry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return apiFetch<T>(path, options, true);
    clearTokens();
    if (typeof window !== 'undefined') window.location.href = '/login';
    throw new ApiError('Phiên đăng nhập đã hết hạn');
  }

  const body: ApiResponse<T> = await res.json();

  if (body.code !== 0) {
    // ValidationException (BE) trả field-level errors trong `data`
    const fieldErrors = body.errorCode === 1001 ? (body.data as Record<string, string[]>) : undefined;
    throw new ApiError(body.message, body.errorCode, fieldErrors);
  }

  return body.data as T;
}

// ===================== Auth =====================
export const authApi = {
  async login(username: string, password: string) {
    const data = await apiFetch<{ accessToken: string; refreshToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    setTokens(data.accessToken, data.refreshToken);
    return data;
  },
  async logout() {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } finally {
      clearTokens();
    }
  },
  async registerStudent(dto: {
    username: string;
    password: string;
    fullName: string;
    studentCode: string;
    className?: string;
    phone?: string;
  }) {
    const data = await apiFetch<{ accessToken: string; refreshToken: string }>('/auth/register-student', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    setTokens(data.accessToken, data.refreshToken);
    return data;
  },
  isAuthenticated() {
    return !!getAccessToken();
  },
};

// ===================== Reservations =====================
export const reservationsApi = {
  own: () => apiFetch<Reservation[]>('/reservations/own'),
  list: () => apiFetch<Reservation[]>('/reservations'),
  create: (copyId: number, scheduledAt: string) =>
    apiFetch<Reservation>('/reservations', {
      method: 'POST',
      body: JSON.stringify({ copyId, scheduledAt }),
    }),
  cancel: (id: number) => apiFetch<Reservation>(`/reservations/${id}/cancel`, { method: 'POST' }),
  fulfill: (id: number) => apiFetch<Reservation>(`/reservations/${id}/fulfill`, { method: 'POST' }),
};

// ===================== Books =====================
export const booksApi = {
  list: (params: { search?: string; page?: number; pageSize?: number } = {}) =>
    apiFetch<PaginatedResult<Book>>(`/books${toQueryString(params)}`),
  get: (id: number) => apiFetch<Book>(`/books/${id}`),
  create: (dto: Partial<Book>) =>
    apiFetch<Book>('/books', { method: 'POST', body: JSON.stringify(dto) }),
  importRows: (rows: Record<string, string>[]) =>
    apiFetch<{ created: number; copiesCreated: number; skipped: number }>('/books/import', {
      method: 'POST',
      body: JSON.stringify({ rows }),
    }),
  update: (id: number, dto: Partial<Book>) =>
    apiFetch<Book>(`/books/${id}`, { method: 'PUT', body: JSON.stringify(dto) }),
  remove: (id: number) => apiFetch<Book>(`/books/${id}`, { method: 'DELETE' }),
};

// ===================== Book copies =====================
export const bookCopiesApi = {
  list: (params: { bookId?: number; status?: string; page?: number; pageSize?: number } = {}) =>
    apiFetch<PaginatedResult<BookCopy>>(`/book-copies${toQueryString(params)}`),
  create: (dto: Partial<BookCopy> & { quantity?: number }) =>
    apiFetch<BookCopy | BookCopy[]>('/book-copies', { method: 'POST', body: JSON.stringify(dto) }),
  importRows: (bookId: number, rows: Record<string, string>[]) =>
    apiFetch<{ created: number; skipped: number }>('/book-copies/import', {
      method: 'POST',
      body: JSON.stringify({ bookId, rows }),
    }),
  update: (id: number, dto: Partial<BookCopy>) =>
    apiFetch<BookCopy>(`/book-copies/${id}`, { method: 'PUT', body: JSON.stringify(dto) }),
  remove: (id: number) => apiFetch<BookCopy>(`/book-copies/${id}`, { method: 'DELETE' }),
};

// ===================== Readers =====================
export const readersApi = {
  list: (params: { search?: string; page?: number; pageSize?: number } = {}) =>
    apiFetch<PaginatedResult<Reader>>(`/readers${toQueryString(params)}`),
  get: (id: number) => apiFetch<Reader>(`/readers/${id}`),
  create: (dto: Partial<Reader>) =>
    apiFetch<Reader>('/readers', { method: 'POST', body: JSON.stringify(dto) }),
  importRows: (rows: Record<string, string>[]) =>
    apiFetch<{ created: number; skipped: number }>('/readers/import', {
      method: 'POST',
      body: JSON.stringify({ rows }),
    }),
  update: (id: number, dto: Partial<Reader>) =>
    apiFetch<Reader>(`/readers/${id}`, { method: 'PUT', body: JSON.stringify(dto) }),
  remove: (id: number) => apiFetch<Reader>(`/readers/${id}`, { method: 'DELETE' }),
};

// ===================== Borrow records =====================
export const borrowRecordsApi = {
  list: (params: { readerId?: number; status?: string; search?: string; activeOnly?: boolean; page?: number; pageSize?: number } = {}) =>
    apiFetch<PaginatedResult<BorrowRecord>>(`/borrow-records${toQueryString(params)}`),
  own: () => apiFetch<BorrowRecord[]>('/borrow-records/own'),
  borrow: (copyId: number, readerId: number) =>
    apiFetch<BorrowRecord>('/borrow-records/borrow', {
      method: 'POST',
      body: JSON.stringify({ copyId, readerId }),
    }),
  return: (copyId: number) =>
    apiFetch<BorrowRecord>('/borrow-records/return', {
      method: 'POST',
      body: JSON.stringify({ copyId }),
    }),
};

// ===================== Users =====================
export const usersApi = {
  list: (params: { page?: number; pageSize?: number } = {}) =>
    apiFetch<PaginatedResult<User>>(`/users${toQueryString(params)}`),
  create: (dto: { username: string; password: string; fullName: string; role?: string }) =>
    apiFetch<User>('/users', { method: 'POST', body: JSON.stringify(dto) }),
  update: (id: number, dto: Partial<Pick<User, 'fullName' | 'role'>>) =>
    apiFetch<User>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(dto) }),
  remove: (id: number) => apiFetch<User>(`/users/${id}`, { method: 'DELETE' }),
  changePassword: (oldPassword: string, newPassword: string) =>
    apiFetch<void>('/users/me/change-password', {
      method: 'POST',
      body: JSON.stringify({ oldPassword, newPassword }),
    }),
};

// ===================== Roles and permissions =====================
export const rolesApi = {
  list: () => apiFetch<AccessRole[]>('/roles'),
  permissions: () => apiFetch<PermissionInfo[]>('/roles/permissions'),
  create: (dto: { code: string; name: string; description?: string; permissionCodes: string[] }) =>
    apiFetch<AccessRole>('/roles', { method: 'POST', body: JSON.stringify(dto) }),
  update: (code: string, dto: { name: string; description?: string; permissionCodes: string[] }) =>
    apiFetch<AccessRole>(`/roles/${encodeURIComponent(code)}`, { method: 'PUT', body: JSON.stringify(dto) }),
  remove: (code: string) => apiFetch<AccessRole>(`/roles/${encodeURIComponent(code)}`, { method: 'DELETE' }),
};

// ===================== Statistics =====================
export const statisticsApi = {
  overview: () => apiFetch<StatisticsOverview>('/statistics/overview'),
  borrowers: (params: { search?: string; page?: number; pageSize?: number } = {}) =>
    apiFetch<PaginatedResult<BorrowerStatistic>>(`/statistics/borrowers${toQueryString(params)}`),
  popularBooks: () => apiFetch<PopularBook[]>('/statistics/popular-books'),
  monthly: () => apiFetch<MonthlyReport[]>('/statistics/monthly'),
};

export const notificationsApi = {
  own: () => apiFetch<Notification[]>('/notifications/own'),
  markRead: (id: number) => apiFetch<void>(`/notifications/${id}/read`, { method: 'POST' }),
};

export const finesApi = {
  list: () => apiFetch<Fine[]>('/fines'),
  pay: (id: number) => apiFetch<Fine>(`/fines/${id}/pay`, { method: 'POST' }),
};

export const auditApi = {
  list: () => apiFetch<AuditItem[]>('/audit'),
};
