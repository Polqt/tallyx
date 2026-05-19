import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, TextInputProps } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';

interface Props extends TextInputProps {
  icon: React.ReactNode;
  label: string;
  showToggle?: boolean;
  error?: string;
  prefix?: string;
  isBottomSheet?: boolean;
}

export function AuthInput({
  icon,
  label,
  showToggle,
  secureTextEntry,
  error,
  prefix,
  isBottomSheet,
  style,
  ...props
}: Props) {
  const [hidden, setHidden] = useState(secureTextEntry ?? false);
  const [focused, setFocused] = useState(false);

  const hasValue = typeof props.value === 'string' && props.value.length > 0;
  const elevated = focused || hasValue;
  const InputComponent = isBottomSheet ? BottomSheetTextInput : TextInput;

  return (
    <View>
      <View
        style={{
          borderWidth: focused ? 2 : 1.5,
          borderColor: error ? '#DC2626' : focused ? '#16A34A' : '#E5E7EB',
          borderRadius: 14,
          backgroundColor: focused ? '#ffffff' : '#F9FAFB',
          paddingHorizontal: 14,
          paddingTop: elevated ? 8 : 0,
          paddingBottom: elevated ? 4 : 0,
          minHeight: 58,
          justifyContent: 'center',
        }}
      >
        {elevated && (
          <Text
            style={{
              fontSize: 11,
              fontFamily: 'Geist_500Medium',
              color: error ? '#DC2626' : focused ? '#16A34A' : '#9CA3AF',
              marginBottom: 2,
            }}
          >
            {label}
          </Text>
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ opacity: focused ? 1 : 0.5 }}>{icon}</View>
          {prefix && (
            <Text style={{ fontSize: 15, fontFamily: 'Geist_400Regular', color: '#111827', marginRight: -4 }}>
              {prefix}
            </Text>
          )}
          <InputComponent
            style={{
              flex: 1,
              fontSize: 15,
              fontFamily: 'Geist_400Regular',
              color: '#111827',
              paddingVertical: 0,
            }}
            placeholder={elevated ? '' : label}
            placeholderTextColor="#9CA3AF"
            secureTextEntry={showToggle ? hidden : secureTextEntry}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            {...(props as any)}
          />
          {showToggle && (
            <TouchableOpacity
              onPress={() => setHidden((v) => !v)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              {hidden
                ? <EyeOff size={18} color="#9CA3AF" strokeWidth={2} />
                : <Eye size={18} color="#9CA3AF" strokeWidth={2} />
              }
            </TouchableOpacity>
          )}
        </View>
      </View>
      {error && (
        <Text
          style={{ fontSize: 12, fontFamily: 'Geist_400Regular', color: '#DC2626', marginTop: 4, marginLeft: 4 }}
        >
          {error}
        </Text>
      )}
    </View>
  );
}
