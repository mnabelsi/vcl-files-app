import { signIn } from '@/auth';

export default function LoginPage() {
  async function login(formData: FormData) {
    'use server';
    await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      redirectTo: '/',
    });
  }
  return (
    <div style={{ maxWidth: 360, margin: '80px auto' }}>
      <h1>Sign in</h1>
      <form action={login} className="card" style={{ display: 'grid', gap: 10 }}>
        <input name="email" type="email" placeholder="email" required />
        <input name="password" type="password" placeholder="password" required />
        <button type="submit">Sign in</button>
      </form>
    </div>
  );
}
