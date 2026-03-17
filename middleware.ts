import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // /files is only meant to be loaded inside the FakeChromeWindow iframe.
  // Block direct browser navigation (Sec-Fetch-Dest: document) and redirect home.
  const dest = request.headers.get('sec-fetch-dest');
  if (dest && dest !== 'iframe') {
    return NextResponse.redirect(new URL('/', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: '/files',
};
