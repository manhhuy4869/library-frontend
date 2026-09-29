'use client';

import { useEffect, useState } from 'react';
import { rolesApi, ApiError } from '../lib/api';
import type { AccessRole, PermissionInfo } from '../lib/types';
import { RequireAuth } from '../ui/require-auth';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ErrorText } from '../ui/notice';
import { Modal } from '../ui/modal';

interface RoleFormValues {
  code: string;
  name: string;
  description: string;
  permissionCodes: string[];
}

const emptyValues: RoleFormValues = { code: '', name: '', description: '', permissionCodes: [] };

function RolesPageContent() {
  const [roles, setRoles] = useState<AccessRole[]>([]);
  const [permissions, setPermissions] = useState<PermissionInfo[]>([]);
  const [editing, setEditing] = useState<AccessRole | null>(null);
  const [values, setValues] = useState<RoleFormValues>(emptyValues);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [roleItems, permissionItems] = await Promise.all([rolesApi.list(), rolesApi.permissions()]);
      setRoles(roleItems);
      setPermissions(permissionItems);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tải được danh sách quyền');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function startCreate() {
    setEditing(null);
    setValues(emptyValues);
    setShowForm(true);
    setError('');
  }

  function startEdit(role: AccessRole) {
    setEditing(role);
    setValues({
      code: role.code,
      name: role.name,
      description: role.description ?? '',
      permissionCodes: role.permissions.map(({ permissionCode }) => permissionCode),
    });
    setShowForm(true);
    setError('');
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    try {
      if (editing) {
        await rolesApi.update(editing.code, {
          name: values.name,
          description: values.description || undefined,
          permissionCodes: values.permissionCodes,
        });
      } else {
        await rolesApi.create({
          ...values,
          description: values.description || undefined,
        });
      }
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không lưu được vai trò');
    }
  }

  async function remove(role: AccessRole) {
    if (!confirm(`Xóa vai trò "${role.name}"?`)) return;
    setError('');
    try {
      await rolesApi.remove(role.code);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không xóa được vai trò');
    }
  }

  function togglePermission(code: string) {
    setValues((current) => ({
      ...current,
      permissionCodes: current.permissionCodes.includes(code)
        ? current.permissionCodes.filter((item) => item !== code)
        : [...current.permissionCodes, code],
    }));
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1>Vai trò & quyền</h1>
          <p className="mt-1 text-sm text-ink-soft">Tạo role và chọn các quyền nghiệp vụ được cấp.</p>
        </div>
        <Button variant="primary" onClick={startCreate}>+ Thêm vai trò</Button>
      </div>
      <ErrorText>{error}</ErrorText>

      {showForm && <Modal title={editing ? `Sửa ${editing.name}` : 'Tạo vai trò'} onClose={() => setShowForm(false)} size="lg">
        {error && <ErrorText>{error}</ErrorText>}
        <form onSubmit={submit} className="flex flex-col gap-4">
          {!editing && (
            <Input
              label="Mã role"
              placeholder="vd: assistant_librarian"
              pattern="[a-z][a-z0-9_-]{1,31}"
              value={values.code}
              onChange={(event) => setValues((current) => ({ ...current, code: event.target.value }))}
              required
            />
          )}
          <Input label="Tên vai trò" value={values.name} onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))} required />
          <Input label="Mô tả" value={values.description} onChange={(event) => setValues((current) => ({ ...current, description: event.target.value }))} />
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Quyền được cấp</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {permissions.map((permission) => (
                <label key={permission.code} className="flex items-start gap-2 border-b border-border py-2 text-sm">
                  <input type="checkbox" checked={values.permissionCodes.includes(permission.code)} onChange={() => togglePermission(permission.code)} />
                  <span>
                    <span className="block font-medium">{permission.name}</span>
                    {permission.description && <span className="text-xs text-ink-soft">{permission.description}</span>}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="flex gap-2">
            <Button variant="primary" type="submit">Lưu</Button>
            <Button type="button" onClick={() => setShowForm(false)}>Hủy</Button>
          </div>
        </form>
      </Modal>}

      <div className="mt-6 overflow-x-auto border-y border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-paper text-xs uppercase text-ink-soft">
            <tr><th className="px-4 py-3">Vai trò</th><th className="px-4 py-3">Quyền</th><th className="px-4 py-3">Loại</th><th className="px-4 py-3"></th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {roles.map((role) => (
              <tr key={role.code}>
                <td className="px-4 py-3">
                  <div className="font-medium">{role.name}</div>
                  <div className="text-xs text-ink-soft">{role.code}{role.description ? ` · ${role.description}` : ''}</div>
                </td>
                <td className="px-4 py-3">{role.permissions.map(({ permission }) => permission.name).join(', ') || 'Chưa cấp quyền'}</td>
                <td className="px-4 py-3">{role.isSystem ? 'Hệ thống' : 'Tùy chỉnh'}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Button onClick={() => startEdit(role)}>Sửa</Button>
                    {!role.isSystem && <Button variant="danger" onClick={() => remove(role)}>Xóa</Button>}
                  </div>
                </td>
              </tr>
            ))}
            {!loading && roles.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-ink-soft">Chưa có vai trò</td></tr>}
            {loading && <tr><td colSpan={4} className="px-4 py-8 text-center text-ink-soft">Đang tải...</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function RolesPage() {
  return <RequireAuth><RolesPageContent /></RequireAuth>;
}