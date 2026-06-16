import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="mx-auto max-w-md border border-[#e5e5e5] bg-white">
          <div className="px-8 py-12 border-b border-[#e5e5e5]">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#777777]">
              Email Sent
            </p>
            <h1 className="mt-3 text-2xl md:text-3xl font-bold text-[#111111]">
              Check Your Email
            </h1>
            <p className="mt-2 text-sm text-[#666666]">
              A reset link has been sent to {email}.
            </p>
          </div>
          <div className="px-8 py-8 text-center space-y-4">
            <div className="h-16 w-16 border border-[#e5e5e5] bg-[#fafafa] flex items-center justify-center mx-auto">
              <Mail className="h-8 w-8 text-[#111111]" />
            </div>
            <p className="text-sm text-[#666666]">
              It may take a few minutes to arrive. Be sure to check your spam folder.
            </p>
            <div className="pt-4">
              <Link to="/login">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back to Sign In
                </Button>
              </Link>
            </div>
          </div>
          <div className="px-8 py-4 bg-[#fafafa] border-t border-[#e5e5e5] text-center">
            <p className="text-xs text-[#777777] uppercase tracking-wider">Market — Premium Products</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="mx-auto max-w-md border border-[#e5e5e5] bg-white">
        <div className="px-8 py-12 border-b border-[#e5e5e5]">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#777777]">
            Password Reset
          </p>
          <h1 className="mt-3 text-2xl md:text-3xl font-bold text-[#111111]">
            Forgot Password?
          </h1>
          <p className="mt-2 text-sm text-[#666666]">
            No worries. Enter your email and we'll send you reset instructions.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-8 py-8 space-y-5">
            {error && (
              <div className="text-sm text-[#111111] p-3 border border-[#e5e5e5] bg-[#fafafa]">
                {error}
              </div>
            )}
            <div>
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-[#111111] mb-2">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="px-8 pb-8 space-y-4">
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Sending...' : 'Send Reset Link'}
            </Button>
            <p className="text-xs text-center text-[#666666] uppercase tracking-wider">
              Remember your password?{' '}
              <Link to="/login" className="text-[#111111] font-bold hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </form>

        <div className="px-8 py-4 bg-[#fafafa] border-t border-[#e5e5e5] text-center">
          <p className="text-xs text-[#777777] uppercase tracking-wider">Market — Premium Products</p>
        </div>
      </div>
    </div>
  );
}
