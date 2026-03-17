import React from 'react'; // TS ko module batane ke liye import zaroori hai

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function BlogPostPage({ params }: Props) {
  // Naye Next.js mein params ko await karna padta hai
  const { slug } = await params; 

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Blog Post: {slug}</h1>
      <p className="text-gray-600">
        Yahan par hum database se post fetch karke show karenge.
      </p>
    </div>
  );
}