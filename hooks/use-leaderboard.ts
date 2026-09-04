import { collection, getDocs, query, Timestamp, where } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';

import { requireDb } from '@/lib/firebase';
import { requestFromDoc } from '@/lib/requests';
import { useBooks } from '@/hooks/use-books';
import type { Book } from '@/types/book';
import type { UserProfile } from '@/types/user';

function userProfileFromDoc(data: Record<string, unknown>): UserProfile {
  const createdAt = data.createdAt as { toMillis?: () => number } | undefined;
  return {
    uid: data.uid as string,
    email: data.email as string,
    displayName: data.displayName as string,
    location: (data.location as UserProfile['location']) ?? null,
    createdAt: createdAt?.toMillis?.() ?? Date.now(),
    trustScore: (data.trustScore as number) ?? 0,
    completedReturns: (data.completedReturns as number) ?? 0,
    reviewCount: (data.reviewCount as number) ?? 0,
    averageRating: (data.averageRating as number) ?? 0,
  };
}

export function useTopReaders(limitCount = 10) {
  const [readers, setReaders] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getDocs(collection(requireDb(), 'users'))
      .then((snapshot) => {
        if (cancelled) return;
        const all = snapshot.docs
          .map((d) => userProfileFromDoc(d.data()))
          // Hide accounts with no activity at all so the board isn't padded
          // with everyone who just signed up.
          .filter((u) => u.trustScore > 0 || u.completedReturns > 0 || u.reviewCount > 0)
          .sort((a, b) => b.trustScore - a.trustScore);
        setReaders(all.slice(0, limitCount));
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [limitCount]);

  return { readers, loading, error };
}

export type BookOfTheMonthEntry = {
  book: Book;
  requestCount: number;
};

export function useBookOfTheMonth(limitCount = 3) {
  const { books, loading: booksLoading } = useBooks();
  const [counts, setCounts] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyRequestsQuery = query(
      collection(requireDb(), 'requests'),
      where('createdAt', '>=', Timestamp.fromDate(startOfMonth))
    );

    getDocs(monthlyRequestsQuery)
      .then((snapshot) => {
        if (cancelled) return;
        const tally = new Map<string, number>();
        snapshot.docs.forEach((d) => {
          const req = requestFromDoc(d.id, d.data());
          tally.set(req.bookId, (tally.get(req.bookId) ?? 0) + 1);
        });
        setCounts(tally);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load Book of the Month');
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const entries = useMemo<BookOfTheMonthEntry[]>(() => {
    const byId = new Map(books.map((b) => [b.id, b] as const));
    return Array.from(counts.entries())
      .map(([bookId, requestCount]) => {
        const book = byId.get(bookId);
        return book ? { book, requestCount } : null;
      })
      .filter((entry): entry is BookOfTheMonthEntry => entry !== null)
      .sort((a, b) => b.requestCount - a.requestCount)
      .slice(0, limitCount);
  }, [counts, books, limitCount]);

  return { entries, loading: loading || booksLoading, error };
}
