import { useCallback, useEffect, useRef, useState } from 'react';

export const STATUS_URL = 'https://api.squeekchain.com/v1/status';
export const POLL_MS = 10_000;
export type WheelStatus = {
  mode: 'checking' | 'live' | 'local'; running: boolean;
  detail: string; checkedAt: number | null; expiresAt: number | null;
};
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;
const timestamp = (value: unknown) => typeof value === 'string' ? Date.parse(value) : NaN;
export function localStatus(detail: string, checkedAt = Date.now()): WheelStatus {
  return { mode: 'local', running: false, detail, checkedAt, expiresAt: null };
}

// Fail closed. Never infer hardware activity from a truthy string or stale cached RPM.
export function parseWheelStatus(payload: unknown, now = Date.now()): WheelStatus {
  if (!isRecord(payload) || payload.schemaVersion !== 1 || !isRecord(payload.measurement))
    return localStatus('The wheel response is unsupported.', now);
  const m = payload.measurement;
  if (m.provenance !== 'hardware') return localStatus('The reading is not hardware-sourced.', now);
  if (m.freshness !== 'online') return localStatus('The wheel reading is offline or stale.', now);
  if (!isRecord(payload.oracle) || payload.oracle.state !== 'accepted' || !isRecord(payload.signer))
    return localStatus('The API has not verified this reading.', now);
  const staleSeconds = typeof m.staleAfterSeconds === 'number' && Number.isFinite(m.staleAfterSeconds)
    ? Math.min(120, Math.max(0, m.staleAfterSeconds)) : 0;
  const observed = timestamp(m.observedAt), generated = timestamp(payload.generatedAt);
  const verified = timestamp(payload.signer.lastVerifiedAt);
  const maxAge = staleSeconds * 1000;
  const fresh = (t: number) => Number.isFinite(t) && t <= now + 15_000 && now - t <= maxAge;
  if (maxAge <= 0 || !fresh(observed) || !fresh(generated) || !fresh(verified))
    return localStatus('The wheel reading has expired.', now);
  if (typeof m.rpmMilli !== 'number' || !Number.isFinite(m.rpmMilli) || m.rpmMilli < 0)
    return localStatus('The wheel speed is unsupported.', now);
  const active = m.coreStatus === 'ACTIVE' && m.rpmMilli > 0;
  const idle = m.coreStatus === 'IDLE' && m.rpmMilli === 0;
  if (!active && !idle) return localStatus('The wheel reports a fault or inconsistent status.', now);
  return { mode: 'live', running: active, checkedAt: now,
    expiresAt: Math.min(observed, generated, verified) + maxAge,
    detail: active ? 'Fresh hardware data reports a running wheel.' : 'Fresh hardware data reports a resting wheel.' };
}

export function useWheel() {
  const [status, setStatus] = useState<WheelStatus>({ mode: 'checking', running: false, detail: 'Connecting to Squeekchain…', checkedAt: null, expiresAt: null });
  const request = useRef<AbortController | null>(null);
  const active = useRef(true);
  const check = useCallback(async () => {
    if (request.current) return;
    const controller = new AbortController(); request.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 6000);
    try {
      const response = await fetch(STATUS_URL, { signal: controller.signal, cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = parseWheelStatus(await response.json());
      if (active.current) setStatus(result);
    } catch {
      if (active.current) setStatus(localStatus('The wheel service is unavailable. The game still works.'));
    } finally { clearTimeout(timeout); if (request.current === controller) request.current = null; }
  }, []);
  useEffect(() => {
    active.current = true; void check();
    const interval = window.setInterval(() => { void check(); }, POLL_MS);
    return () => { active.current = false; clearInterval(interval); request.current?.abort(); request.current = null; };
  }, [check]);
  useEffect(() => {
    if (status.mode !== 'live' || status.expiresAt === null) return;
    const timeout = window.setTimeout(() => setStatus(localStatus('The last wheel reading has expired.')), Math.max(0, status.expiresAt - Date.now()));
    return () => clearTimeout(timeout);
  }, [status]);
  return { status, check };
}

export function isGoldenBonus(status: WheelStatus, elapsed: number): boolean {
  if (status.mode === 'live') return status.running && status.expiresAt !== null && Date.now() < status.expiresAt;
  return status.mode === 'local' && elapsed % 30 < 12;
}
