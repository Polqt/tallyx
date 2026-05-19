import { useState } from 'react';
import { Modal, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CalendarDays, ClipboardList } from 'lucide-react-native';

type Props = {
  amount: string;
  dueDate: string;
  note: string;
  onAmountChange: (v: string) => void;
  onDueDateChange: (v: string) => void;
  onNoteChange: (v: string) => void;
  TextInputComponent?: React.ComponentType<React.ComponentProps<typeof TextInput>>;
};

function formatDisplayDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export function CreditDetailForm({
  amount,
  dueDate,
  note,
  onAmountChange,
  onDueDateChange,
  onNoteChange,
  TextInputComponent = TextInput,
}: Props) {
  const [showPicker, setShowPicker] = useState(false);

  const pickerDate = dueDate ? new Date(dueDate + 'T00:00:00') : new Date();

  function handleDateChange(_: unknown, selected?: Date) {
    if (Platform.OS === 'android') setShowPicker(false);
    if (!selected) return;
    const iso = selected.toISOString().slice(0, 10);
    onDueDateChange(iso);
  }

  return (
    <View style={{ gap: 10 }}>
      {/* Amount — hero field */}
      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          padding: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 6,
          elevation: 2,
        }}
      >
        <Text style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 8 }}>Amount</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 32, fontWeight: '700', color: '#16A34A', marginRight: 4 }}>₱</Text>
          <TextInputComponent
            value={amount}
            onChangeText={onAmountChange}
            placeholder="0"
            keyboardType="numeric"
            placeholderTextColor="#D1D5DB"
            style={{ flex: 1, fontSize: 40, fontWeight: '700', color: '#111827', padding: 0 }}
          />
        </View>
      </View>

      {/* Due date */}
      <TouchableOpacity
        onPress={() => setShowPicker(true)}
        activeOpacity={0.75}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          height: 52,
          backgroundColor: '#F5F5F5',
          borderRadius: 14,
          paddingHorizontal: 16,
          gap: 10,
        }}
      >
        <CalendarDays size={16} color="#9CA3AF" strokeWidth={2} />
        <Text style={{ flex: 1, fontSize: 15, color: dueDate ? '#111827' : '#9CA3AF' }}>
          {dueDate ? formatDisplayDate(dueDate) : 'Select due date'}
        </Text>
        {dueDate ? (
          <TouchableOpacity
            onPress={() => onDueDateChange('')}
            hitSlop={8}
          >
            <Text style={{ fontSize: 12, color: '#9CA3AF' }}>Clear</Text>
          </TouchableOpacity>
        ) : null}
      </TouchableOpacity>

      {/* Date picker modal for iOS */}
      {Platform.OS === 'ios' && showPicker && (
        <Modal transparent animationType="slide">
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' }}>
            <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 32 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 }}>
                <TouchableOpacity onPress={() => setShowPicker(false)}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#16A34A' }}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={pickerDate}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                minimumDate={new Date()}
                style={{ height: 200 }}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Android date picker — renders inline when visible */}
      {Platform.OS === 'android' && showPicker && (
        <DateTimePicker
          value={pickerDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}

      {/* Notes */}
      <View
        style={{
          backgroundColor: '#F5F5F5',
          borderRadius: 14,
          padding: 14,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <ClipboardList size={13} color="#9CA3AF" strokeWidth={2} />
          <Text style={{ fontSize: 12, color: '#9CA3AF' }}>Notes</Text>
        </View>
        <TextInputComponent
          value={note}
          onChangeText={onNoteChange}
          placeholder="Rice, canned goods, load..."
          multiline
          placeholderTextColor="#9CA3AF"
          style={{ minHeight: 80, fontSize: 14, color: '#111827', textAlignVertical: 'top' }}
        />
      </View>
    </View>
  );
}
