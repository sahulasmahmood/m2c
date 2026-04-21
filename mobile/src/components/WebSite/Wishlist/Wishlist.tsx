import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Share,
  RefreshControl,
  StatusBar,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import {
  Heart,
  ShoppingCart,
  Share2,
  Trash2,
  ArrowRight,
  Package,
  Tag,
  AlertCircle,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { showSuccessToast, showErrorToast } from '@/lib/toast-utils';
import { wishlistService, WishlistItem } from '@/services/wishlistService';
import { cartService } from '@/services/cartService';
import { userAuthService } from '@/services/userAuthService';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';

const fmt = (n: number) => `₹${n.toFixed(2)}`;

// ─── Stock status helpers ─────────────────────────────────────────────────────
type StockLevel = 'in_stock' | 'low_stock' | 'out_of_stock';

const LOW_STOCK_THRESHOLD = 5;

/** Returns the stock level string for display. WishlistItem.product doesn't
 * expose a numeric availableStock count directly, so we infer from `inStock` and
 * use the `totalStock` if the backend ever surfaces it in the wishlist payload. */
function resolveStockLevel(product: WishlistItem['product']): StockLevel {
  if (!product) return 'out_of_stock';
  // If the product explicitly exposes a numeric stock count, use it.
  const numericStock = (product as any).availableStock ?? (product as any).totalStock ?? null;
  if (numericStock !== null) {
    if (numericStock <= 0) return 'out_of_stock';
    if (numericStock <= LOW_STOCK_THRESHOLD) return 'low_stock';
    return 'in_stock';
  }
  return product.inStock ? 'in_stock' : 'out_of_stock';
}

// ─── Sub-component: stock pill ────────────────────────────────────────────────
function StockPill({ level, numericStock }: { level: StockLevel; numericStock?: number }) {
  if (level === 'out_of_stock') {
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          backgroundColor: '#fef2f2',
          borderRadius: 6,
          paddingHorizontal: 7,
          paddingVertical: 3,
          alignSelf: 'flex-start',
          marginTop: 6,
        }}
      >
        <AlertCircle size={10} color="#dc2626" />
        <Text style={{ fontSize: 10, fontWeight: '700', color: '#dc2626' }}>
          Out of Stock
        </Text>
      </View>
    );
  }

  if (level === 'low_stock') {
    const label =
      numericStock != null ? `Only ${numericStock} left` : 'Low Stock';
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          backgroundColor: '#fffbeb',
          borderRadius: 6,
          paddingHorizontal: 7,
          paddingVertical: 3,
          alignSelf: 'flex-start',
          marginTop: 6,
        }}
      >
        <AlertTriangle size={10} color="#d97706" />
        <Text style={{ fontSize: 10, fontWeight: '700', color: '#d97706' }}>
          {label}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#f0fdf4',
        borderRadius: 6,
        paddingHorizontal: 7,
        paddingVertical: 3,
        alignSelf: 'flex-start',
        marginTop: 6,
      }}
    >
      <CheckCircle2 size={10} color="#16a34a" />
      <Text style={{ fontSize: 10, fontWeight: '700', color: '#16a34a' }}>
        In Stock
      </Text>
    </View>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
const Wishlist = () => {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  /** Set of productIds that were OOS on previous load — so we can show "Back in stock!" */
  const [previouslyOos, setPreviouslyOos] = useState<Set<string>>(new Set());
  const [addingToCart, setAddingToCart] = useState<string | null>(null);

  const { refreshWishlist, lastSyncedAt } = useWishlist();
  const { refreshCart } = useCart();

  useEffect(() => {
    checkAuthAndLoad();
  }, []);

  const checkAuthAndLoad = async () => {
    const authStatus = await userAuthService.isAuthenticated();
    setIsAuthenticated(authStatus);
    if (!authStatus) { setIsLoading(false); return; }
    loadWishlist();
  };

  const loadWishlist = async () => {
    try {
      setIsLoading(true);
      const response = await wishlistService.getWishlist();
      if (response.success && response.data) {
        const items = response.data.items;

        // Track which items just became back-in-stock
        setWishlistItems((prev) => {
          const prevOosIds = new Set<string>(
            prev
              .filter((i) => i.product && !i.product.inStock)
              .map((i) => i.productId),
          );
          const newlyBack = new Set<string>(
            items
              .filter(
                (i) =>
                  i.product?.inStock === true && prevOosIds.has(i.productId),
              )
              .map((i) => i.productId),
          );
          if (newlyBack.size > 0) setPreviouslyOos(newlyBack);
          return items;
        });

        // Fallback: first load — just set items
        setWishlistItems(items);
      }
    } catch (error: any) {
      console.error('Error loading wishlist:', error);
      showErrorToast('Load Failed', 'Unable to load wishlist');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (isAuthenticated) {
      loadWishlist();
    } else {
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  const removeFromWishlist = async (productId: string, productName?: string) => {
    try {
      if (typeof Haptics !== 'undefined')
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await wishlistService.removeFromWishlist(productId);
      setWishlistItems((items) => items.filter((item) => item.productId !== productId));
      showSuccessToast('Removed', `${productName || 'Item'} removed from wishlist.`);
      refreshWishlist();
    } catch (error: any) {
      showErrorToast('Failed', 'Unable to remove item from wishlist.');
    }
  };

  const addToCart = async (productId: string, productName: string) => {
    if (addingToCart) return;
    try {
      if (typeof Haptics !== 'undefined')
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setAddingToCart(productId);
      await cartService.addToCart(productId, 1);
      showSuccessToast('Added to Cart!', `${productName} added to your cart.`);
      refreshCart();
    } catch (error: any) {
      showErrorToast('Failed to Add', 'Unable to add item to cart.');
    } finally {
      setAddingToCart(null);
    }
  };

  const shareProduct = async (productId: string, productName: string) => {
    try {
      const url = `https://m2cmarkdowns.com/products/${productId}`;
      await Share.share({
        message: `Check out this amazing product: ${productName} - ${url}`,
        title: productName,
      });
    } catch {
      showErrorToast('Share Failed', 'Unable to share product.');
    }
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isLoading && !refreshing) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#111827" />
        <Text className="text-gray-500 mt-4">Loading wishlist...</Text>
      </View>
    );
  }

  // ── Auth required ─────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <View className="flex-1 bg-gray-50">
        <StatusBar barStyle="light-content" backgroundColor="#111827" />
        <View className={`bg-[#111827] ${Platform.OS === 'ios' ? 'pt-0' : 'pt-4'} pb-5 px-5`}>
          <Text className="text-white text-2xl font-extrabold tracking-tight">My Wishlist</Text>
          <Text className="text-gray-400 text-xs mt-0.5">Please login to view</Text>
        </View>
        <View className="flex-1 items-center justify-center p-8">
          <View className="w-24 h-24 rounded-full bg-gray-200 items-center justify-center mb-6">
            <Heart size={48} color="#9ca3af" />
          </View>
          <Text className="text-2xl font-extrabold text-gray-900 mb-2 text-center">Login Required</Text>
          <Text className="text-sm text-gray-500 mb-8 text-center leading-5">
            Please log in to view and save items to your wishlist.
          </Text>
          <Pressable
            onPress={() => router.push('/(auth)/Login' as any)}
            style={({ pressed }) => ({
              opacity: pressed ? 0.8 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
              shadowColor: '#111827',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 10,
              elevation: 6,
            })}
            className="bg-[#111827] px-8 py-4 rounded-2xl flex-row items-center justify-center w-full"
          >
            <Text className="text-white text-base font-bold text-center">Login to Continue</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  if (wishlistItems.length === 0) {
    return (
      <View className="flex-1 bg-gray-50">
        <StatusBar barStyle="light-content" backgroundColor="#111827" />
        <View className={`bg-[#111827] ${Platform.OS === 'ios' ? 'pt-0' : 'pt-4'} pb-5 px-5`}>
          <Text className="text-white text-2xl font-extrabold tracking-tight">My Wishlist</Text>
          <Text className="text-gray-400 text-xs mt-0.5">0 items</Text>
        </View>
        <View className="flex-1 items-center justify-center p-8">
          <View className="w-24 h-24 rounded-full bg-gray-200 items-center justify-center mb-6">
            <Heart size={48} color="#9ca3af" />
          </View>
          <Text className="text-2xl font-extrabold text-gray-900 mb-2 text-center">Your Wishlist is Empty</Text>
          <Text className="text-sm text-gray-500 mb-8 text-center leading-5 px-4">
            Save items you love to your wishlist and never lose track of them.
          </Text>
          <Pressable
            onPress={() => router.push('/(tabs)')}
            style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] })}
            className="bg-[#111827] px-8 py-4 rounded-2xl flex-row items-center gap-2"
          >
            <Text className="text-white font-bold text-base">Start Shopping</Text>
            <ArrowRight size={18} color="#ffffff" />
          </Pressable>
        </View>
      </View>
    );
  }

  // ── Counts for header ─────────────────────────────────────────────────────
  const oosCount = wishlistItems.filter(
    (i) => i.product && !i.product.inStock,
  ).length;

  // ── Main layout ────────────────────────────────────────────────────────────
  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar barStyle="light-content" backgroundColor="#111827" />

      {/* ── Page Header ─────────────────────────────────────── */}
      <View className={`bg-[#111827] ${Platform.OS === 'ios' ? 'pt-0' : 'pt-4'} pb-5 px-5`}>
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-white text-2xl font-extrabold tracking-tight">My Wishlist</Text>
            <Text className="text-gray-400 text-xs mt-0.5">
              {wishlistItems.length} item{wishlistItems.length !== 1 ? 's' : ''}
              {oosCount > 0 ? ` · ${oosCount} out of stock` : ''}
            </Text>
          </View>
          <View className="bg-gray-200 rounded-full px-3.5 py-1.5">
            <Text className="text-black font-extrabold text-xs">{wishlistItems.length}</Text>
          </View>
        </View>
      </View>

      {/* ── OOS notice banner (if some items are out of stock) ─────────────── */}
      {oosCount > 0 && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            backgroundColor: '#fef2f2',
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderBottomColor: '#fecaca',
          }}
        >
          <AlertCircle size={14} color="#dc2626" />
          <Text style={{ fontSize: 12, color: '#991b1b', flex: 1, fontWeight: '600' }}>
            {oosCount} item{oosCount !== 1 ? 's are' : ' is'} currently out of stock. We&apos;ll notify you when {oosCount !== 1 ? "they're" : "it's"} back.
          </Text>
        </View>
      )}

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#111827"
          />
        }
      >
        <View className="px-4 pt-4">

          {wishlistItems.map((item, index) => {
            if (!item.product) return null;
            const isLast = index === wishlistItems.length - 1;
            const stockLevel = resolveStockLevel(item.product);
            const isOutOfStock = stockLevel === 'out_of_stock';
            const isBackInStock = previouslyOos.has(item.productId);
            const numericStock =
              (item.product as any).availableStock ??
              (item.product as any).totalStock ??
              undefined;
            const isAddingThisItem = addingToCart === item.productId;

            // Border color by stock status
            const borderColor = isOutOfStock
              ? '#fecaca'
              : stockLevel === 'low_stock'
              ? '#fde68a'
              : 'transparent';

            return (
              <View
                key={item.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: 20,
                  overflow: 'hidden',
                  marginBottom: isLast ? 0 : 12,
                  borderWidth: 1.5,
                  borderColor,
                  shadowColor: '#000',
                  shadowOpacity: 0.06,
                  shadowRadius: 8,
                  elevation: 2,
                }}
              >
                {/* Back-in-stock banner */}
                {isBackInStock && (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      paddingHorizontal: 14,
                      paddingVertical: 7,
                      backgroundColor: '#f0fdf4',
                      borderBottomWidth: 1,
                      borderBottomColor: '#bbf7d0',
                    }}
                  >
                    <Sparkles size={12} color="#16a34a" />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#16a34a' }}>
                      Back in Stock! Add it to your cart now
                    </Text>
                  </View>
                )}

                {/* ── Product Info Row ───────────────────────── */}
                <View className="p-4 flex-row gap-3">

                  {/* Left 25% — Image */}
                  <View className="w-[25%] relative">
                    {item.product.image ? (
                      <Image
                        source={{ uri: item.product.image }}
                        style={{
                          width: '100%',
                          aspectRatio: 1,
                          borderRadius: 16,
                          opacity: isOutOfStock ? 0.5 : 1,
                        }}
                        contentFit="cover"
                        transition={300}
                      />
                    ) : (
                      <View className="w-full aspect-square rounded-2xl bg-gray-100 items-center justify-center">
                        <Package size={28} color="#d1d5db" />
                      </View>
                    )}

                    {/* OOS stamp */}
                    {isOutOfStock && (
                      <View
                        style={{
                          position: 'absolute',
                          inset: 0,
                          borderRadius: 16,
                          backgroundColor: 'rgba(255,255,255,0.4)',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <View
                          style={{
                            backgroundColor: '#dc2626',
                            borderRadius: 6,
                            paddingHorizontal: 5,
                            paddingVertical: 2,
                          }}
                        >
                          <Text style={{ color: '#fff', fontSize: 7, fontWeight: '800' }}>
                            OOS
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* Discount badge */}
                    {item.product.discount && item.product.discount > 0 ? (
                      <View className="absolute top-1 left-1 bg-gray-800 rounded-md px-1 py-0.5">
                        <Text className="text-white text-[9px] font-extrabold">
                          -{item.product.discount}%
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Right 75% — Details */}
                  <View className="flex-1">
                    {/* Name & Trash */}
                    <View className="flex-row items-start justify-between mb-1.5">
                      <Text
                        className="flex-1 text-[15px] font-bold text-gray-900 leading-5 mr-2"
                        numberOfLines={2}
                      >
                        {item.product.name}
                      </Text>
                      <Pressable
                        onPress={() => removeFromWishlist(item.productId, item.product?.name)}
                        style={({ pressed }) => ({
                          opacity: pressed ? 0.6 : 1,
                          transform: [{ scale: pressed ? 0.95 : 1 }],
                        })}
                        className="p-1 -mt-0.5"
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Trash2 size={17} color="#374151" />
                      </Pressable>
                    </View>

                    {/* Tags */}
                    <View className="flex-row flex-wrap gap-1.5">
                      {item.product.category ? (
                        <View className="bg-gray-100 px-2 py-0.5 rounded-md">
                          <Text className="text-[11px] text-gray-700 font-semibold">
                            {item.product.category}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    {/* Price */}
                    <View className="mt-2 flex-row items-center gap-2">
                      <Text className="text-[17px] font-extrabold text-gray-900">
                        {fmt(item.product.basePrice)}
                      </Text>
                      {item.product.originalPrice &&
                        item.product.originalPrice > item.product.basePrice && (
                          <Text className="text-xs text-gray-400 line-through">
                            {fmt(item.product.originalPrice)}
                          </Text>
                        )}
                    </View>

                    {/* Stock pill */}
                    <StockPill
                      level={stockLevel}
                      numericStock={
                        stockLevel === 'low_stock' ? numericStock : undefined
                      }
                    />
                  </View>
                </View>

                {/* ── Actions row ───────────────────────────────── */}
                <View className="flex-row border-t border-gray-100 bg-gray-50/50">
                  <Pressable
                    onPress={() => addToCart(item.productId, item.product!.name)}
                    disabled={isOutOfStock || isAddingThisItem}
                    style={({ pressed }) => ({
                      opacity: pressed ? 0.8 : 1,
                      backgroundColor: isOutOfStock
                        ? '#f3f4f6'
                        : isBackInStock
                        ? (pressed ? '#15803d' : '#16a34a')
                        : pressed
                        ? '#1f2937'
                        : '#111827',
                    })}
                    className="flex-1 flex-row items-center justify-center py-3.5 border-r border-gray-100"
                  >
                    {isAddingThisItem ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <ShoppingCart
                          size={16}
                          color={!isOutOfStock ? '#ffffff' : '#9ca3af'}
                        />
                        <Text
                          className={`ml-2 text-sm font-bold tracking-wide ${!isOutOfStock ? 'text-white' : 'text-gray-400'}`}
                        >
                          {isOutOfStock
                            ? 'OUT OF STOCK'
                            : isBackInStock
                            ? 'ADD NOW ✦'
                            : 'ADD TO CART'}
                        </Text>
                      </>
                    )}
                  </Pressable>

                  <Pressable
                    onPress={() => shareProduct(item.productId, item.product!.name)}
                    style={({ pressed }) => ({
                      opacity: pressed ? 0.6 : 1,
                      transform: [{ scale: pressed ? 0.95 : 1 }],
                    })}
                    className="px-6 items-center justify-center bg-white"
                  >
                    <Share2 size={18} color="#374151" />
                  </Pressable>
                </View>
              </View>
            );
          })}

          {/* ── Wishlist Tips ─────────────────────────────────────── */}
          <View className="bg-white rounded-[20px] mt-4 shadow-sm p-4">
            <View className="flex-row items-center justify-center gap-2 mb-4">
              <View className="w-8 h-8 bg-gray-100 rounded-xl items-center justify-center">
                <Tag size={15} color="#374151" />
              </View>
              <Text className="text-[15px] font-bold text-gray-900">Wishlist Tips</Text>
            </View>
            <View className="gap-3.5 pl-1">
              {[
                { icon: Heart,        label: 'Save for Later',  desc: 'Tap the heart icon on any product to save it' },
                { icon: Share2,       label: 'Share',           desc: 'Share your wishlist with family for gift ideas' },
                { icon: ShoppingCart, label: 'Add to Cart',     desc: 'Easily move in-stock items right to your cart' },
              ].map(({ icon: Icon, label, desc }, idx) => (
                <View key={idx} className="flex-row items-center gap-3">
                  <View className="w-9 h-9 bg-gray-100 rounded-xl items-center justify-center">
                    <Icon size={16} color="#4b5563" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-bold text-gray-900 text-sm">{label}</Text>
                    <Text className="text-[11px] text-gray-500 mt-0.5">{desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

        </View>
      </ScrollView>
    </View>
  );
};

export default Wishlist;
