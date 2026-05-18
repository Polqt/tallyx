import { ActivityIndicator, Text, TouchableOpacity } from 'react-native';

interface Props {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'green' | 'white';
}

export function AuthButton({ label, onPress, loading, disabled, variant = 'green' }: Props) {
  const isDisabled = disabled || loading;

  const bg = variant === 'white'
    ? (isDisabled ? 'rgba(255,255,255,0.35)' : '#ffffff')
    : (isDisabled ? '#86EFAC' : '#16A34A');

  const textColor = variant === 'white'
    ? (isDisabled ? 'rgba(255,255,255,0.5)' : '#15803D')
    : '#ffffff';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
      className="items-center justify-center rounded-full"
      style={{ height: 52, backgroundColor: bg }}
    >
      {loading
        ? <ActivityIndicator color={textColor} />
        : <Text style={{ color: textColor, fontSize: 16, fontFamily: 'Geist_600SemiBold' }}>{label}</Text>
      }
    </TouchableOpacity>
  );
}
