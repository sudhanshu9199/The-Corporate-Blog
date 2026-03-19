import { notFound } from 'next/navigation';
import { Metadata } from 'next';

export const revalidate = 900;

async function getAuthorPosts(slug: string) {
    // Note: Assuming 'slug' here is the author ID or username as defined in your BE route
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/authors/${slug}/posts`, {
        next: { revalidate: 900 }
    });
    if (!res.ok) return null;
    return res.json();
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    return {
        title: `Posts by Author | The Corporate Blog`,
    };
}

export default async function AuthorPage({ params }: { params: { slug: string } }) {
    const response = await getAuthorPosts(params.slug);
    const posts = response?.data;

    if (!posts || posts.length === 0) {
        notFound();
    }

    return (
        <div className="max-w-4xl mx-auto py-12 px-4">
            <h1 className="text-4xl font-bold mb-8 text-center text-black dark:text-white">
                Articles by {posts[0].author_name}
            </h1>
            <div className="grid gap-6">
                {posts.map((post: any) => (
                    <a href={`/blog/${post.slug}`} key={post.id} className="block p-6 border border-gray-100 dark:border-zinc-800 rounded-2xl hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors">
                        <h2 className="text-2xl font-semibold mb-2 text-black dark:text-white">{post.title}</h2>
                        <p className="text-gray-500 text-sm">{new Date(post.published_at || post.created_at).toLocaleDateString()}</p>
                    </a>
                ))}
            </div>
        </div>
    );
}