/**
 * Google Play in-app purchase handler
 * Manages scan purchase flow with react-native-iap
 */

import * as RNIap from 'react-native-iap';
import { ErrorCode } from 'react-native-iap';
import { Platform } from 'react-native';
import { API_BASE_URL } from '@/constants/api';
import { authenticatedFetch } from './authFetch';

// Product IDs (must match backend configuration)
const PRODUCT_IDS = [
  'com.icalorie.tokens.5',
  'com.icalorie.tokens.15',
  'com.icalorie.tokens.50',
];

let iapInitialized = false;

/**
 * Initialize IAP connection
 */
export async function initializeIAP(): Promise<void> {
  if (iapInitialized) return;

  try {
    await RNIap.initConnection();
    iapInitialized = true;
    console.log('✅ IAP initialized');

    // Set up purchase update listener
    RNIap.purchaseUpdatedListener(handlePurchaseUpdate);

    // Set up purchase error listener
    RNIap.purchaseErrorListener(handlePurchaseError);
  } catch (error) {
    console.error('❌ IAP initialization failed:', error);
    throw error;
  }
}

/**
 * Get available products from store
 */
export async function getProducts(): Promise<RNIap.Product[]> {
  try {
    await initializeIAP();

    if (Platform.OS === 'android') {
      const result = await RNIap.fetchProducts({ skus: PRODUCT_IDS });
      // fetchProducts returns Product[] for in-app products (default type)
      // Filter out any null and ensure we have Product[] type
      if (!result) return [];
      return result as RNIap.Product[];
    } else {
      // iOS support can be added later
      return [];
    }
  } catch (error) {
    console.error('❌ Failed to get products:', error);
    throw error;
  }
}

/**
 * Purchase a token package
 */
export async function purchaseProduct(productId: string): Promise<void> {
  try {
    await initializeIAP();

    if (Platform.OS === 'android') {
      await RNIap.requestPurchase({
        type: 'in-app',
        request: {
          google: {
            skus: [productId],
          },
        },
      });
    } else {
      throw new Error('iOS purchases not yet implemented');
    }
  } catch (error: any) {
    if (error.code === ErrorCode.UserCancelled) {
      throw new Error('Purchase cancelled');
    }
    console.error('❌ Purchase failed:', error);
    throw error;
  }
}

/**
 * Handle successful purchase
 */
async function handlePurchaseUpdate(purchase: RNIap.Purchase): Promise<void> {
  const { productId, purchaseToken } = purchase;

  if (!purchaseToken) {
    console.error('No purchase token received');
    return;
  }

  try {
    // Verify purchase with backend
    const response = await authenticatedFetch(
      `${API_BASE_URL}/auth/tokens/verify-android-purchase`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchase_token: purchaseToken,
          product_id: productId,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Verification failed');
    }

    // Finish the transaction
    await RNIap.finishTransaction({ purchase, isConsumable: true });

    console.log('✅ Purchase successful and verified');
  } catch (error) {
    console.error('❌ Purchase verification failed:', error);
    // Don't finish transaction if verification failed
    throw error;
  }
}

/**
 * Handle purchase errors
 */
function handlePurchaseError(error: RNIap.PurchaseError): void {
  console.warn('Purchase error:', error);

  if (error.code === ErrorCode.UserCancelled) {
    // User cancelled, no action needed
    return;
  }

  // Log other errors for debugging
  console.error('IAP Error:', error);
}

/**
 * Cleanup IAP connection
 */
export async function endIAPConnection(): Promise<void> {
  if (iapInitialized) {
    await RNIap.endConnection();
    iapInitialized = false;
    console.log('IAP connection closed');
  }
}
