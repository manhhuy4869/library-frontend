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
}

export function UserTable({ items, loading, currentUsername, onEdit, onDelete }: UserTableProps) {
  if (loading) return <p className="p-6 text-sm text-ink-soft">Đang tải...</p>;

  return (
    <table className="table-shell">
      <thead>
        <tr>
          <th>Tên đăng nhập</th>
          <th>Họ tên</th>
          <th>Vai trò</th>
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
              {user.role !== 'student' && <div className="flex justify-end gap-2">
                <Button onClick={() => onEdit(user)}>Sửa</Button>
                {user.username !== currentUsername && <Button variant="danger" onClick={() => onDelete(user.id)}>Xóa</Button>}
              </div>}
            </td>
          </tr>
        ))}
        {items.length === 0 && <EmptyState colSpan={4}>Chưa có tài khoản nào.</EmptyState>}
      </tbody>
    </table>
  );
}
