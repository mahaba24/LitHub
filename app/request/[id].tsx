import { Link, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ACCENT_COLOR } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useRequest, useRequestActions } from '@/hooks/use-requests';

export default function NegotiationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { request, loading } = useRequest(id);
  const { status: actionStatus, proposeDueDate, counterProposal, acceptProposal, markReturned } =
    useRequestActions();
  const [dueDateInput, setDueDateInput] = useState('');
  const tint = ACCENT_COLOR;

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Loading…</ThemedText>
      </ThemedView>
    );
  }

  if (!request) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="subtitle">Request not found</ThemedText>
      </ThemedView>
    );
  }

  const isSubmitting = actionStatus === 'submitting';
  const isConfirmed = request.status === 'Confirmed';
  const isCompleted = request.status === 'Completed';
  const isLender = user?.uid === request.lenderId;
  const counterpart = isLender ? request.borrowerName : request.lenderName;

  const handlePropose = async () => {
    if (!dueDateInput) return;
    await proposeDueDate(request.id, dueDateInput);
    setDueDateInput('');
  };

  const handleCounter = async () => {
    if (!dueDateInput) return;
    await counterProposal(request.id, dueDateInput);
    setDueDateInput('');
  };

  const handleAccept = async () => {
    if (!request.proposedDueDate) return;
    await acceptProposal(request.id, request.proposedDueDate);
  };

  return (
    <>
      <Stack.Screen options={{ title: request.bookTitle }} />
      <ThemedView style={styles.container}>
        <ThemedText type="subtitle">{request.bookTitle}</ThemedText>
        <ThemedText style={styles.counterpart}>
          {isLender ? 'Borrower' : 'Lender'}: {counterpart}
        </ThemedText>

        <Link href={`/chat/${request.id}`} asChild>
          <Pressable style={styles.chatLink}>
            <ThemedText type="link">Open Chat →</ThemedText>
          </Pressable>
        </Link>

        <ThemedText type="subtitle">Status: {request.status}</ThemedText>

        {request.proposedDueDate && (
          <ThemedText>
            Proposed due date: <ThemedText type="defaultSemiBold">{request.proposedDueDate}</ThemedText>
          </ThemedText>
        )}

        {!isConfirmed && !isCompleted && (
          <>
            <ThemedText type="defaultSemiBold" style={styles.label}>
              {request.status === 'Requested' ? 'Propose a due date' : 'Counter with a new due date'}
            </ThemedText>
            <TextInput
              value={dueDateInput}
              onChangeText={setDueDateInput}
              placeholder="YYYY-MM-DD"
              style={styles.input}
            />

            <ThemedView style={styles.buttonRow}>
              <Pressable
                disabled={isSubmitting || !dueDateInput}
                onPress={request.status === 'Requested' ? handlePropose : handleCounter}
                style={[
                  styles.button,
                  { backgroundColor: tint },
                  (isSubmitting || !dueDateInput) && styles.buttonDisabled,
                ]}>
                <ThemedText style={styles.buttonText} type="defaultSemiBold">
                  {request.status === 'Requested' ? 'Propose' : 'Counter'}
                </ThemedText>
              </Pressable>

              {request.status === 'Under Negotiation' && (
                <Pressable
                  disabled={isSubmitting}
                  onPress={handleAccept}
                  style={[styles.button, styles.acceptButton, isSubmitting && styles.buttonDisabled]}>
                  <ThemedText style={styles.buttonText} type="defaultSemiBold">
                    Accept
                  </ThemedText>
                </Pressable>
              )}
            </ThemedView>
          </>
        )}

        {isConfirmed && (
          <>
            <ThemedText>Exchange confirmed for {request.proposedDueDate}.</ThemedText>
            <Pressable
              disabled={isSubmitting}
              onPress={() => markReturned(request.id)}
              style={[styles.button, styles.acceptButton, isSubmitting && styles.buttonDisabled]}>
              <ThemedText style={styles.buttonText} type="defaultSemiBold">
                Mark as Returned
              </ThemedText>
            </Pressable>
          </>
        )}

        {isCompleted && (
          <>
            <ThemedText>This exchange is complete.</ThemedText>
            <Link href={`/review/${request.id}`} asChild>
              <Pressable style={[styles.button, { backgroundColor: tint }]}>
                <ThemedText style={styles.buttonText} type="defaultSemiBold">
                  Leave a Review
                </ThemedText>
              </Pressable>
            </Link>
          </>
        )}
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 12 },
  counterpart: { opacity: 0.7, marginTop: -8 },
  chatLink: { marginBottom: 4 },
  label: { marginTop: 8 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#687076',
    borderRadius: 8,
    padding: 12,
  },
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  button: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  acceptButton: { backgroundColor: '#2e7d32' },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff' },
});
