import { NextRequest, NextResponse } from 'next/server';

const MAX_EVENTS = 2000;
const DEFAULT_WINDOW_MINUTES = 60;
const DEFAULT_RECENT_LIMIT = 40;
const DEFAULT_SLOW_THRESHOLD_MS = 1200;

export interface ApiTelemetryEvent {
  timestamp: number;
  route: string;
  method: string;
  status: number;
  durationMs: number;
  requestId: string;
  error?: string;
}

export interface ApiTelemetryAggregate {
  requests: number;
  errors: number;
  errorRate: number;
  avgMs: number;
  p50Ms: number;
  p95Ms: number;
  maxMs: number;
  slowRequests: number;
}

export interface ApiTelemetryRouteMetric extends ApiTelemetryAggregate {
  route: string;
  method: string;
  lastStatus: number | null;
  lastSeenAt: string | null;
}

export interface ApiTelemetrySnapshot {
  generatedAt: string;
  uptimeMs: number;
  totals: ApiTelemetryAggregate;
  routes: ApiTelemetryRouteMetric[];
  recent: ApiTelemetryEvent[];
  telemetryEnabled: boolean;
  slowThresholdMs: number;
}

interface ApiTelemetryStore {
  startedAt: number;
  events: ApiTelemetryEvent[];
}

interface SnapshotOptions {
  windowMinutes?: number;
  limit?: number;
  route?: string;
}

interface EventInput {
  route: string;
  method: string;
  status: number;
  durationMs: number;
  requestId: string;
  error?: string;
}

type ApiRouteHandler<TContext = unknown> = (
  request: NextRequest,
  context?: TContext
) => Promise<Response> | Response;

const globalStore = globalThis as typeof globalThis & {
  __apiTelemetryStore?: ApiTelemetryStore;
};

function parseBooleanEnv(value: string | undefined, defaultValue: boolean): boolean {
  if (value == null || value === '') return defaultValue;
  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return defaultValue;
}

function getSlowThresholdMs(): number {
  const raw = Number.parseInt(process.env.API_TELEMETRY_SLOW_MS || '', 10);
  if (!Number.isFinite(raw) || raw <= 0) return DEFAULT_SLOW_THRESHOLD_MS;
  return raw;
}

function isTelemetryEnabled(): boolean {
  return parseBooleanEnv(process.env.API_TELEMETRY_ENABLED, true);
}

function getStore(): ApiTelemetryStore {
  if (!globalStore.__apiTelemetryStore) {
    globalStore.__apiTelemetryStore = {
      startedAt: Date.now(),
      events: [],
    };
  }
  return globalStore.__apiTelemetryStore;
}

function nowMs(): number {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }
  return Date.now();
}

function safeRequestId(request: NextRequest): string {
  const incoming = request.headers?.get?.('x-request-id')?.trim();
  if (incoming) return incoming;
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function toResponseWithTelemetryHeaders(response: Response, headersToSet: Record<string, string>): NextResponse {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(headersToSet)) {
    headers.set(key, value);
  }
  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function round2(value: number): number {
  return Number(value.toFixed(2));
}

function percentile(sortedValues: number[], q: number): number {
  if (sortedValues.length === 0) return 0;
  if (sortedValues.length === 1) return sortedValues[0];
  const index = (sortedValues.length - 1) * q;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sortedValues[lower];
  const weight = index - lower;
  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
}

function aggregate(events: ApiTelemetryEvent[], slowThresholdMs: number): ApiTelemetryAggregate {
  if (events.length === 0) {
    return {
      requests: 0,
      errors: 0,
      errorRate: 0,
      avgMs: 0,
      p50Ms: 0,
      p95Ms: 0,
      maxMs: 0,
      slowRequests: 0,
    };
  }

  const durations = events.map((event) => event.durationMs).sort((a, b) => a - b);
  const totalMs = durations.reduce((acc, value) => acc + value, 0);
  const errors = events.filter((event) => event.status >= 500).length;
  const slowRequests = events.filter((event) => event.durationMs >= slowThresholdMs).length;

  return {
    requests: events.length,
    errors,
    errorRate: round2((errors / events.length) * 100),
    avgMs: round2(totalMs / events.length),
    p50Ms: round2(percentile(durations, 0.5)),
    p95Ms: round2(percentile(durations, 0.95)),
    maxMs: round2(durations[durations.length - 1]),
    slowRequests,
  };
}

function record(event: EventInput): void {
  if (!isTelemetryEnabled()) return;

  const store = getStore();
  const stored: ApiTelemetryEvent = {
    ...event,
    timestamp: Date.now(),
  };

  store.events.push(stored);
  if (store.events.length > MAX_EVENTS) {
    store.events.splice(0, store.events.length - MAX_EVENTS);
  }

  const roundedMs = round2(stored.durationMs);
  if (stored.status >= 500) {
    console.error(
      `[API][ERROR] ${stored.method} ${stored.route} ${stored.status} ${roundedMs}ms`,
      stored.error ? { requestId: stored.requestId, error: stored.error } : { requestId: stored.requestId }
    );
    return;
  }

  if (stored.durationMs >= getSlowThresholdMs()) {
    console.warn(`[API][SLOW] ${stored.method} ${stored.route} ${stored.status} ${roundedMs}ms`, {
      requestId: stored.requestId,
    });
  }
}

export function withApiTelemetry<TContext = unknown>(
  route: string,
  handler: ApiRouteHandler<TContext>
): ApiRouteHandler<TContext> {
  return async (request: NextRequest, context?: TContext): Promise<Response> => {
    const requestId = safeRequestId(request);
    const startedAt = nowMs();

    try {
      const response = await handler(request, context);
      const durationMs = nowMs() - startedAt;
      const method = request.method?.toUpperCase?.() || 'GET';

      record({
        route,
        method,
        status: response.status,
        durationMs,
        requestId,
      });

      return toResponseWithTelemetryHeaders(response, {
        'x-request-id': requestId,
        'x-response-time-ms': round2(durationMs).toString(),
        'server-timing': `app;dur=${round2(durationMs)}`,
      });
    } catch (error) {
      const durationMs = nowMs() - startedAt;
      const method = request.method?.toUpperCase?.() || 'GET';
      const errorMessage = error instanceof Error ? error.message : 'Unknown API error';

      record({
        route,
        method,
        status: 500,
        durationMs,
        requestId,
        error: errorMessage,
      });

      throw error;
    }
  };
}

export function getApiTelemetrySnapshot(options: SnapshotOptions = {}): ApiTelemetrySnapshot {
  const store = getStore();
  const windowMinutes =
    Number.isFinite(options.windowMinutes) && (options.windowMinutes as number) > 0
      ? Math.min(Math.floor(options.windowMinutes as number), 24 * 60)
      : DEFAULT_WINDOW_MINUTES;
  const recentLimit =
    Number.isFinite(options.limit) && (options.limit as number) > 0
      ? Math.min(Math.floor(options.limit as number), 200)
      : DEFAULT_RECENT_LIMIT;
  const slowThresholdMs = getSlowThresholdMs();
  const now = Date.now();
  const minTimestamp = now - windowMinutes * 60 * 1000;

  const filtered = store.events.filter((event) => {
    if (event.timestamp < minTimestamp) return false;
    if (options.route && event.route !== options.route) return false;
    return true;
  });

  const grouped = new Map<string, ApiTelemetryEvent[]>();
  for (const event of filtered) {
    const key = `${event.route}::${event.method}`;
    const bucket = grouped.get(key) || [];
    bucket.push(event);
    grouped.set(key, bucket);
  }

  const routes: ApiTelemetryRouteMetric[] = [...grouped.entries()]
    .map(([key, events]) => {
      const [route, method] = key.split('::');
      const stats = aggregate(events, slowThresholdMs);
      const last = events.reduce((acc, current) => (current.timestamp > acc.timestamp ? current : acc), events[0]);

      return {
        route,
        method,
        ...stats,
        lastStatus: last?.status ?? null,
        lastSeenAt: last ? new Date(last.timestamp).toISOString() : null,
      };
    })
    .sort((a, b) => {
      if (b.errors !== a.errors) return b.errors - a.errors;
      return b.requests - a.requests;
    });

  const recent = filtered
    .slice()
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, recentLimit);

  return {
    generatedAt: new Date().toISOString(),
    uptimeMs: now - store.startedAt,
    totals: aggregate(filtered, slowThresholdMs),
    routes,
    recent,
    telemetryEnabled: isTelemetryEnabled(),
    slowThresholdMs,
  };
}

export function resetApiTelemetryStoreForTests(): void {
  globalStore.__apiTelemetryStore = {
    startedAt: Date.now(),
    events: [],
  };
}
