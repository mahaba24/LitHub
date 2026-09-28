import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  type DocumentData,
} from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/contexts/auth-context';
import { requireDb } from '@/lib/firebase';
import type { ChatMessage } from '@/types/message';

function messageFromDoc(id: string, data: DocumentData): ChatMessage {
  return {
    id,
    senderId: data.senderId,
    senderName: data.senderName,
    text: data.text,
    createdAt: data.createdAt?.toMillis?.() ?? Date.now(),
  };
}

export function useMessages(requestId: string | undefined) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!requestId) {
      setMessages([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const messagesQuery = query(
      collection(requireDb(), 'requests', requestId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    return onSnapshot(
      messagesQuery,
      (snapshot) => {
        setMessages(snapshot.docs.map((d) => messageFromDoc(d.id, d.data())));
        setLoading(false);
      },
      (error) => {
        console.warn('useMessages listener failed', error);
        setLoading(false);
      }
    );
  }, [requestId]);

  return { messages, loading };
}

/**
 * Live latest message for each request thread, keyed by request id (null when
 * the thread is empty). One limit(1) listener per thread.
 */
export function useLastMessages(requestIds: string[]) {
  const [lastById, setLastById] = useState<Record<string, ChatMessage | null>>({});
  // Callers pass a freshly built array every render; key on its contents.
  const idsKey = requestIds.join(',');

  useEffect(() => {
    if (!idsKey) {
      setLastById({});
      return;
    }
    const unsubs = idsKey.split(',').map((requestId) =>
      onSnapshot(
        query(collection(requireDb(), 'requests', requestId, 'messages'), orderBy('createdAt', 'desc'), limit(1)),
        (snapshot) => {
          const first = snapshot.docs[0];
          setLastById((prev) => ({
            ...prev,
            [requestId]: first ? messageFromDoc(first.id, first.data()) : null,
          }));
        },
        (error) => console.warn(`useLastMessages listener failed for ${requestId}`, error)
      )
    );
    return () => unsubs.forEach((unsub) => unsub());
  }, [idsKey]);

  return lastById;
}

export function useSendMessage(requestId: string) {
  const { user, profile } = useAuth();

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      if (!user) throw new Error('Must be signed in to send a message');
      // Don't block sending on the Firestore profile doc (it may be missing or
      // still loading); the auth display name is set at sign-up too.
      await addDoc(collection(requireDb(), 'requests', requestId, 'messages'), {
        senderId: user.uid,
        senderName: profile?.displayName ?? user.displayName ?? user.email ?? 'Unknown',
        text: trimmed,
        createdAt: serverTimestamp(),
      });
    },
    [requestId, user, profile]
  );

  return { sendMessage };
}
