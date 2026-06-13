import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';

export function ForgotPasswordPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
      toast({ title: 'Email sent', description: 'Check your inbox for the reset link', variant: 'success' });
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to send reset email';
      setError(message);
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-200px)] px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
              <Mail className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold">Check Your Email</h1>
            <p className="text-muted-foreground mt-1">A reset link has been sent to {email}</p>
          </div>
          <Card className="border-0 shadow-xl">
            <CardContent className="text-center py-8 space-y-4">
              <div className="h-16 w-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto">
                <Mail className="h-8 w-8 text-amber-500" />
              </div>
              <p className="text-muted-foreground">
                We've sent a password reset link to <strong className="text-foreground">{email}</strong>. It may take a few minutes to arrive. Be sure to check your spam folder.
              </p>
              <div className="pt-4">
                <Link to="/login">
                  <Button variant="outline" className="rounded-full gap-2">
                    <ArrowLeft className="h-4 w-4" /> Back to Login
                  </Button>
                </Link>
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
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
            <Mail className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold">Forgot password?</h1>
          <p className="text-muted-foreground mt-1">No worries, we'll send you reset instructions</p>
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
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="h-11 rounded-xl"
                  placeholder="you@example.com"
                />
              </div>
            </CardContent>
            <div className="px-6 pb-6 flex flex-col space-y-4">
              <Button type="submit" className="w-full h-11 rounded-full gap-2" disabled={submitting}>
                {submitting ? 'Sending...' : <><Send className="h-4 w-4" /> Send Reset Link</>}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                Remember your password?{' '}
                <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
              </p>
            </div>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
