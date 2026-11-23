import { StatPills } from '@/components/profile/stat-pills';
import { useBooksByOwner } from '@/hooks/use-books';
import { useReviewsReceived } from '@/hooks/use-reviews';
import type { UserProfile } from '@/types/user';

/**
 * Books listed and review count are computed live on the client.
 * completedReturns/trustScore are maintained only by Cloud Functions
 * (functions/src), so they stay 0 until those are deployed.
 */
export function ProfileStats({ uid, profile }: { uid: string; profile: UserProfile | null }) {
  const { books } = useBooksByOwner(uid);
  const { all } = useReviewsReceived(uid);

  return (
    <StatPills
      stats={[
        { icon: 'books.vertical.fill', color: '#1971C2', value: books.length, label: 'Books listed' },
        {
          icon: 'arrow.left.arrow.right',
          color: '#2B8A3E',
          value: profile?.completedReturns ?? 0,
          label: 'Exchanges done',
        },
        {
          icon: 'checkmark.seal.fill',
          color: '#9C36B5',
          value: Math.round(profile?.trustScore ?? 0),
          label: 'Trust score',
        },
        {
          icon: 'star.fill',
          color: '#E67700',
          value: all.count ? `${all.count} · ${all.averageRating.toFixed(1)}★` : 0,
          label: 'Reviews',
        },
      ]}
    />
  );
}
