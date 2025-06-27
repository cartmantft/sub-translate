import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { cookies } from 'next/headers';
import MainContent from '@/components/MainContent';

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log('Current user ID:', user?.id);

  const signOut = async () => {
    'use server';
    const supabase = await createClient();
    await supabase.auth.signOut();
    return redirect('/login');
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="container mx-auto max-w-2xl space-y-8">
        <h1 className="text-4xl font-bold text-center">SubTranslate</h1>
        {user ? (
          <div className="text-center">
            <p className="text-gray-600">Welcome, {user.email}!</p>
            <form action={signOut}>
              <button className="text-blue-500 hover:underline">
                Sign Out
              </button>
            </form>
            <MainContent />
          </div>
        ) : (
          <div className="text-center">
            <p className="text-gray-500">
              Please log in to upload videos and use the service.
            </p>
            <Link href="/login">
              <button className="mt-4 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                Log In
              </button>
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
