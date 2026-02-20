import { API_BASE_URL } from '@/constants/api';
export { API_BASE_URL };
import { authenticatedFetch } from './authFetch';

export type FoodItem = {
  name: string;
  grams?: number;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  confidence?: number;
};

export type ScanResponse = {
  items: FoodItem[];
  total_calories?: number;
  photo_url?: string | null;
  scans_remaining?: number;
  log_id?: number;
};

export type MealLog = {
  id: number;
  items: FoodItem[];
  total_calories: number;
  photo_url?: string | null;
  plate_size_cm?: number;
  created_at: string;
};

export type LogRequest = {
  items: FoodItem[];
  total_calories?: number | null;
  photo_url?: string | null;
  created_at?: string;
  plate_size_cm?: number;
};

export type TokenPackage = {
  product_id: string;
  scans: number;
  price_usd: number;
  savings_percent: number;
};

export type PricingInfo = {
  base_price_per_scan: number;
  packages: TokenPackage[];
};

async function handleResponse(res: Response, fallbackError: string) {
  if (!res.ok) {
    let errorMessage = `${fallbackError}: ${res.status}`;
    try {
      const data = await res.json();
      errorMessage = data.detail || data.message || errorMessage;
    } catch (e) {
      // Ignore JSON parse error
    }
    throw new Error(errorMessage);
  }
  return res.json();
}

export async function scanImage(
  imageUri: string,
  plateSizeCm?: number
): Promise<ScanResponse> {
  const form = new FormData();
  form.append('image', {
    uri: imageUri,
    name: 'meal.jpg',
    type: 'image/jpeg',
  } as unknown as Blob);
  if (plateSizeCm) {
    form.append('plate_size_cm', String(plateSizeCm));
  }

  const res = await authenticatedFetch(`${API_BASE_URL}/scan`, {
    method: 'POST',
    body: form,
  });
  return handleResponse(res, 'Scan failed');
}

export async function saveLog(payload: LogRequest) {
  const res = await authenticatedFetch(`${API_BASE_URL}/log`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return handleResponse(res, 'Log failed');
}

export async function deleteLog(id: number | string) {
  const res = await authenticatedFetch(`${API_BASE_URL}/log/${id}`, {
    method: 'DELETE',
  });
  return handleResponse(res, 'Delete log failed');
}

export async function getLog(date?: string) {
  const url = date
    ? `${API_BASE_URL}/log?date=${encodeURIComponent(date)}`
    : `${API_BASE_URL}/log`;
  const res = await authenticatedFetch(url);
  return handleResponse(res, 'Get log failed');
}

export async function getMealLog(id: number | string): Promise<MealLog> {
  const res = await authenticatedFetch(`${API_BASE_URL}/log/${id}`);
  return handleResponse(res, 'Get meal log failed');
}

export async function getSummary(): Promise<{
  summary: { date: string; total_calories: number }[];
}> {
  const res = await authenticatedFetch(`${API_BASE_URL}/log/summary`);
  return handleResponse(res, 'Get summary failed');
}

export type ScanBalance = {
  scans_remaining: number;
};

export async function getScanBalance(): Promise<ScanBalance> {
  const res = await authenticatedFetch(`${API_BASE_URL}/auth/tokens`);
  return handleResponse(res, 'Get scan balance failed');
}

export async function purchaseScans(amount: number): Promise<any> {
  const res = await authenticatedFetch(`${API_BASE_URL}/auth/tokens/purchase`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ amount }),
  });
  return handleResponse(res, 'Purchase scans failed');
}

export async function getScanPricing(): Promise<PricingInfo> {
  const res = await authenticatedFetch(`${API_BASE_URL}/auth/tokens/pricing`);
  return handleResponse(res, 'Get pricing failed');
}

export async function submitFeedback(message: string): Promise<any> {
  const res = await authenticatedFetch(`${API_BASE_URL}/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  });
  return handleResponse(res, 'Submit feedback failed');
}
