import { Link, Stack } from 'expo-router';
import { FlatList, Pressable, StyleSheet } from 'react-native';

import { Avatar } from '@/components/avatar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/auth-context';
import { useLastMessages } from '@/hooks/use-messages';
import { useMyRequests } from '@/hooks/use-requests';
import { formatDueDate } from '@/lib/dates';

function formatActivity(millis: number) {
  const date = new Date(millis);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  return isToday ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : formatDueDate(date);
}

export default function MyChatsScreen() {
  const { user } = useAuth();
  const { requests, loading } = useMyRequests();
  const lastMessages = useLastMessages(requests.map((r) => r.id));

  // Every request is a chat thread; most recent activity (message, or the
  // request itself changing) first.
  const threads = requests
    .map((request) => {
      const lastMessage = lastMessages[request.id] ?? null;
      return { request, lastMessage, activityAt: lastMessage?.createdAt ?? request.updatedAt };
    })
    .sort((a, b) => b.activityAt - a.activityAt);

  return (
    <>
      <Stack.Screen options={{ title: 'My Chats' }} />
      <FlatList
        contentContainerStyle={styles.content}
        data={threads}
        keyExtractor={(item) => item.request.id}
        ListEmptyComponent={
          !loading ? (
            <ThemedView style={styles.empty}>
              <ThemedText>No conversations yet — request a book to start chatting with its lender.</ThemedText>
            </ThemedView>
          ) : null
        }
        renderItem={({ item: { request, lastMessage, activityAt } }) => {
          const isLender = request.lenderId === user?.uid;
          const counterpart = isLender ? request.borrowerName : request.lenderName;
          const preview = lastMessage
            ? `${lastMessage.senderId === user?.uid ? 'You: ' : ''}${lastMessage.text}`
            : 'No messages yet';
          return (
            <Link href={`/chat/${request.id}`} asChild>
              <Pressable style={styles.row}>
                <Avatar name={counterpart} uid={isLender ? request.borrowerId : request.lenderId} size={44} />
                <ThemedView style={styles.info}>
                  <ThemedView style={styles.topLine}>
                    <ThemedText type="defaultSemiBold" numberOfLines={1} style={styles.name}>
                      {counterpart}
                    </ThemedText>
                    <ThemedText style={styles.time}>{formatActivity(activityAt)}</ThemedText>
                  </ThemedView>
                  <ThemedText style={styles.book} numberOfLines={1}>
                    {request.bookTitle} · {request.status}
                  </ThemedText>
                  <ThemedText style={[styles.preview, !lastMessage && styles.previewEmpty]} numberOfLines={1}>
                    {preview}
                  </ThemedText>
                </ThemedView>
              </Pressable>
            </Link>
          );
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1 },
  empty: { padding: 20 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#687076',
  },
  info: { flex: 1, gap: 1 },
  topLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { flex: 1 },
  time: { fontSize: 12, opacity: 0.6 },
  book: { fontSize: 13, opacity: 0.7 },
  preview: { opacity: 0.85 },
  previewEmpty: { opacity: 0.5, fontStyle: 'italic' },
});
