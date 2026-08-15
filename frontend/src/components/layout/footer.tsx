import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Facebook, Instagram, Twitter, Youtube, Mail, CreditCard, Shield, Truck, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function Footer() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
      setEmail('');
      setTimeout(() => setSubmitted(false), 4000);
    }
  };

  return (
    <footer className="border-t border-border bg-background">
      {/* Trust strip */}
      <div className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
          <div className="flex items-center gap-3 justify-center md:justify-start">
            <Truck className="h-6 w-6 text-foreground" />
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-foreground">
                Free Shipping
              </p>
              <p className="text-xs text-muted-foreground">On orders over $50</p>
            </div>
          </div>
          <div className="flex items-center gap-3 justify-center md:justify-start">
            <RotateCcw className="h-6 w-6 text-foreground" />
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-foreground">
                30-Day Returns
              </p>
              <p className="text-xs text-muted-foreground">Easy & hassle-free</p>
            </div>
          </div>
          <div className="flex items-center gap-3 justify-center md:justify-start">
            <Shield className="h-6 w-6 text-foreground" />
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-foreground">
                Secure Payment
              </p>
              <p className="text-xs text-muted-foreground">256-bit SSL encryption</p>
            </div>
          </div>
        </div>
      </div>

      {/* Newsletter */}
      <div className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-12 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-2xl font-bold tracking-tight text-foreground">
              Join the club
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Get 10% off your first order, plus early access to new drops and
              curated edits.
            </p>
          </div>
          <form onSubmit={handleSubscribe} className="flex gap-2">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9"
                required
              />
            </div>
            <Button type="submit">Subscribe</Button>
          </form>
          {submitted && (
            <p className="md:col-span-2 text-xs text-success uppercase tracking-wider text-center">
              ✓ Thanks — check your inbox for the welcome code.
            </p>
          )}
        </div>
      </div>

      {/* Main links */}
      <div className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link
              to="/"
              className="text-lg font-bold tracking-widest text-foreground uppercase"
            >
              Market
            </Link>
            <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
              Premium products, curated with care. We partner with artisans and
              trusted brands to bring you the best.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <a
                href="#"
                aria-label="Facebook"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="#"
                aria-label="Instagram"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="#"
                aria-label="Twitter"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="#"
                aria-label="YouTube"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Youtube className="h-4 w-4" />
              </a>
            </div>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-foreground mb-4">
              Shop
            </h3>
            <ul className="space-y-2">
              {[
                { label: 'Products', path: '/products' },
                { label: 'Categories', path: '/categories' },
                { label: 'New In', path: '/products?sort=newest' },
                { label: 'Sale', path: '/products?filter=sale' },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.path}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-foreground mb-4">
              Company
            </h3>
            <ul className="space-y-2">
              {[
                { label: 'About', path: '/about' },
                { label: 'Careers', path: '/careers' },
                { label: 'Contact', path: '/contact' },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.path}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-foreground mb-4">
              Support
            </h3>
            <ul className="space-y-2">
              {[
                { label: 'Help Center', path: '/help' },
                { label: 'Shipping', path: '/shipping' },
                { label: 'Returns', path: '/returns' },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.path}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-foreground mb-4">
              Legal
            </h3>
            <ul className="space-y-2">
              {[
                { label: 'Privacy', path: '/privacy' },
                { label: 'Terms', path: '/terms' },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.path}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            &copy; {new Date().getFullYear()} Market. All rights reserved.
          </p>
          <div className="flex items-center gap-3 text-muted-foreground">
            <CreditCard className="h-5 w-5" />
            <span className="text-xs uppercase tracking-wider">
              Visa · Mastercard · Amex · PayPal · Apple Pay
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}