import { redirect } from 'next/navigation';

export default function SignupRedirectPage() {
  // Signup is not implemented yet; redirect to login.
  // Preserve a hint so we can show contextual messaging later via search params if needed.
  redirect('/auth/login?from=signup');
}
