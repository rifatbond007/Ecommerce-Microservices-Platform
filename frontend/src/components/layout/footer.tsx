import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-bold text-sm">
                M
              </div>
              <span className="text-lg font-bold tracking-tight">Market</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your one-stop shop for premium products. Quality curated, delivered with care.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-4 uppercase tracking-wider text-muted-foreground/80">Company</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">About Us</Link></li>
              <li><Link to="/careers" className="text-muted-foreground hover:text-foreground transition-colors">Careers</Link></li>
              <li><Link to="/contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-4 uppercase tracking-wider text-muted-foreground/80">Support</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="/help" className="text-muted-foreground hover:text-foreground transition-colors">Help Center</Link></li>
              <li><Link to="/shipping" className="text-muted-foreground hover:text-foreground transition-colors">Shipping Info</Link></li>
              <li><Link to="/returns" className="text-muted-foreground hover:text-foreground transition-colors">Returns</Link></li>
              <li><Link to="/contact" className="text-muted-foreground hover:text-foreground transition-colors">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-4 uppercase tracking-wider text-muted-foreground/80">Legal</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link></li>
            </ul>
            <div className="mt-6">
              <h3 className="font-semibold text-sm mb-3 uppercase tracking-wider text-muted-foreground/80">Contact</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>support@market.com</li>
                <li>1-800-MARKET</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Market. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
