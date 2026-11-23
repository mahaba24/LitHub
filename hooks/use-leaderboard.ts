import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';

import { requireDb } from '@/lib/firebase';
import { userProfileFromDoc } from '@/lib/users';
import { useBooks } from '@/hooks/use-books';
import type { Book } from '@/types/book';
import type { UserProfile } from '@/types/user';

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

/** UTC `YYYY-MM`, matching monthKey() in functions/src/index.ts. */
function currentMonthKey(now = new Date()) {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
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

    // Requests are private to their two parties, so we read the public
    // per-book counters maintained by the onRequestCreatedCountBook Cloud
    // Function. Fetch a few extra in case some books were since deleted.
    const monthlyCountsQuery = query(
      collection(requireDb(), 'monthlyBookCounts'),
      where('month', '==', currentMonthKey()),
      orderBy('count', 'desc'),
      limit(limitCount + 7)
    );

    getDocs(monthlyCountsQuery)
      .then((snapshot) => {
        if (cancelled) return;
        const tally = new Map<string, number>();
        snapshot.docs.forEach((d) => {
          const { bookId, count } = d.data();
          if (typeof bookId === 'string' && typeof count === 'number') tally.set(bookId, count);
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
  }, [limitCount]);

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
