export function auditLog(action: string, meta: Record<string, unknown>) {
  console.log(JSON.stringify({ audit: true, action, ...meta, ts: new Date().toISOString() }));
}
