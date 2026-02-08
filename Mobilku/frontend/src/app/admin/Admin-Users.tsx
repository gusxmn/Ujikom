'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/lib/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/lib/components/ui/Card';
import {
  Users,
  Search,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Shield,
  User,
  Download,
  Plus,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface UserData {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: 'ADMIN' | 'CUSTOMER';
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export default function AdminUsers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'ADMIN' | 'CUSTOMER'>('all');
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '' });

  // Fetch users
  const { data: users, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-users', searchTerm, filterRole],
    queryFn: async () => {
      try {
        const response = await api.get('/users', {
          params: {
            page: 1,
            limit: 100,
            search: searchTerm || undefined,
            role: filterRole !== 'all' ? filterRole : undefined,
          },
        });
        console.log('Users response:', response.data);
        const userData = response.data?.data || [];
        console.log('Parsed users:', userData);
        return userData;
      } catch (err) {
        console.error('Error fetching users:', err);
        throw err;
      }
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      await api.delete(`/users/${userId}`);
    },
    onSuccess: () => {
      toast.success('User deleted successfully');
      refetch();
    },
    onError: () => {
      toast.error('Failed to delete user');
    },
  });

  // Change role mutation
  const changeRoleMutation = useMutation({
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: number;
      role: 'ADMIN' | 'CUSTOMER';
    }) => {
      await api.patch(`/users/${userId}/role`, { role });
    },
    onSuccess: () => {
      toast.success('User role updated');
      refetch();
    },
    onError: () => {
      toast.error('Failed to update user role');
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({
      userId,
      data,
    }: {
      userId: number;
      data: { name: string; email: string; phone: string };
    }) => {
      await api.patch(`/users/${userId}`, data);
    },
    onSuccess: () => {
      toast.success('User updated successfully');
      setEditingUser(null);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update user');
    },
  });

  const handleDeleteUser = (userId: number) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleChangeRole = (userId: number, newRole: 'ADMIN' | 'CUSTOMER') => {
    changeRoleMutation.mutate({ userId, role: newRole });
  };

  const handleEditUser = (user: UserData) => {
    setEditingUser(user);
    setEditForm({ name: user.name, email: user.email, phone: user.phone });
  };

  const handleSaveEdit = () => {
    if (!editingUser) return;
    if (!editForm.name || !editForm.email || !editForm.phone) {
      toast.error('Please fill in all fields');
      return;
    }
    updateUserMutation.mutate({
      userId: editingUser.id,
      data: editForm,
    });
  };

  const filteredUsers = (users || []).filter((user: UserData) => {
    if (
      searchTerm &&
      !user.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !user.email.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-300 rounded w-1/4"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 bg-gray-300 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p className="font-bold">Error loading users</p>
        <p className="text-sm">{error?.message || 'An error occurred'}</p>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-4xl font-bold text-black flex items-center gap-3">
            <Users size={32} className="text-black" />
            Users Management
          </h1>
          <p className="text-black mt-2">
            Total: {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Download size={18} />
          Export
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search
              size={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black placeholder-gray-500"
            />
          </div>
        </div>
        <select
          value={filterRole}
          onChange={e =>
            setFilterRole(e.target.value as 'all' | 'ADMIN' | 'CUSTOMER')
          }
          className="px-4 py-2 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black bg-white"
        >
          <option value="all">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="CUSTOMER">Customer</option>
        </select>
      </div>

      {/* Users Table */}
      {filteredUsers.length > 0 ? (
        <div className="grid gap-4">
          {filteredUsers.map((user: UserData) => (
            <Card key={user.id} className="bg-white shadow-md">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* User Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="w-6 h-6 text-black" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-black">{user.name}</h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <p className="text-sm text-gray-600">{user.phone}</p>
                      </div>
                    </div>
                  </div>

                  {/* Role and Status */}
                  <div className="flex items-center gap-3">
                    {/* Role Badge */}
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-md whitespace-nowrap ${
                      user.role === 'ADMIN'
                        ? 'bg-purple-600 text-white'
                        : 'bg-blue-600 text-white'
                    }`}>
                      {user.role}
                    </span>

                    {/* Status Badge */}
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-md flex items-center gap-1 whitespace-nowrap ${
                      user.status === 'active'
                        ? 'bg-green-600 text-white'
                        : 'bg-red-600 text-white'
                    }`}>
                      {user.status === 'active' ? (
                        <>
                          <CheckCircle size={14} />
                          Active
                        </>
                      ) : (
                        <>
                          <XCircle size={14} />
                          Inactive
                        </>
                      )}
                    </span>

                    {/* Actions */}
                    <button
                      onClick={() => handleEditUser(user)}
                      className="p-2 rounded-lg hover:bg-blue-100 transition"
                      title="Edit user"
                    >
                      <Edit2 size={18} className="text-blue-600" />
                    </button>
                    <button
                      onClick={() =>
                        handleChangeRole(
                          user.id,
                          user.role === 'ADMIN' ? 'CUSTOMER' : 'ADMIN'
                        )
                      }
                      className="p-2 rounded-lg hover:bg-gray-200 transition"
                      title="Change role"
                    >
                      <Shield size={18} className="text-black" />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="p-2 rounded-lg hover:bg-red-100 transition"
                      title="Delete user"
                    >
                      <Trash2 size={18} className="text-red-600" />
                    </button>
                  </div>
                </div>

                {/* Metadata */}
                <div className="mt-3 pt-3 border-t border-slate-200 text-xs text-slate-500 flex justify-between">
                  <span>Joined: {formatDate(user.createdAt)}</span>
                  <span>Last updated: {formatDate(user.updatedAt)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Users size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-black text-lg">No users found</p>
            <p className="text-gray-600 mt-2">Try adjusting your search or filters</p>
          </CardContent>
        </Card>
      )}

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-black">Edit User</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  onClick={handleSaveEdit}
                  disabled={updateUserMutation.isPending}
                  className="flex-1 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition"
                >
                  {updateUserMutation.isPending ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => setEditingUser(null)}
                  className="flex-1 bg-gray-300 text-black px-4 py-2 rounded-lg hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
