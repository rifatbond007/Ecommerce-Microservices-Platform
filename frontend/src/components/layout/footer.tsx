import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t border-[#e5e5e5] bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="text-lg font-bold tracking-widest text-[#111111] uppercase">
              Market
            </Link>
            <p className="mt-3 text-xs text-[#666666] leading-relaxed">
              Premium products, curated with care.
            </p>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#111111] mb-4">Company</h3>
            <ul className="space-y-2">
              {['About', 'Careers', 'Contact'].map((item) => (
                <li key={item}>
                  <Link to={`/${item.toLowerCase()}`} className="text-xs text-[#666666] hover:text-[#111111] transition-colors uppercase tracking-wider">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#111111] mb-4">Support</h3>
            <ul className="space-y-2">
              {['Help', 'Shipping', 'Returns'].map((item) => (
                <li key={item}>
                  <Link to={`/${item.toLowerCase()}`} className="text-xs text-[#666666] hover:text-[#111111] transition-colors uppercase tracking-wider">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#111111] mb-4">Legal</h3>
            <ul className="space-y-2">
              {['Privacy', 'Terms'].map((item) => (
                <li key={item}>
                  <Link to={`/${item.toLowerCase()}`} className="text-xs text-[#666666] hover:text-[#111111] transition-colors uppercase tracking-wider">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[#e5e5e5] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#666666] uppercase tracking-wider">&copy; {new Date().getFullYear()} Market. All rights reserved.</p>
          <div className="flex items-center gap-6 text-xs text-[#666666] uppercase tracking-wider">
            <Link to="/privacy" className="hover:text-[#111111] transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-[#111111] transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
