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
      analyze: (id: string) => request(`/api/trades/${id}/analyze`, { method: "POST" }),
    },

    signals: {
      today: () => request("/api/signals"),
      generate: () => request("/api/signals", { method: "POST" }),
    },

    analytics: {
      overview: () => request("/api/analytics"),
      timePerformance: () => request("/api/analytics/time-performance"),
      edge: (zile = 365) => request(`/api/analytics/edge?days=${zile}`),
      monteCarlo: (zile = 365) => request(`/api/analytics/montecarlo?days=${zile}`),
    },

    /** Jurnalul: aceeași interogare ca pagina web, expusă ca date. */
    journal: {
      list: () => request("/api/journal"),
      get: (tradeId: string) => request(`/api/trades/${tradeId}/journal`),
      save: (tradeId: string, data: unknown) =>
        request(`/api/trades/${tradeId}/journal`, { method: "PUT", body: json(data) }),
    },

    tradingRules: {
      update: (data: unknown) =>
        request("/api/user/trading-rules", { method: "PATCH", body: json(data) }),
    },

    charts: {
      candles: (symbol: string, tf: string) =>
        request(`/api/charts/candles?symbol=${encodeURIComponent(symbol)}&tf=${tf}`),
      /** `cuSold` aduce și soldul contului activ — o interogare în plus, cerută explicit. */
      quote: (symbol: string, cuSold = false) =>
        request(
          `/api/charts/quote?symbol=${encodeURIComponent(symbol)}${cuSold ? "&withBalance=1" : ""}`,
        ),
      trades: (symbol: string, from: number, to: number) =>
        request(
          `/api/charts/trades?symbol=${encodeURIComponent(symbol)}&from=${from}&to=${to}`,
        ),
      analyze: (data: unknown) =>
        request("/api/charts/analyze", { method: "POST", body: json(data) }),
    },

    market: {
      correlations: () => request("/api/market/correlations"),
      pulse: () => request("/api/nav/pulse"),
      /** Cotații pentru mai multe perechi deodată, cu variația zilei. */
      cotatii: (simboluri: string[]) =>
        request(
          `/api/integrations/twelvedata/quote?symbols=${encodeURIComponent(simboluri.join(","))}`,
        ),
    },

    watchlist: {
      list: () => request("/api/watchlist"),
      add: (data: unknown) => request("/api/watchlist", { method: "POST", body: json(data) }),
      remove: (id: string) => request(`/api/watchlist/${id}`, { method: "DELETE" }),
    },

    /** Vederea instituțională: aceeași funcție ca pagina web, ca date. */
    institutional: () => request("/api/institutional"),

    riskManager: () => request("/api/risk-manager"),

    gamification: () => request("/api/gamification"),

    academy: {
      progress: () => request("/api/academy/progress"),
      saveProgress: (data: unknown) =>
        request("/api/academy/progress", { method: "PUT", body: json(data) }),
      tutor: (data: unknown) =>
        request("/api/academy/tutor", { method: "POST", body: json(data) }),
    },

    community: {
      posts: (page = 1) => request(`/api/community/posts?page=${page}`),
      createPost: (data: unknown) =>
        request("/api/community/posts", { method: "POST", body: json(data) }),
      react: (id: string, data: unknown) =>
        request(`/api/community/posts/${id}/react`, { method: "POST", body: json(data) }),
      teams: () => request("/api/community/teams"),
      joinByCode: (data: unknown) =>
        request("/api/community/teams/join-by-code", { method: "POST", body: json(data) }),
      leave: (id: string) =>
        request(`/api/community/teams/${id}/leave`, { method: "POST" }),
    },

    backtesting: {
      strategies: () => request("/api/backtesting/strategies"),
      get: (id: string) => request(`/api/backtesting/${id}`),
      run: (data: unknown) => request("/api/backtesting/run", { method: "POST", body: json(data) }),
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
      markRead: (id: string) => request(`/api/alerts/${id}`, { method: "PATCH" }),
      remove: (id: string) => request(`/api/alerts/${id}`, { method: "DELETE" }),
    },

    calendar: (week: "last" | "this" | "next" = "this") => request(`/api/calendar?week=${week}`),
    news: () => request("/api/forex-news"),

    accounts: {
      list: () => request("/api/accounts"),
      active: () => request("/api/accounts/active"),
      /** `null` = vederea agregată pe toate conturile. */
      setActive: (accountId: string | null) =>
        request("/api/accounts/active", { method: "POST", body: json({ accountId }) }),
      refresh: () => request("/api/accounts/refresh", { method: "POST" }),
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
