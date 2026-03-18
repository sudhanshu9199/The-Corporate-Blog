// frontend/src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check token in cookies
  const token = request.cookies.get('token')?.value;

  // Agar user dashboard pe ja raha hai aur token nahi hai, toh login pe bhejo
  if (request.nextUrl.pathname.startsWith('/dashboard') && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'], // Ye routes protect honge
};