import { API_BASE_URL } from '@/constants/api';
import { storage } from './storage';

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
};

export type LogRequest = {
  items: FoodItem[];
  total_calories?: number | null;
  photo_url?: string | null;
  created_at?: string;
};

async function getAuthHeaders(): Promise<HeadersInit> {
  const token = await storage.getAuthToken();
  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
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

  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/scan`, {
    method: 'POST',
    headers: authHeaders,
    body: form,
  });
  if (!res.ok) throw new Error(`Scan failed: ${res.status}`);
  return res.json();
}

export async function confirmScan(
  items: FoodItem[],
  photo_url?: string | null
): Promise<ScanResponse> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/scan/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
    body: JSON.stringify({ items, photo_url }),
  });
  if (!res.ok) throw new Error(`Confirm failed: ${res.status}`);
  return res.json();
}

export async function saveLog(payload: LogRequest) {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/log`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
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
  const authHeaders = await getAuthHeaders();
  const res = await fetch(url, {
    headers: authHeaders,
  });
  if (!res.ok) throw new Error(`Get log failed: ${res.status}`);
  return res.json();
}
