import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ACCENT_COLOR } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getAuthErrorMessage } from '@/lib/auth-errors';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { signIn } = useAuth();
  const tint = ACCENT_COLOR;
  const textColor = useThemeColor({}, 'text');

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      router.replace('/(tabs)');
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Welcome back</ThemedText>

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
        placeholder="Password"
        secureTextEntry
        style={[styles.input, { color: textColor }]}
      />

      {error && <ThemedText style={styles.error}>{error}</ThemedText>}

      <Pressable
        disabled={submitting || !email || !password}
        onPress={handleSubmit}
        style={[
          styles.button,
          { backgroundColor: tint },
          (submitting || !email || !password) && styles.buttonDisabled,
        ]}>
        <ThemedText style={styles.buttonText} type="defaultSemiBold">
          {submitting ? 'Logging in…' : 'Log In'}
        </ThemedText>
      </Pressable>

      <Link href="/(auth)/register" style={styles.link}>
        <ThemedText type="link">Need an account? Register</ThemedText>
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
