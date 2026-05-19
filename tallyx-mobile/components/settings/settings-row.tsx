import { Switch, Text, TouchableOpacity, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

export type SettingsRightElement =
  | { type: 'chevron' }
  | { type: 'toggle'; value: boolean; onChange: (v: boolean) => void }
  | { type: 'value'; text: string }
  | { type: 'none' };

type Props = {
  icon: React.ComponentType<{ size: number; color: string; strokeWidth: number }>;
  label: string;
  labelColor?: string;
  right?: SettingsRightElement;
  onPress?: () => void;
};

export function SettingsRow({
  icon: Icon,
  label,
  labelColor = '#111827',
  right = { type: 'chevron' },
  onPress,
}: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.65 : 1}
      className="flex-row items-center px-5"
      style={{ paddingVertical: 13 }}
    >
      <Icon size={18} color="#9CA3AF" strokeWidth={1.8} />
      <View className="ml-3 flex-1">
        <View className="flex-row items-center justify-between">
          <Text style={{ fontSize: 15, color: labelColor }}>{label}</Text>
          {right.type === 'chevron' && (
            <ChevronRight size={16} color="#D1D5DB" strokeWidth={2} />
          )}
          {right.type === 'toggle' && (
            <Switch
              value={right.value}
              onValueChange={right.onChange}
              trackColor={{ false: '#E5E7EB', true: '#16A34A' }}
              thumbColor="#FFFFFF"
            />
          )}
          {right.type === 'value' && (
            <Text style={{ fontSize: 14, color: '#9CA3AF' }}>{right.text}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export function SettingsSectionLabel({ label }: { label: string }) {
  return (
    <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 4 }}>
      {label}
    </Text>
  );
}
