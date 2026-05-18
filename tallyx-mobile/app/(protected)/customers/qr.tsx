import { useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Share, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Download, Share2 } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { useStoreStore } from '@/stores/store.store';
import { haptics } from '@/utils/haptics';

export default function QRScreen() {
  const insets = useSafeAreaInsets();
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const profile = useStoreStore((s) => s.profile);
  const storeName = profile?.name ?? 'My Store';
  const customerName = name ? decodeURIComponent(name) : 'Customer';

  const qrValue = JSON.stringify({ customerId: id, storeId: profile?.stellarPublicKey ?? 'unknown' });

  const svgRef = useRef<any>(null);

  async function handleShare() {
    haptics.medium();
    try {
      svgRef.current?.toDataURL((data: string) => {
        Share.share({
          title: `Payment QR — ${customerName}`,
          message: `Payment QR for ${customerName} at ${storeName}`,
          url: Platform.OS === 'ios' ? `data:image/png;base64,${data}` : undefined,
        });
      });
    } catch {
      // fallback — share text only
      Share.share({
        title: `Payment QR — ${customerName}`,
        message: `Payment QR for ${customerName} at ${storeName}\n\nID: ${id}`,
      });
    }
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => { haptics.light(); router.back(); }}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.backBtn}
        >
          <ChevronLeft size={20} color="#111827" strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment QR</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >

        <View style={styles.card}>
          <Text style={styles.cardStoreName}>{storeName}</Text>
          <Text style={styles.cardCustomer}>For {customerName}</Text>

          <View style={styles.qrWrap}>
            <QRCode
              value={qrValue}
              size={220}
              color="#111827"
              backgroundColor="#FFFFFF"
              getRef={(ref) => { svgRef.current = ref; }}
            />
          </View>

          <Text style={styles.cardNote}>Show this to your customer to confirm payment.</Text>
        </View>

        <TouchableOpacity onPress={handleShare} activeOpacity={0.85} style={styles.shareBtn}>
          <Share2 size={18} color="#FFFFFF" strokeWidth={2} />
          <Text style={styles.shareBtnText}>Share QR</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => { haptics.light(); /* download logic */ }}
          activeOpacity={0.7}
          style={styles.downloadBtn}
        >
          <Download size={16} color="#374151" strokeWidth={2} />
          <Text style={styles.downloadBtnText}>Download</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:           { flex: 1, backgroundColor: '#FFFFFF' },

  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  backBtn:          { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  headerTitle:      { fontFamily: 'Geist_700Bold', fontSize: 17, color: '#111827' },

  content:          { alignItems: 'center', paddingTop: 40, paddingHorizontal: 24 },

  card:             { width: '100%', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 32, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },
  cardStoreName:    { fontFamily: 'Geist_700Bold', fontSize: 15, color: '#111827', textAlign: 'center', marginBottom: 4 },
  cardCustomer:     { fontFamily: 'Geist_400Regular', fontSize: 13, color: '#6B7280', textAlign: 'center', marginBottom: 24 },
  qrWrap:           { padding: 4 },
  cardNote:         { fontFamily: 'Geist_400Regular', fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginTop: 20, lineHeight: 18 },

  shareBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', height: 52, borderRadius: 26, backgroundColor: '#16A34A', marginTop: 28 },
  shareBtnText:     { fontFamily: 'Geist_700Bold', fontSize: 15, color: '#FFFFFF' },

  downloadBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' },
  downloadBtnText:  { fontFamily: 'Geist_500Medium', fontSize: 14, color: '#374151' },
});
