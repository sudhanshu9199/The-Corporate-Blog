import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');
  const slug = request.nextUrl.searchParams.get('slug');

  // Verify secret to prevent unauthorized revalidations
  if (secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
  }

  if (!slug) {
    // Revalidate main blog page and sitemap
    revalidatePath('/blog');
    revalidatePath('/sitemap.xml');
    return NextResponse.json({ revalidated: true, now: Date.now() });
  }

  try {
    // Revalidate specific post, the blog listing, and sitemap
    revalidatePath(`/blog/${slug}`);
    revalidatePath('/blog');
    revalidatePath('/sitemap.xml');
    
    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch (err) {
    return NextResponse.json({ message: 'Error revalidating' }, { status: 500 });
  }
}