export default function BlogPostPage({ params }: { params: { slug: string } }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Blog Post: {params.slug}</h1>
      <p className="text-gray-600">
        Yahan par hum database se post fetch karke show karenge.
      </p>
    </div>
  );
}