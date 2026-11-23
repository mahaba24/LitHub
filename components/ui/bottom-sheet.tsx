import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

type Props = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
};

/** Modal sheet that slides up from the bottom; tap the backdrop to dismiss. */
export function BottomSheet({ visible, onClose, title, children }: Props) {
  const insets = useSafeAreaInsets();
  const background = useThemeColor({}, 'groupedBackground');
  const handle = useThemeColor({}, 'separator');

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
        <View style={[styles.sheet, { backgroundColor: background, paddingBottom: insets.bottom + 16 }]}>
          <View style={[styles.handle, { backgroundColor: handle }]} />
          {title && (
            <ThemedText type="defaultSemiBold" style={styles.title}>
              {title}
            </ThemedText>
          )}
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 16,
    maxHeight: '90%',
  },
  handle: { alignSelf: 'center', width: 36, height: 5, borderRadius: 3 },
  title: { fontSize: 17, textAlign: 'center' },
});
