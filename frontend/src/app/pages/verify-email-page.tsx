import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCheck, XCircle, Loader2, ShieldCheck, MailCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';

export function VerifyEmailPage() {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification token');
      toast({ title: 'Verification failed', description: 'Invalid or missing token', variant: 'destructive' });
      return;
    }
    let cancelled = false;
    const verify = async () => {
      try {
        await api.post('/auth/verify-email', { token });
        if (!cancelled) {
          setStatus('success');
          setMessage('Your email has been verified successfully!');
          toast({ title: 'Email verified', description: 'You can now sign in to your account', variant: 'success' });
        }
      } catch (err: any) {
        if (!cancelled) {
          const msg = err.response?.data?.message || 'Failed to verify email';
          setStatus('error');
          setMessage(msg);
          toast({ title: 'Verification failed', description: msg, variant: 'destructive' });
        }
      }
    };
    verify();
    return () => { cancelled = true; };
  }, [token, toast]);

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-200px)] px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
            <MailCheck className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold">Email Verification</h1>
          <p className="text-muted-foreground mt-1">Confirming your email address</p>
        </div>

        <Card className="border-0 shadow-xl">
          <CardContent className="py-10">
            {status === 'loading' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-4"
              >
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground">Verifying your email...</p>
                <div className="w-full space-y-3 pt-4">
                  <Skeleton className="h-4 w-3/4 mx-auto" />
                  <Skeleton className="h-4 w-1/2 mx-auto" />
                  <Skeleton className="h-10 w-40 rounded-full mx-auto mt-4" />
                </div>
              </motion.div>
            )}
            {status === 'success' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <CheckCheck className="h-8 w-8 text-emerald-500" />
                </div>
                <h2 className="text-lg font-semibold text-emerald-600">{message}</h2>
                <p className="text-muted-foreground text-sm text-center">
                  You can now sign in with your verified account.
                </p>
                <Link to="/login" className="mt-2">
                  <Button className="rounded-full gap-2">
                    <ShieldCheck className="h-4 w-4" /> Go to Login
                  </Button>
                </Link>
              </motion.div>
            )}
            {status === 'error' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                  <XCircle className="h-8 w-8 text-destructive" />
                </div>
                <h2 className="text-lg font-semibold text-destructive">{message}</h2>
                <p className="text-muted-foreground text-sm text-center">
                  The verification link may have expired or is invalid.
                </p>
                <Link to="/login" className="mt-2">
                  <Button variant="outline" className="rounded-full gap-2">
                    <ShieldCheck className="h-4 w-4" /> Back to Login
                  </Button>
                </Link>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
