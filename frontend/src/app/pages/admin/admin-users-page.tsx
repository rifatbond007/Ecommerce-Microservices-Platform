import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { adminApi, api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Check, X, Users } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  sellerStatus: string;
  avatar: string | null;
  createdAt: string;
}

const roleOptions = [
  { label: 'User', value: 'user' },
  { label: 'Admin', value: 'admin' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const rowVariants = {
  hidden: { x: -10, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: 'spring' as const, stiffness: 260, damping: 22 },
  },
};

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function roleBadge(role: string) {
  if (role === 'admin') return <Badge variant="default">Admin</Badge>;
  return <Badge variant="secondary">User</Badge>;
}

function statusBadge(status: string) {
  if (status === 'ACTIVE') return <Badge variant="success">Active</Badge>;
  return <Badge variant="destructive">Inactive</Badge>;
}

export function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUsers = useCallback(async (q?: string) => {
    setLoading(true);
    setError('');
    try {
      const params = q ? { search: q } : undefined;
      const res = await adminApi.getUsers(params);
      setUsers(res.data.users || []);
    } catch {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = () => {
    fetchUsers(search);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await adminApi.updateUser(userId, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch {
      // silent
    }
  };

  const handleSellerApprove = async (userId: string) => {
    try {
      await api.post(`/auth/admin/seller-requests/${userId}/approve`);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, sellerStatus: 'APPROVED' } : u
        )
      );
    } catch {
      // silent
    }
  };

  const handleSellerReject = async (userId: string) => {
    try {
      await api.post(`/auth/admin/seller-requests/${userId}/reject`);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, sellerStatus: 'REJECTED' } : u
        )
      );
    } catch {
      // silent
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-9 w-56 mb-6" />
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={() => fetchUsers()} className="rounded-full">Retry</Button>
      </div>
    );
  }

  return (
    <motion.div
      className="container mx-auto px-4 py-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={rowVariants} className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground mt-1">{users.length} user{users.length !== 1 ? 's' : ''} registered</p>
      </motion.div>

      <motion.div variants={rowVariants}>
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                All Users
              </CardTitle>
              <div className="flex gap-2 w-full sm:w-auto">
                <Input
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full sm:w-64"
                />
                <Button variant="outline" size="icon" onClick={handleSearch} className="rounded-full">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {users.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No users found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left bg-muted/30">
                      <th className="sticky top-0 px-6 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">User</th>
                      <th className="sticky top-0 px-6 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">Email</th>
                      <th className="sticky top-0 px-6 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">Role</th>
                      <th className="sticky top-0 px-6 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="sticky top-0 px-6 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">Joined</th>
                      <th className="sticky top-0 px-6 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <motion.tr
                        key={user.id}
                        variants={rowVariants}
                        className="border-b last:border-0 transition-colors hover:bg-muted/20"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={user.avatar || undefined} alt={user.name} />
                              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-sm">{user.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground text-sm">{user.email}</td>
                        <td className="px-6 py-4">{roleBadge(user.role)}</td>
                        <td className="px-6 py-4">{statusBadge(user.status)}</td>
                        <td className="px-6 py-4 text-muted-foreground text-sm whitespace-nowrap">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <select
                              defaultValue=""
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleRoleChange(user.id, e.target.value);
                                }
                                e.target.value = '';
                              }}
                              className="h-8 rounded-lg border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              <option value="" disabled>Change role...</option>
                              {roleOptions.map((r) => (
                                <option key={r.value} value={r.value}>{r.label}</option>
                              ))}
                            </select>
                            {user.sellerStatus === 'PENDING' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleSellerApprove(user.id)}
                                  title="Approve seller"
                                  className="rounded-full text-green-600 hover:text-green-700 hover:bg-green-50"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleSellerReject(user.id)}
                                  title="Reject seller"
                                  className="rounded-full text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
