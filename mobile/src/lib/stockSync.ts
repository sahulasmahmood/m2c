/**
 * stockSync.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Fetches live product/variant data for every cart item and returns a diff
 * describing what has changed since the item was added to cart.
 *
 * Consumed by CartContext.syncStock(); the Cart UI reads the result array to
 * render per-item banners without knowing any fetch logic.
 */
import { publicProductService } from '@/services/publicProductService';
import { CartItem } from '@/services/cartService';

// Re-export so callers import from one place.
export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export interface StockSyncResult {
  /** cart item id */
  itemId: string;
  productId: string;
  productName: string;

  /* ── Stock ─────────────────────────────── */
  availableStock: number;
  stockStatus: StockStatus;
  wasOutOfStock: boolean;  // item was OOS before, now back in stock

  /* ── Price ─────────────────────────────── */
  oldPrice: number;
  newPrice: number;
  priceChanged: boolean;

  /* ── Quantity ───────────────────────────── */
  oldQty: number;
  /** qty clamped to availableStock; equals oldQty if no clamp needed */
  clampedQty: number;
  qtyAdjusted: boolean;
}

/** Threshold below which we call stock "low". */
const LOW_STOCK_THRESHOLD = 5;

function stockStatus(available: number): StockStatus {
  if (available <= 0) return 'out_of_stock';
  if (available <= LOW_STOCK_THRESHOLD) return 'low_stock';
  return 'in_stock';
}

/**
 * Run a stock check for every item in `cartItems`.
 * Items whose product fetch fails are skipped (they won't appear in the result).
 */
export async function syncCartStock(
  cartItems: CartItem[],
): Promise<StockSyncResult[]> {
  const results: StockSyncResult[] = [];

  await Promise.allSettled(
    cartItems.map(async (item) => {
      try {
        const res = await publicProductService.getProduct(item.productId);
        if (!res.success || !res.data) return;

        const p = res.data;

        // Resolve price and available stock — prefer variant if present.
        let livePrice: number;
        let availableStock: number;

        if (item.variantId && p.variants) {
          const variant = p.variants.find((v) => v.id === item.variantId);
          if (variant) {
            livePrice =
              variant.adminFixedPrice != null
                ? variant.adminFixedPrice
                : variant.price;
            availableStock = variant.stock;
          } else {
            // Variant no longer exists — treat as OOS.
            livePrice = item.price;
            availableStock = 0;
          }
        } else {
          livePrice =
            p.adminFixedPrice != null ? p.adminFixedPrice : p.basePrice;
          availableStock = p.inventory?.availableStock ?? p.totalStock ?? 0;
        }

        availableStock = Math.max(0, availableStock);
        const oldQty = item.quantity;
        const clampedQty =
          availableStock > 0 ? Math.min(oldQty, availableStock) : oldQty;
        const qtyAdjusted = clampedQty < oldQty;

        const oldPrice = item.price;
        const priceChanged = Math.abs(oldPrice - livePrice) >= 0.01;

        const status = stockStatus(availableStock);
        // "wasOutOfStock" — the item was originally OOS (inStock === false) but
        // is now available again.
        const wasOutOfStock =
          item.product?.inStock === false && status !== 'out_of_stock';

        results.push({
          itemId: item.id,
          productId: item.productId,
          productName: item.product?.name ?? p.name,
          availableStock,
          stockStatus: status,
          wasOutOfStock,
          oldPrice,
          newPrice: livePrice,
          priceChanged,
          oldQty,
          clampedQty,
          qtyAdjusted,
        });
      } catch {
        // Network error for this item — skip silently.
      }
    }),
  );

  return results;
}
