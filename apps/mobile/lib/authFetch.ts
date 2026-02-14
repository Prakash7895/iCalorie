import { storage } from './storage';
import { router } from 'expo-router';

/**
 * Makes an authenticated fetch request and handles token expiration automatically.
 * If the request returns 401 Unauthorized, it clears auth data and navigates to login.
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await storage.getAuthToken();

  if (!token) {
    // No token available, redirect to login
    await handleAuthFailure();
    throw new Error('No authentication token');
  }

  // Add auth header to request
  const authHeaders = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
  };

  const response = await fetch(url, {
    ...options,
    headers: authHeaders,
  });

  // Check for authentication failure
  if (response.status === 401) {
    await handleAuthFailure();
    throw new Error('Authentication expired');
  }

  return response;
}

/**
 * Handles authentication failure by clearing storage and navigating to login
 */
async function handleAuthFailure() {
  console.log('Authentication expired or invalid, logging out...');
  await storage.clearAll();

  // Use replace to prevent going back to protected screens
  router.replace('/(auth)/login');
}
