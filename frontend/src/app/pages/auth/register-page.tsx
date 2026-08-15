import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();
  const [formData, setFormData] = useState({ email: '', password: '', username: '', firstName: '', lastName: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await register(formData);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Registration failed');
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="mx-auto max-w-md border border-border bg-background">
        <div className="px-8 py-12 border-b border-border">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Join Us
          </p>
          <h1 className="mt-3 text-2xl md:text-3xl font-bold text-foreground">
            Create Account
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Create an account and start shopping premium products.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-8 py-8 space-y-5">
            {error && (
              <div className="text-sm text-foreground p-3 border border-border bg-muted">
                {error}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-xs font-bold uppercase tracking-wider text-foreground mb-2">
                  First Name
                </label>
                <Input id="firstName" value={formData.firstName} onChange={(e) => setFormData(s => ({ ...s, firstName: e.target.value }))} required placeholder="John" />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-xs font-bold uppercase tracking-wider text-foreground mb-2">
                  Last Name
                </label>
                <Input id="lastName" value={formData.lastName} onChange={(e) => setFormData(s => ({ ...s, lastName: e.target.value }))} required placeholder="Doe" />
              </div>
            </div>
            <div>
              <label htmlFor="username" className="block text-xs font-bold uppercase tracking-wider text-foreground mb-2">
                Username
              </label>
              <Input id="username" value={formData.username} onChange={(e) => setFormData(s => ({ ...s, username: e.target.value }))} required placeholder="johndoe" />
            </div>
            <div>
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-foreground mb-2">
                Email
              </label>
              <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData(s => ({ ...s, email: e.target.value }))} required placeholder="you@example.com" />
            </div>
            <div>
              <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-foreground mb-2">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData(s => ({ ...s, password: e.target.value }))}
                  required
                  placeholder="Min. 8 characters"
                  className="pr-10"
                />
                <p className="mt-2 text-xs text-[#777777]">
                  Must be 8+ characters with at least one uppercase letter, one lowercase letter, and one number.
                </p>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="px-8 pb-8 space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
            <p className="text-xs text-center text-muted-foreground uppercase tracking-wider">
              Already have an account?{' '}
              <Link to="/login" className="text-foreground font-bold hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </form>

        <div className="px-8 py-4 bg-muted border-t border-border text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Market — Premium Products
          </p>
        </div>
      </div>
    </div>
  );
}
