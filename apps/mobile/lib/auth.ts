import { storage } from './storage';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export type User = {
  id: string;
  email: string;
  name?: string;
};

export type AuthResponse = {
  token: string;
  user: User;
};

export const auth = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: 'Login failed' }));
      throw new Error(error.detail || 'Login failed');
    }

    const data: AuthResponse = await response.json();

    // Store auth data
    await storage.setAuthToken(data.token);
    await storage.setUserData(data.user);

    return data;
  },

  async signup(
    email: string,
    password: string,
    name?: string
  ): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, name }),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: 'Signup failed' }));
      throw new Error(error.detail || 'Signup failed');
    }

    const data: AuthResponse = await response.json();

    // Store auth data
    await storage.setAuthToken(data.token);
    await storage.setUserData(data.user);

    return data;
  },

  async logout(): Promise<void> {
    await storage.removeAuthToken();
    await storage.removeUserData();
  },

  async getCurrentUser(): Promise<User | null> {
    const token = await storage.getAuthToken();
    if (!token) return null;

    try {
      const { authenticatedFetch } = await import('./authFetch');
      const response = await authenticatedFetch(`${API_BASE_URL}/auth/me`);

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch {
      // authenticatedFetch already handles logout on 401
      return null;
    }
  },

  async isAuthenticated(): Promise<boolean> {
    const token = await storage.getAuthToken();
    return !!token;
  },
};
