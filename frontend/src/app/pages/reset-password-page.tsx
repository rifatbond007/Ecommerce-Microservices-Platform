import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (!token) {
      setError('Invalid or missing reset token');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      toast({ title: 'Password reset', description: 'Your password has been changed successfully', variant: 'success' });
      navigate('/login');
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to reset password';
      setError(message);
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-200px)] px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-destructive to-destructive/70 flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
              <Lock className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold">Invalid Link</h1>
            <p className="text-muted-foreground mt-1">This reset link is invalid or expired</p>
          </div>
          <Card className="border-0 shadow-xl">
            <CardContent className="text-center py-8 space-y-4">
              <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                <Lock className="h-8 w-8 text-destructive" />
              </div>
              <p className="text-muted-foreground">This password reset link is invalid or has expired. Please request a new one.</p>
              <div className="pt-4">
                <Button onClick={() => navigate('/forgot-password')} className="rounded-full gap-2">
                  <ShieldCheck className="h-4 w-4" /> Request New Link
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-200px)] px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-bold text-xl mx-auto mb-4">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold">Reset password</h1>
          <p className="text-muted-foreground mt-1">Choose a new password for your account</p>
        </div>

        <Card className="border-0 shadow-xl">
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-6">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-destructive p-3 bg-destructive/10 rounded-xl border border-destructive/20"
                >
                  {error}
                </motion.div>
              )}
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="h-11 rounded-xl pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="h-11 rounded-xl pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </CardContent>
            <div className="px-6 pb-6 flex flex-col space-y-4">
              <Button type="submit" className="w-full h-11 rounded-full gap-2" disabled={submitting}>
                {submitting ? 'Resetting...' : <><ShieldCheck className="h-4 w-4" /> Reset Password</>}
              </Button>
            </div>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
