import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  CancelTokenSource,
} from "axios";

export type ApiResponse<T> = {
  data: T;
  status: number;
  headers: Record<string, any>;
};

export type ApiError = {
  message: string;
  status?: number;
  data?: any;
  isNetworkError?: boolean;
  isCanceled?: boolean;
  original?: unknown;
};

const DEFAULT_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || "";

let authToken: string | null = null;

const client: AxiosInstance = axios.create({
  baseURL: DEFAULT_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 30000,
});

client.interceptors.request.use((cfg) => {
  const headers = (cfg.headers as any) || {};
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }
  cfg.headers = headers;
  return cfg;
});

client.interceptors.response.use(
  (r) => r,
  (err) => {
    return Promise.reject(err);
  }
);

function normalizeError(err: unknown): ApiError {
  if (axios.isAxiosError(err)) {
    const aErr = err as AxiosError;
    const isCanceled = aErr.code === "ERR_CANCELED" || axios.isCancel(aErr);
    const isNetwork = !aErr.response;
    return {
      message: aErr.message || "Request failed",
      status: aErr.response?.status,
      data: aErr.response?.data,
      isNetworkError: isNetwork,
      isCanceled,
      original: aErr,
    };
  }

  return {
    message: (err && typeof err === "object" && (err as any).message) || String(err),
    original: err,
  };
}

export async function request<T = any>(
  cfg: AxiosRequestConfig
): Promise<ApiResponse<T> | ApiError> {
  try {
    const res: AxiosResponse<T> = await client.request<T>(cfg);
    return { data: res.data, status: res.status, headers: res.headers };
  } catch (e) {
    return normalizeError(e);
  }
}

export const http = {
  get: async <T = any>(url: string, cfg?: AxiosRequestConfig) =>
    request<T>({ ...(cfg || {}), url, method: "GET" }),
  post: async <T = any, B = any>(url: string, body?: B, cfg?: AxiosRequestConfig) =>
    request<T>({ ...(cfg || {}), url, method: "POST", data: body }),
  put: async <T = any, B = any>(url: string, body?: B, cfg?: AxiosRequestConfig) =>
    request<T>({ ...(cfg || {}), url, method: "PUT", data: body }),
  patch: async <T = any, B = any>(url: string, body?: B, cfg?: AxiosRequestConfig) =>
    request<T>({ ...(cfg || {}), url, method: "PATCH", data: body }),
  delete: async <T = any>(url: string, cfg?: AxiosRequestConfig) =>
    request<T>({ ...(cfg || {}), url, method: "DELETE" }),
  createCancelToken: (): CancelTokenSource => axios.CancelToken.source(),
};

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    client.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete client.defaults.headers.common["Authorization"];
  }
}

export function getAuthToken() {
  return authToken;
}

export function getClientInstance() {
  return client;
}

export default http;
