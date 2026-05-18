import { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Animated,
  TextInputProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, HelpCircle } from 'lucide-react-native';
import { haptics } from '@/utils/haptics';

interface Props extends Pick<TextInputProps, 'keyboardType' | 'autoCapitalize' | 'textContentType'> {
  stepNumber: number;
  totalSteps: number;
  headline: string;
  subtitle: string;
  placeholder: string;
  privacyNote: string;
  value: string;
  prefix?: string;
  onChangeText: (text: string) => void;
  onContinue: () => void;
  onBack: () => void;
  onSkip?: () => void;
}

export function SingleFocusScreen({
  stepNumber,
  totalSteps,
  headline,
  subtitle,
  placeholder,
  privacyNote,
  value,
  onChangeText,
  onContinue,
  onBack,
  onSkip,
  prefix,
  keyboardType,
  autoCapitalize,
  textContentType,
}: Props) {
  const insets = useSafeAreaInsets();
  const canContinue = value.trim().length > 0;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 340, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 340, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#ffffff' }}
      behavior="padding"
    >
      <View style={{ flex: 1, paddingTop: insets.top }}>

        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingTop: 12,
          height: 52,
        }}>
          {/* Back button */}
          <TouchableOpacity
            onPress={() => { haptics.light(); onBack(); }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}
          >
            <ChevronLeft size={22} color="#9CA3AF" strokeWidth={2} />
          </TouchableOpacity>

          {/* Progress pills */}
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
            {Array.from({ length: totalSteps }).map((_, i) => (
              <View
                key={i}
                style={{
                  width: 28,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: i < stepNumber ? '#16A34A' : '#E5E7EB',
                }}
              />
            ))}
          </View>

          <View style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            borderWidth: 1.5,
            borderColor: '#E5E7EB',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <HelpCircle size={16} color="#9CA3AF" strokeWidth={2} />
          </View>
        </View>

        <Animated.View
          style={{
            flex: 1,
            paddingHorizontal: 28,
            paddingTop: 40,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <Text style={{
            fontFamily: 'Geist_700Bold',
            fontSize: 28,
            color: '#111827',
            lineHeight: 36,
          }}>
            {headline}
          </Text>

          <Text style={{
            fontFamily: 'Geist_400Regular',
            fontSize: 14,
            color: '#6B7280',
            marginTop: 8,
            lineHeight: 22,
          }}>
            {subtitle}
          </Text>

          <View style={{ marginTop: 24, flexDirection: 'row', alignItems: 'center' }}>
            {prefix && (
              <Text style={{
                fontFamily: 'Geist_700Bold',
                fontSize: 28,
                color: '#111827',
                marginRight: 2,
              }}>
                {prefix}
              </Text>
            )}
            <TextInput
              value={value}
              onChangeText={onChangeText}
              placeholder={placeholder}
              placeholderTextColor="#D1D5DB"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={canContinue ? onContinue : undefined}
              keyboardType={keyboardType}
              autoCapitalize={autoCapitalize}
              textContentType={textContentType}
              style={{
                flex: 1,
                fontFamily: 'Geist_700Bold',
                fontSize: 28,
                color: '#111827',
                paddingVertical: 0,
                includeFontPadding: false,
              }}
            />
          </View>

          <Text style={{
            fontFamily: 'Geist_400Regular',
            fontSize: 12,
            color: '#9CA3AF',
            marginTop: 16,
            lineHeight: 18,
          }}>
            {privacyNote}
          </Text>
        </Animated.View>

      </View>

      <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 16, gap: 20 }}>
        <TouchableOpacity
          onPress={canContinue ? () => { haptics.medium(); onContinue(); } : undefined}
          activeOpacity={canContinue ? 0.85 : 1}
          style={{
            height: 52,
            borderRadius: 26,
            backgroundColor: canContinue ? '#16A34A' : '#86EFAC',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{
            fontFamily: 'Geist_600SemiBold',
            fontSize: 16,
            color: '#ffffff',
          }}>
            Continue
          </Text>
        </TouchableOpacity>
        {onSkip && (
          <TouchableOpacity
            onPress={() => { haptics.light(); onSkip(); }}
            activeOpacity={0.85}
            style={{
              height: 52,
              borderRadius: 26,
              borderWidth: 1.5,
              borderColor: '#16A34A',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontFamily: 'Geist_600SemiBold', fontSize: 16, color: '#16A34A' }}>
              Skip for now
            </Text>
          </TouchableOpacity>
        )}
      </View>

    </KeyboardAvoidingView>
  );
}
