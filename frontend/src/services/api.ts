import {
  AnalysisResponse,
  AnalysisSummary,
  PresetItem,
  RegulatoryReferenceItem,
  MandateRecordInput,
  UserSubscriptionInput,
  ChatResponse,
  User,
  AuthResponse
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000/api/v1';

// Token Storage
const TOKEN_KEY = 'spashtmandate_token';
const USER_KEY = 'spashtmandate_user';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  const u = localStorage.getItem(USER_KEY);
  if (!u) return null;
  try {
    return JSON.parse(u);
  } catch {
    return null;
  }
}

export function setAuthSession(token: string, user: User): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuthSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function authHeaders(): Record<string, string> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// -------------------------------------------------------------
// Authentication Endpoints
// -------------------------------------------------------------
export async function signupUser(email: string, password: string, fullName: string = ''): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, full_name: fullName })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Registration failed' }));
    throw new Error(err.detail || 'Registration failed');
  }
  const data: AuthResponse = await res.json();
  setAuthSession(data.access_token, data.user);
  return data;
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Invalid email or password' }));
    throw new Error(err.detail || 'Login failed');
  }
  const data: AuthResponse = await res.json();
  setAuthSession(data.access_token, data.user);
  return data;
}

export async function logoutUser(): Promise<void> {
  const token = getStoredToken();
  if (token) {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: authHeaders()
    }).catch(() => {});
  }
  clearAuthSession();
}

export async function fetchCurrentUser(): Promise<User | null> {
  const token = getStoredToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: authHeaders()
    });
    if (!res.ok) {
      clearAuthSession();
      return null;
    }
    const user: User = await res.json();
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  } catch {
    return null;
  }
}

// -------------------------------------------------------------
// System & Reference Endpoints
// -------------------------------------------------------------
export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Backend health check failed');
  return res.json();
}

export async function fetchPresets(): Promise<PresetItem[]> {
  const res = await fetch(`${API_BASE}/presets`);
  if (!res.ok) throw new Error('Failed to load sample presets');
  return res.json();
}

export async function fetchRegulatoryReferences(): Promise<RegulatoryReferenceItem[]> {
  const res = await fetch(`${API_BASE}/regulatory-references`);
  if (!res.ok) throw new Error('Failed to load regulatory references');
  return res.json();
}

// -------------------------------------------------------------
// Analysis Workspace Endpoints (Protected)
// -------------------------------------------------------------
export async function analyzeSubscriptionUrl(
  url: string | null,
  mandateRecord?: MandateRecordInput,
  userSubscription?: UserSubscriptionInput,
  inputMode?: 'URL_ASSISTED' | 'MANUAL'
): Promise<AnalysisResponse> {
  const mode = inputMode || (url && url.trim().length > 0 ? 'URL_ASSISTED' : 'MANUAL');
  const res = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      url: url && url.trim().length > 0 ? url.trim() : null,
      input_mode: mode,
      mandate_record: mandateRecord || null,
      user_subscription: userSubscription || null
    })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Failed to analyze subscription' }));
    throw new Error(errorData.detail || 'Analysis request failed');
  }

  return res.json();
}

export async function verifyUserPlan(
  analysisId: string,
  userSubscription: UserSubscriptionInput
): Promise<AnalysisResponse> {
  const res = await fetch(`${API_BASE}/plans/verify`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      analysis_id: analysisId,
      user_subscription: userSubscription
    })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Failed to verify user plan' }));
    throw new Error(errorData.detail || 'Plan verification failed');
  }

  return res.json();
}

export async function sendAssistantChatMessage(
  analysisId: string,
  message: string,
  history: Array<{ role: string; content: string }> = []
): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/assistant/chat`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      analysis_id: analysisId,
      message,
      history
    })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'AI Assistant query failed' }));
    throw new Error(errorData.detail || 'Assistant query failed');
  }

  return res.json();
}

export async function fetchAnalysesHistory(): Promise<AnalysisSummary[]> {
  const res = await fetch(`${API_BASE}/analyses`, {
    headers: authHeaders()
  });
  if (!res.ok) {
    if (res.status === 401) {
      clearAuthSession();
      throw new Error('Session expired. Please sign in again.');
    }
    throw new Error('Failed to load analyses history');
  }
  return res.json();
}

export async function fetchAnalysisById(id: string): Promise<AnalysisResponse> {
  const res = await fetch(`${API_BASE}/analyses/${id}`, {
    headers: authHeaders()
  });
  if (!res.ok) throw new Error(`Failed to load analysis record ${id}`);
  return res.json();
}

export async function deleteAnalysisById(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/analyses/${id}`, {
    method: 'DELETE',
    headers: authHeaders()
  });
  if (!res.ok) throw new Error(`Failed to delete analysis record ${id}`);
}

export function getPdfDownloadUrl(analysisId: string): string {
  const token = getStoredToken();
  const tokenQuery = token ? `?token=${encodeURIComponent(token)}` : '';
  return `${API_BASE}/analyses/${analysisId}/pdf${tokenQuery}`;
}
