import Link from "next/link";
import Image from "next/image";

async function getRelatedPosts(postId: number) {
  const res = await fetch(`http://localhost:8080/api/posts/${postId}/related`, {
    next: { revalidate: 3600 } // ISR: Revalidate every hour
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data;
}

export default async function RelatedPosts({ postId }: { postId: number }) {
  const posts = await getRelatedPosts(postId);

  if (!posts || posts.length === 0) return null;

  return (
    <div className="mt-12 border-t pt-8">
      <h3 className="text-2xl font-bold mb-6">Related Posts</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {posts.map((post: any) => (
          <Link key={post.id} href={`/blog/${post.slug}`} className="group block">
             <div className="relative w-full h-40 mb-3 rounded-lg overflow-hidden bg-gray-100">
               {post.cover_image_url && (
                 <Image src={post.cover_image_url} alt={post.title} fill className="object-cover group-hover:scale-105 transition" />
               )}
             </div>
             <h4 className="font-semibold group-hover:text-blue-600 transition">{post.title}</h4>
          </Link>
        ))}
      </div>
    </div>
  );
}