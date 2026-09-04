import {
  addDoc,
  collection,
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
    return onSnapshot(messagesQuery, (snapshot) => {
      setMessages(snapshot.docs.map((d) => messageFromDoc(d.id, d.data())));
      setLoading(false);
    });
  }, [requestId]);

  return { messages, loading };
}

export function useSendMessage(requestId: string) {
  const { user, profile } = useAuth();

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !user || !profile) return;
      await addDoc(collection(requireDb(), 'requests', requestId, 'messages'), {
        senderId: user.uid,
        senderName: profile.displayName,
        text: trimmed,
        createdAt: serverTimestamp(),
      });
    },
    [requestId, user, profile]
  );

  return { sendMessage };
}
