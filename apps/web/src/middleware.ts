export { auth as middleware } from './auth';

export const config = {
  // Protect everything except login, auth API, static assets.
  matcher: ['/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)'],
};
