import { router, Stack } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { RequestStatusChip } from '@/components/request-status-chip';
import { ThemedText } from '@/components/themed-text';
import { Card, CardSeparator } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ACCENT_COLOR } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useMyRequests } from '@/hooks/use-requests';
import { useThemeColor } from '@/hooks/use-theme-color';
import { requestNeedsActionFrom } from '@/lib/requests';
import type { BorrowRequest } from '@/types/request';

const AVATAR_SIZE = 44;
const ROW_PADDING = 16;
const AVATAR_GAP = 12;
const YOUR_TURN = '#FF3B30';

function RequestRow({ request, uid, yourTurn }: { request: BorrowRequest; uid: string; yourTurn: boolean }) {
  const muted = useThemeColor({}, 'mutedText');
  const pressedBg = useThemeColor({ light: 'rgba(0,0,0,0.05)', dark: 'rgba(255,255,255,0.06)' }, 'card');
  const isLender = request.lenderId === uid;
  const counterpart = isLender ? request.borrowerName : request.lenderName;
  const counterpartId = isLender ? request.borrowerId : request.lenderId;

  return (
    <Pressable
      onPress={() => router.push(`/request/${request.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`${request.bookTitle}, ${isLender ? 'lending to' : 'borrowing from'} ${counterpart}, ${request.status}${yourTurn ? ', your turn' : ''}`}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: pressedBg }]}>
      <Avatar name={counterpart} uid={counterpartId} size={AVATAR_SIZE} />
      <View style={styles.info}>
        <ThemedText style={styles.title} numberOfLines={1}>
          {request.bookTitle}
        </ThemedText>
        <View style={styles.subtitleLine}>
          <ThemedText style={[styles.subtitle, { color: muted }]} numberOfLines={1}>
            {isLender ? 'Lending to' : 'Borrowing from'} {counterpart}
          </ThemedText>
          {yourTurn && (
            <View style={styles.yourTurn}>
              <View style={styles.dot} />
              <ThemedText style={styles.yourTurnText}>Your turn</ThemedText>
            </View>
          )}
        </View>
      </View>
      <RequestStatusChip status={request.status} />
      <IconSymbol name="chevron.right" size={14} color={muted} />
    </Pressable>
  );
}

export default function MyRequestsScreen() {
  const { user } = useAuth();
  const { requests, loading } = useMyRequests();
  const background = useThemeColor({}, 'groupedBackground');
  const uid = user?.uid ?? '';

  // useMyRequests is already newest-first; partitioning keeps that order
  // within each section, and "needs your response" always renders first.
  const needsResponse = requests.filter((r) => requestNeedsActionFrom(r, uid));
  const inProgress = requests.filter((r) => r.status !== 'Completed' && !requestNeedsActionFrom(r, uid));
  const completed = requests.filter((r) => r.status === 'Completed');

  const sections = [
    { title: 'Needs your response', items: needsResponse, yourTurn: true },
    { title: 'In progress', items: inProgress, yourTurn: false },
    { title: 'Completed', items: completed, yourTurn: false },
  ].filter((section) => section.items.length > 0);

  return (
    <>
      <Stack.Screen options={{ title: 'My Requests' }} />
      <ScrollView style={{ backgroundColor: background }} contentContainerStyle={styles.content}>
        {!loading && requests.length === 0 ? (
          <EmptyState
            icon="arrow.left.arrow.right"
            iconColor={ACCENT_COLOR}
            title="No requests yet"
            message="Find a book you'd like to read and tap “Request to Borrow”. Requests from people who want your books show up here too."
          />
        ) : (
          sections.map((section) => (
            <Card key={section.title} title={section.title}>
              {section.items.map((request, index) => (
                <View key={request.id}>
                  {index > 0 && <CardSeparator inset={ROW_PADDING + AVATAR_SIZE + AVATAR_GAP} />}
                  <RequestRow request={request} uid={uid} yourTurn={section.yourTurn} />
                </View>
              ))}
            </Card>
          ))
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40, gap: 24, flexGrow: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AVATAR_GAP,
    paddingHorizontal: ROW_PADDING,
    paddingVertical: 12,
  },
  info: { flex: 1, gap: 2 },
  title: { fontSize: 16, lineHeight: 21, fontWeight: '700' },
  subtitleLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  subtitle: { flexShrink: 1, fontSize: 13, lineHeight: 17 },
  yourTurn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: YOUR_TURN },
  yourTurnText: { fontSize: 12, lineHeight: 16, fontWeight: '700', color: YOUR_TURN },
});
