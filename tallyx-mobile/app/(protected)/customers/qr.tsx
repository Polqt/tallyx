import { useRef } from 'react';
import { Alert, ScrollView, Share, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { File, Paths } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { router, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { ChevronLeft, Download, Share2 } from 'lucide-react-native';
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

  const svgRef = useRef<any>(null);

  function getQrBase64() {
    return new Promise<string>((resolve, reject) => {
      if (!svgRef.current?.toDataURL) {
        reject(new Error('QR image is not ready.'));
        return;
      }

      svgRef.current.toDataURL((data: string) => resolve(data));
    });
  }

  async function writeQrImageToCache() {
    const base64 = await getQrBase64();
    const file = new File(Paths.cache, `tallyx-${safeFileName(customerName)}-qr.png`);
    file.create({ overwrite: true });
    file.write(base64, { encoding: 'base64' });
    return file.uri;
  }

  async function writeQrTextToCache() {
    const file = new File(Paths.cache, `tallyx-${safeFileName(customerName)}-qr.txt`);
    file.create({ overwrite: true });
    file.write(qrValue);
    return file.uri;
  }

  async function handleShare() {
    haptics.medium();

    try {
      const imageUri = await writeQrImageToCache();

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(imageUri, {
          mimeType: 'image/png',
          dialogTitle: `Share QR for ${customerName}`,
        });
        return;
      }

      await Share.share({
        title: `Payment QR - ${customerName}`,
        message: `Payment QR for ${customerName} at ${storeName}\n\n${qrValue}`,
      });
    } catch {
      await Clipboard.setStringAsync(qrValue);
      await Share.share({
        title: `Payment QR - ${customerName}`,
        message: `Payment QR for ${customerName} at ${storeName}\n\n${qrValue}`,
      }).catch(() => undefined);
      Alert.alert('QR text copied', 'Image sharing failed, so the QR identity text was copied instead.');
    }
  }

  async function handleDownload() {
    haptics.medium();

    try {
      const imageUri = await writeQrImageToCache();
      const permission = await MediaLibrary.requestPermissionsAsync(true, ['photo']);

      if (!permission.granted) {
        const textUri = await writeQrTextToCache();
        Alert.alert(
          'Gallery permission needed',
          `QR image was not saved to gallery. A text fallback was saved locally:\n${textUri}`
        );
        return;
      }

      await MediaLibrary.saveToLibraryAsync(imageUri);
      Alert.alert('QR saved', 'Customer QR image was saved to your device gallery.');
    } catch {
      try {
        const textUri = await writeQrTextToCache();
        Alert.alert('QR text saved', `Image export failed. QR identity text was saved locally:\n${textUri}`);
      } catch {
        Alert.alert('Download failed', 'Unable to save the QR image or fallback text.');
      }
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
          paddingBottom: insets.bottom + 32,
        }}
      >
        <View
          className="w-full items-center rounded-[20px] bg-white p-8"
          style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 }}
        >
          <Text className="mb-1 text-[15px] font-bold text-gray-900">{storeName}</Text>
          <Text className="mb-6 text-[13px] text-gray-500">For {customerName}</Text>

          <View className="p-1">
            <QRCode
              value={qrValue}
              size={220}
              color="#111827"
              backgroundColor="#FFFFFF"
              getRef={(ref) => {
                svgRef.current = ref;
              }}
            />
          </View>

          <Text className="mt-5 text-center text-[12px] leading-[18px] text-gray-400">
            Show this to your customer to confirm payment.
          </Text>
        </View>

        <View className="mt-14 w-full gap-3">
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
      </ScrollView>
    </View>
  );
}
