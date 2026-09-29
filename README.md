# library-frontend

Next.js (App Router) — quản trị thư viện: sách, độc giả, mượn/trả, tài khoản.
Gọi API từ `library-backend` (project riêng).

## Nguồn tham khảo đã áp dụng

- **Cấu trúc `app/ui/` + `app/lib/`**: theo [Next.js App Router Course chính thức
  của Vercel](https://nextjs.org/learn/dashboard-app) — chuẩn được khuyến nghị cho
  dashboard app, không phải tự nghĩ ra. `app/ui/` chứa component theo từng domain
  (`books/`, `readers/`, `borrow/`...) + primitive dùng chung ở gốc; `app/lib/`
  chứa gọi API, type, auth.
- **Tailwind v4 CSS-first** (`@tailwindcss/postcss`, token qua `@theme` trong
  `styles/globals.css`): theo cấu hình thật của
  [netlify-templates/next-platform-starter](https://github.com/netlify-templates/next-platform-starter).
  Khác biệt có chủ đích: giữ TypeScript (repo gốc dùng JS thuần) vì toàn bộ lớp
  gọi API đã type chặt khớp response backend.

## Cấu trúc

```
app/
├── layout.tsx            # AuthProvider + Sidebar, next/font (Source Serif 4 + Inter)
├── page.tsx              # redirect /login hoặc /books tùy trạng thái đăng nhập
├── login/page.tsx
├── books/
│   ├── page.tsx           # danh sách + tìm kiếm + phân trang + form thêm/sửa
│   └── [id]/copies/page.tsx  # quản lý bản sao vật lý của 1 đầu sách
├── readers/page.tsx
├── borrow/page.tsx        # cho mượn + danh sách đang mượn kèm nút trả (hiện vị trí kệ)
├── users/page.tsx         # quản lý tài khoản + đổi mật khẩu của chính mình
├── dashboard/page.tsx     # trang mặc định sau đăng nhập - thống kê tổng quan
├── ui/                    # component theo domain (Next.js dashboard course convention)
│   ├── button.tsx, input.tsx, select.tsx, badge.tsx    # primitive dùng chung
│   ├── pagination.tsx, empty-state.tsx, notice.tsx
│   ├── sidebar.tsx, require-auth.tsx
│   ├── books/book-table.tsx, book-form.tsx
│   ├── readers/reader-table.tsx, reader-form.tsx
│   ├── borrow/borrow-form.tsx, active-borrow-table.tsx
│   ├── book-copies/book-copy-table.tsx, book-copy-form.tsx
│   ├── users/user-table.tsx, user-form.tsx, change-password-form.tsx
│   └── dashboard/stat-card.tsx
└── lib/
    ├── types.ts           # khớp ĐÚNG response backend
    ├── api.ts              # fetch client - tự refresh JWT, unwrap ApiResponse
    └── auth-context.tsx    # AuthProvider + useAuth() - decode JWT lấy user hiện tại
styles/
└── globals.css            # Tailwind v4 - token màu/font + component class (.btn-*, .card...)
```

Quy tắc tổ chức: `page.tsx` chỉ lo state + gọi API; giao diện (bảng, form) nằm
hết trong `app/ui/<domain>/`. Muốn sửa hiển thị bảng sách → sửa
`app/ui/books/book-table.tsx`, không đụng `app/books/page.tsx`.

## Cài đặt

```bash
npm install
cp .env.local.example .env.local   # NEXT_PUBLIC_API_URL trỏ về backend (/api/v1)
npm run dev
```

- Frontend: http://localhost:3001 — cần `library-backend` chạy sẵn ở
  `http://localhost:3000` (đã `prisma migrate dev` + `prisma db seed`)
- Đăng nhập bằng tài khoản seed: `thuthu` / `123456`

## Giao diện (Tailwind v4)

**Hệ thống thiết kế — "phòng đọc thư viện":**
- Màu: `ink` (navy đậm, sidebar + chữ), `paper` (nền trắng ngà), `brass` (đồng ấm,
  nút chính/điểm nhấn), `danger`/`success` cho trạng thái
- Font: `Source Serif 4` (tiêu đề) + `Inter` (nội dung/bảng), qua `next/font/google`
  (tự host lúc build, không phụ thuộc CDN runtime)
- Component class dùng chung trong `globals.css` (`@layer components`): `.btn-primary`,
  `.btn-secondary`, `.btn-danger`, `.input`, `.card`, `.table-shell`, `.badge-*`.
  Lưu ý Tailwind v4: KHÔNG `@apply` được 1 class tự định nghĩa vào class tự định
  nghĩa khác — mỗi biến thể phải viết đầy đủ, không chain qua class trung gian.

## Luồng auth

- Login lưu `accessToken` (15 phút) + `refreshToken` (7 ngày) vào `localStorage`,
  đồng thời decode JWT (base64, không verify — chỉ để hiển thị UI) lấy
  `username`/`role` hiện tại
- Mọi request tự gắn header `Authorization: Bearer <accessToken>`
- Nhận `401` → tự gọi `/auth/refresh` MỘT LẦN, thành công thì gọi lại request gốc;
  thất bại → xóa token, đẩy về `/login`
- `RequireAuth` (`app/ui/require-auth.tsx`) bọc quanh mọi page cần đăng nhập —
  check CLIENT-SIDE bằng `localStorage`, không dùng Next.js middleware (middleware
  chạy ở edge/server, không đọc được `localStorage` của trình duyệt)

## Lỗi validate hiển thị theo field

Khi backend trả `errorCode: 1001` (ValidationException), `data` chứa lỗi theo
từng field. `ApiError.fieldErrors` tự parse sẵn — mọi form (`BookForm`,
`ReaderForm`, `UserForm`, `BookCopyForm`) hiển thị lỗi ngay dưới từng ô input qua
prop `error` của `<Input>`.

## Có thể làm thêm

- Toast notification thay vì `<ErrorText>`/`<SuccessNotice>` tĩnh trên đầu trang
- Trang thống kê (`/dashboard`) — tổng số sách, độc giả, phiếu mượn quá hạn
- Test (Jest + React Testing Library) — chưa có
