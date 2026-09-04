import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ACCENT_COLOR } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getAuthErrorMessage } from '@/lib/auth-errors';

export default function RegisterScreen() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { signUp } = useAuth();
  const tint = ACCENT_COLOR;
  const textColor = useThemeColor({}, 'text');

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await signUp(email.trim(), password, displayName.trim());
      router.replace('/(tabs)');
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = displayName.trim() && email.trim() && password.length >= 6;

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Create your account</ThemedText>

      <TextInput
        value={displayName}
        onChangeText={setDisplayName}
        placeholder="Display name"
        style={[styles.input, { color: textColor }]}
      />
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        style={[styles.input, { color: textColor }]}
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password (min 6 characters)"
        secureTextEntry
        style={[styles.input, { color: textColor }]}
      />

      {error && <ThemedText style={styles.error}>{error}</ThemedText>}

      <Pressable
        disabled={submitting || !canSubmit}
        onPress={handleSubmit}
        style={[
          styles.button,
          { backgroundColor: tint },
          (submitting || !canSubmit) && styles.buttonDisabled,
        ]}>
        <ThemedText style={styles.buttonText} type="defaultSemiBold">
          {submitting ? 'Creating account…' : 'Create Account'}
        </ThemedText>
      </Pressable>

      <Link href="/(auth)/login" style={styles.link}>
        <ThemedText type="link">Already have an account? Log in</ThemedText>
      </Link>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    gap: 12,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#687076',
    borderRadius: 8,
    padding: 12,
  },
  error: {
    color: '#c0392b',
  },
  button: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
  },
  link: {
    marginTop: 16,
    alignSelf: 'center',
  },
});
