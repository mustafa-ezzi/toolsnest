import { useEffect, useMemo, useState } from "react";
import { getBanners, getBrands, getCategories, getProducts } from "../api/client";
import type { Banner, Brand, Category, Product } from "../types";
import HeroCarousel from "../components/HeroCarousel";
import BrandMarquee from "../components/BrandMarquee";
import CategoryGrid from "../components/CategoryGrid";
import BrandProductSection from "../components/BrandProductSection";
import AboutSupportBand from "../components/AboutSupportBand";

const BRAND_TAGLINES: Record<string, string> = {
  total: "Professional Tools for Every Job",
  ingco: "Make The World In Your Hands",
  makita: "Jobsite Power You Can Trust",
  dewalt: "Guaranteed Tough",
  stanley: "Make Something Great",
};

export default function LandingPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [b, br, c] = await Promise.all([
          getBanners(),
          getBrands(),
          getCategories(),
        ]);
        if (cancelled) return;
        setBanners(b);
        setBrands(br);
        setCategories(c);

        // Small page per brand for landing teasers — not the full catalog
        const brandPages = await Promise.all(
          br.map((brand) =>
            getProducts({ brand: brand.slug, page_size: "4" }).then((page) => ({
              slug: brand.slug,
              products: page.results,
            })),
          ),
        );
        if (cancelled) return;
        setProducts(brandPages.flatMap((x) => x.products));
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load storefront");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const productsByBrand = useMemo(() => {
    const map = new Map<string, Product[]>();
    for (const product of products) {
      const slug = product.brand?.slug;
      if (!slug) continue;
      const list = map.get(slug) || [];
      list.push(product);
      map.set(slug, list);
    }
    return map;
  }, [products]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-[var(--neo-muted)]">
        <div className="neo-raised rounded-3xl px-8 py-6">Loading ToolsNest...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="neo-raised rounded-[2rem] px-8 py-10">
          <h1 className="brand-font text-2xl font-bold text-[var(--neo-ink)]">
            Couldn’t load store
          </h1>
          <p className="mt-2 text-[var(--neo-muted)]">{error}</p>
          <p className="mt-4 text-sm text-[var(--neo-muted)]">
            Make sure the API is running on port 8001.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="spatial-canvas">
      <span className="spatial-orb spatial-orb--1" aria-hidden />
      <span className="spatial-orb spatial-orb--2" aria-hidden />
      <span className="spatial-orb spatial-orb--3" aria-hidden />
      <span className="spatial-orb spatial-orb--4" aria-hidden />

      <div className="spatial-layer">
        <HeroCarousel banners={banners} />
        <BrandMarquee brands={brands} />
        <CategoryGrid categories={categories} />
        <div className="mx-auto max-w-7xl px-4 pt-4">
          <h2 className="brand-font text-center text-3xl font-bold sm:text-4xl">
            <span className="section-title-accent">Shop by Brand</span>
          </h2>
          <div className="section-underline" />
          <p className="mx-auto mt-3 max-w-xl text-center text-[var(--neo-muted)]">
            Each brand brings its own color, quality, and tools for the jobsite.
          </p>
        </div>
        <div>
          {brands.map((brand) => (
            <BrandProductSection
              key={brand.id}
              brand={brand}
              products={productsByBrand.get(brand.slug) || []}
              tagline={BRAND_TAGLINES[brand.slug]}
            />
          ))}
        </div>
        <AboutSupportBand />
      </div>
    </div>
  );
}
