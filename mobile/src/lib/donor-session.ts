import AsyncStorage from '@react-native-async-storage/async-storage';

// Member 1 - remembers which donor is using this device.
// Works on phone (Expo Go) and web (uses localStorage under the hood).

const KEY = 'lifelink.donorId';
const TOKEN_KEY = 'lifelink.authToken';
const ROLE_KEY = 'lifelink.role';

export const donorSession = {
  async get(): Promise<string | null> {
    return AsyncStorage.getItem(KEY);
  },
  async save(donorId: string): Promise<void> {
    if (!donorId.trim()) {
      throw new Error('Cannot save an empty donor session.');
    }

    await AsyncStorage.setItem(KEY, donorId);

    const savedDonorId = await AsyncStorage.getItem(KEY);
    if (savedDonorId !== donorId) {
      throw new Error('The donor session could not be saved on this device.');
    }
  },
  async saveSession(userId: string, token: string, role = 'donor'): Promise<void> {
    if (!userId.trim() || !token.trim() || !role.trim()) {
      throw new Error('Cannot save an empty donor session.');
    }
    await AsyncStorage.multiSet([[KEY, userId], [TOKEN_KEY, token], [ROLE_KEY, role]]);
    const values = await AsyncStorage.multiGet([KEY, TOKEN_KEY, ROLE_KEY]);
    if (values[0][1] !== userId || values[1][1] !== token || values[2][1] !== role) {
      throw new Error('The donor session could not be saved on this device.');
    }
  },
  async getToken(): Promise<string | null> {
    return AsyncStorage.getItem(TOKEN_KEY);
  },
  async getRole(): Promise<string | null> {
    return AsyncStorage.getItem(ROLE_KEY);
  },
  async clear(): Promise<void> {
    await AsyncStorage.multiRemove([KEY, TOKEN_KEY, ROLE_KEY]);
  },
};
