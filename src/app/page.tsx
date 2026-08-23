import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

export default async function HomePage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  } else if (session.role === 'administrator') {
    redirect('/users');
  } else {
    redirect('/dashboard');
  }
}
