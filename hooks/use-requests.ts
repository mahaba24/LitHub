import {
  addDoc,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/contexts/auth-context';
import { requireDb } from '@/lib/firebase';
import { requestFromDoc } from '@/lib/requests';
import type { Book } from '@/types/book';
import { DAMAGE_FEES, type BorrowRequest, type DamageSeverity } from '@/types/request';

/** Stores the picked calendar day at local midnight, whatever time the picker attached. */
function dueDateTimestamp(date: Date) {
  return Timestamp.fromDate(new Date(date.getFullYear(), date.getMonth(), date.getDate()));
}

export function useRequest(id: string | undefined) {
  const [request, setRequest] = useState<BorrowRequest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setRequest(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    return onSnapshot(
      doc(requireDb(), 'requests', id),
      (snapshot) => {
        setRequest(snapshot.exists() ? requestFromDoc(snapshot.id, snapshot.data()) : null);
        setLoading(false);
      },
      (error) => {
        console.warn('useRequest listener failed', error);
        setRequest(null);
        setLoading(false);
      }
    );
  }, [id]);

  return { request, loading };
}

/** The current user's most recent open (non-completed) request for a book, if any. */
export function useMyRequestForBook(bookId: string | undefined) {
  const { user } = useAuth();
  const [request, setRequest] = useState<BorrowRequest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookId || !user) {
      setRequest(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const myRequestQuery = query(
      collection(requireDb(), 'requests'),
      where('bookId', '==', bookId),
      where('borrowerId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    return onSnapshot(
      myRequestQuery,
      (snapshot) => {
        const first = snapshot.docs[0];
        setRequest(first ? requestFromDoc(first.id, first.data()) : null);
        setLoading(false);
      },
      (error) => {
        console.warn('useMyRequestForBook listener failed', error);
        setLoading(false);
      }
    );
  }, [bookId, user]);

  return { request, loading };
}

/** Every request the current user is part of, either as borrower or lender. */
export function useMyRequests() {
  const { user } = useAuth();
  const [asBorrower, setAsBorrower] = useState<BorrowRequest[]>([]);
  const [asLender, setAsLender] = useState<BorrowRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setAsBorrower([]);
      setAsLender([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    let borrowerReady = false;
    let lenderReady = false;
    const checkDone = () => {
      if (borrowerReady && lenderReady) setLoading(false);
    };

    const borrowerQuery = query(collection(requireDb(), 'requests'), where('borrowerId', '==', user.uid));
    const lenderQuery = query(collection(requireDb(), 'requests'), where('lenderId', '==', user.uid));

    const unsubBorrower = onSnapshot(
      borrowerQuery,
      (snapshot) => {
        setAsBorrower(snapshot.docs.map((d) => requestFromDoc(d.id, d.data())));
        borrowerReady = true;
        checkDone();
      },
      (error) => {
        console.warn('useMyRequests (borrower) listener failed', error);
        borrowerReady = true;
        checkDone();
      }
    );
    const unsubLender = onSnapshot(
      lenderQuery,
      (snapshot) => {
        setAsLender(snapshot.docs.map((d) => requestFromDoc(d.id, d.data())));
        lenderReady = true;
        checkDone();
      },
      (error) => {
        console.warn('useMyRequests (lender) listener failed', error);
        lenderReady = true;
        checkDone();
      }
    );

    return () => {
      unsubBorrower();
      unsubLender();
    };
  }, [user]);

  const requests = [...asBorrower, ...asLender].sort((a, b) => b.updatedAt - a.updatedAt);

  return { requests, loading };
}

export function useRequestActions() {
  const { user, profile } = useAuth();
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle');

  const createRequest = useCallback(
    async (book: Book) => {
      if (!user || !profile) throw new Error('Must be signed in to request a book');
      setStatus('submitting');
      try {
        const ref = await addDoc(collection(requireDb(), 'requests'), {
          bookId: book.id,
          bookTitle: book.title,
          borrowerId: user.uid,
          borrowerName: profile.displayName,
          lenderId: book.ownerId,
          lenderName: book.ownerName,
          status: 'Requested',
          proposedDueDate: null,
          lastProposedBy: null,
          damageSeverity: 'None',
          damageFee: null,
          damageReportedAt: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setStatus('idle');
        return ref.id;
      } catch (error) {
        setStatus('error');
        throw error;
      }
    },
    [user, profile]
  );

  const setRequestFields = useCallback(async (requestId: string, fields: Record<string, unknown>) => {
    setStatus('submitting');
    try {
      await updateDoc(doc(requireDb(), 'requests', requestId), {
        ...fields,
        updatedAt: serverTimestamp(),
      });
      setStatus('idle');
    } catch (error) {
      setStatus('error');
      throw error;
    }
  }, []);

  const proposeDueDate = useCallback(
    (requestId: string, dueDate: Date) => {
      if (!user) throw new Error('Must be signed in to propose a due date');
      return setRequestFields(requestId, {
        status: 'Under Negotiation',
        proposedDueDate: dueDateTimestamp(dueDate),
        lastProposedBy: user.uid,
      });
    },
    [setRequestFields, user]
  );

  const counterProposal = useCallback(
    (requestId: string, dueDate: Date) => {
      if (!user) throw new Error('Must be signed in to counter a proposal');
      return setRequestFields(requestId, {
        status: 'Under Negotiation',
        proposedDueDate: dueDateTimestamp(dueDate),
        lastProposedBy: user.uid,
      });
    },
    [setRequestFields, user]
  );

  const acceptProposal = useCallback(
    // Accepting keeps the already-stored proposedDueDate as the agreed date.
    (requestId: string) => setRequestFields(requestId, { status: 'Confirmed' }),
    [setRequestFields]
  );

  const markReturned = useCallback(
    (requestId: string) => setRequestFields(requestId, { status: 'Completed' }),
    [setRequestFields]
  );

  const reportDamage = useCallback(
    (requestId: string, severity: Exclude<DamageSeverity, 'None'>) =>
      setRequestFields(requestId, {
        status: 'Completed',
        damageSeverity: severity,
        damageFee: DAMAGE_FEES[severity],
        damageReportedAt: serverTimestamp(),
      }),
    [setRequestFields]
  );

  return {
    status,
    createRequest,
    proposeDueDate,
    counterProposal,
    acceptProposal,
    markReturned,
    reportDamage,
  };
}