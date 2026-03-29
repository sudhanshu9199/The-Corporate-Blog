import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;

  const secret = searchParams.get('secret');
  const path   = searchParams.get('path');
  const slug   = searchParams.get('slug');
 
  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
  }
 
  try {
    if (slug) {
      revalidatePath(`/blog/${slug}`);
      revalidatePath('/blog');
      revalidatePath('/sitemap.xml');
      return NextResponse.json({ revalidated: true, slug, now: Date.now() });
    }
 
    if (path) {
      revalidatePath(path);
      return NextResponse.json({ revalidated: true, path, now: Date.now() });
    }
 
    return NextResponse.json(
      { revalidated: false, message: 'Provide a path or slug query param' },
      { status: 400 }
    );
  } catch {
    return NextResponse.json({ message: 'Revalidation failed' }, { status: 500 });
  }
}