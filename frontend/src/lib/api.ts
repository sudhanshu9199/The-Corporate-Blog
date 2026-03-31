// src/lib/api.ts

export async function getPublishedPosts() {
  try {
    // Replace this URL with your actual backend API endpoint! 🌐
    const response = await fetch('http://localhost:5000/api/posts', {
      cache: 'no-store' // Keeps data fresh instead of caching statically
    });

    if (!response.ok) {
      throw new Error('Failed to fetch posts');
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching published posts:", error);
    return []; // Returns an empty array so the frontend doesn't crash 🛡️
  }
}