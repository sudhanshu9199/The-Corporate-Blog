import { Metadata } from "next";
import Link from "next/link";
import SearchBar from "@/components/SearchBar";

// SEO: Validate Search pages noindex
export const metadata: Metadata = {
  title: "Search Results | The Corporate Blog",
  robots: { index: false, follow: true }, // 🛑 NoIndex for SEO compliance
};

async function fetchSearchResults(query: string) {
  if (!query) return [];
  const res = await fetch(`http://localhost:8080/api/posts/search?q=${query}`, {
    cache: 'no-store' // SSR: Always fetch fresh results
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.data;
}

export default async function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const query = searchParams.q || "";
  const results = await fetchSearchResults(query);

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Search Blog</h1>
      <SearchBar />
      
      {query && (
        <div className="mt-8">
          <h2 className="text-xl mb-4">Results for "{query}"</h2>
          {results.length === 0 ? (
            <p className="text-gray-500">No posts found. Try different keywords.</p>
          ) : (
            <div className="grid gap-6">
              {results.map((post: any) => (
                <Link key={post.id} href={`/blog/${post.slug}`} className="block border p-4 rounded-lg hover:shadow-lg transition">
                  <h3 className="text-xl font-semibold text-blue-600">{post.title}</h3>
                  <p className="text-sm text-gray-500">By {post.author_name} • {new Date(post.published_at).toLocaleDateString()}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}