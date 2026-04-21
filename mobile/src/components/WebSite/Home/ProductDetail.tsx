import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Pressable,
  ActivityIndicator, useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Star, Heart, Truck, Shield, RotateCcw, Package,
  ChevronDown, ChevronUp, ShoppingCart, Tag,
} from 'lucide-react-native';
import { PublicProduct } from '@/services/publicProductService';
import { cartService } from '@/services/cartService';
import { wishlistService } from '@/services/wishlistService';
import { userAuthService } from '@/services/userAuthService';
import { showSuccessToast, showErrorToast } from '@/lib/toast-utils';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';



interface ProductDetailProps {
  product: PublicProduct;
  productId: string;
}

export default function ProductDetail({ product, productId }: ProductDetailProps) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { refreshCart, addToCart: addToGlobalCart } = useCart();
  const {
    isInWishlist: checkIsInWishlist,
    addToWishlist: addToGlobalWishlist,
    removeFromWishlist: removeFromGlobalWishlist,
  } = useWishlist();
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [showAllDetails, setShowAllDetails] = useState(false);

  // Use the global state for initial UI state
  const isWishlisted = checkIsInWishlist(productId);

  // ── Derived values ─────────────────────────────────────────────────────
  const displayImages = selectedVariant?.images?.length > 0
    ? selectedVariant.images.map((url: string) => ({ url }))
    : product.images || [];

  const currentPrice = selectedVariant
    ? (selectedVariant.adminFixedPrice ?? selectedVariant.price)
    : (product.adminFixedPrice ?? product.basePrice);
  const originalPrice = selectedVariant
    ? selectedVariant.originalPrice
    : product.originalPrice;
  const currentImageUrl = displayImages[selectedImage]?.url;
  const savings = originalPrice && originalPrice > currentPrice ? originalPrice - currentPrice : 0;

  const currentStock = selectedVariant
    ? selectedVariant.stock
    : (product.inventory?.baseStock ?? product.inventory?.currentStock ?? (product.hasVariants ? 0 : product.totalStock) ?? 0);
  const isActuallyInStock = product.inStock && currentStock > 0;

  // ── Helpers ────────────────────────────────────────────────────────────
  const fmt = (n: number) => `₹${n.toFixed(2)}`;

  const renderStars = (rating: number) =>
    [0, 1, 2, 3, 4].map(i => (
      <Star
        key={i}
        size={16}
        color={i < Math.floor(rating) ? '#111827' : '#e5e7eb'}
        fill={i < Math.floor(rating) ? '#111827' : 'transparent'}
      />
    ));

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleAddToCart = async () => {
    const auth = await userAuthService.isAuthenticated();
    if (!auth) {
      showErrorToast('Login Required', 'Please login to add items to cart');
      setTimeout(() => router.push('/(auth)/Login' as any), 1500);
      return;
    }

    setIsAddingToCart(true);
    try {
      if (typeof Haptics !== 'undefined') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      
      // Use optimistic context method
      await addToGlobalCart(product.id, quantity, selectedVariant?.id);

      const variantInfo = selectedVariant
        ? ` (${selectedVariant.size} - ${selectedVariant.color})`
        : (product.singleUnitSize || product.singleUnitColor 
            ? ` (${[product.singleUnitSize, product.singleUnitColor].filter(Boolean).join(' - ')})` 
            : '');

      showSuccessToast(
        'Added to Cart!',
        `${quantity} x ${product.name}${variantInfo} has been added to your cart.`
      );
      
      setQuantity(1);
    } catch (e: any) {
      console.error('Error adding to cart:', e);
      showErrorToast('Failed to Add', e.message || 'Unable to add item to cart. Please try again.');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleToggleWishlist = async () => {
    try {
      if (isTogglingWishlist) return;
      setIsTogglingWishlist(true);
      
      const impactStyle = isWishlisted ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light;
      if (typeof Haptics !== 'undefined') await Haptics.impactAsync(impactStyle);
      
      if (isWishlisted) {
        await removeFromGlobalWishlist(product.id);
        showSuccessToast('Removed', 'Product removed from wishlist');
      } else {
        await addToGlobalWishlist(product.id);
        showSuccessToast('Wishlisted', 'Product saved for later');
      }
    } catch (e: any) {
      showErrorToast('Error', e.message || 'Unable to update wishlist');
    } finally {
      setIsTogglingWishlist(false);
    }
  };

  const handleBuyNow = async () => {
    const auth = await userAuthService.isAuthenticated();
    if (!auth) {
      showErrorToast('Login Required', 'Please login to checkout');
      setTimeout(() => router.push('/(auth)/Login' as any), 1500);
      return;
    }

    try {
      if (typeof Haptics !== 'undefined') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
      // Logic for Buy Now usually involves adding to cart then redirecting
      await cartService.addToCart(product.id, quantity, selectedVariant?.id);
      showSuccessToast('Proceeding to Checkout', `Taking you to checkout with ${product.name}.`);
      router.push('/(any)/cart' as any); // Redirecting to cart/checkout
    } catch (e: any) {
      showErrorToast('Checkout Failed', 'Unable to proceed to checkout. Please try again.');
    }
  };

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >

      {/* ── Hero Image ─────────────────────────────────────────────────────── */}
      <View className="bg-white">
        {/* Main image carousel */}
        <View className="bg-gray-100" style={{ height: Math.min(width, 500) }}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const newIndex = Math.round(e.nativeEvent.contentOffset.x / width);
              if (newIndex !== selectedImage) setSelectedImage(newIndex);
            }}
          >
            {displayImages.length > 0 ? (
              displayImages.map((img: any, idx: number) => (
                <View key={idx} style={{ width, height: Math.min(width, 500) }} className="bg-white">
                  <Image
                    source={{ uri: img.url }}
                    transition={300}
                    contentFit="contain"
                    style={{ width, height: Math.min(width, 500) }}
                    placeholder={null}
                    accessibilityLabel={`Product image ${idx + 1}`}
                  />
                </View>
              ))
            ) : (
              <View style={{ width, height: Math.min(width, 500) }} className="items-center justify-center">
                <Package size={80} color="#d1d5db" />
              </View>
            )}
          </ScrollView>

          {/* Discount ribbon */}
          {product.discount && product.discount > 0 && (
            <View className="absolute top-4 left-0 bg-[#111827] px-3.5 py-1 rounded-r-lg z-10">
              <Text className="text-white font-extrabold text-xs">
                {product.discount}% OFF
              </Text>
            </View>
          )}

          {/* Out of stock badge */}
          {!isActuallyInStock && (
            <View className="absolute top-4 right-4 bg-gray-500/85 rounded-lg px-3 py-1 z-10">
              <Text className="text-white font-bold text-xs">Out of Stock</Text>
            </View>
          )}

          {/* Pagination Indicators (Dots) */}
          {displayImages.length > 1 && (
            <View className="absolute bottom-4 left-0 right-0 flex-row justify-center gap-1.5 z-10">
              {displayImages.map((_: any, idx: number) => (
                <View
                  key={idx}
                  className={`w-2 h-2 rounded-full ${selectedImage === idx ? 'bg-[#111827] w-4' : 'bg-gray-300'}`}
                />
              ))}
            </View>
          )}

          <Pressable
            onPress={handleToggleWishlist}
            disabled={isTogglingWishlist}
            accessibilityRole="button"
            accessibilityLabel={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
            style={({ pressed }) => ({
              transform: [{ scale: pressed ? 0.92 : 1 }],
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 10,
              elevation: 8,
            })}
            className="absolute bottom-6 right-6 w-12 h-12 rounded-full bg-white/95 items-center justify-center z-20 border border-gray-100/50"
          >
            {isTogglingWishlist
              ? <ActivityIndicator size="small" color="#ef4444" />
              : <Heart
                  size={24}
                  color={isWishlisted ? '#ef4444' : '#111827'}
                  fill={isWishlisted ? '#ef4444' : 'transparent'}
                />
            }
          </Pressable>
        </View>

        {/* Thumbnail strip */}
        {displayImages.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 14, paddingVertical: 12, gap: 8 }}
          >
            {displayImages.map((img: any, idx: number) => (
              <Pressable
                key={idx}
                onPress={() => setSelectedImage(idx)}
                accessibilityRole="button"
                accessibilityLabel={`View image ${idx + 1}`}
                style={({ pressed }) => ({
                  borderWidth: 2.5,
                  borderColor: selectedImage === idx ? '#111827' : '#e5e7eb',
                  opacity: pressed ? 0.8 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }]
                })}
                className="w-16 h-16 rounded-xl overflow-hidden"
              >
                {img.url ? (
                  <Image 
                    source={{ uri: img.url }} 
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                    transition={200}
                  />
                ) : (
                  <View className="flex-1 items-center justify-center bg-gray-100">
                    <Package size={20} color="#d1d5db" />
                  </View>
                )}
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>

      {/* ── Product Header ──────────────────────────────────────────────────── */}
      <View className="bg-white mt-2 px-5 pt-5 pb-1">
        {/* Category breadcrumb */}
        {product.category && (
          <Text className="text-[11px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
            {product.category}{product.subCategory ? ` › ${product.subCategory}` : ''}
          </Text>
        )}

        {/* Product name */}
        <Text className="text-[22px] font-extrabold text-gray-900 leading-[30px] mb-3">
          {product.name}
        </Text>

        {/* Star rating row */}
        <View className="flex-row items-center mb-4">
          <View className="flex-row mr-2">{renderStars(product.rating || 0)}</View>
          <Text className="text-[13px] font-bold text-gray-700">
            {(product.rating ?? 0).toFixed(1)}
          </Text>
          <Text className="text-[13px] text-gray-400 ml-1">
            ({product.reviews ?? 0} reviews)
          </Text>
        </View>

        {/* Price card */}
        <View
          className="bg-white rounded-2xl p-4 mb-4 shadow-sm"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          <View className="flex-row items-baseline flex-wrap gap-2">
            <Text className="text-[32px] font-black text-gray-900">{fmt(currentPrice)}</Text>
            {savings > 0 && (
              <>
                <Text className="text-[18px] text-gray-400 line-through">{fmt(originalPrice!)}</Text>
                <View className="bg-green-50 rounded-lg px-2 py-0.5">
                  <Text className="text-[13px] font-bold text-green-700">Save {fmt(savings)}</Text>
                </View>
              </>
            )}
          </View>
          <Text className="text-xs text-gray-500 mt-1">Price includes all taxes</Text>
        </View>
      </View>

      {/* ── Variants ────────────────────────────────────────────────────────── */}
      {product.hasVariants && product.variants && product.variants.length > 0 && (
        <View className="bg-white mt-2 px-5 py-4.5">
          <Text className="text-base font-bold text-gray-900 mb-3">
            Select Variant:{' '}
            <Text className="text-gray-500 font-medium">
              {selectedVariant
                ? `${selectedVariant.size} — ${selectedVariant.color}`
                : 'Choose one'}
            </Text>
          </Text>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={{ paddingRight: 20 }}
          >
            <View className="flex-row">
            {/* Base variant */}
              <Pressable
                onPress={async () => { 
                  if (typeof Haptics !== 'undefined') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedVariant(null); setSelectedImage(0); setQuantity(1); 
                }}
                accessibilityRole="button"
                accessibilityLabel="Select Base Variant"
                style={({ pressed }) => ({
                  borderWidth: 2,
                  borderColor: !selectedVariant ? '#111827' : '#e5e7eb',
                  backgroundColor: !selectedVariant ? '#f9fafb' : '#ffffff',
                  opacity: pressed ? 0.9 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                  minHeight: 160
                })}
                className="w-[140px] p-3 rounded-2xl mr-3 flex-shrink-0"
              >
                <View className="w-full h-[80px] rounded-xl bg-gray-50 mb-2 overflow-hidden items-center justify-center">
                  {product.images && product.images.length > 0 ? (
                    <Image
                      source={{ uri: product.images.find(i => i.isPrimary)?.url || product.images[0].url }}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="contain"
                      transition={200}
                    />
                  ) : (
                    <Package size={24} color="#d1d5db" />
                  )}
                </View>
                <Text className="text-[13px] font-bold text-gray-900 leading-tight" numberOfLines={1}>
                  {product.singleUnitSize || product.singleUnitColor || 'Base Unit'}
                </Text>
                {product.singleUnitColor && (
                  <View className="flex-row items-center mt-1 gap-1">
                    {product.singleUnitColorHex && (
                      <View
                        className="w-3.5 h-3.5 rounded-full border border-gray-200"
                        style={{ backgroundColor: product.singleUnitColorHex }}
                      />
                    )}
                    <Text className="text-[10px] text-gray-500 font-medium">{product.singleUnitColor}</Text>
                  </View>
                )}
                <View className="mt-auto">
                  <Text className="text-sm font-extrabold text-gray-900">
                    {fmt(product.adminFixedPrice || product.basePrice)}
                  </Text>
                  <Text
                    className="text-[10px] mt-0.5"
                    style={{
                      color: (product.inventory?.baseStock ?? product.inventory?.currentStock ?? product.totalStock) > 0
                        ? '#16a34a' : '#ef4444',
                    }}
                  >
                    {(product.inventory?.baseStock ?? product.inventory?.currentStock ?? product.totalStock) > 0
                      ? `${product.inventory?.baseStock ?? product.inventory?.currentStock ?? product.totalStock} in stock`
                      : 'Out of stock'}
                  </Text>
                </View>
              </Pressable>

            {/* Named variants */}
            {product.variants.map((variant: any) => (
              <Pressable
                key={variant.id}
                onPress={async () => {
                  if (typeof Haptics !== 'undefined') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedVariant(selectedVariant?.id === variant.id ? null : variant);
                  setSelectedImage(0);
                  setQuantity(1);
                }}
                accessibilityRole="button"
                accessibilityLabel={`Select ${variant.size} ${variant.color} variant`}
                style={({ pressed }) => ({
                  borderWidth: 2,
                  borderColor: selectedVariant?.id === variant.id ? '#111827' : '#e5e7eb',
                  backgroundColor: selectedVariant?.id === variant.id ? '#f9fafb' : '#ffffff',
                  opacity: pressed ? 0.9 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                  minHeight: 160
                })}
                className="w-[140px] p-3 rounded-2xl mr-3 flex-shrink-0"
              >
                <View className="w-full h-[80px] rounded-xl bg-gray-50 mb-2 overflow-hidden items-center justify-center">
                  {variant.images?.length > 0 ? (
                    <Image
                      source={{ uri: variant.images[0] }}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="contain"
                      transition={200}
                    />
                  ) : (
                    <Package size={24} color="#d1d5db" />
                  )}
                </View>
                <Text className="text-[13px] font-bold text-gray-900 leading-tight" numberOfLines={1}>
                  {variant.size || 'Standard Size'}
                </Text>
                <View className="flex-row items-center mt-1 gap-1">
                  {variant.colorHex && (
                    <View
                      className="w-3.5 h-3.5 rounded-full border border-gray-200"
                      style={{ backgroundColor: variant.colorHex }}
                    />
                  )}
                  <Text className="text-[10px] text-gray-500 font-medium">{variant.color || 'Default Color'}</Text>
                </View>
                <View className="mt-auto">
                  <Text className="text-sm font-extrabold text-gray-900">
                    {fmt(variant.adminFixedPrice ?? variant.price)}
                  </Text>
                  {variant.originalPrice && variant.originalPrice > (variant.adminFixedPrice ?? variant.price) && (
                    <View className="flex-row items-center gap-1.5 mt-0.5">
                      <Text className="text-[10px] text-gray-400 line-through">{fmt(variant.originalPrice)}</Text>
                      {variant.discount && variant.discount > 0 && (
                        <Text className="text-[10px] font-bold text-green-600">-{variant.discount}%</Text>
                      )}
                    </View>
                  )}
                </View>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>
      )}

      {/* ── Product Specs (For non-variant items) ────────────────────────── */}
      {!product.hasVariants && (product.singleUnitSize || product.singleUnitColor) && (
        <View className="bg-white mt-2 px-5 py-4.5">
          <Text className="text-[15px] font-bold text-gray-900 mb-3">Product Attributes</Text>
          
          <View className="flex-row flex-wrap gap-2">
            {product.singleUnitSize && (
              <View className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 flex-row items-center">
                <Text className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mr-2">Size</Text>
                <Text className="text-[13px] font-bold text-gray-900">{product.singleUnitSize}</Text>
              </View>
            )}

            {product.singleUnitColor && (
              <View className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 flex-row items-center">
                <Text className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mr-2">Color</Text>
                <View className="flex-row items-center gap-1.5">
                  {product.singleUnitColorHex && (
                    <View
                      className="w-3.5 h-3.5 rounded-full border border-gray-200"
                      style={{ backgroundColor: product.singleUnitColorHex }}
                    />
                  )}
                  <Text className="text-[13px] font-bold text-gray-900">{product.singleUnitColor}</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      )}

      {/* ── Purchase Panel ──────────────────────────────────────────────────── */}
      <View className="bg-white mt-2 px-5 py-5">
        {/* Stock status */}
        <View className="flex-row items-center mb-3">
          <View
            className="w-2.5 h-2.5 rounded-full mr-2"
            style={{ backgroundColor: isActuallyInStock ? '#22c55e' : '#6b7280' }}
          />
          {isActuallyInStock ? (
            <>
              <Text className="text-sm font-bold text-green-700">In stock</Text>
              <Text className="text-[13px] text-gray-500 ml-1.5">({currentStock} available)</Text>
            </>
          ) : (
            <Text className="text-sm font-bold text-red-600">Out of Stock</Text>
          )}
        </View>

        {/* Dispatch timeline */}
        {product.dispatchTimeline && (
          <View className="bg-blue-50 rounded-xl p-3 mb-4 flex-row items-center gap-2">
            <Truck size={16} color="#111827" />
            <Text className="text-xs text-blue-800 flex-1">
              <Text className="font-bold">Dispatch: </Text>
              {product.dispatchTimeline.processingDays}d processing + {product.dispatchTimeline.shippingDays}d shipping{' '}
              <Text className="font-bold">(Total: {product.dispatchTimeline.totalDays} days)</Text>
            </Text>
          </View>
        )}

        {isActuallyInStock && (
          <View className="flex-row items-center justify-center gap-3">
            <Text className="text-sm font-bold text-gray-700">Quantity Selection Below</Text>
          </View>
        )}
      </View>

      {/* ── Product Details ─────────────────────────────────────────────────── */}
      <View className="bg-white mt-2 px-5 py-6">
        <Text className="text-xl font-bold text-gray-900 mb-6">Product Details</Text>

        {/* Spec table with better spacing */}
        <View className="mb-6">
          {[
            { label: 'Category',     value: product.category },
            { label: 'Sub Category', value: product.subCategory },
            { label: 'Material',     value: product.material },
            { label: 'Fabric Type',  value: product.fabricType },
            { label: 'Dimensions',   value: product.dimensions },
            { label: 'Weight',       value: product.weight },
          ].map((item, idx) => item.value && (
            <View key={idx} className="flex-row items-center border-b border-gray-50 py-3.5">
              <Text className="w-1/3 text-sm font-semibold text-gray-400 capitalize">{item.label}</Text>
              <Text className="flex-1 text-sm font-bold text-gray-800 text-right">{item.value}</Text>
            </View>
          ))}
        </View>

        {/* Info & Specs Group */}
        <View className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-gray-900">Specs & Info</Text>
            <TouchableOpacity
              onPress={() => setShowAllDetails(v => !v)}
              className="flex-row items-center bg-white px-3 py-1.5 rounded-full border border-gray-200"
            >
              <Text className="text-xs font-bold text-blue-600 mr-1">
                {showAllDetails ? 'Show Less' : 'Full Details'}
              </Text>
              {showAllDetails ? <ChevronUp size={14} color="#111827" /> : <ChevronDown size={14} color="#111827" />}
            </TouchableOpacity>
          </View>

          {showAllDetails ? (
            <View className="space-y-5">
              {/* About description */}
              <View>
                <Text className="text-xs font-bold text-gray-400 uppercase mb-2">Description</Text>
                <Text className="text-sm text-gray-600 leading-6">{product.description}</Text>
              </View>

              {/* Fabric Specs */}
              {product.fabricSpecifications && (
                <View className="pt-4 border-t border-gray-100">
                  <Text className="text-xs font-bold text-gray-400 uppercase mb-3">Specifications</Text>
                  {Object.entries(product.fabricSpecifications).map(([key, value]) => {
                    if (key === 'careInstructions') return null;
                    return (
                      <View key={key} className="flex-row items-start mb-2.5">
                        <View className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 mr-2.5" />
                        <Text className="text-sm text-gray-600 flex-1">
                          <Text className="font-bold capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}: </Text>
                          {Array.isArray(value) ? value.join(', ') : String(value)}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Tags */}
              {product.tags && product.tags.length > 0 && (
                <View className="pt-4 border-t border-gray-100">
                  <Text className="text-xs font-bold text-gray-400 uppercase mb-3">Registry Tags</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {product.tags.map((tag, i) => (
                      <View key={i} className="bg-white px-3 py-1.5 rounded-lg border border-gray-100">
                        <Text className="text-[11px] font-bold text-gray-500">{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          ) : (
            <Text className="text-sm text-gray-500 leading-5" numberOfLines={2}>
              {product.description}
            </Text>
          )}
        </View>
      </View>

      {/* ── Care Instructions ───────────────────────────────────────────────── */}
      {product.fabricSpecifications &&
        typeof product.fabricSpecifications === 'object' &&
        'careInstructions' in product.fabricSpecifications &&
        Array.isArray((product.fabricSpecifications as any).careInstructions) &&
        (product.fabricSpecifications as any).careInstructions.length > 0 && (
          <View className="bg-white mt-2 px-5 py-5">
            <Text className="text-[18px] font-extrabold text-gray-900 mb-3.5">Care Instructions</Text>
            {(product.fabricSpecifications as any).careInstructions.map((instr: string, i: number) => (
              <View key={i} className="flex-row items-start bg-gray-50 rounded-xl p-3 mb-2">
                <View className="w-6 h-6 rounded-full bg-[#111827] items-center justify-center mr-3">
                  <Text className="text-amber-400 text-[11px] font-extrabold">{i + 1}</Text>
                </View>
                <Text className="text-[13px] text-gray-700 flex-1 leading-5">{instr}</Text>
              </View>
            ))}
          </View>
        )}

      {/* ── Why choose this product ─────────────────────────────────────────── */}
      <View className="bg-white mt-2 px-5 py-6">
        <Text className="text-xl font-bold text-gray-900 mb-5">
          Why choose this product?
        </Text>
        {[
          {
            icon: Truck, color: '#16a34a', bg: '#f0fdf4',
            title: 'Fast Dispatch',
            subtitle: product.dispatchTimeline
              ? `Ships in ${product.dispatchTimeline.totalDays} days`
              : 'Quick delivery',
          },
          {
            icon: Shield, color: '#111827', bg: '#eff6ff',
            title: 'Quality Guarantee',
            subtitle: 'Premium materials and craftsmanship',
          },
          {
            icon: RotateCcw, color: '#9333ea', bg: '#faf5ff',
            title: '30-Day Returns',
            subtitle: 'Easy returns and exchanges',
          },
        ].map(({ icon: Icon, color, bg, title, subtitle }) => (
          <View
            key={title}
            className="flex-row items-center rounded-2xl p-3.5 mb-2.5"
            style={{ backgroundColor: bg }}
          >
            <View
              className="w-11 h-11 rounded-xl items-center justify-center mr-3.5"
              style={{ backgroundColor: color + '20' }}
            >
              <Icon size={22} color={color} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-gray-900">{title}</Text>
              <Text className="text-xs text-gray-500 mt-0.5">{subtitle}</Text>
            </View>
          </View>
        ))}
      </View>

      </ScrollView>

      {/* ── Sticky Action Bar ─────────────────────────────────────────────── */}
      {isActuallyInStock && (
        <View
          className="bg-white border-t border-gray-100 px-4 py-3 flex-row items-center gap-4"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        >
          {/* Quantity selector (Mini) */}
          <View className="flex-row items-center bg-gray-100 rounded-xl h-12">
            <TouchableOpacity
              onPress={() => setQuantity((q: number) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="px-3 items-center justify-center"
            >
              <Text className="text-lg font-bold" style={{ color: quantity <= 1 ? '#9ca3af' : '#111827' }}>−</Text>
            </TouchableOpacity>
            <View className="min-w-[32px] items-center">
              <Text className="text-base font-extrabold text-gray-900">{quantity}</Text>
            </View>
            <TouchableOpacity
              onPress={() => setQuantity((q: number) => Math.min(currentStock, q + 1))}
              className="px-3 items-center justify-center"
            >
              <Text className="text-lg font-bold text-gray-900">+</Text>
            </TouchableOpacity>
          </View>

          {/* Primary Action */}
          <Pressable
            onPress={handleAddToCart}
            disabled={isAddingToCart}
            accessibilityRole="button"
            accessibilityLabel="Add to Cart"
            style={({ pressed }) => ({
              opacity: pressed ? 0.7 : 1,
            })}
            className="flex-1 bg-[#111827] h-12 rounded-xl flex-row items-center justify-center gap-2"
          >
            {isAddingToCart
              ? <ActivityIndicator size="small" color="#ffffff" />
              : <ShoppingCart size={18} color="#ffffff" />
            }
            <Text className="text-[15px] font-bold text-white">
              {isAddingToCart ? 'Adding…' : 'Add to Cart'}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
