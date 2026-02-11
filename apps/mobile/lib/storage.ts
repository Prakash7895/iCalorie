import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  AUTH_TOKEN: '@iCalorie:auth_token',
  USER_DATA: '@iCalorie:user_data',
  ONBOARDING_COMPLETE: '@iCalorie:onboarding_complete',
};

export const storage = {
  // Auth token
  async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(KEYS.AUTH_TOKEN);
    } catch {
      return null;
    }
  },

  async setAuthToken(token: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.AUTH_TOKEN, token);
  },

  async removeAuthToken(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.AUTH_TOKEN);
  },

  // User data
  async getUserData(): Promise<any | null> {
    try {
      const data = await AsyncStorage.getItem(KEYS.USER_DATA);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  async setUserData(data: any): Promise<void> {
    await AsyncStorage.setItem(KEYS.USER_DATA, JSON.stringify(data));
  },

  async removeUserData(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.USER_DATA);
  },

  // Onboarding
  async hasCompletedOnboarding(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(KEYS.ONBOARDING_COMPLETE);
      return value === 'true';
    } catch {
      return false;
    }
  },

  async setOnboardingComplete(): Promise<void> {
    await AsyncStorage.setItem(KEYS.ONBOARDING_COMPLETE, 'true');
  },

  // Clear all
  async clearAll(): Promise<void> {
    await AsyncStorage.multiRemove([
      KEYS.AUTH_TOKEN,
      KEYS.USER_DATA,
      KEYS.ONBOARDING_COMPLETE,
    ]);
  },
};
