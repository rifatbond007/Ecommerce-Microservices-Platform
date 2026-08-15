import { useState, useEffect, useCallback } from 'react';
import { adminApi, authApi, getErrorMessage } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Pagination } from '@/components/pagination';
import { Search, Check, X, Users, RefreshCw } from 'lucide-react';

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

function getInitials(name: string) {
  return (name || '?')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';
}

function roleBadge(role: string) {
  if (role === 'admin') return <Badge variant="default">Admin</Badge>;
  return <Badge variant="secondary">User</Badge>;
}

function statusBadge(status: string) {
  const s = status?.toLowerCase();
  if (s === 'active') return <Badge variant="success">Active</Badge>;
  if (s === 'pending') return <Badge variant="warning">Pending</Badge>;
  return <Badge variant="destructive">Inactive</Badge>;
}

export function AdminUsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const limit = 20;

  const fetchUsers = useCallback(
    async (q?: string, p = 1) => {
      setLoading(true);
      setError('');
      try {
        const res = await adminApi.getUsers({ search: q, page: p, limit });
        const data = (res.data ?? {}) as { users?: User[]; total?: number };
        setUsers(data.users ?? []);
        setTotal(data.total ?? (data.users?.length ?? 0));
      } catch (err) {
        setError(getErrorMessage(err, 'Failed to load users'));
      } finally {
        setLoading(false);
      }
    },
    [limit]
  );

  useEffect(() => {
    fetchUsers(undefined, page);
  }, [fetchUsers, page]);

  const handleSearch = () => {
    setPage(1);
    fetchUsers(search, 1);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await adminApi.updateUser(userId, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      toast({ title: 'Role updated', variant: 'success' as const });
    } catch (err) {
      toast({
        title: 'Update failed',
        description: getErrorMessage(err),
        variant: 'destructive',
      });
    }
  };

  const handleSellerApprove = async (userId: string) => {
    try {
      await authApi.adminApproveSeller(userId);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, sellerStatus: 'APPROVED' } : u
        )
      );
      toast({ title: 'Seller approved', variant: 'success' as const });
    } catch (err) {
      toast({
        title: 'Approve failed',
        description: getErrorMessage(err),
        variant: 'destructive',
      });
    }
  };

  const handleSellerReject = async (userId: string) => {
    try {
      await authApi.adminRejectSeller(userId);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, sellerStatus: 'REJECTED' } : u
        )
      );
      toast({ title: 'Seller rejected', variant: 'success' as const });
    } catch (err) {
      toast({
        title: 'Reject failed',
        description: getErrorMessage(err),
        variant: 'destructive',
      });
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground mt-2">
          {total} user{total !== 1 ? 's' : ''} registered
        </p>
      </div>

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
              <Button variant="outline" size="icon" onClick={handleSearch}>
                <Search className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => fetchUsers(search, page)}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {error ? (
            <div className="p-8 text-center text-destructive">{error}</div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No users found.</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm">{user.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell>{roleBadge(user.role)}</TableCell>
                      <TableCell>{statusBadge(user.status)}</TableCell>
                      <TableCell>
                        {user.sellerStatus === 'APPROVED' && <Badge variant="success">Approved</Badge>}
                        {user.sellerStatus === 'PENDING' && <Badge variant="warning">Pending</Badge>}
                        {user.sellerStatus === 'REJECTED' && <Badge variant="destructive">Rejected</Badge>}
                        {(!user.sellerStatus || user.sellerStatus === 'NONE') && (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <Select
                            onValueChange={(value) => handleRoleChange(user.id, value)}
                          >
                            <SelectTrigger className="h-8 w-[120px]">
                              <SelectValue placeholder="Change role" />
                            </SelectTrigger>
                            <SelectContent>
                              {roleOptions.map((r) => (
                                <SelectItem key={r.value} value={r.value}>
                                  {r.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {user.sellerStatus === 'PENDING' && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleSellerApprove(user.id)}
                                title="Approve seller"
                                className="text-success hover:text-success"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleSellerReject(user.id)}
                                title="Reject seller"
                                className="text-destructive hover:text-destructive"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pagination
                page={page}
                totalPages={Math.max(1, Math.ceil(total / limit))}
                onPageChange={setPage}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}