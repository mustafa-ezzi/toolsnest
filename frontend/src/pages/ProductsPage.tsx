import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useSearchParams } from "react-router-dom";
import { animate } from "animejs";
import { stagger } from "animejs/utils";
import { getBrands, getCategories, getProducts } from "../api/client";
import type { Brand, Category, Product } from "../types";
import ProductCard from "../components/ProductCard";
import { ProductGridSkeleton } from "../components/Skeleton";
import { useReducedMotion } from "../hooks/useReducedMotion";

const PAGE_SIZE = 24;

export default function ProductsPage() {
  const [params, setParams] = useSearchParams();
  const brand = params.get("brand") || "";
  const category = params.get("category") || "";
  const q = params.get("q") || "";

  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [localQ, setLocalQ] = useState(q);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const previousLengthRef = useRef(0);
  const loadingMoreRef = useRef(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    getBrands().then(setBrands).catch(() => setBrands([]));
    getCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setLocalQ(q);
  }, [q]);

  // Reset and load first page when filters change
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setProducts([]);
    setPage(1);
    setHasMore(false);
    loadingMoreRef.current = false;

    getProducts({
      brand: brand || undefined,
      category: category || undefined,
      search: q || undefined,
      page: "1",
      page_size: String(PAGE_SIZE),
    })
      .then((data) => {
        if (cancelled) return;
        setProducts(data.results);
        setCount(data.count);
        setHasMore(Boolean(data.next));
        setPage(1);
      })
      .catch(() => {
        if (!cancelled) {
          setProducts([]);
          setCount(0);
          setHasMore(false);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [brand, category, q]);

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || !hasMore || loading) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const data = await getProducts({
        brand: brand || undefined,
        category: category || undefined,
        search: q || undefined,
        page: String(nextPage),
        page_size: String(PAGE_SIZE),
      });
      setProducts((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        const appended = data.results.filter((p) => !seen.has(p.id));
        return [...prev, ...appended];
      });
      setCount(data.count);
      setHasMore(Boolean(data.next));
      setPage(nextPage);
    } catch {
      /* keep current list; user can scroll again */
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [brand, category, q, hasMore, loading, page]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          void loadMore();
        }
      },
      { root: null, rootMargin: "400px 0px", threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadMore, products.length]);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid || reduceMotion || products.length === 0 || loading) {
      previousLengthRef.current = products.length;
      return;
    }
    const cards = Array.from(grid.querySelectorAll(".product-card"));
    const previousLength = previousLengthRef.current;
    const newCards = cards.slice(previousLength);
    previousLengthRef.current = products.length;
    if (newCards.length === 0) return;

    const anim = animate(newCards, {
      opacity: [0, 1],
      translateY: [18, 0],
      duration: 420,
      ease: "out(3)",
      delay: stagger(55),
    });
    return () => {
      anim.pause();
    };
  }, [products, loading, reduceMotion]);

  const title = useMemo(() => {
    if (brand) {
      const b = brands.find((x) => x.slug === brand);
      return b ? `${b.name} Products` : "Products";
    }
    if (category) {
      const c = categories.find((x) => x.slug === category);
      return c ? c.name : "Products";
    }
    if (q) return `Results for “${q}”`;
    return "All Products";
  }, [brand, category, q, brands, categories]);

  function updateFilter(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  }

  function onFilterSearch(e: FormEvent) {
    e.preventDefault();
    updateFilter("q", localQ.trim());
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8 animate-fade-up">
        <h1 className="brand-font text-3xl font-bold text-slate-900 sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 text-slate-500">
          {loading
            ? "Loading…"
            : `Showing ${products.length} of ${count} item${count === 1 ? "" : "s"}`}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm animate-fade-up">
          <div className="mb-4 flex items-center gap-2">
            <span className="text-[#0F4C5C]">⚙</span>
            <h2 className="font-semibold text-slate-900">Filters</h2>
          </div>

          <form onSubmit={onFilterSearch} className="mb-6">
            <input
              value={localQ}
              onChange={(e) => setLocalQ(e.target.value)}
              placeholder="Product name or SKU..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-[#147D8A] focus:ring-2 focus:ring-[#147D8A]/15"
            />
          </form>

          <div className="mb-6">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Categories
            </h3>
            <div className="space-y-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                <input
                  type="radio"
                  name="category"
                  checked={!category}
                  onChange={() => updateFilter("category", "")}
                />
                All
              </label>
              {categories.map((c) => (
                <label
                  key={c.id}
                  className="flex cursor-pointer items-center gap-2 text-sm text-slate-700"
                >
                  <input
                    type="radio"
                    name="category"
                    checked={category === c.slug}
                    onChange={() => updateFilter("category", c.slug)}
                  />
                  {c.name}
                </label>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Brands
            </h3>
            <div className="space-y-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                <input
                  type="radio"
                  name="brand"
                  checked={!brand}
                  onChange={() => updateFilter("brand", "")}
                />
                All brands
              </label>
              {brands.map((b) => (
                <label
                  key={b.id}
                  className="flex cursor-pointer items-center gap-2 text-sm text-slate-700"
                >
                  <input
                    type="radio"
                    name="brand"
                    checked={brand === b.slug}
                    onChange={() => updateFilter("brand", b.slug)}
                  />
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: b.primary_color }}
                  />
                  {b.name}
                </label>
              ))}
            </div>
          </div>
        </aside>

        <div>
          {loading ? (
            <ProductGridSkeleton count={6} />
          ) : products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-center text-slate-500">
              No products match these filters.
            </div>
          ) : (
            <>
              <div
                ref={gridRef}
                className="stagger grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
              >
                {products.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
              </div>
              <div ref={sentinelRef} className="h-8 w-full" aria-hidden />
              <div className="py-8 text-center text-sm text-slate-500">
                {loadingMore
                  ? "Loading more…"
                  : hasMore
                    ? "Scroll for more"
                    : products.length > 0
                      ? "You’ve reached the end"
                      : null}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
