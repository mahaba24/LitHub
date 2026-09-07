import { Link, Stack } from 'expo-router';
import { FlatList, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/auth-context';
import { useMyRequests } from '@/hooks/use-requests';

export default function MyRequestsScreen() {
  const { user } = useAuth();
  const { requests, loading } = useMyRequests();

  return (
    <>
      <Stack.Screen options={{ title: 'My Requests' }} />
      <FlatList
        contentContainerStyle={styles.content}
        data={requests}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          !loading ? (
            <ThemedView style={styles.empty}>
              <ThemedText>No requests yet.</ThemedText>
            </ThemedView>
          ) : null
        }
        renderItem={({ item }) => {
          const isLender = item.lenderId === user?.uid;
          const counterpart = isLender ? item.borrowerName : item.lenderName;
          const role = isLender ? 'Lending to' : 'Borrowing from';
          return (
            <Link href={`/request/${item.id}`} asChild>
              <Pressable style={styles.row}>
                <ThemedView style={styles.info}>
                  <ThemedText type="defaultSemiBold">{item.bookTitle}</ThemedText>
                  <ThemedText style={styles.meta}>
                    {role} {counterpart} · {item.status}
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
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#687076',
  },
  info: { gap: 2 },
  meta: { opacity: 0.7 },
});