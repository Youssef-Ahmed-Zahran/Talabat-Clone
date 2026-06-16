import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '@config/axios';
import { useUIStore } from '@store/uiStore';
import { useAuthStore } from '@store/authStore';
import { useLocationStore } from '@store/locationStore';
import * as Location from 'expo-location';
import { connectSocket, dispatchSocket } from '@config/socket';
import { getErrorMessage } from '@utils/error';
import { HOME_KEYS } from '@features/home/api/home.api';

export const useOnlineToggle = () => {
  const isOnline = useUIStore((s) => s.isOnline);
  const setOnline = useUIStore((s) => s.setOnline);
  const qc = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (coords: { latitude: number; longitude: number } | null) => {
      // Always send coords — backend ignores them when going OFFLINE
      const res = await api.patch('/drivers/toggle-online', coords ?? {});
      return res.data.data as { isOnline: boolean; status: string };
    },
  });

  const toggle = useCallback(async () => {
    try {
      // Read latest GPS position from the location store
      const { currentLatitude, currentLongitude } = useLocationStore.getState();

      let lat = currentLatitude;
      let lng = currentLongitude;

      // If going online, require a valid GPS fix
      if (!isOnline) {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Location permission is required to go online.');
            return;
          }
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          lat = location.coords.latitude;
          lng = location.coords.longitude;
          useLocationStore.getState().setCurrentPosition(lat, lng, location.coords.heading ?? 0);
        } catch (e) {
          Alert.alert(
            'Location Required',
            'We could not detect your current location. Please enable GPS and try again.'
          );
          return;
        }
      }

      const coords =
        !isOnline && lat !== null && lng !== null
          ? { latitude: lat, longitude: lng }
          : null;

      const result = await mutateAsync(coords);
      const next = result.isOnline;
      setOnline(next);

      // Persist the updated driver status to authStore and AsyncStorage so it persists on restart
      const authStore = useAuthStore.getState();
      if (authStore.driver) {
        const updatedDriver = { ...authStore.driver, isOnline: next };
        useAuthStore.setState({ driver: updatedDriver });
        await AsyncStorage.setItem('driver_user', JSON.stringify(updatedDriver));
      }

      if (next) {
        // Connect to dispatch socket when going online
        await connectSocket(dispatchSocket);
        console.log('[OnlineToggle] Driver is ONLINE — dispatch socket connected');
      } else {
        dispatchSocket.disconnect();
        console.log('[OnlineToggle] Driver is OFFLINE — dispatch socket disconnected');
      }

      // Refresh profile/stats
      qc.invalidateQueries({ queryKey: HOME_KEYS.stats });
      qc.invalidateQueries({ queryKey: HOME_KEYS.profile });
    } catch (err) {
      const msg = getErrorMessage(err);
      // Show a specific, friendly alert for out-of-zone errors
      if (msg.toLowerCase().includes('outside your registered working zone')) {
        Alert.alert(
          '📍 Outside Working Zone',
          msg + '\n\nOnce you are in the correct zone, tap the button again to go online.',
          [{ text: 'Got it', style: 'default' }]
        );
      } else {
        Alert.alert('Error', msg);
      }
    }
  }, [isOnline, mutateAsync, setOnline, qc]);

  return {
    query: {},
    state: {
      isOnline,
    },
    modal: {},
    actions: {
      toggle,
      isPending,
    },
  };
};

