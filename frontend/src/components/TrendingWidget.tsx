import Link from 'next/link';

// Ye Next.js feature hai, jo har 15 min (900 seconds) mein data refresh karega (ISR)
async function getTrendingPosts() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/posts/popular`, {
        next: { revalidate: 900 } 
    });
    if (!res.ok) return null;
    return res.json();
}

export default async function TrendingWidget() {
    const data = await getTrendingPosts();
    const posts = data?.data || [];

    if (posts.length === 0) return null;

    return (
        <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-bold mb-4 border-b pb-2">🔥 Trending Now</h3>
            <ul className="space-y-3">
                {posts.map((post: any) => (
                    <li key={post.id}>
                        <Link href={`/blog/${post.slug}`} className="hover:text-blue-600 transition-colors">
                            <h4 className="font-semibold text-gray-800">{post.title}</h4>
                            <p className="text-sm text-gray-500">{post.views_count} views</p>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}