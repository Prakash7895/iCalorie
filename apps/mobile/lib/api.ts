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
  if (!res.ok) throw new Error(`Scan failed: ${res.status}`);
  return res.json();
}

export async function saveLog(payload: LogRequest) {
  const res = await authenticatedFetch(`${API_BASE_URL}/log`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Log failed: ${res.status}`);
  return res.json();
}

export async function getLog(date?: string) {
  const url = date
    ? `${API_BASE_URL}/log?date=${encodeURIComponent(date)}`
    : `${API_BASE_URL}/log`;
  const res = await authenticatedFetch(url);
  if (!res.ok) throw new Error(`Get log failed: ${res.status}`);
  return res.json();
}

export async function getMealLog(id: number | string): Promise<MealLog> {
  const res = await authenticatedFetch(`${API_BASE_URL}/log/${id}`);
  if (!res.ok) throw new Error(`Get meal log failed: ${res.status}`);
  return res.json();
}

export async function getSummary(): Promise<{
  summary: { date: string; total_calories: number }[];
}> {
  const res = await authenticatedFetch(`${API_BASE_URL}/log/summary`);
  if (!res.ok) throw new Error(`Get summary failed: ${res.status}`);
  return res.json();
}

export type ScanBalance = {
  scans_remaining: number;
};

export async function getScanBalance(): Promise<ScanBalance> {
  const res = await authenticatedFetch(`${API_BASE_URL}/auth/tokens`);
  if (!res.ok) throw new Error(`Get scan balance failed: ${res.status}`);
  return res.json();
}

export async function purchaseScans(amount: number): Promise<any> {
  const res = await authenticatedFetch(`${API_BASE_URL}/auth/tokens/purchase`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ amount }),
  });
  if (!res.ok) throw new Error(`Purchase scans failed: ${res.status}`);
  return res.json();
}

export async function getScanPricing(): Promise<PricingInfo> {
  const res = await authenticatedFetch(`${API_BASE_URL}/auth/tokens/pricing`);
  if (!res.ok) throw new Error(`Get pricing failed: ${res.status}`);
  return res.json();
}
