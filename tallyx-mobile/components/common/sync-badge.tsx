import { View, Text } from 'react-native';
import { ShieldCheck, WifiOff, Clock3, HardDrive } from 'lucide-react-native';

export type SyncStatus = 'local' | 'pending' | 'syncing' | 'synced' | 'failed';

const config: Record<SyncStatus, { label: string; color: string; bg: string; Icon: React.ComponentType<{ size: number; color: string; strokeWidth?: number }> }> = {
  local:   { label: 'Local',   color: '#9CA3AF', bg: '#F3F4F6', Icon: HardDrive },
  pending: { label: 'Pending', color: '#D97706', bg: '#FFFBEB', Icon: Clock3 },
  syncing: { label: 'Syncing', color: '#2563EB', bg: '#EFF6FF', Icon: Clock3 },
  synced:  { label: 'Synced',  color: '#16A34A', bg: '#F0FDF4', Icon: ShieldCheck },
  failed:  { label: 'Failed',  color: '#DC2626', bg: '#FEF2F2', Icon: WifiOff },
};

export function SyncBadge({ status }: { status: SyncStatus }) {
  const { label, color, bg, Icon } = config[status] ?? config.local;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: bg, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 }}>
      <Icon size={9} color={color} strokeWidth={2.2} />
      <Text style={{ fontSize: 10, fontWeight: '600', color }}>{label}</Text>
    </View>
  );
}

export { config as syncConfig };
