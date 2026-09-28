import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { BookCover } from '@/components/book-card';
import { ThemedText } from '@/components/themed-text';
import { Card, CardSeparator } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ScreenTitle } from '@/components/ui/screen-title';
import { useAuth } from '@/contexts/auth-context';
import { useBookOfTheMonth, useTopReaders } from '@/hooks/use-leaderboard';
import { useThemeColor } from '@/hooks/use-theme-color';

const RANK_COLORS = ['#E5A50A', '#9CA3AF', '#B8733D'];

function RankBadge({ rank }: { rank: number }) {
  const muted = useThemeColor({}, 'mutedText');
  const color = RANK_COLORS[rank - 1];
  return color ? (
    <View style={[styles.rankBadge, { backgroundColor: color }]}>
      <ThemedText style={styles.rankBadgeText}>{rank}</ThemedText>
    </View>
  ) : (
    <ThemedText style={[styles.rankPlain, { color: muted }]}>{rank}</ThemedText>
  );
}

export default function LeaderboardScreen() {
  const { user } = useAuth();
  const { readers, loading: readersLoading } = useTopReaders();
  const { entries, loading: booksLoading } = useBookOfTheMonth();
  const insets = useSafeAreaInsets();
  const background = useThemeColor({}, 'groupedBackground');
  const muted = useThemeColor({}, 'mutedText');
  const tint = useThemeColor({}, 'tint');

  return (
    <ScrollView
      style={{ backgroundColor: background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
      <ScreenTitle title="Leaderboard" subtitle="The community’s most trusted readers" />

      <Card title="Top readers">
        {!readersLoading && readers.length === 0 && (
          <ThemedText style={[styles.empty, { color: muted }]}>
            No readers yet — complete an exchange to get ranked.
          </ThemedText>
        )}
        {readers.map((reader, index) => (
          <View key={reader.uid}>
            {index > 0 && <CardSeparator inset={100} />}
            <Pressable
              onPress={() => router.push(reader.uid === user?.uid ? '/account' : `/user/${reader.uid}`)}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
              <RankBadge rank={index + 1} />
              <Avatar name={reader.displayName} uid={reader.uid} size={40} />
              <View style={styles.info}>
                <ThemedText style={styles.name} numberOfLines={1}>
                  {reader.displayName}
                  {reader.uid === user?.uid ? ' (you)' : ''}
                </ThemedText>
                <ThemedText style={[styles.meta, { color: muted }]}>
                  {reader.completedReturns} returns · {reader.reviewCount} reviews
                </ThemedText>
              </View>
              <View style={styles.score}>
                <ThemedText style={[styles.scoreValue, { color: tint }]}>{Math.round(reader.trustScore)}</ThemedText>
                <ThemedText style={[styles.scoreLabel, { color: muted }]}>TRUST</ThemedText>
              </View>
            </Pressable>
          </View>
        ))}
      </Card>

      <Card title="Book of the month">
        {!booksLoading && entries.length === 0 && (
          <ThemedText style={[styles.empty, { color: muted }]}>No requests yet this month.</ThemedText>
        )}
        {entries.map(({ book, requestCount }, index) => (
          <View key={book.id}>
            {index > 0 && <CardSeparator inset={100} />}
            <Pressable
              onPress={() => router.push(`/book/${book.id}`)}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
              <RankBadge rank={index + 1} />
              <BookCover uri={book.coverUrl} width={40} />
              <View style={styles.info}>
                <ThemedText style={styles.name} numberOfLines={2}>
                  {book.title}
                </ThemedText>
                <ThemedText style={[styles.meta, { color: muted }]} numberOfLines={1}>
                  {book.author} · {requestCount} request{requestCount === 1 ? '' : 's'}
                </ThemedText>
              </View>
              <IconSymbol name="chevron.right" size={14} color={muted} />
            </Pressable>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 32, gap: 28 },
  empty: { padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  pressed: { opacity: 0.6 },
  rankBadge: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  rankBadgeText: { color: '#fff', fontSize: 13, lineHeight: 16, fontWeight: '800' },
  rankPlain: { width: 26, textAlign: 'center', fontSize: 15, fontWeight: '700' },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 16, lineHeight: 21, fontWeight: '600' },
  meta: { fontSize: 13, lineHeight: 17 },
  score: { alignItems: 'center', minWidth: 44 },
  scoreValue: { fontSize: 20, lineHeight: 24, fontWeight: '800' },
  scoreLabel: { fontSize: 10, lineHeight: 12, fontWeight: '700', letterSpacing: 0.8 },
});
