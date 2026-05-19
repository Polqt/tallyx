import { useRef } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import * as MediaLibrary from 'expo-media-library';
import { router, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { CheckCircle2, ChevronLeft, Download, Landmark, Share2 } from 'lucide-react-native';
import ViewShot from 'react-native-view-shot';
import QRCode from 'react-native-qrcode-svg';
import { createCustomerQRData } from '@/lib/qr';
import { useStoreStore } from '@/stores/store.store';
import { haptics } from '@/utils/haptics';

function safeFileName(value: string) {
  return value.trim().replace(/[^a-z0-9-_]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'customer';
}

export default function QRScreen() {
  const insets = useSafeAreaInsets();
  const { id, name, qr } = useLocalSearchParams<{ id: string; name: string; qr?: string }>();
  const profile = useStoreStore((s) => s.profile);
  const storeName = profile?.name ?? 'My Store';
  const customerName = name ? decodeURIComponent(name) : 'Customer';

  const qrValue = qr
    ? decodeURIComponent(qr)
    : createCustomerQRData({ customerId: id, storeId: 'unknown' });

  const shareCardRef = useRef<ViewShot>(null);

  async function captureQrCard() {
    const imageUri = await shareCardRef.current?.capture?.();

    if (!imageUri) throw new Error('QR card is not ready.');
    return imageUri;
  }

  async function saveQrImageToGallery(imageUri: string) {
    try {
      await MediaLibrary.saveToLibraryAsync(imageUri);
    } catch {
      await MediaLibrary.createAssetAsync(imageUri);
    }
  }

  async function openImageShareFallback(imageUri: string) {
    if (!(await Sharing.isAvailableAsync())) return false;

    await Sharing.shareAsync(imageUri, {
      mimeType: 'image/png',
      dialogTitle: `Save QR for ${customerName}`,
    });
    return true;
  }

  async function handleShare() {
    haptics.medium();

    try {
      const imageUri = await captureQrCard();

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(imageUri, {
          mimeType: 'image/png',
          dialogTitle: `Share QR for ${customerName}`,
        });
        return;
      }

      await Clipboard.setStringAsync(qrValue);
      Alert.alert('Sharing unavailable', 'QR image sharing is unavailable on this device. Customer QR identity was copied instead.');
    } catch {
      await Clipboard.setStringAsync(qrValue);
      Alert.alert('Share failed', 'Unable to generate the QR image. Customer QR identity was copied instead.');
    }
  }

  async function handleDownload() {
    haptics.medium();

    let imageUri: string;

    try {
      imageUri = await captureQrCard();
    } catch {
      Alert.alert('Download failed', 'Unable to generate the QR image. Please restart Expo and try again.');
      return;
    }

    let permission: MediaLibrary.PermissionResponse;

    try {
      permission = await MediaLibrary.requestPermissionsAsync(false, ['photo']);
    } catch {
      try {
        if (await openImageShareFallback(imageUri)) return;
      } catch {
        // Expo Go on Android cannot request full media-library access; the image still exists in cache.
      }

      Alert.alert(
        'Use a development build',
        'Expo Go cannot save directly to the gallery on this Android version. The QR image was generated, but direct download needs a development build.'
      );
      return;
    }

    if (!permission.granted) {
      Alert.alert('Gallery permission needed', 'Allow photo access so Tallyx can save the customer QR image.');
      return;
    }

    try {
      await saveQrImageToGallery(imageUri);
      Alert.alert('QR saved', 'Customer QR image was saved to your device gallery.');
    } catch {
      try {
        if (await openImageShareFallback(imageUri)) return;
      } catch {
        // The image already exists in cache; if native sharing also fails, show one clear message.
      }

      Alert.alert('Save failed', 'QR image was generated, but your device did not allow saving it to the gallery.');
    }
  }

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center justify-between border-b border-gray-100 px-5 py-3.5">
        <TouchableOpacity
          onPress={() => {
            haptics.light();
            router.back();
          }}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          className="h-9 w-9 items-center justify-center rounded-full bg-gray-100"
        >
          <ChevronLeft size={20} color="#111827" strokeWidth={2.5} />
        </TouchableOpacity>
        <Text className="text-[17px] font-bold text-gray-900">Payment QR</Text>
        <View className="w-9" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          alignItems: 'center',
          paddingTop: 40,
          paddingHorizontal: 24,
          paddingBottom: 24,
        }}
      >
        <View
          className="w-full items-center rounded-[24px] bg-white p-8"
          style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 }}
        >
          <Text className="mb-1 text-[15px] font-bold text-gray-900">{storeName}</Text>
          <Text className="mb-6 text-[13px] text-gray-500">For {customerName}</Text>

          <View className="rounded-[20px] bg-white p-2">
            <QRCode
              value={qrValue}
              size={230}
              color="#111827"
              backgroundColor="#FFFFFF"
            />
          </View>

          <Text className="mt-5 text-center text-[12px] leading-[18px] text-gray-400">
            Scan in Tallyx to identify this customer.
          </Text>
        </View>
      </ScrollView>

      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: -10000,
          top: 0,
          width: 360,
          backgroundColor: '#FFFFFF',
        }}
      >
        <ViewShot
          ref={shareCardRef}
          options={{
            fileName: `tallyx-${safeFileName(customerName)}-qr-card`,
            format: 'png',
            quality: 1,
            result: 'tmpfile',
          }}
          style={{ width: 360, backgroundColor: '#FFFFFF' }}
        >
          <View style={{ overflow: 'hidden', borderRadius: 28, backgroundColor: '#FFFFFF' }}>
            <View style={{ backgroundColor: '#14532D', paddingHorizontal: 24, paddingTop: 24, paddingBottom: 28 }}>
              <View style={{ marginBottom: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ height: 36, width: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)' }}>
                    <Landmark size={18} color="#FFFFFF" strokeWidth={2.2} />
                  </View>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>Tallyx</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 12, paddingVertical: 6 }}>
                  <CheckCircle2 size={13} color="#BBF7D0" strokeWidth={2.2} />
                  <Text style={{ fontSize: 11, fontWeight: '600', color: '#DCFCE7' }}>Verified QR</Text>
                </View>
              </View>

              <Text style={{ fontSize: 12, fontWeight: '500', letterSpacing: 2, color: 'rgba(255,255,255,0.55)' }}>STORE</Text>
              <Text style={{ marginTop: 4, fontSize: 24, fontWeight: '700', color: '#FFFFFF' }}>{storeName}</Text>
              <Text style={{ marginTop: 4, fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>For {customerName}</Text>
            </View>

            <View style={{ alignItems: 'center', paddingHorizontal: 28, paddingVertical: 32 }}>
              <View style={{ borderRadius: 24, borderWidth: 1, borderColor: '#F3F4F6', backgroundColor: '#FFFFFF', padding: 16 }}>
                <QRCode value={qrValue} size={230} color="#111827" backgroundColor="#FFFFFF" />
              </View>

              <Text style={{ marginTop: 20, fontSize: 16, fontWeight: '700', color: '#111827' }}>Customer identity QR</Text>
              <Text style={{ marginTop: 8, textAlign: 'center', fontSize: 12, lineHeight: 18, color: '#9CA3AF' }}>
                Scan in Tallyx to identify this customer. This QR does not contain private keys or passwords.
              </Text>
            </View>
          </View>
        </ViewShot>
      </View>

      <View
        style={{
          paddingHorizontal: 24,
          paddingTop: 12,
          paddingBottom: insets.bottom + 16,
          gap: 12,
        }}
      >
        <TouchableOpacity
          onPress={handleShare}
          activeOpacity={0.85}
          className="h-[52px] w-full flex-row items-center justify-center gap-2 rounded-[26px] bg-green-600"
        >
          <Share2 size={18} color="#FFFFFF" strokeWidth={2} />
          <Text className="text-[15px] font-bold text-white">Share QR</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleDownload}
          activeOpacity={0.7}
          className="h-[52px] w-full flex-row items-center justify-center gap-2 rounded-[26px] border border-gray-200 bg-white"
        >
          <Download size={16} color="#374151" strokeWidth={2} />
          <Text className="text-[14px] font-medium text-gray-700">Download</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
