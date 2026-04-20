import { redirect } from 'next/navigation';

export default function EarningsPageRedirect() {
  redirect('/corporate-actions?focus=earnings');
}
