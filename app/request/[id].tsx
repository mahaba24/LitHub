import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { DueDatePicker } from '@/components/due-date-picker';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card, CardSeparator } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ACCENT_COLOR } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useRequest, useRequestActions } from '@/hooks/use-requests';
import { useThemeColor } from '@/hooks/use-theme-color';
import { formatDueDate } from '@/lib/dates';
import { DAMAGE_FEES, type DamageSeverity, type RequestStatus } from '@/types/request';

const DAMAGE_OPTIONS: Exclude<DamageSeverity, 'None'>[] = ['Minor', 'Moderate', 'Severe'];
const STEPS: { status: RequestStatus; label: string }[] = [
  { status: 'Requested', label: 'Requested' },
  { status: 'Under Negotiation', label: 'Negotiating' },
  { status: 'Confirmed', label: 'Confirmed' },
  { status: 'Completed', label: 'Returned' },
];

/** Requested → Negotiating → Confirmed → Returned, with Overdue shown in red on the last step. */
function StatusStepper({ status }: { status: RequestStatus }) {
  const muted = useThemeColor({}, 'mutedText');
  const track = useThemeColor({ light: '#E5E7EB', dark: '#2F3134' }, 'card');
  const isOverdue = status === 'Overdue';
  const current = isOverdue ? 3 : STEPS.findIndex((s) => s.status === status);

  return (
    <View style={styles.stepper}>
      {STEPS.map((step, index) => {
        const done = index < current || status === 'Completed';
        const active = index === current;
        const color = isOverdue && active ? '#E03131' : done || active ? ACCENT_COLOR : track;
        return (
          <View key={step.status} style={styles.step}>
            <View style={styles.stepTrackRow}>
              <View style={[styles.stepLine, { backgroundColor: index === 0 ? 'transparent' : index <= current ? ACCENT_COLOR : track }]} />
              <View style={[styles.stepDot, { backgroundColor: color }]}>
                {done && !active ? <IconSymbol name="checkmark" size={11} color="#fff" /> : null}
              </View>
              <View
                style={[
                  styles.stepLine,
                  { backgroundColor: index === STEPS.length - 1 ? 'transparent' : index < current ? ACCENT_COLOR : track },
                ]}
              />
            </View>
            <ThemedText
              style={[styles.stepLabel, { color: active ? color : muted }, active && styles.stepLabelActive]}
              numberOfLines={1}>
              {isOverdue && index === 3 ? 'Overdue' : step.label}
            </ThemedText>
          </View>
        );
      })}
    </View>
  );
}

export default function NegotiationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { request, loading } = useRequest(id);
  const {
    status: actionStatus,
    proposeDueDate,
    counterProposal,
    acceptProposal,
    markReturned,
    reportDamage,
  } = useRequestActions();
  const [dueDateInput, setDueDateInput] = useState<Date | null>(null);
  const [reportingDamage, setReportingDamage] = useState(false);
  const background = useThemeColor({}, 'groupedBackground');
  const muted = useThemeColor({}, 'mutedText');

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText>Loading…</ThemedText>
      </ThemedView>
    );
  }

  if (!request) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText type="subtitle">Request not found</ThemedText>
      </ThemedView>
    );
  }

  const isSubmitting = actionStatus === 'submitting';
  const isConfirmed = request.status === 'Confirmed';
  const isCompleted = request.status === 'Completed';
  const isLender = user?.uid === request.lenderId;
  const counterpart = isLender ? request.borrowerName : request.lenderName;
  const counterpartId = isLender ? request.borrowerId : request.lenderId;
  // Only the party who did NOT make the latest proposal may counter/accept it.
  // Legacy docs without lastProposedBy fall back to letting either side respond.
  const awaitingOtherParty =
    request.status === 'Under Negotiation' &&
    request.lastProposedBy !== null &&
    request.lastProposedBy === user?.uid;

  const handlePropose = async () => {
    if (!dueDateInput) return;
    await proposeDueDate(request.id, dueDateInput);
    setDueDateInput(null);
  };

  const handleCounter = async () => {
    if (!dueDateInput) return;
    await counterProposal(request.id, dueDateInput);
    setDueDateInput(null);
  };

  const handleAccept = async () => {
    if (!request.proposedDueDate) return;
    await acceptProposal(request.id);
  };

  const handleReportDamage = async (severity: Exclude<DamageSeverity, 'None'>) => {
    await reportDamage(request.id, severity);
    setReportingDamage(false);
  };

  return (
    <>
      <Stack.Screen options={{ title: request.bookTitle }} />
      <ScrollView
        style={{ backgroundColor: background }}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <ThemedText type="subtitle" style={styles.bookTitle}>
            {request.bookTitle}
          </ThemedText>
          <StatusStepper status={request.status} />
        </View>

        <Card title={isLender ? 'Borrower' : 'Lender'}>
          <Pressable
            onPress={() => router.push(`/user/${counterpartId}`)}
            style={({ pressed }) => [styles.personRow, pressed && styles.pressed]}>
            <Avatar name={counterpart} uid={counterpartId} size={44} />
            <View style={styles.personText}>
              <ThemedText style={styles.personName}>{counterpart}</ThemedText>
              <ThemedText style={[styles.personMeta, { color: muted }]}>View profile</ThemedText>
            </View>
            <IconSymbol name="chevron.right" size={14} color={muted} />
          </Pressable>
          <CardSeparator />
          <Pressable
            onPress={() => router.push(`/chat/${request.id}`)}
            style={({ pressed }) => [styles.personRow, pressed && styles.pressed]}>
            <View style={[styles.iconTile, { backgroundColor: '#34C759' }]}>
              <IconSymbol name="bubble.left.and.bubble.right.fill" size={18} color="#fff" />
            </View>
            <ThemedText style={[styles.personName, styles.flex]}>Message {counterpart}</ThemedText>
            <IconSymbol name="chevron.right" size={14} color={muted} />
          </Pressable>
        </Card>

        {request.proposedDueDate && !isConfirmed && !isCompleted && (
          <Card title="Proposed return date">
            <View style={styles.dateRow}>
              <IconSymbol name="calendar" size={22} color={ACCENT_COLOR} />
              <ThemedText style={styles.dateText}>{formatDueDate(request.proposedDueDate)}</ThemedText>
              <ThemedText style={[styles.dateBy, { color: muted }]}>
                {request.lastProposedBy === user?.uid ? 'by you' : request.lastProposedBy ? `by ${counterpart}` : ''}
              </ThemedText>
            </View>
          </Card>
        )}

        {awaitingOtherParty && (
          <Card>
            <View style={styles.waiting}>
              <IconSymbol name="hourglass" size={22} color={muted} />
              <View style={styles.flex}>
                <ThemedText style={styles.personName}>Waiting for response</ThemedText>
                <ThemedText style={[styles.personMeta, { color: muted }]}>
                  You proposed this date. {counterpart} can accept it or counter with a new one.
                </ThemedText>
              </View>
            </View>
          </Card>
        )}

        {!isConfirmed && !isCompleted && !awaitingOtherParty && (
          <Card title={request.status === 'Requested' ? 'Propose a return date' : 'Counter with a new date'}>
            <View style={styles.cardBody}>
              <DueDatePicker value={dueDateInput} onChange={setDueDateInput} />
              <View style={styles.buttonRow}>
                <Button
                  style={styles.flex}
                  outline={request.status === 'Under Negotiation'}
                  label={request.status === 'Requested' ? 'Propose' : 'Counter'}
                  disabled={isSubmitting || !dueDateInput}
                  onPress={request.status === 'Requested' ? handlePropose : handleCounter}
                />
                {request.status === 'Under Negotiation' && (
                  <Button
                    style={styles.flex}
                    variant="success"
                    icon="checkmark"
                    label="Accept"
                    disabled={isSubmitting}
                    onPress={handleAccept}
                  />
                )}
              </View>
            </View>
          </Card>
        )}

        {isConfirmed && !reportingDamage && (
          <Card title="Exchange confirmed">
            <View style={styles.cardBody}>
              <View style={[styles.dateRow, styles.dateRowInline]}>
                <IconSymbol name="calendar" size={22} color="#2B8A3E" />
                <ThemedText style={styles.personMeta}>Return by</ThemedText>
                <ThemedText style={styles.dateText}>
                  {request.proposedDueDate ? formatDueDate(request.proposedDueDate) : 'the agreed date'}
                </ThemedText>
              </View>
              <Button
                variant="success"
                icon="checkmark"
                label="Mark as Returned"
                disabled={isSubmitting}
                onPress={() => markReturned(request.id)}
              />
              {isLender && (
                <Button
                  variant="destructive"
                  outline
                  label="Report Damage"
                  disabled={isSubmitting}
                  onPress={() => setReportingDamage(true)}
                />
              )}
            </View>
          </Card>
        )}

        {isConfirmed && reportingDamage && (
          <Card title="How bad is the damage?">
            {DAMAGE_OPTIONS.map((severity, index) => (
              <View key={severity}>
                {index > 0 && <CardSeparator inset={16} />}
                <Pressable
                  disabled={isSubmitting}
                  onPress={() => handleReportDamage(severity)}
                  style={({ pressed }) => [styles.damageRow, (pressed || isSubmitting) && styles.pressed]}>
                  <ThemedText style={styles.personName}>{severity}</ThemedText>
                  <ThemedText style={[styles.damageFee, { color: muted }]}>Fee: ${DAMAGE_FEES[severity]}</ThemedText>
                </Pressable>
              </View>
            ))}
            <CardSeparator inset={0} />
            <Pressable
              onPress={() => setReportingDamage(false)}
              style={({ pressed }) => [styles.cancelRow, pressed && styles.pressed]}>
              <ThemedText type="link">Cancel</ThemedText>
            </Pressable>
          </Card>
        )}

        {isCompleted && (
          <Card title="Exchange complete">
            <View style={styles.cardBody}>
              {request.damageSeverity !== 'None' ? (
                <View style={styles.damageSummary}>
                  <ThemedText style={[styles.personName, { color: '#E03131' }]}>
                    Damage reported: {request.damageSeverity}
                  </ThemedText>
                  <ThemedText style={{ color: muted }}>Fee: ${request.damageFee}</ThemedText>
                </View>
              ) : (
                <ThemedText style={{ color: muted }}>The book was returned. Thanks for sharing!</ThemedText>
              )}
              <Button icon="star.fill" label="Leave a Review" onPress={() => router.push(`/review/${request.id}`)} />
            </View>
          </Card>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, paddingBottom: 40, gap: 24 },
  flex: { flex: 1 },
  header: { gap: 16, paddingTop: 4 },
  bookTitle: { textAlign: 'center' },
  stepper: { flexDirection: 'row' },
  step: { flex: 1, alignItems: 'center', gap: 6 },
  stepTrackRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch' },
  stepLine: { flex: 1, height: 2 },
  stepDot: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  stepLabel: { fontSize: 11, lineHeight: 14 },
  stepLabelActive: { fontWeight: '700' },
  personRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  pressed: { opacity: 0.6 },
  personText: { flex: 1, gap: 1 },
  personName: { fontSize: 16, fontWeight: '600' },
  personMeta: { fontSize: 13, lineHeight: 18 },
  iconTile: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16 },
  dateRowInline: { padding: 0 },
  dateText: { fontSize: 20, fontWeight: '700' },
  dateBy: { marginLeft: 'auto', fontSize: 13 },
  waiting: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  cardBody: { padding: 16, gap: 12 },
  buttonRow: { flexDirection: 'row', gap: 10 },
  damageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  damageFee: { fontSize: 14 },
  cancelRow: { alignItems: 'center', paddingVertical: 14 },
  damageSummary: { gap: 2 },
});
