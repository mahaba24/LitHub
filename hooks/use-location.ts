import * as Location from 'expo-location';
import { useCallback, useState } from 'react';

import type { GeoPoint } from '@/types/geo';

export type LocationRequestStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'error';

export function useDeviceLocation() {
  const [status, setStatus] = useState<LocationRequestStatus>('idle');
  const [location, setLocation] = useState<GeoPoint | null>(null);

  const requestLocation = useCallback(async () => {
    setStatus('requesting');
    try {
      const { status: permissionStatus } = await Location.requestForegroundPermissionsAsync();
      if (permissionStatus !== 'granted') {
        setStatus('denied');
        return null;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const point: GeoPoint = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      setLocation(point);
      setStatus('granted');
      return point;
    } catch {
      setStatus('error');
      return null;
    }
  }, []);

  return { status, location, requestLocation };
}
