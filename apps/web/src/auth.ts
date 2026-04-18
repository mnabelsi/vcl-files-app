import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

// Single-user credentials auth. APP_USER_EMAIL + APP_USER_PASSWORD are the
// only valid login; no DB user table.
export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(creds) {
        const email = String(creds?.email ?? '').toLowerCase();
        const password = String(creds?.password ?? '');
        const expectedEmail = (process.env.APP_USER_EMAIL ?? '').toLowerCase();
        const expectedPassword = process.env.APP_USER_PASSWORD ?? '';
        if (!expectedEmail || !expectedPassword) return null;
        if (email !== expectedEmail) return null;
        if (password !== expectedPassword) return null;
        return { id: 'single-user', email: expectedEmail, name: 'Owner' };
      },
    }),
  ],
});
