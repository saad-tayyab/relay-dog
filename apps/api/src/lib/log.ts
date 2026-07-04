// ─── Structured Logging ───

export interface LogEntry {
  level: 'info' | 'warn' | 'error';
  msg: string;
  [key: string]: unknown;
}

export function log(entry: LogEntry): void {
  process.stderr.write(`${JSON.stringify({ ...entry, timestamp: new Date().toISOString() })}\n`);
}
