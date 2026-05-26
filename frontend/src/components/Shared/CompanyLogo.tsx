'use client';

/**
 * Shared logo component for every surface that displays the company brand —
 * Header, Footer, login pages, vendor/checker headers, etc.
 *
 * What it does
 *   - Fetches the admin-uploaded company logo from the public company-info
 *     endpoint exactly once per page session (module-level promise cache —
 *     so a Header + Footer mounted together don't both hit the API).
 *   - While the fetch is in flight, renders a neutral pulsing skeleton in
 *     the same layout box the final logo will occupy. No flash of the
 *     static fallback logo before the dynamic one resolves, which used to
 *     confuse users who'd briefly see the bundled M2C placeholder and
 *     then watch it swap to whatever the admin had uploaded.
 *   - When the fetch resolves with a logo URL → renders an <img> with the
 *     dynamic URL.
 *   - When the fetch resolves WITHOUT a URL (or errors out) → renders the
 *     bundled fallback as a Next.js <Image> with width/height/sizes/priority
 *     wired through.
 *
 * Why a module-level cache and not React Query / Context
 *   This is a single string fetched on first paint and cached for the
 *   entire session. There is no invalidation story and no per-component
 *   variation. A 30-line module cache is the right size for the problem,
 *   and avoids pulling in a heavier client-state dependency.
 */

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { companyInfoService } from '@/services/companyInfoService';

// `undefined` = not yet fetched (consumers should render the skeleton)
// `null`      = fetch resolved but admin hasn't uploaded a logo (use bundled fallback)
// `<url>`     = fetch resolved with an admin-uploaded logo URL
let cachedLogoUrl: string | null | undefined = undefined;
let inflightFetch: Promise<string | null> | null = null;

function loadCompanyLogo(): Promise<string | null> {
  if (cachedLogoUrl !== undefined) return Promise.resolve(cachedLogoUrl);
  if (inflightFetch) return inflightFetch;
  inflightFetch = companyInfoService
    .getPublicCompanyInfo()
    .then(info => {
      cachedLogoUrl = info.companyLogo ?? null;
      return cachedLogoUrl;
    })
    .catch(() => {
      cachedLogoUrl = null;
      return null;
    })
    .finally(() => {
      inflightFetch = null;
    });
  return inflightFetch;
}

interface CompanyLogoProps {
  /** Tailwind/CSS classes applied to the rendered <img> and the fallback <Image>. */
  className?: string;
  /**
   * Classes applied to the loading-state skeleton div. MUST include sizing
   * (height + aspect-ratio or width) so the skeleton occupies the same box
   * the final logo will, avoiding layout shift when the fetch resolves.
   * Falls back to `className` if not provided.
   */
  skeletonClassName?: string;
  /** Intrinsic width for the bundled fallback Image (no effect on dynamic img). */
  fallbackWidth?: number;
  /** Intrinsic height for the bundled fallback Image. */
  fallbackHeight?: number;
  /** Next.js `sizes` hint for the bundled fallback. */
  fallbackSizes?: string;
  /** Mark the fallback Image as LCP-priority (header / hero). */
  priority?: boolean;
  /** Alt text for both the dynamic <img> and the static fallback. */
  alt?: string;
}

export default function CompanyLogo({
  className,
  skeletonClassName,
  fallbackWidth = 200,
  fallbackHeight = 100,
  fallbackSizes,
  priority,
  alt = 'Company Logo',
}: CompanyLogoProps) {
  const [logoUrl, setLogoUrl] = useState<string | null | undefined>(cachedLogoUrl);

  useEffect(() => {
    if (cachedLogoUrl !== undefined) {
      setLogoUrl(cachedLogoUrl);
      return;
    }
    let cancelled = false;
    loadCompanyLogo().then(url => {
      if (!cancelled) setLogoUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Still loading — render skeleton in the layout box the logo will fill.
  // The skeleton bg color is NOT hardcoded here: surfaces sit on widely
  // different backgrounds (white nav, black login pages, dark footer) and a
  // single hardcoded bg would look broken on at least one of them. Each
  // consumer is expected to include an appropriate `bg-*` class in
  // `skeletonClassName` — e.g. `bg-gray-100` on light surfaces, `bg-white/10`
  // on dark surfaces.
  if (logoUrl === undefined) {
    return (
      <div
        aria-hidden="true"
        className={`${skeletonClassName ?? className ?? ''} animate-pulse rounded`}
      />
    );
  }

  // Admin uploaded a logo — render it directly. We use a raw <img> here
  // (rather than next/image) because the URL is dynamic and arrives after
  // hydration; next/image's optimization pipeline doesn't gain us anything
  // for a single tiny logo and the Cloudinary CDN is already optimal.
  if (logoUrl) {
    return <img src={logoUrl} alt={alt} className={className} />;
  }

  // No admin-uploaded logo — fall back to the bundled file.
  return (
    <Image
      src="/assets/logo/m2c-logo.png"
      alt={alt}
      width={fallbackWidth}
      height={fallbackHeight}
      sizes={fallbackSizes}
      className={className}
      priority={priority}
    />
  );
}
