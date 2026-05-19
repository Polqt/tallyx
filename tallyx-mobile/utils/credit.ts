import { Clock3, ShieldCheck, WifiOff } from 'lucide-react-native';
import type { CreditStatus, CreditSyncStatus } from '@/features/credits/credit.types';

export const statusStyles: Record<CreditStatus, { label: string; bg: string; text: string }> = {
  pending: { label: 'Pending', bg: 'bg-amber-50', text: 'text-amber-700' },
  partial: { label: 'Partial', bg: 'bg-blue-50', text: 'text-blue-700' },
  paid: { label: 'Paid', bg: 'bg-green-50', text: 'text-green-700' },
  overdue: { label: 'Overdue', bg: 'bg-red-50', text: 'text-red-700' },
};

export const syncStyles: Record<CreditSyncStatus, { label: string; color: string; Icon: typeof Clock3 }> = {
  pending: { label: 'Sync pending', color: '#D97706', Icon: Clock3 },
  synced: { label: 'On-chain synced', color: '#16A34A', Icon: ShieldCheck },
  failed: { label: 'Sync failed', color: '#DC2626', Icon: WifiOff },
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
