import { Stack, usePathname } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import {
  Home,
  ShoppingCart,
  User,
  Grid2X2,
  Package,
  Heart,
} from 'lucide-react-native';


export default function TabLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { itemCount } = useCart();
  const { wishlistCount } = useWishlist();

  const allTabs = [
    { name: "index", label: "Home", icon: Home, title: "Home" },
    { name: "categories", label: "Category", icon: Grid2X2, title: "Categories" },
    { name: "wishlist", label: "Wishlist", icon: Heart, title: "Wishlist", badge: wishlistCount },
    { name: "cart", label: "Cart", icon: ShoppingCart, title: "Cart", badge: itemCount },
    { name: "orders", label: "Orders", icon: Package, title: "Orders" },
    { name: "profile", label: "Profile", icon: User, title: "Profile" },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
  
    
      
      {/* Stack Navigator */}
      <Stack
        initialRouteName="index"
        screenOptions={{
          headerShown: false,
          contentStyle: { 
            paddingBottom: 60,
          },
          animation: "none"
        }}
      >
        {allTabs.map(tab => (
          <Stack.Screen
            key={tab.name}
            name={tab.name}
            options={{
              title: tab.title,
            }}
          />
        ))}
      </Stack>

      {/* Custom Bottom Navigation */}
      <View 
        className="absolute left-0 right-0 bg-white border-t border-gray-200 shadow-2xl"
        style={{ 
          bottom: 0,
          paddingBottom: insets.bottom,
        }}
      >
        <View className="flex-row items-center justify-around px-2 py-2">
          {allTabs.map((tab) => {
            const isActive = tab.name === 'index' 
              ? pathname === '/' || pathname === '/(tabs)' || pathname === '/(tabs)/'
              : pathname.includes(`/${tab.name}`);
            
            return (
              <TouchableOpacity
                key={tab.name}
                activeOpacity={0.7}
                className={`flex-1 items-center justify-center py-2 mx-1 rounded-2xl ${
                  isActive ? 'bg-black' : 'bg-transparent'
                }`}
                onPress={() => {
                  try {
                    const routePath = tab.name === 'index' ? '/(tabs)/' : `/(tabs)/${tab.name}`;
                    router.replace(routePath as any);
                  } catch (error) {
                    router.push('/(tabs)/' as any);
                  }
                }}
              >
                <View className="items-center">
                  <View className="relative">
                    <tab.icon 
                      color={isActive ? '#ffffff' : '#6b7280'} 
                      size={20}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <View 
                        className="absolute -top-2 -right-2 min-w-[16px] h-4 rounded-full items-center justify-center px-1 border border-white"
                        style={{ backgroundColor: tab.name === 'cart' ? '#fbbf24' : '#ef4444' }}
                      >
                        <Text className="text-[9px] font-black text-white">
                          {tab.badge > 99 ? '99+' : tab.badge}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text 
                    className={`mt-1 text-[10px] ${
                      isActive ? 'text-white font-bold' : 'text-gray-500 font-medium'
                    }`}
                  >
                    {tab.label}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}
