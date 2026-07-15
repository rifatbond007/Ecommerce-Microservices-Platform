import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Invalid email or password');
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="mx-auto max-w-md border border-[#e5e5e5] bg-white">
        <div className="px-8 py-12 border-b border-[#e5e5e5]">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#777777]">
            Account
          </p>
          <h1 className="mt-3 text-2xl md:text-3xl font-bold text-[#111111]">
            Sign In
          </h1>
          <p className="mt-2 text-sm text-[#666666]">
            Welcome back. Sign in to your account to continue.
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
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-[#111111] mb-2">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666666] hover:text-[#111111] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs font-bold uppercase tracking-wider text-[#666666] hover:text-[#111111] transition-colors">
                Forgot Password?
              </Link>
            </div>
          </div>

          <div className="px-8 pb-8 space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
            <p className="text-xs text-center text-[#666666] uppercase tracking-wider">
              Don't have an account?{' '}
              <Link to="/register" className="text-[#111111] font-bold hover:underline">
                Create One
              </Link>
            </p>
          </div>
        </form>

        <div className="px-8 py-4 bg-[#fafafa] border-t border-[#e5e5e5] text-center">
          <p className="text-xs text-[#777777] uppercase tracking-wider">
            Market — Premium Products
          </p>
        </div>
      </div>
    </div>
  );
}
