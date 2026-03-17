import Link from "next/link";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen bg-gray-50">
            <aside className="w-64 bg-white shadow-md p-6">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">CMS Panel</h2>
                <nav className="space-y-4">
                    <Link href="/dashboard/" className="block text-gray-600 hover:text-blue-600">Overview</Link>
                    <Link href="/dashboard/posts" className="block text-gray-600 hover:text-blue-600">All Posts</Link>
                    <Link href="/dashboard/settings" className="block text-gray-600 hover:text-blue-600">Settings</Link>
                </nav>
            </aside>

            <main className="flex-1 p-8">
                {children}
            </main>
        </div>
    )
}