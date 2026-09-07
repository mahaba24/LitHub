import { Link } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ACCENT_COLOR } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useDeviceLocation } from '@/hooks/use-location';

export default function AccountScreen() {
  const { user, profile, signOut, updateLocation } = useAuth();
  const { status, location, requestLocation } = useDeviceLocation();
  const tint = ACCENT_COLOR;

  const handleShareLocation = async () => {
    const point = await requestLocation();
    if (point) await updateLocation(point);
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Account</ThemedText>
      <Link href="/requests" style={styles.requestsLink}>
        <ThemedText type="link">My Requests →</ThemedText>
      </Link>

      <ThemedView style={styles.section}>
        <ThemedText type="defaultSemiBold">{profile?.displayName ?? 'Loading…'}</ThemedText>
        <ThemedText>{user?.email}</ThemedText>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="defaultSemiBold">Location</ThemedText>
        <ThemedText style={styles.locationHint}>
          {profile?.location
            ? `Shared (${profile.location.latitude.toFixed(3)}, ${profile.location.longitude.toFixed(3)})`
            : 'Not shared yet — used to show distance to other listings.'}
        </ThemedText>
        {status === 'denied' && (
          <ThemedText style={styles.error}>Location permission was denied.</ThemedText>
        )}
        {status === 'error' && <ThemedText style={styles.error}>Couldn&apos;t get location.</ThemedText>}
        <Pressable
          onPress={handleShareLocation}
          disabled={status === 'requesting'}
          style={[styles.button, { backgroundColor: tint }, status === 'requesting' && styles.buttonDisabled]}>
          <ThemedText style={styles.buttonText} type="defaultSemiBold">
            {status === 'requesting' ? 'Locating…' : 'Share my current location'}
          </ThemedText>
        </Pressable>
        {location && (
          <ThemedText style={styles.locationHint}>
            Updated: ({location.latitude.toFixed(3)}, {location.longitude.toFixed(3)})
          </ThemedText>
        )}
      </ThemedView>

      <Pressable onPress={() => signOut()} style={styles.signOutButton}>
        <ThemedText style={styles.signOutText} type="defaultSemiBold">
          Sign Out
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 24,
  },
  requestsLink: {
    marginTop: -8,
  },
  section: {
    gap: 6,
  },
  locationHint: {
    opacity: 0.7,
  },
  error: {
    color: '#c0392b',
  },
  button: {
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
  },
  signOutButton: {
    marginTop: 'auto',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#c0392b',
  },
  signOutText: {
    color: '#c0392b',
  },
});