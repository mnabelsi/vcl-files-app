import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';

// Single-user credentials auth. APP_USER_EMAIL + APP_USER_PASSWORD_HASH are the
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
        const hash = process.env.APP_USER_PASSWORD_HASH ?? '';
        console.log('[auth] email match:', email === expectedEmail, '| hash length:', hash.length, '| hash prefix:', hash.substring(0, 4));
        if (!expectedEmail || !hash) return null;
        if (email !== expectedEmail) return null;
        const ok = await bcrypt.compare(password, hash);
        console.log('[auth] bcrypt result:', ok);
        if (!ok) return null;
        return { id: 'single-user', email: expectedEmail, name: 'Owner' };
      },
    }),
  ],
});
