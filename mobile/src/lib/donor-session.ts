import AsyncStorage from '@react-native-async-storage/async-storage';

// Member 1 - remembers which donor is using this device.
// Works on phone (Expo Go) and web (uses localStorage under the hood).

const KEY = 'lifelink.donorId';

export const donorSession = {
  async get(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(KEY);
    } catch {
      return null;
    }
  },
  async save(donorId: string): Promise<void> {
    try {
      await AsyncStorage.setItem(KEY, donorId);
    } catch {
      // ignore: the app still works, the donor just has to register again next time
    }
  },
  async clear(): Promise<void> {
    try {
      await AsyncStorage.removeItem(KEY);
    } catch {
      // ignore
    }
  },
};
