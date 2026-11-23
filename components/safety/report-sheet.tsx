import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Card, CardSeparator } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ACCENT_COLOR } from '@/constants/theme';
import { useReportUser } from '@/hooks/use-blocks';
import { useThemeColor } from '@/hooks/use-theme-color';
import { notify } from '@/lib/confirm';
import { REPORT_NOTE_MAX, REPORT_REASONS, type ReportReason, type ReportSource } from '@/types/safety';

type Props = {
  visible: boolean;
  onClose: () => void;
  reportedUserId: string;
  reportedName: string;
  source: ReportSource;
  requestId?: string;
};

/** Bottom sheet: pick a reason, add an optional note, submit to `reports`. */
export function ReportSheet({ visible, onClose, reportedUserId, reportedName, source, requestId }: Props) {
  const { status, submitReport } = useReportUser();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const text = useThemeColor({}, 'text');
  const muted = useThemeColor({}, 'mutedText');
  const card = useThemeColor({}, 'card');
  const submitting = status === 'submitting';

  // Fresh form every time the sheet opens.
  useEffect(() => {
    if (visible) {
      setReason(null);
      setNote('');
      setError(null);
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (!reason) return;
    setError(null);
    try {
      await submitReport({ reportedUserId, reason, note, source, requestId });
      onClose();
      notify(
        'Report sent',
        `Thanks for letting us know. ${reportedName} won’t be told who reported them. If you feel unsafe, you can also block them.`
      );
    } catch (err) {
      console.warn('submitReport failed', err);
      setError('Couldn’t send the report. Check your connection and try again.');
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title={`Report ${reportedName}`}>
      <Card title="Reason">
        {REPORT_REASONS.map((option, index) => {
          const selected = option === reason;
          return (
            <View key={option}>
              {index > 0 && <CardSeparator inset={16} />}
              <Pressable
                onPress={() => setReason(option)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                style={({ pressed }) => [styles.reasonRow, pressed && styles.pressed]}>
                <ThemedText style={styles.reasonLabel}>{option}</ThemedText>
                {selected && <IconSymbol name="checkmark" size={18} color={ACCENT_COLOR} />}
              </Pressable>
            </View>
          );
        })}
      </Card>

      <Card title="Note (optional)" footer={`${note.length}/${REPORT_NOTE_MAX}`}>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="What happened? Include dates or places if relevant."
          placeholderTextColor={muted}
          maxLength={REPORT_NOTE_MAX}
          multiline
          style={[styles.note, { color: text, backgroundColor: card }]}
        />
      </Card>

      {error && <ThemedText style={styles.error}>{error}</ThemedText>}

      <View style={styles.actions}>
        <Button
          label={submitting ? 'Sending…' : 'Send Report'}
          variant="destructive"
          disabled={!reason || submitting}
          onPress={handleSubmit}
        />
        <Button label="Cancel" outline disabled={submitting} onPress={onClose} />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 50,
  },
  reasonLabel: { fontSize: 16, lineHeight: 21 },
  pressed: { opacity: 0.6 },
  note: {
    minHeight: 88,
    maxHeight: 160,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    lineHeight: 20,
    textAlignVertical: 'top',
  },
  error: { color: '#E03131', fontSize: 14, textAlign: 'center' },
  actions: { gap: 10 },
});
