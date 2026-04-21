import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, Pressable, TextInput, AppState, Platform } from 'react-native';
import { Search, User, ShoppingCart, Menu, Heart } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { cartService } from '@/services/cartService';
import { userAuthService } from '@/services/userAuthService';
import Sidebar from '../Sidebar/Sidebar';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';

const pressableScale = ({ pressed }: { pressed: boolean }) => ({
  opacity: pressed ? 0.8 : 1,
  transform: [{ scale: pressed ? 0.96 : 1 }],
});

export function Header() {
  const { itemCount } = useCart();
  const { wishlistCount } = useWishlist();
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const router = useRouter();

  // ── Search handlers ────────────────────────────────────────────────────────
  const handleSearch = () => {
    const q = searchQuery.trim();
    if (q.length > 0) {
      router.push(`/(any)/products?search=${encodeURIComponent(q)}` as any);
    }
  };

  return (
    <>
    <View style={{ backgroundColor: '#111827' }}>
      {/* First Section - Menu, Brand, Profile, Cart */}
      <View className="px-4 py-3 flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          {/* Menu Button to trigger sidebar */}
          <Pressable
            onPress={async () => {
              if (typeof Haptics !== 'undefined') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setSidebarVisible(true);
            }}
            accessibilityLabel="Open menu"
            accessibilityRole="button"
            style={pressableScale}
            className="p-2 -ml-2 mr-2"
          >
            <Menu size={24} color="#ffffff" />
          </Pressable>

          {/* Brand Text (tap to go home) */}
          <Pressable
            onPress={async () => {
              if (typeof Haptics !== 'undefined') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(tabs)' as any);
            }}
            accessibilityLabel="Go to home"
            accessibilityRole="button"
            style={pressableScale}
          >
            <Text className="text-base font-bold text-white tracking-tight">M2C MarkDowns</Text>
            <Text className="text-[10px] text-gray-400 font-medium -mt-1">Private Limited</Text>
          </Pressable>
        </View>

        <View className="flex-row items-center gap-1.5">
          {/* Wishlist Link */}
          <Pressable
            onPress={async () => {
              if (typeof Haptics !== 'undefined') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(tabs)/wishlist' as any);
            }}
            accessibilityLabel="View wishlist"
            accessibilityRole="button"
            style={pressableScale}
            className="p-2 relative"
            hitSlop={8}
          >
            <Heart size={22} color="#ffffff" />
            {wishlistCount > 0 && (
              <View className="absolute top-1 right-1 bg-red-500 min-w-[18px] h-[18px] rounded-full items-center justify-center px-1 border border-[#111827]">
                <Text className="text-white text-[10px] font-bold">{wishlistCount > 99 ? '99+' : wishlistCount}</Text>
              </View>
            )}
          </Pressable>

          {/* Profile Icon */}
          <Pressable
            onPress={async () => {
              if (typeof Haptics !== 'undefined') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(tabs)/profile' as any);
            }}
            accessibilityLabel="View profile"
            accessibilityRole="button"
            style={pressableScale}
            className="p-2"
            hitSlop={8}
          >
            <User size={22} color="#ffffff" />
          </Pressable>

          {/* Cart Icon */}
          <Pressable
            onPress={async () => {
              if (typeof Haptics !== 'undefined') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(tabs)/cart' as any);
            }}
            accessibilityLabel="View cart"
            accessibilityRole="button"
            style={pressableScale}
            className="p-2 relative"
            hitSlop={8}
          >
            <ShoppingCart size={22} color="#ffffff" />
            {itemCount > 0 && (
              <View className="absolute top-1 right-1 bg-amber-500 min-w-[18px] h-[18px] rounded-full items-center justify-center px-1 border border-[#111827]">
                <Text className="text-[#111827] text-[10px] font-bold">{itemCount > 99 ? '99+' : itemCount}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      {/* Second Section - Search Bar */}
      <View className="px-4 pb-4">
        <View className="flex-row items-center bg-white/10 rounded-2xl border border-white/5 overflow-hidden">
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search products..."
            placeholderTextColor="#9ca3af"
            className="flex-1 px-4 py-3.5 text-white"
            style={{ fontSize: 15 }}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            accessibilityLabel="Search products"
          />
          <Pressable
            onPress={async () => {
              if (typeof Haptics !== 'undefined') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              handleSearch();
            }}
            accessibilityLabel="Submit search"
            accessibilityRole="button"
            style={({ pressed }) => ({
              backgroundColor: pressed ? '#fbbf24' : '#fcd34d',
            })}
            className="px-5 items-center justify-center align-self-stretch"
          >
            <Search size={22} color="#000000" />
          </Pressable>
        </View>
      </View>
    </View>

    <Sidebar
      visible={sidebarVisible}
      onClose={() => setSidebarVisible(false)}
    />
    </>
  );
}

export default Header;
