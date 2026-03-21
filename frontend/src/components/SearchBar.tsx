"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const router = useRouter();

  // Debounce logic: Only push to router if user stops typing for 500ms
  useEffect(() => {
    const fetchPreview = async () => {
      if (!query.trim()) {
        setResults([]);
        setDropdownOpen(false);
        return;
      }
      // Instant preview API call
      const res = await fetch(`https://the-corporate-blog.vercel.app/api/posts/search?q=${query}&limit=5`);
      const data = await res.json();
      setResults(data.data || []);
      setDropdownOpen(true);
    };

    const timer = setTimeout(fetchPreview, 300); // 300ms debounce
    return () => clearTimeout(timer);
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setDropdownOpen(false);
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto mb-8">
      <form onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="🔍 Search articles..."
          className="w-full px-4 py-2 border rounded-lg focus:outline-none"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </form>

      {/* Instant Preview Dropdown */}
      {isDropdownOpen && results.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border mt-1 rounded-lg shadow-lg">
          {results.map((post: any) => (
            <li key={post.id} className="p-2 hover:bg-gray-100 border-b last:border-0">
              <Link href={`/blog/${post.slug}`} className="block text-blue-600 font-medium">
                {/* Basic client-side highlight (ts_headline is also available from BE) */}
                {post.title.split(new RegExp(`(${query})`, 'gi')).map((part: string, i: number) => 
                  part.toLowerCase() === query.toLowerCase() ? <strong key={i} className="bg-yellow-200">{part}</strong> : part
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}