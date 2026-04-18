'use server';

import { signIn } from '@/auth';
import { AuthError } from 'next-auth';

export async function login(
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  try {
    await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      redirectTo: '/',
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return 'Invalid email or password';
    }
    throw error; // Re-throw redirect errors
  }
  return null;
}
