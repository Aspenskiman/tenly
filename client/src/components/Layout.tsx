import Navbar from './Navbar';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0D0D1A' }}>
      <Navbar />
      <main className="flex-1 px-4 py-5 max-w-2xl mx-auto w-full">{children}</main>
    </div>
  );
}
