import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

export function SafetyBanner() {
  return (
    <View style={styles.banner}>
      <ThemedText style={styles.text} lightColor="#5c4300" darkColor="#5c4300">
        Stay safe: never share your home address, and always meet in a public place.
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#f4d374',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  text: {
    fontSize: 13,
    lineHeight: 18,
  },
});
