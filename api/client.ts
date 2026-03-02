import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";

// ── Generic API response shapes ───────────────────────────────────────────────

/**
 * Represents a normalised successful API payload.
 * Services unwrap the raw axios response and return only `data`.
 */
export interface ApiSuccessResponse<T = unknown> {
  data: T;
  status: number;
}

/**
 * Normalised error shape thrown by the response interceptor.
 * Consumers can rely on `error` for a human-readable message and
 * `status` for HTTP status code handling.
 */
export interface ApiErrorResponse {
  error: string;
  code?: string;
  status: number;
}

// ── Raw server error body ─────────────────────────────────────────────────────

interface ServerErrorBody {
  error?: string;
  code?: string;
  message?: string;
}

// ── Create axios instance ─────────────────────────────────────────────────────

const apiClient: AxiosInstance = axios.create({
  /**
   * Empty baseURL means all paths are relative to the current origin.
   * Services prefix their paths with "/api/…" so this works for both
   * development (localhost:3000) and production.
   */
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
  /** 30-second hard timeout — streaming endpoints bypass this via fetch */
  timeout: 30_000,
  /** Include session cookies on every request automatically */
  withCredentials: true,
});

// ── Request interceptor ───────────────────────────────────────────────────────

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Next-Auth session cookies are sent automatically via `withCredentials`.
    // Extend this hook if you ever need to inject custom auth headers (e.g. JWT).
    return config;
  },
  (error: unknown) => Promise.reject(error)
);

// ── Response interceptor ──────────────────────────────────────────────────────

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<ServerErrorBody>) => {
    const status = error.response?.status ?? 500;

    const message =
      error.response?.data?.error ??
      error.response?.data?.message ??
      error.message ??
      "An unexpected error occurred.";

    const code = error.response?.data?.code;

    const apiError: ApiErrorResponse = { error: message, code, status };

    // Re-throw as a plain object so consumers can do:
    //   catch (e) { const err = e as ApiErrorResponse; ... }
    return Promise.reject(apiError);
  }
);

export default apiClient;

