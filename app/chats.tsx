import { router, Stack } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { RequestStatusChip } from '@/components/request-status-chip';
import { ThemedText } from '@/components/themed-text';
import { Card, CardSeparator } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { useAuth } from '@/contexts/auth-context';
import { useLastMessages } from '@/hooks/use-messages';
import { useMyRequests } from '@/hooks/use-requests';
import { useThemeColor } from '@/hooks/use-theme-color';
import { formatActivityTime } from '@/lib/dates';

const AVATAR_SIZE = 44;
const ROW_PADDING = 16;
const AVATAR_GAP = 12;

export default function MyChatsScreen() {
  const { user } = useAuth();
  const { requests, loading } = useMyRequests();
  const lastMessages = useLastMessages(requests.map((r) => r.id));
  const background = useThemeColor({}, 'groupedBackground');
  const muted = useThemeColor({}, 'mutedText');
  // One step stronger than mutedText so the preview reads above the book line.
  const previewColor = useThemeColor({ light: '#4B5563', dark: '#B8BDC3' }, 'mutedText');
  const pressedBg = useThemeColor({ light: 'rgba(0,0,0,0.05)', dark: 'rgba(255,255,255,0.06)' }, 'card');

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
      <ScrollView style={{ backgroundColor: background }} contentContainerStyle={styles.content}>
        {!loading && threads.length === 0 ? (
          <EmptyState
            icon="bubble.left.and.bubble.right.fill"
            iconColor="#34C759"
            title="No chats yet"
            message="When you request a book, you can chat with its lender here to arrange a meetup."
          />
        ) : (
          threads.length > 0 && (
            <Card>
              {threads.map(({ request, lastMessage, activityAt }, index) => {
                const isLender = request.lenderId === user?.uid;
                const counterpart = isLender ? request.borrowerName : request.lenderName;
                const counterpartId = isLender ? request.borrowerId : request.lenderId;
                const preview = lastMessage
                  ? `${lastMessage.senderId === user?.uid ? 'You: ' : ''}${lastMessage.text}`
                  : 'No messages yet';

                return (
                  <View key={request.id}>
                    {index > 0 && <CardSeparator inset={ROW_PADDING + AVATAR_SIZE + AVATAR_GAP} />}
                    <Pressable
                      onPress={() => router.push(`/chat/${request.id}`)}
                      accessibilityRole="button"
                      accessibilityLabel={`Chat with ${counterpart} about ${request.bookTitle}`}
                      style={({ pressed }) => [styles.row, pressed && { backgroundColor: pressedBg }]}>
                      <Avatar name={counterpart} uid={counterpartId} size={AVATAR_SIZE} />
                      <View style={styles.info}>
                        <View style={styles.line}>
                          <ThemedText style={styles.name} numberOfLines={1}>
                            {counterpart}
                          </ThemedText>
                          <ThemedText style={[styles.time, { color: muted }]}>
                            {formatActivityTime(activityAt)}
                          </ThemedText>
                        </View>
                        <View style={styles.line}>
                          <ThemedText style={[styles.book, { color: muted }]} numberOfLines={1}>
                            {request.bookTitle}
                          </ThemedText>
                          <RequestStatusChip status={request.status} />
                        </View>
                        <ThemedText
                          style={[styles.preview, { color: previewColor }, !lastMessage && styles.previewEmpty]}
                          numberOfLines={1}
                          ellipsizeMode="tail">
                          {preview}
                        </ThemedText>
                      </View>
                    </Pressable>
                  </View>
                );
              })}
            </Card>
          )
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40, flexGrow: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AVATAR_GAP,
    paddingHorizontal: ROW_PADDING,
    paddingVertical: 12,
  },
  info: { flex: 1, gap: 2 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { flex: 1, fontSize: 16, lineHeight: 21, fontWeight: '700' },
  time: { fontSize: 12, lineHeight: 16 },
  book: { flex: 1, fontSize: 13, lineHeight: 17 },
  preview: { fontSize: 15, lineHeight: 20, marginTop: 1 },
  previewEmpty: { fontStyle: 'italic', opacity: 0.8 },
});
