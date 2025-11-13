import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../api/admin.api';
import Loading from '../../components/Loading';
import toast from 'react-hot-toast';
import { FaSearch, FaUserShield, FaUser, FaBan, FaCheck } from 'react-icons/fa';
import { formatDate } from '../../utils/dateUtils';

const Users = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [page, setPage] = useState(1);

  // Fetch users
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin-users', page, searchTerm, filterRole],
    queryFn: () => adminAPI.getUsers({
      page,
      limit: 15,
      search: searchTerm,
      role: filterRole,
    }),
  });

  // Update user role mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }) => adminAPI.updateUserRole(id, role),
    onSuccess: () => {
      toast.success('Cập nhật vai trò thành công!');
      queryClient.invalidateQueries(['admin-users']);
    },
    onError: (error) => {
      toast.error(error.message || 'Cập nhật thất bại');
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: (id) => adminAPI.deleteUser(id),
    onSuccess: () => {
      toast.success('Xóa người dùng thành công!');
      queryClient.invalidateQueries(['admin-users']);
    },
    onError: (error) => {
      toast.error(error.message || 'Xóa người dùng thất bại');
    },
  });

  const handleDeleteUser = (id) => {
    if (window.confirm('Bạn có chắc muốn xóa người dùng này? Hành động này không thể hoàn tác.')) {
      deleteUserMutation.mutate(id);
    }
  };

  const handleToggleRole = (user) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    if (window.confirm(`Bạn có chắc muốn ${newRole === 'admin' ? 'cấp quyền admin' : 'gỡ quyền admin'} cho ${user.name}?`)) {
      updateRoleMutation.mutate({ id: user._id, role: newRole });
    }
  };

  if (isLoading) {
    return <Loading fullScreen />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Quản lý người dùng</h1>
        <p className="text-gray-600">Tổng số: {usersData?.total || 0} người dùng</p>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="input"
          >
            <option value="">Tất cả vai trò</option>
            <option value="user">Người dùng</option>
            <option value="admin">Quản trị viên</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Người dùng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số ĐT</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vai trò</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày tạo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số đặt phòng</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {usersData?.data?.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-semibold">
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold">{user.name}</div>
                        {user.role === 'admin' && (
                          <span className="text-xs bg-accent text-gray-900 px-2 py-0.5 rounded-full">
                            Admin
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">{user.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">{user.phone || '-'}</div>
                  </td>
                  <td className="px-6 py-4">
                    {user.role === 'admin' ? (
                      <span className="flex items-center text-accent font-semibold">
                        <FaUserShield className="mr-1" />
                        Quản trị viên
                      </span>
                    ) : (
                      <span className="flex items-center text-gray-600">
                        <FaUser className="mr-1" />
                        Người dùng
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">{formatDate(user.createdAt)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-center font-semibold">
                      {user.totalBookings || 0}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={() => handleToggleRole(user)}
                        className={`p-2 rounded hover:bg-gray-100 ${
                          user.role === 'admin' ? 'text-yellow-600' : 'text-green-600'
                        }`}
                        title={user.role === 'admin' ? 'Gỡ quyền admin' : 'Cấp quyền admin'}
                      >
                        {user.role === 'admin' ? <FaBan /> : <FaCheck />}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user._id)}
                        className="p-2 rounded hover:bg-gray-100 text-red-600"
                        title="Xóa người dùng"
                      >
                        <FaBan />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {usersData?.pages > 1 && (
          <div className="flex justify-center items-center space-x-2 p-4 border-t">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn btn-outline btn-sm"
            >
              Trước
            </button>
            <span className="text-sm text-gray-600">
              Trang {page} / {usersData.pages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(usersData.pages, p + 1))}
              disabled={page === usersData.pages}
              className="btn btn-outline btn-sm"
            >
              Sau
            </button>
          </div>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Tổng người dùng</p>
              <p className="text-3xl font-bold">{usersData?.total || 0}</p>
            </div>
            <div className="bg-blue-500 text-white p-4 rounded-lg">
              <FaUser size={24} />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Quản trị viên</p>
              <p className="text-3xl font-bold">
                {usersData?.data?.filter(u => u.role === 'admin').length || 0}
              </p>
            </div>
            <div className="bg-accent text-gray-900 p-4 rounded-lg">
              <FaUserShield size={24} />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Người dùng thường</p>
              <p className="text-3xl font-bold">
                {usersData?.data?.filter(u => u.role === 'user').length || 0}
              </p>
            </div>
            <div className="bg-green-500 text-white p-4 rounded-lg">
              <FaUser size={24} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Users;

