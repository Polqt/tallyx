import { Text, TouchableOpacity, View } from 'react-native';
import { SearchX, UserRound } from 'lucide-react-native';

type CustomerEmptyStateProps = {
  isSearching: boolean;
  onAddCustomer: () => void;
};

export function CustomerEmptyState({ isSearching, onAddCustomer }: CustomerEmptyStateProps) {
  const Icon = isSearching ? SearchX : UserRound;

  return (
    <View className="items-center px-8 py-16">
      <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-green-50">
        <Icon size={28} color="#16A34A" strokeWidth={1.8} />
      </View>
      <Text className="mb-2 text-center text-base font-bold text-gray-950">
        {isSearching ? 'No matching customer' : 'No customers yet'}
      </Text>
      <Text className="mb-6 text-center text-sm leading-5 text-gray-500">
        {isSearching
          ? 'Try a different name or clear the search field.'
          : 'Add your first customer to start tracking utang.'}
      </Text>

      {!isSearching ? (
        <TouchableOpacity
          onPress={onAddCustomer}
          activeOpacity={0.85}
          className="rounded-full bg-green-600 px-5 py-3"
        >
          <Text className="text-[15px] font-bold text-white">Add Customer</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
