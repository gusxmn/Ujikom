'use client';

import { useState } from 'react';
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

  // Fetch users
  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ['admin-users', searchTerm, filterRole],
    queryFn: async () => {
      const response = await api.get('/users', {
        params: {
          search: searchTerm,
          role: filterRole !== 'all' ? filterRole : undefined,
        },
      });
      return response.data?.data || [];
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

  const handleDeleteUser = (userId: number) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleChangeRole = (userId: number, newRole: 'ADMIN' | 'CUSTOMER') => {
    changeRoleMutation.mutate({ userId, role: newRole });
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
        <div className="h-8 bg-slate-200 rounded w-1/4"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 bg-slate-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3">
            <Users size={32} className="text-blue-600" />
            Users Management
          </h1>
          <p className="text-slate-600 mt-2">
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
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <select
          value={filterRole}
          onChange={e =>
            setFilterRole(e.target.value as 'all' | 'ADMIN' | 'CUSTOMER')
          }
          className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{user.name}</h3>
                        <p className="text-sm text-slate-600">{user.email}</p>
                        <p className="text-sm text-slate-600">{user.phone}</p>
                      </div>
                    </div>
                  </div>

                  {/* Role and Status */}
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield size={16} className="text-slate-400" />
                        <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                          user.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {user.role}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {user.status === 'active' ? (
                          <>
                            <CheckCircle size={16} className="text-green-600" />
                            <span className="text-sm text-green-600 font-semibold">
                              Active
                            </span>
                          </>
                        ) : (
                          <>
                            <XCircle size={16} className="text-red-600" />
                            <span className="text-sm text-red-600 font-semibold">
                              Inactive
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          handleChangeRole(
                            user.id,
                            user.role === 'ADMIN' ? 'CUSTOMER' : 'ADMIN'
                          )
                        }
                        className="p-2 rounded-lg hover:bg-slate-100 transition"
                        title="Change role"
                      >
                        <Shield size={18} className="text-slate-600" />
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
            <Users size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-600 text-lg">No users found</p>
            <p className="text-slate-500 mt-2">Try adjusting your search or filters</p>
          </CardContent>
        </Card>
      )}
    </>
  );
}
