import { Link } from 'react-router';
import { Facebook, Twitter, Instagram, Mail } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

export function Footer() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* About */}
          <div>
            <h3 className="mb-4 font-semibold">About ShopHub</h3>
            <p className="text-sm text-muted-foreground">
              Your one-stop destination for quality products at great prices. Shop with confidence.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 font-semibold">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/products" className="text-muted-foreground hover:text-foreground">
                  All Products
                </Link>
              </li>
              <li>
                <Link to="/account/orders" className="text-muted-foreground hover:text-foreground">
                  Track Order
                </Link>
              </li>
              <li>
                <Link to="/account/become-seller" className="text-muted-foreground hover:text-foreground">
                  Become a Seller
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="mb-4 font-semibold">Support</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground">
                  FAQs
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground">
                  Returns & Refunds
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground">
                  Shipping Info
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="mb-4 font-semibold">Newsletter</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Subscribe to get special offers and updates.
            </p>
            <form className="space-y-2">
              <Input type="email" placeholder="Your email" />
              <Button type="submit" className="w-full">
                Subscribe
              </Button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 flex flex-col items-center justify-between border-t pt-8 md:flex-row">
          <p className="text-sm text-muted-foreground">
            © 2024 ShopHub. All rights reserved.
          </p>
          <div className="mt-4 flex gap-4 md:mt-0">
            <a href="#" className="text-muted-foreground hover:text-foreground">
              <Facebook className="h-5 w-5" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground">
              <Twitter className="h-5 w-5" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground">
              <Instagram className="h-5 w-5" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground">
              <Mail className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
