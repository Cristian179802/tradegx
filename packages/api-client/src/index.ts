// @tradegx/api-client — client REST tipat, partajat web + mobile.
// Web: same-origin + cookie (credentials:include). Mobile: baseUrl + Bearer token.
// SINGURUL loc unde sunt definite apelurile către API. Web și mobile îl folosesc identic.

export class ApiError extends Error {
  constructor(public status: number, message: string, public body?: unknown) {
    super(message);
    this.name = "ApiError";
  }
}

export interface ApiClientConfig {
  /** "" pe web (same-origin), "https://www.tradegx.com" pe mobile. */
  baseUrl?: string;
  /** Returnează JWT-ul (mobile). Pe web rămâne undefined → se folosește cookie-ul. */
  getToken?: () => string | null | Promise<string | null>;
  /** "include" pe web pentru cookie httpOnly. */
  credentials?: RequestCredentials;
  /**
   * Chemat o singură dată când o cerere ia 401. Dacă întoarce `true`, cererea
   * se repetă; altfel eroarea urcă neschimbată.
   *
   * DE CE AICI și nu în app: toate metodele de mai jos (`trades`, `analytics`…)
   * se închid peste `request`-ul de aici. Dacă reîncercarea ar sta în afara
   * clientului, ar prinde doar apelurile făcute manual prin `request` — restul
   * ar picat la primul token expirat. E exact greșeala pe care am făcut-o o
   * dată în `apps/mobile/src/lib/api.ts`.
   *
   * Pe mobile: reîmprospătează tokenul din secure-store. Pe web: nefolosit,
   * cookie-ul NextAuth se reînnoiește singur.
   */
  onUnauthorized?: () => boolean | Promise<boolean>;
}

export function createApiClient(config: ApiClientConfig = {}) {
  const baseUrl = config.baseUrl ?? "";

  async function oCerere<T>(path: string, opts: RequestInit): Promise<T> {
    const token = config.getToken ? await config.getToken() : null;
    const res = await fetch(`${baseUrl}${path}`, {
      ...opts,
      ...(config.credentials ? { credentials: config.credentials } : {}),
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(opts.headers ?? {}),
      },
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) {
      const msg = (data && (data.error || data.message)) || res.statusText;
      throw new ApiError(res.status, msg, data);
    }
    return data as T;
  }

  async function request<T = unknown>(path: string, opts: RequestInit = {}): Promise<T> {
    try {
      return await oCerere<T>(path, opts);
    } catch (e) {
      // O SINGURĂ reîncercare. Un 401 care persistă după reîmprospătare
      // înseamnă sesiune moartă; a insista ar fi o buclă.
      if (!config.onUnauthorized || !(e instanceof ApiError) || e.status !== 401) throw e;
      const potContinua = await config.onUnauthorized();
      if (!potContinua) throw e;
      return oCerere<T>(path, opts);
    }
  }

  const json = (body: unknown) => JSON.stringify(body);

  return {
    request,

    trades: {
      list: () => request("/api/trades"),
      get: (id: string) => request(`/api/trades/${id}`),
      create: (data: unknown) => request("/api/trades", { method: "POST", body: json(data) }),
      update: (id: string, data: unknown) => request(`/api/trades/${id}`, { method: "PATCH", body: json(data) }),
      remove: (id: string) => request(`/api/trades/${id}`, { method: "DELETE" }),
      replay: (id: string) => request(`/api/trades/${id}/replay`),
    },

    signals: {
      today: () => request("/api/signals"),
      generate: () => request("/api/signals", { method: "POST" }),
    },

    analytics: {
      overview: () => request("/api/analytics"),
      timePerformance: () => request("/api/analytics/time-performance"),
    },

    goals: {
      get: () => request("/api/user/goals"),
      update: (data: unknown) => request("/api/user/goals", { method: "PATCH", body: json(data) }),
    },

    propfirm: {
      list: () => request("/api/propfirm"),
      update: (data: unknown) => request("/api/propfirm", { method: "PATCH", body: json(data) }),
    },

    dailyReview: () => request("/api/daily-review"),

    /** Curba contului + rezultatul zilei, o singura interogare. */
    equitySpark: () => request("/api/equity/spark"),

    alerts: {
      list: () => request("/api/alerts"),
      markAllRead: () => request("/api/alerts", { method: "PATCH" }),
    },

    calendar: (week: "last" | "this" | "next" = "this") => request(`/api/calendar?week=${week}`),
    news: () => request("/api/forex-news"),

    accounts: {
      list: () => request("/api/accounts"),
    },

    push: {
      register: (token: string, platform?: string) =>
        request("/api/push/register", { method: "POST", body: json({ token, platform }) }),
      unregister: (token: string) =>
        request("/api/push/register", { method: "DELETE", body: json({ token }) }),
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
