// author/[slug]/page.tsx
export const revalidate = 900; // 🕒 ISR: Rebuilds page every 15 mins in background

async function getPosts() {
    // Uses clean URL structure with no duplicated query params
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/posts?status=published`, {
        next: { revalidate: 900 }
    });
    if (!res.ok) return [];
    return res.json();
}

export default async function BlogHome() {
    const posts = await getPosts();
    
    return (
        <div className="max-w-4xl mx-auto py-12 px-4">
            <h1 className="text-4xl font-bold mb-8 text-center text-black dark:text-white">Latest Posts</h1>
            <div className="grid gap-6">
                {posts.map((post: any) => (
                    <a href={`/blog/${post.slug}`} key={post.id} className="block p-6 border border-gray-100 dark:border-zinc-800 rounded-2xl hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors">
                        <h2 className="text-2xl font-semibold mb-2 text-black dark:text-white">{post.title}</h2>
                        <p className="text-gray-500 text-sm">Published on {new Date(post.published_at || post.created_at).toLocaleDateString()}</p>
                    </a>
                ))}
            </div>
        </div>
    );
}