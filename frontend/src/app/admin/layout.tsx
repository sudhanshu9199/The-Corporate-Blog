import { redirect } from 'next/navigation';

// ✅ This ensures admin routes are dynamically rendered, never cached or static
export const dynamic = 'force-dynamic';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // Add authentication check here
  return <div className="admin-container">{children}</div>;
}