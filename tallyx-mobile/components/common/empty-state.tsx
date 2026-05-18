import { View, Text } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

interface Props {
  icon: LucideIcon;
  title: string;
  subtitle: string;
}

export function EmptyState({ icon: Icon, title, subtitle }: Props) {
  return (
    <View style={{
      backgroundColor: '#F9FAFB', borderRadius: 18, borderWidth: 1,
      borderColor: '#F3F4F6', padding: 24, alignItems: 'center', gap: 8,
    }}>
      <View style={{
        width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFFFFF',
        alignItems: 'center', justifyContent: 'center', marginBottom: 4,
      }}>
        <Icon size={22} color="#D1D5DB" strokeWidth={2} />
      </View>
      <Text style={{ fontFamily: 'Geist_600SemiBold', fontSize: 14, color: '#374151' }}>
        {title}
      </Text>
      <Text style={{ fontFamily: 'Geist_400Regular', fontSize: 13, color: '#9CA3AF', textAlign: 'center', lineHeight: 20 }}>
        {subtitle}
      </Text>
    </View>
  );
}
