import DateTimePicker, { DateTimePickerAndroid, type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ACCENT_COLOR } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { formatDueDate, parseDueDate, startOfToday } from '@/lib/dates';

type Props = {
  value: Date | null;
  onChange: (date: Date | null) => void;
};

/**
 * Native calendar picker on iOS/Android (no free-text typos), displayed as
 * DD-MM-YYYY. The native picker has no web implementation, so web falls back
 * to a strictly validated DD-MM-YYYY text field.
 */
export function DueDatePicker({ value, onChange }: Props) {
  const colorScheme = useColorScheme();
  const textColor = useThemeColor({}, 'text');
  const [iosOpen, setIosOpen] = useState(false);
  const [webText, setWebText] = useState(value ? formatDueDate(value) : '');
  const minimumDate = startOfToday();

  if (Platform.OS === 'web') {
    const invalid = webText.length > 0 && !parseDueDate(webText);
    return (
      <View style={styles.wrapper}>
        <TextInput
          value={webText}
          onChangeText={(text) => {
            setWebText(text);
            const parsed = parseDueDate(text);
            onChange(parsed && parsed >= minimumDate ? parsed : null);
          }}
          placeholder="DD-MM-YYYY"
          style={[styles.field, { color: textColor }]}
        />
        {invalid && <ThemedText style={styles.error}>Use DD-MM-YYYY, e.g. 05-11-2026</ThemedText>}
      </View>
    );
  }

  const openPicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: value ?? minimumDate,
        mode: 'date',
        minimumDate,
        onChange: (event: DateTimePickerEvent, date?: Date) => {
          if (event.type === 'set' && date) onChange(date);
        },
      });
    } else {
      setIosOpen((open) => !open);
    }
  };

  return (
    <View style={styles.wrapper}>
      <Pressable onPress={openPicker} style={styles.field}>
        <ThemedText style={!value && styles.placeholder}>
          {value ? formatDueDate(value) : 'Select a date (DD-MM-YYYY)'}
        </ThemedText>
      </Pressable>

      {Platform.OS === 'ios' && iosOpen && (
        <View>
          <DateTimePicker
            value={value ?? minimumDate}
            mode="date"
            display="inline"
            minimumDate={minimumDate}
            accentColor={ACCENT_COLOR}
            themeVariant={colorScheme === 'dark' ? 'dark' : 'light'}
            onChange={(_event, date) => {
              if (date) onChange(date);
            }}
          />
          <Pressable onPress={() => setIosOpen(false)} style={styles.doneButton}>
            <ThemedText type="link">Done</ThemedText>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  field: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#687076',
    borderRadius: 8,
    padding: 12,
  },
  placeholder: { opacity: 0.5 },
  error: { color: '#c0392b', fontSize: 13 },
  doneButton: { alignSelf: 'flex-end', paddingVertical: 4 },
});
