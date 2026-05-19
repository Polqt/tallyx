import React, { useState, useEffect } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { X, ShieldAlert, Sparkles } from 'lucide-react-native';
import { haptics } from '@/utils/haptics';
import { parseCustomerQRData } from '@/lib/qr';

interface Props {
  visible: boolean;
  onClose: () => void;
  onScanSuccess: (customerId: string) => void;
}

export function QrScannerModal({ visible, onClose, onScanSuccess }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (visible) {
      setScanned(false);
    }
  }, [visible]);

  if (!visible) return null;

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    haptics.success();

    const parsed = parseCustomerQRData(data);
    if (parsed) {
      onScanSuccess(parsed.customerId);
    } else {
      // Fallback: If it's a raw customer ID, try using that directly!
      onScanSuccess(data);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header Overlay */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={styles.closeButton}>
            <X size={20} color="#FFFFFF" strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan Customer QR</Text>
          <View style={{ width: 40 }} />
        </View>

        {!permission ? (
          <View style={styles.center}>
            <ActivityIndicator size="small" color="#16A34A" />
            <Text style={styles.statusText}>Requesting camera access...</Text>
          </View>
        ) : !permission.granted ? (
          <View style={styles.permissionContainer}>
            <View style={styles.iconContainer}>
              <ShieldAlert size={44} color="#D97706" />
            </View>
            <Text style={styles.permissionTitle}>Camera Permission Required</Text>
            <Text style={styles.permissionDesc}>
              Tallyx needs access to your camera to scan customer QR identity cards instantly.
            </Text>
            <TouchableOpacity onPress={requestPermission} activeOpacity={0.8} style={styles.grantButton}>
              <Text style={styles.grantButtonText}>Grant Camera Access</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.cameraContainer}>
            <CameraView
              style={StyleSheet.absoluteFillObject}
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}
              onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
            />

            {/* Viewfinder Overlays */}
            <View style={styles.overlayContainer}>
              <View style={styles.overlayTop} />
              <View style={styles.overlayMiddleContainer}>
                <View style={styles.overlaySide} />
                <View style={styles.viewfinder}>
                  {/* Viewfinder corners */}
                  <View style={[styles.corner, styles.topLeft]} />
                  <View style={[styles.corner, styles.topRight]} />
                  <View style={[styles.corner, styles.bottomLeft]} />
                  <View style={[styles.corner, styles.bottomRight]} />

                  {scanned && (
                    <View style={styles.scanSuccessOverlay}>
                      <Sparkles size={24} color="#16A34A" />
                      <Text style={styles.successText}>Resolving...</Text>
                    </View>
                  )}
                </View>
                <View style={styles.overlaySide} />
              </View>
              <View style={styles.overlayBottom}>
                <Text style={styles.hintText}>
                  Center the customer's QR code inside the frame to scan automatically
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    paddingTop: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Geist_700Bold',
    fontSize: 17,
    color: '#FFFFFF',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
  },
  statusText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 12,
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#111827',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(217,119,6,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  permissionTitle: {
    fontFamily: 'Geist_700Bold',
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionDesc: {
    fontFamily: 'Geist_400Regular',
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  grantButton: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  grantButtonText: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  cameraContainer: {
    flex: 1,
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  overlayMiddleContainer: {
    flexDirection: 'row',
    height: 250,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  viewfinder: {
    width: 250,
    height: 250,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    paddingTop: 32,
    paddingHorizontal: 40,
  },
  hintText: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    color: '#E5E7EB',
    textAlign: 'center',
    lineHeight: 18,
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#16A34A',
  },
  topLeft: {
    top: -2,
    left: -2,
    borderLeftWidth: 4,
    borderTopWidth: 4,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: -2,
    right: -2,
    borderRightWidth: 4,
    borderTopWidth: 4,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderLeftWidth: 4,
    borderBottomWidth: 4,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderBottomRightRadius: 8,
  },
  scanSuccessOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  successText: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 14,
    color: '#16A34A',
  },
});
