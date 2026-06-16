import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

export function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f5]">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
