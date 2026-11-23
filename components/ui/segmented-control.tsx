import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

type Props<T extends string> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

/** iOS-style segmented control: tinted track, raised "thumb" on the selected segment. */
export function SegmentedControl<T extends string>({ options, value, onChange }: Props<T>) {
  const track = useThemeColor({ light: 'rgba(118,118,128,0.12)', dark: 'rgba(118,118,128,0.24)' }, 'card');
  const thumb = useThemeColor({ light: '#FFFFFF', dark: '#3A3B3E' }, 'card');

  return (
    <View style={[styles.track, { backgroundColor: track }]} accessibilityRole="tablist">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            style={[styles.segment, selected && [styles.selected, { backgroundColor: thumb }]]}>
            <ThemedText style={[styles.text, selected && styles.textSelected]} numberOfLines={1}>
              {option.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', borderRadius: 10, padding: 2 },
  segment: { flex: 1, paddingVertical: 7, paddingHorizontal: 4, borderRadius: 8, alignItems: 'center' },
  selected: {
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  text: { fontSize: 13, lineHeight: 18, opacity: 0.75 },
  textSelected: { fontWeight: '600', opacity: 1 },
});
