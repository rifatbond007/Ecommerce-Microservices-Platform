import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/auth-store';
import { userApi, api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertCircle, CheckCircle2, Eye, EyeOff, User, Mail, Phone, Camera, Save, KeyRound } from 'lucide-react';

function ProfileSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="h-9 w-48 mb-6" />
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-10 w-full" /></div>
                <div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-10 w-full" /></div>
              </div>
              <div className="space-y-2"><Skeleton className="h-4 w-12" /><Skeleton className="h-10 w-full" /></div>
              <div className="space-y-2"><Skeleton className="h-4 w-12" /><Skeleton className="h-10 w-full" /></div>
              <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
              <Skeleton className="h-10 w-36" />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
          <Card><CardHeader><Skeleton className="h-6 w-24" /></CardHeader><CardContent className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></CardContent></Card>
          <Card><CardHeader><Skeleton className="h-6 w-36" /></CardHeader><CardContent className="space-y-4"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></CardContent></Card>
        </div>
      </div>
    </div>
  );
}

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', avatarUrl: '' });
  const [saving, setSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!user) return;
    const u = user as any;
    setForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: u.phone || '',
      avatarUrl: user.avatarUrl || '',
    });
    setLoading(false);
  }, [user]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setProfileError('');
    setProfileSuccess('');
    try {
      const { data } = await userApi.updateProfile({
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        avatarUrl: form.avatarUrl,
      });
      setUser(data.user || data);
      setProfileSuccess('Profile updated successfully');
    } catch {
      setProfileError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  }, [form, setUser]);

  const handleChangePassword = useCallback(async () => {
    setPasswordError('');
    setPasswordSuccess('');
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    setChangingPassword(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordSuccess('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch {
      setPasswordError('Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  }, [passwordForm]);

  if (loading) return <ProfileSkeleton />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="container mx-auto px-4 py-8"
    >
      <h1 className="text-3xl font-bold mb-8">My Profile</h1>

      {profileSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-green-600 mb-4 p-4 rounded-xl bg-green-50 border border-green-200"
        >
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span className="text-sm font-medium">{profileSuccess}</span>
        </motion.div>
      )}
      {profileError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-destructive mb-4 p-4 rounded-xl bg-destructive/10 border border-destructive/20"
        >
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="text-sm font-medium">{profileError}</span>
        </motion.div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="overflow-hidden">
              <CardHeader className="border-b bg-muted/30">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <User className="h-5 w-5 text-primary" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-6 pb-4 border-b">
                  <Avatar className="h-20 w-20 ring-4 ring-background">
                    {form.avatarUrl ? (
                      <AvatarImage src={form.avatarUrl} alt={form.firstName} />
                    ) : null}
                    <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                      {form.firstName?.charAt(0)}{form.lastName?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-lg font-semibold">{form.firstName} {form.lastName}</p>
                    <p className="text-sm text-muted-foreground">{form.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="email" value={form.email} disabled className="pl-10" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+1 (555) 123-4567" className="pl-10" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="avatarUrl">Avatar URL</Label>
                  <div className="relative">
                    <Camera className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="avatarUrl" value={form.avatarUrl} onChange={e => setForm({ ...form, avatarUrl: e.target.value })} placeholder="https://example.com/avatar.jpg" className="pl-10" />
                  </div>
                </div>

                <Button onClick={handleSave} disabled={saving} size="lg" className="gap-2">
                  {saving ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="overflow-hidden">
              <CardHeader className="border-b bg-muted/30">
                <CardTitle className="text-lg">Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                <Button variant="ghost" className="w-full justify-start gap-3 h-12 rounded-xl hover:bg-muted transition-all" onClick={() => navigate('/orders')}>
                  My Orders
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-3 h-12 rounded-xl hover:bg-muted transition-all" onClick={() => navigate('/addresses')}>
                  Addresses
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-3 h-12 rounded-xl hover:bg-muted transition-all" onClick={() => navigate('/wishlists')}>
                  Wishlists
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="overflow-hidden">
              <CardHeader className="border-b bg-muted/30">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <KeyRound className="h-5 w-5 text-primary" />
                  Change Password
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {passwordSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 text-green-600 text-sm bg-green-50 p-3 rounded-xl border border-green-200"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{passwordSuccess}</span>
                  </motion.div>
                )}
                {passwordError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-xl border border-destructive/20"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{passwordError}</span>
                  </motion.div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      className="pr-10"
                    />
                    <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  />
                </div>
                <Button onClick={handleChangePassword} disabled={changingPassword} variant="outline" className="w-full gap-2 rounded-xl">
                  {changingPassword ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
                  ) : null}
                  {changingPassword ? 'Changing...' : 'Change Password'}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
