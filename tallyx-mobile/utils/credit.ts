import { Clock3, RefreshCw, ShieldCheck, WifiOff } from 'lucide-react-native';
import type { CreditStatus, CreditSyncStatus } from '@/features/credits/credit.types';

export const statusStyles: Record<CreditStatus, { label: string; bg: string; color: string }> = {
  pending: { label: 'Pending', bg: '#FFFBEB', color: '#B45309' },
  partial: { label: 'Partial', bg: '#EFF6FF', color: '#1D4ED8' },
  paid:    { label: 'Paid',    bg: '#F0FDF4', color: '#15803D' },
  overdue: { label: 'Overdue', bg: '#FEF2F2', color: '#B91C1C' },
  voided:  { label: 'Voided',  bg: '#F3F4F6', color: '#6B7280' },
};

export const syncStyles: Record<CreditSyncStatus, { label: string; color: string; Icon: typeof Clock3 }> = {
  local:   { label: 'Local only',      color: '#6B7280', Icon: Clock3 },
  pending: { label: 'Sync pending',    color: '#D97706', Icon: Clock3 },
  syncing: { label: 'Syncing...',      color: '#2563EB', Icon: RefreshCw },
  synced:  { label: 'On-chain synced', color: '#16A34A', Icon: ShieldCheck },
  failed:  { label: 'Sync failed',     color: '#DC2626', Icon: WifiOff },
};

export function parsePesoAmount(value: string): number {
  const parsed = Number(value.replace(/[^\d]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function parseDueDate(value: string): string | null | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const date = new Date(`${trimmed}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}
