import { storage } from './storage';

export type User = {
  id: string;
  email: string;
  name?: string;
};

export type AuthResponse = {
  token: string;
  user: User;
};

// Mock auth for now (replace with real API calls later)
export const auth = {
  async login(email: string, password: string): Promise<AuthResponse> {
    // TODO: Replace with actual API call to POST /auth/login
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate network delay

    // Mock response
    const mockResponse: AuthResponse = {
      token: 'mock_token_' + Date.now(),
      user: {
        id: '1',
        email,
        name: email.split('@')[0],
      },
    };

    await storage.setAuthToken(mockResponse.token);
    await storage.setUserData(mockResponse.user);

    return mockResponse;
  },

  async signup(
    email: string,
    password: string,
    name?: string
  ): Promise<AuthResponse> {
    // TODO: Replace with actual API call to POST /auth/signup
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate network delay

    // Mock response
    const mockResponse: AuthResponse = {
      token: 'mock_token_' + Date.now(),
      user: {
        id: '1',
        email,
        name: name || email.split('@')[0],
      },
    };

    await storage.setAuthToken(mockResponse.token);
    await storage.setUserData(mockResponse.user);

    return mockResponse;
  },

  async logout(): Promise<void> {
    await storage.removeAuthToken();
    await storage.removeUserData();
  },

  async getCurrentUser(): Promise<User | null> {
    const token = await storage.getAuthToken();
    if (!token) return null;

    return await storage.getUserData();
  },

  async isAuthenticated(): Promise<boolean> {
    const token = await storage.getAuthToken();
    return !!token;
  },
};
