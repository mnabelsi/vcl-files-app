'use client';

import { useActionState } from 'react';
import { login } from './actions';

export default function LoginPage() {
  const [error, formAction, pending] = useActionState(login, null);

  return (
    <div style={{ maxWidth: 360, margin: '80px auto' }}>
      <h1>Sign in</h1>
      <form action={formAction} className="card" style={{ display: 'grid', gap: 10 }}>
        <input name="email" type="email" placeholder="email" required />
        <input name="password" type="password" placeholder="password" required />
        <button type="submit" disabled={pending}>
          {pending ? 'Signing in…' : 'Sign in'}
        </button>
        {error && <p style={{ color: '#f87171' }}>{error}</p>}
      </form>
    </div>
  );
}
