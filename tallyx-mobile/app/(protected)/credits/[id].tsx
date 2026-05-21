import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { CalendarDays, ChevronLeft, Clock3, HardDrive, MoreHorizontal, Pencil, RefreshCcw, RotateCcw, ShieldCheck, Trash2, WifiOff, XCircle } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '@/context/AuthContext';
import { deleteCredit, fetchCredit, unvoidCredit, updateCredit, voidCredit } from '@/features/credits/credit.service';
import type { CreditListItem } from '@/features/credits/credit.types';
import { openTransactionExplorer, truncateStellarAddress } from '@/features/stellar/stellar.service';
import { statusStyles } from '@/utils/credit';
import { compactKey, formatDashboardDate, formatPeso } from '@/utils/dashboard';
import { haptics } from '@/utils/haptics';

const syncConfig = {
  local:   { label: 'Saved locally',    color: '#9CA3AF', Icon: HardDrive },
  pending: { label: 'Sync pending',     color: '#D97706', Icon: Clock3 },
  syncing: { label: 'Syncing…',         color: '#2563EB', Icon: Clock3 },
  synced:  { label: 'On-chain synced',  color: '#16A34A', Icon: ShieldCheck },
  failed:  { label: 'Sync failed',      color: '#DC2626', Icon: WifiOff },
};

export default function CreditDetailScreen() {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [credit, setCredit] = useState<CreditListItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [voiding, setVoiding] = useState(false);
  const [unvoiding, setUnvoiding] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const [editVisible, setEditVisible] = useState(false);
  const [editNote, setEditNote] = useState('');
  const [editDueDate, setEditDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const noteInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!token || !id) { setLoading(false); return; }
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchCredit(token!, id as string, controller.signal);
        setCredit(data);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Unable to load credit.');
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [id, token]);

  function openEdit() {
    if (!credit) return;
    setEditNote(credit.note ?? '');
    setEditDueDate(credit.dueDate ? new Date(credit.dueDate) : null);
    setShowDatePicker(false);
    setMenuVisible(false);
    setEditVisible(true);
    setTimeout(() => noteInputRef.current?.focus(), 150);
  }

  async function handleEditSave() {
    if (!credit || !token || saving) return;
    setSaving(true);
    haptics.medium();
    try {
      const updated = await updateCredit(token, credit.id, {
        note: editNote.trim() || null,
        dueDate: editDueDate
          ? `${editDueDate.getFullYear()}-${String(editDueDate.getMonth() + 1).padStart(2, '0')}-${String(editDueDate.getDate()).padStart(2, '0')}T00:00:00.000Z`
          : null,
      });
      haptics.success();
      setCredit(updated);
      setEditVisible(false);
    } catch (err) {
      haptics.error();
      Alert.alert('Could not save', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function handleVoid() {
    if (!credit || !token) return;
    setMenuVisible(false);
    haptics.medium();
    Alert.alert(
      'Void credit?',
      `This will cancel the ${formatPeso(credit.amount)} credit for ${credit.customerName ?? 'this customer'}. Cannot be undone if it has payments.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Void',
          style: 'destructive',
          onPress: async () => {
            setVoiding(true);
            try {
              await voidCredit(token, credit.id);
              haptics.success();
              setCredit((prev) => prev ? { ...prev, status: 'voided', balance: 0 } : prev);
            } catch (err) {
              haptics.error();
              Alert.alert('Could not void', err instanceof Error ? err.message : 'Please try again.');
            } finally {
              setVoiding(false);
            }
          },
        },
      ]
    );
  }

  function handleUnvoid() {
    if (!credit || !token) return;
    setMenuVisible(false);
    haptics.medium();
    Alert.alert(
      'Restore credit?',
      `This will restore the ${formatPeso(credit.amount)} credit back to pending.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          onPress: async () => {
            setUnvoiding(true);
            try {
              const updated = await unvoidCredit(token, credit.id);
              haptics.success();
              setCredit(updated);
            } catch (err) {
              haptics.error();
              Alert.alert('Could not restore', err instanceof Error ? err.message : 'Please try again.');
            } finally {
              setUnvoiding(false);
            }
          },
        },
      ]
    );
  }

  function handleDelete() {
    if (!credit || !token) return;
    setMenuVisible(false);
    haptics.medium();
    Alert.alert(
      'Delete credit?',
      `This will permanently delete the ${formatPeso(credit.amount)} credit record. Credits with payments cannot be deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteCredit(token, credit.id);
              haptics.success();
              router.back();
            } catch (err) {
              haptics.error();
              Alert.alert('Could not delete', err instanceof Error ? err.message : 'Please try again.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  }

  const status = credit ? (statusStyles[credit.status] ?? statusStyles.pending) : null;
  const sync = credit ? (syncConfig[credit.syncStatus] ?? syncConfig.local) : null;
  const SyncIcon = sync?.Icon;
  const canVoid = credit && credit.status !== 'voided' && credit.status !== 'paid';
  const canUnvoid = credit && credit.status === 'voided';
  const canEdit = credit && credit.status !== 'paid' && credit.status !== 'voided';
  const paidPercent = credit && credit.amount > 0
    ? Math.round(((credit.amount - credit.balance) / credit.amount) * 100)
    : 0;

  const isBusy = voiding || unvoiding || deleting;

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF', paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
        <TouchableOpacity
          onPress={() => { haptics.light(); router.back(); }}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{ height: 36, width: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: '#F3F4F6' }}
        >
          <ChevronLeft size={20} color="#111827" strokeWidth={2.5} />
        </TouchableOpacity>

        <Text style={{ fontSize: 17, fontWeight: '700', color: '#111827' }}>Credit Detail</Text>

        {credit ? (
          <TouchableOpacity
            onPress={() => { haptics.light(); setMenuVisible(true); }}
            activeOpacity={0.7}
            disabled={isBusy}
            style={{ height: 36, width: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: '#F3F4F6' }}
          >
            {isBusy
              ? <ActivityIndicator size="small" color="#6B7280" />
              : <MoreHorizontal size={20} color="#374151" strokeWidth={2} />
            }
          </TouchableOpacity>
        ) : (
          <View style={{ width: 36 }} />
        )}
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="small" color="#16A34A" />
          <Text style={{ marginTop: 10, fontSize: 13, color: '#9CA3AF' }}>Loading credit...</Text>
        </View>
      ) : error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#B45309' }}>Credit unavailable</Text>
          <Text style={{ marginTop: 6, fontSize: 13, color: '#9CA3AF', textAlign: 'center' }}>{error}</Text>
        </View>
      ) : credit && status && sync && SyncIcon ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 24 }}>

          <View style={{ alignItems: 'center', paddingTop: 32, paddingBottom: 28, paddingHorizontal: 24 }}>
            <View style={{ paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginBottom: 16, backgroundColor: credit.status === 'paid' ? '#F0FDF4' : credit.status === 'voided' ? '#F3F4F6' : credit.status === 'overdue' ? '#FEF2F2' : credit.status === 'partial' ? '#EFF6FF' : '#FFFBEB' }}>
              <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: credit.status === 'paid' ? '#16A34A' : credit.status === 'overdue' ? '#DC2626' : credit.status === 'voided' ? '#6B7280' : credit.status === 'partial' ? '#2563EB' : '#D97706' }}>
                {status.label}
              </Text>
            </View>
            <Text style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 6 }}>Remaining Balance</Text>
            <Text style={{ fontSize: 52, fontWeight: '800', color: credit.status === 'paid' || credit.status === 'voided' ? '#9CA3AF' : '#14532D', lineHeight: 60 }}>
              {formatPeso(credit.balance)}
            </Text>
            <Text style={{ fontSize: 14, color: '#9CA3AF', marginTop: 6 }}>
              of {formatPeso(credit.amount)} original
            </Text>
          </View>

          {credit.amount > 0 && (
            <View style={{ marginHorizontal: 24, marginBottom: 32 }}>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: '#F3F4F6', overflow: 'hidden' }}>
                <View style={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: credit.status === 'paid' ? '#16A34A' : credit.status === 'voided' ? '#9CA3AF' : '#14532D',
                  width: `${paidPercent}%`,
                }} />
              </View>
              <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 6, textAlign: 'right' }}>
                {paidPercent}% paid
              </Text>
            </View>
          )}

          <View style={{ marginHorizontal: 20, marginBottom: 12 }}>
            <View style={{ borderRadius: 20, borderWidth: 1, borderColor: '#F3F4F6', backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingVertical: 18 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Customer</Text>
              <Text style={{ fontSize: 17, fontWeight: '700', color: '#111827' }}>{credit.customerName ?? '—'}</Text>
            </View>
          </View>

          <View style={{ marginHorizontal: 20, marginBottom: 12, flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1, borderRadius: 20, borderWidth: 1, borderColor: '#F3F4F6', backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 18 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Recorded</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>{formatDashboardDate(credit.createdAt)}</Text>
            </View>
            <View style={{ flex: 1, borderRadius: 20, borderWidth: 1, borderColor: '#F3F4F6', backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 18 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Due Date</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: credit.status === 'overdue' ? '#DC2626' : '#111827' }}>
                {credit.dueDate ? formatDashboardDate(credit.dueDate) : 'None'}
              </Text>
            </View>
          </View>

          {credit.note ? (
            <View style={{ marginHorizontal: 20, marginBottom: 12 }}>
              <View style={{ borderRadius: 20, borderWidth: 1, borderColor: '#F3F4F6', backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingVertical: 18 }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Note</Text>
                <Text style={{ fontSize: 14, color: '#374151', lineHeight: 22 }}>{credit.note}</Text>
              </View>
            </View>
          ) : null}

          <View style={{ marginHorizontal: 20, marginBottom: 12 }}>
            <View style={{ borderRadius: 20, borderWidth: 1, borderColor: '#F3F4F6', backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingVertical: 18 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Blockchain</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <SyncIcon size={15} color={sync.color} strokeWidth={2.2} />
                <Text style={{ fontSize: 14, fontWeight: '600', color: sync.color }}>{sync.label}</Text>
              </View>
              {credit.stellarTxHash ? (
                <TouchableOpacity
                  onPress={async () => {
                    haptics.light();
                    try {
                      await openTransactionExplorer(credit.stellarTxHash!);
                    } catch {
                      Alert.alert('Unable to open explorer', 'Please try again.');
                    }
                  }}
                  activeOpacity={0.7}
                  style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}
                >
                  <Text style={{ fontSize: 12, color: '#2563EB', fontWeight: '600' }}>
                    {compactKey(credit.stellarTxHash)}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#2563EB' }}>↗</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* Sync failed banner */}
          {credit.syncStatus === 'failed' && (
            <View style={{ marginHorizontal: 20, marginBottom: 12, borderRadius: 16, borderWidth: 1, borderColor: '#FECACA', backgroundColor: '#FEF2F2', padding: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                <WifiOff size={16} color="#DC2626" strokeWidth={2} style={{ marginTop: 1 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#991B1B', marginBottom: 2 }}>
                    Blockchain sync failed
                  </Text>
                  <Text style={{ fontSize: 12, color: '#B91C1C', lineHeight: 18 }}>
                    Saved locally. Blockchain sync failed. You can retry later.
                  </Text>
                </View>
              </View>
              {/* TODO: implement retry sync — call createCreditOnChain and update syncStatus */}
              <TouchableOpacity
                onPress={() => Alert.alert('Retry Sync', 'Sync retry is not yet implemented. Your data is saved locally and will sync in a future update.')}
                activeOpacity={0.8}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12, height: 36, borderRadius: 10, borderWidth: 1, borderColor: '#FECACA', backgroundColor: '#FFFFFF' }}
              >
                <RefreshCcw size={13} color="#DC2626" strokeWidth={2} />
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#DC2626' }}>Retry Sync</Text>
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>
      ) : null}

      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' }}
          onPress={() => setMenuVisible(false)}
        >
          <Pressable onPress={() => {}}>
            <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 12, paddingBottom: insets.bottom + 24 }}>
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB', alignSelf: 'center', marginBottom: 20 }} />
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#9CA3AF', paddingHorizontal: 20, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                Credit Actions
              </Text>

              {canEdit && (
                <TouchableOpacity onPress={openEdit} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 16 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
                    <Pencil size={16} color="#374151" strokeWidth={2} />
                  </View>
                  <View>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>Edit Credit</Text>
                    <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 1 }}>Change note or due date</Text>
                  </View>
                </TouchableOpacity>
              )}

              {canVoid && (
                <TouchableOpacity onPress={handleVoid} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 16 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' }}>
                    <XCircle size={16} color="#DC2626" strokeWidth={2} />
                  </View>
                  <View>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#DC2626' }}>Void Credit</Text>
                    <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 1 }}>Cancel this credit (no payments)</Text>
                  </View>
                </TouchableOpacity>
              )}

              {canUnvoid && (
                <TouchableOpacity onPress={handleUnvoid} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 16 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center' }}>
                    <RotateCcw size={16} color="#16A34A" strokeWidth={2} />
                  </View>
                  <View>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#16A34A' }}>Restore Credit</Text>
                    <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 1 }}>Un-void and set back to pending</Text>
                  </View>
                </TouchableOpacity>
              )}

              <TouchableOpacity onPress={handleDelete} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 16 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' }}>
                  <Trash2 size={16} color="#DC2626" strokeWidth={2} />
                </View>
                <View>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#DC2626' }}>Delete Credit</Text>
                  <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 1 }}>Permanently remove (no payments)</Text>
                </View>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={editVisible} transparent animationType="slide" onRequestClose={() => setEditVisible(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' }} onPress={() => setEditVisible(false)}>
          <Pressable onPress={() => {}}>
            <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 12, paddingBottom: insets.bottom + 24, paddingHorizontal: 20 }}>
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB', alignSelf: 'center', marginBottom: 20 }} />
              <Text style={{ fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 20 }}>Edit Credit</Text>

              <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Note</Text>
              <TextInput
                ref={noteInputRef}
                value={editNote}
                onChangeText={setEditNote}
                placeholder="Add a note..."
                placeholderTextColor="#D1D5DB"
                multiline
                style={{ backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827', minHeight: 80, textAlignVertical: 'top', marginBottom: 16 }}
              />

              <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Due Date</Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14, marginBottom: 24 }}
              >
                <Text style={{ fontSize: 15, color: editDueDate ? '#111827' : '#D1D5DB' }}>
                  {editDueDate ? editDueDate.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Select a date'}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  {editDueDate && (
                    <TouchableOpacity onPress={() => setEditDueDate(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Text style={{ fontSize: 12, color: '#9CA3AF' }}>Clear</Text>
                    </TouchableOpacity>
                  )}
                  <CalendarDays size={16} color="#9CA3AF" strokeWidth={2} />
                </View>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={editDueDate ?? new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  minimumDate={new Date()}
                  onChange={(_, selected) => {
                    setShowDatePicker(Platform.OS === 'ios');
                    if (selected) setEditDueDate(selected);
                  }}
                />
              )}

              <TouchableOpacity
                onPress={handleEditSave}
                disabled={saving}
                activeOpacity={0.85}
                style={{ backgroundColor: '#14532D', borderRadius: 16, paddingVertical: 16, alignItems: 'center' }}
              >
                {saving
                  ? <ActivityIndicator size="small" color="#FFFFFF" />
                  : <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}>Save Changes</Text>
                }
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
