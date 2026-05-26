'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/WebSite/ProductCard/ProductCard';
import { publicProductService, PublicProduct } from '@/services/publicProductService';

export default function FeaturedProducts() {
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      setIsLoading(true);
      try {
        const response = await publicProductService.getFeaturedProducts(4);
        if (response.success && response.data) {
          setProducts(response.data.items);
        }
      } catch (error) {
        console.error('Error fetching featured products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  if (isLoading) {
    // Skeleton that mirrors the loaded section (header row + 4-card product
    // grid). Same outer section padding as the loaded state so the page
    // doesn't reflow when the fetch resolves.
    return (
      <section className="bg-white py-8 sm:py-12 md:py-16 lg:py-20 font-sans">
        <div className="max-w-7xl 2xl:max-w-420 mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-10 md:mb-12 lg:mb-16">
            <div className="flex-1 space-y-3">
              <div className="h-7 md:h-8 w-48 md:w-64 bg-gray-200 rounded animate-pulse mx-auto lg:mx-0" />
              <div className="h-4 w-full max-w-md bg-gray-100 rounded animate-pulse mx-auto lg:mx-0" />
            </div>
            <div className="h-10 w-32 sm:w-40 bg-gray-200 rounded-lg animate-pulse shrink-0 mx-auto lg:mx-0" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="h-48 sm:h-64 md:h-72 w-full bg-gray-200 animate-pulse" />
                <div className="p-4 space-y-3">
                  <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
                  <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-1/2 bg-gray-100 rounded animate-pulse" />
                  <div className="h-9 w-full bg-gray-200 rounded animate-pulse mt-3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null; // Don't show section if no products
  }

  return (
    <section className="bg-white py-8 sm:py-12 md:py-16 lg:py-20 font-sans">
      <div className="max-w-7xl 2xl:max-w-420 mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-10 md:mb-12 lg:mb-16">
          <div className="text-center lg:text-left flex-1">
            <h2 className="text-lg sm:text-xl md:text-2xl xl:text-3xl font-bold text-[#313131] mb-2 md:mb-3">
              Featured Products
            </h2>
            <p className="text-sm sm:text-sm md:text-base lg:text-lg text-gray-500 max-w-full lg:max-w-2xl xl:max-w-3xl mx-auto lg:mx-0 leading-relaxed">
              Handpicked selection of our finest traditional textiles, crafted by master artisans
            </p>
          </div>
          
          {/* View All Button */}
          <div className="flex justify-center lg:justify-end lg:ml-8 shrink-0">
            <Link 
              href="/products"
              className="inline-block bg-gray-700 text-white px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 rounded-lg hover:bg-gray-400 transition-colors font-semibold text-xs sm:text-sm md:text-base whitespace-nowrap transform hover:scale-105 duration-200"
            >
              <span className="hidden sm:inline">View All Products</span>
              <span className="sm:hidden">View All</span>
            </Link>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
          {products.map((product) => (
            <div key={product.id} className="w-full">
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        {/* Mobile View All Button (Bottom) */}
        <div className="flex justify-center mt-8 sm:mt-10 md:mt-12 lg:hidden">
          <Link 
            href="/products"
            className="inline-block bg-gray-700 text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-lg hover:bg-gray-400 transition-colors font-semibold text-sm sm:text-base transform hover:scale-105 duration-200"
          >
            View All Products
          </Link>
        </div>
      </div>
    </section>
  );
}
