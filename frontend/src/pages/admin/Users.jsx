import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../api/admin.api';
import Loading from '../../components/Loading';
import toast from 'react-hot-toast';
import {
  FaSearch,
  FaUserShield,
  FaUser,
  FaBan,
  FaCheck,
  FaUserTie,
  FaPlus
} from 'react-icons/fa';
import { formatDate } from '../../utils/dateUtils';

const Users = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [page, setPage] = useState(1);

  // Modal create manager
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    hotelId: ''
  });

  // Fetch hotels for manager assignment
  const { data: hotelsData } = useQuery({
    queryKey: ['admin-hotels'],
    queryFn: adminAPI.getHotels
  });

  // Fetch users
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin-users', page, searchTerm, filterRole],
    queryFn: () =>
      adminAPI.getUsers({
        page,
        limit: 15,
        search: searchTerm,
        role: filterRole
      })
  });

  // Update role
  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }) => adminAPI.updateUserRole(id, role),
    onSuccess: () => {
      toast.success('Cập nhật vai trò thành công!');
      queryClient.invalidateQueries(['admin-users']);
    },
    onError: (err) => toast.error(err.message)
  });

  // Delete user
  const deleteUserMutation = useMutation({
    mutationFn: (id) => adminAPI.deleteUser(id),
    onSuccess: () => {
      toast.success('Xóa người dùng thành công!');
      queryClient.invalidateQueries(['admin-users']);
    },
    onError: (err) => toast.error(err.message)
  });

  // Create manager
  const createUserMutation = useMutation({
    mutationFn: (data) => adminAPI.createUser(data),
    onSuccess: () => {
      toast.success('Tạo Manager thành công!');
      queryClient.invalidateQueries(['admin-users']);
      setShowCreateModal(false);
      setNewUser({
        name: '',
        email: '',
        phone: '',
        password: '',
        hotelId: ''
      });
    },
    onError: (err) => toast.error(err.message)
  });

  const handleToggleRole = (user) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    if (
      window.confirm(
        `Bạn có chắc muốn ${
          newRole === 'admin' ? 'cấp quyền admin' : 'gỡ quyền admin'
        } cho ${user.name}?`
      )
    ) {
      updateRoleMutation.mutate({ id: user._id, role: newRole });
    }
  };

  const handleDeleteUser = (id) => {
    if (window.confirm('Xóa người dùng này?')) {
      deleteUserMutation.mutate(id);
    }
  };

  const handleCreateManager = () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast.error('Vui lòng nhập đầy đủ thông tin!');
      return;
    }

    createUserMutation.mutate({
      ...newUser,
      role: 'manager'
    });
  };

  if (isLoading) return <Loading fullScreen />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Quản lý người dùng</h1>
          <p className="text-gray-600">
            Tổng số: {usersData?.total || 0} người dùng
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg shadow hover:bg-primary-dark"
        >
          <FaPlus /> Tạo tài khoản Manager
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm tên hoặc email..."
              className="input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="input"
          >
            <option value="">Tất cả vai trò</option>
            <option value="user">Người dùng</option>
            <option value="manager">Manager</option>
            <option value="admin">Quản trị viên</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">Người dùng</th>
                <th className="px-6 py-3 text-left">Email</th>
                <th className="px-6 py-3 text-left">SĐT</th>
                <th className="px-6 py-3 text-left">Vai trò</th>
                <th className="px-6 py-3 text-left">Ngày tạo</th>
                <th className="px-6 py-3 text-center">Số đặt phòng</th>
                <th className="px-6 py-3 text-center">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {usersData?.data?.map((u) => (
                <tr key={u._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-semibold">{u.name}</td>
                  <td className="px-6 py-4">{u.email}</td>
                  <td className="px-6 py-4">{u.phone}</td>

                  {/* ROLE DISPLAY FIXED */}
                  <td className="px-6 py-4">
                    {u.role === 'admin' && (
                      <span className="flex items-center text-red-500 font-semibold">
                        <FaUserShield className="mr-1" /> Admin
                      </span>
                    )}

                    {u.role === 'manager' && (
                      <span className="flex items-center text-blue-600 font-semibold">
                        <FaUserTie className="mr-1" /> Manager
                      </span>
                    )}

                    {u.role === 'user' && (
                      <span className="flex items-center text-gray-600">
                        <FaUser className="mr-1" /> Người dùng
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4">{formatDate(u.createdAt)}</td>
                  <td className="px-6 py-4 text-center">{u.totalBookings}</td>

                  <td className="px-6 py-4 flex justify-center gap-3">
                    {u.role !== 'manager' && (
                      <button
                        onClick={() => handleToggleRole(u)}
                        className={`p-2 rounded ${
                          u.role === 'admin'
                            ? 'text-yellow-600'
                            : 'text-green-600'
                        }`}
                      >
                        {u.role === 'admin' ? <FaBan /> : <FaCheck />}
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteUser(u._id)}
                      className="p-2 text-red-600 hover:bg-gray-100 rounded"
                    >
                      <FaBan />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {usersData?.pages > 1 && (
          <div className="p-4 flex justify-center items-center gap-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn btn-outline"
            >
              Trước
            </button>

            <span>
              {page}/{usersData.pages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(usersData.pages, p + 1))}
              disabled={page === usersData.pages}
              className="btn btn-outline"
            >
              Sau
            </button>
          </div>
        )}
      </div>

      {/* Create Manager Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 space-y-4">
            <h2 className="text-xl font-bold mb-2">Tạo tài khoản Manager</h2>

            <input
              type="text"
              placeholder="Tên"
              className="input w-full"
              value={newUser.name}
              onChange={(e) =>
                setNewUser((p) => ({ ...p, name: e.target.value }))
              }
            />

            <input
              type="email"
              placeholder="Email"
              className="input w-full"
              value={newUser.email}
              onChange={(e) =>
                setNewUser((p) => ({ ...p, email: e.target.value }))
              }
            />

            <input
              type="text"
              placeholder="Số điện thoại"
              className="input w-full"
              value={newUser.phone}
              onChange={(e) =>
                setNewUser((p) => ({ ...p, phone: e.target.value }))
              }
            />

            <input
              type="password"
              placeholder="Mật khẩu"
              className="input w-full"
              value={newUser.password}
              onChange={(e) =>
                setNewUser((p) => ({ ...p, password: e.target.value }))
              }
            />

            <select
              className="input w-full"
              value={newUser.hotelId}
              onChange={(e) =>
                setNewUser((p) => ({ ...p, hotelId: e.target.value }))
              }
            >
              <option value="">Chọn khách sạn phụ trách</option>
              {hotelsData?.data?.map((h) => (
                <option key={h._id} value={h._id}>
                  {h.name} – {h.city}
                </option>
              ))}
            </select>

            {/* buttons */}
            <div className="flex justify-end gap-3 pt-3">
              <button
                className="btn btn-outline"
                onClick={() => setShowCreateModal(false)}
              >
                Hủy
              </button>

              <button
                className="btn btn-primary"
                onClick={handleCreateManager}
              >
                Tạo Manager
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
