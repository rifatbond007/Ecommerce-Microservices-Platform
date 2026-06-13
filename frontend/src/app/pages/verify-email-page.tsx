import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCheck, XCircle, Loader2 } from 'lucide-react';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification token');
      return;
    }
    let cancelled = false;
    const verify = async () => {
      try {
        await api.post('/auth/verify-email', { token });
        if (!cancelled) {
          setStatus('success');
          setMessage('Your email has been verified successfully!');
        }
      } catch (err: any) {
        if (!cancelled) {
          setStatus('error');
          setMessage(err.response?.data?.message || 'Failed to verify email');
        }
      }
    };
    verify();
    return () => { cancelled = true; };
  }, [token]);

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-200px)] px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Email Verification</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Verifying your email...</p>
            </div>
          )}
          {status === 'success' && (
            <div className="flex flex-col items-center gap-4">
              <CheckCheck className="h-12 w-12 text-green-500" />
              <p className="text-lg font-medium text-green-600">{message}</p>
              <Link to="/login"><Button>Go to Login</Button></Link>
            </div>
          )}
          {status === 'error' && (
            <div className="flex flex-col items-center gap-4">
              <XCircle className="h-12 w-12 text-destructive" />
              <p className="text-lg font-medium text-destructive">{message}</p>
              <Link to="/login"><Button variant="outline">Back to Login</Button></Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
