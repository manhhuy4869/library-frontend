import { Inter, Source_Serif_4 } from 'next/font/google';
import '../styles/globals.css';
import { AuthProvider } from './lib/auth-context';
import { Sidebar } from './ui/sidebar';

const sans = Inter({ subsets: ['latin', 'vietnamese'], variable: '--font-sans' });
const serif = Source_Serif_4({ subsets: ['latin', 'vietnamese'], variable: '--font-serif' });

export const metadata = {
  title: 'Thư viện | Hệ thống quản lý',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${sans.variable} ${serif.variable}`}>
      <body>
        <AuthProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 px-8 py-8 md:px-12">{children}</main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
