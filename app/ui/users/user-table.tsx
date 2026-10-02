import { Button } from '../button';
import { Badge } from '../badge';
import { EmptyState } from '../empty-state';
import type { User } from '../../lib/types';

interface UserTableProps {
  items: User[];
  loading: boolean;
  currentUsername?: string;
  onEdit: (user: User) => void;
  onDelete: (id: number) => void;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
}

export function UserTable({ items, loading, currentUsername, onEdit, onDelete, onApprove, onReject }: UserTableProps) {
  if (loading) return <p className="p-6 text-sm text-ink-soft">Đang tải...</p>;

  return (
    <table className="table-shell">
      <thead>
        <tr>
          <th>Tên đăng nhập</th>
          <th>Họ tên</th>
          <th>Vai trò</th>
          <th>Trạng thái</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {items.map((user) => (
          <tr key={user.id}>
            <td className="font-medium">{user.username}</td>
            <td>{user.fullName}</td>
            <td>
              <Badge variant={user.role === 'admin' ? 'warning' : 'neutral'}>
                {user.role === 'admin' ? 'Admin' : user.role === 'student' ? 'Sinh viên' : user.role === 'librarian' ? 'Thủ thư' : user.role}
              </Badge>
            </td>
            <td>
              <Badge variant={user.approvalStatus === 'pending' ? 'warning' : 'neutral'}>
                {user.approvalStatus === 'approved' ? 'Đã duyệt' : user.approvalStatus === 'pending' ? 'Chờ duyệt' : 'Đã từ chối'}
              </Badge>
            </td>
            <td>
              {user.role === 'student' && user.approvalStatus !== 'approved' ? (
                <div className="flex justify-end gap-2">
                  <Button variant="primary" onClick={() => onApprove(user.id)}>{user.approvalStatus === 'rejected' ? 'Duyệt lại' : 'Duyệt'}</Button>
                  {user.approvalStatus === 'pending' && <Button variant="danger" onClick={() => onReject(user.id)}>Từ chối</Button>}
                </div>
              ) : user.role !== 'student' && <div className="flex justify-end gap-2">
                <Button onClick={() => onEdit(user)}>Sửa</Button>
                {user.username !== currentUsername && <Button variant="danger" onClick={() => onDelete(user.id)}>Xóa</Button>}
              </div>}
            </td>
          </tr>
        ))}
        {items.length === 0 && <EmptyState colSpan={5}>Chưa có tài khoản nào.</EmptyState>}
      </tbody>
    </table>
  );
}
