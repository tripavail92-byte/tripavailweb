'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SignupRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login since signup is not implemented yet
    router.replace('/auth/login?from=signup');
  }, [router]);

  return null;
}
