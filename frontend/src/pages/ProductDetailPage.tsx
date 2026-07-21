import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { animate } from "animejs";
import { createTimeline } from "animejs/timeline";
import { stagger } from "animejs/utils";
import { formatPrice, getProduct, getRelatedProducts } from "../api/client";
import type { Product } from "../types";
import { useCart } from "../context/CartContext";
import ProductCard from "../components/ProductCard";
import { getProductBadges } from "../utils/badges";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { ProductDetailSkeleton } from "../components/Skeleton";

export default function ProductDetailPage() {
  const { slug } = useParams();
  const { addItem } = useCart();
  const reduceMotion = useReducedMotion();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);

  const galleryRef = useRef<HTMLDivElement | null>(null);
  const infoRef = useRef<HTMLDivElement | null>(null);
  const addBtnRef = useRef<HTMLButtonElement | null>(null);
  const relatedRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setRelated([]);
    getProduct(slug)
      .then((p) => {
        setProduct(p);
        setActiveImg(0);
        return getRelatedProducts(slug).then(setRelated).catch(() => setRelated([]));
      })
      .catch(() => setError("Product not found"))
      .finally(() => setLoading(false));
  }, [slug]);

  // Entrance sequence when product loads
  useEffect(() => {
    if (loading || !product || reduceMotion) return;
    const gallery = galleryRef.current;
    const info = infoRef.current;
    if (!gallery || !info) return;

    const timeline = createTimeline({
      defaults: { duration: 520, ease: "out(3)" },
    });
    timeline
      .add(gallery, { opacity: [0, 1], scale: [0.96, 1] })
      .add(info, { opacity: [0, 1], translateX: [28, 0] }, "-=320")
      .add(".pd-price", { opacity: [0, 1], translateY: [10, 0] }, "-=280")
      .add(".pd-actions", { opacity: [0, 1], translateY: [12, 0] }, "-=260");

    return () => {
      timeline.pause();
    };
  }, [loading, product, reduceMotion, slug]);

  // Related products stagger when they appear
  useEffect(() => {
    if (reduceMotion || related.length === 0) return;
    const cards = relatedRef.current?.querySelectorAll(".product-card");
    if (!cards?.length) return;
    const anim = animate(cards, {
      opacity: [0, 1],
      translateY: [16, 0],
      duration: 420,
      ease: "out(3)",
      delay: stagger(60),
    });
    return () => {
      anim.pause();
    };
  }, [related, reduceMotion]);

  if (loading) {
    return <ProductDetailSkeleton />;
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="brand-font text-2xl font-bold">Product not found</h1>
        <Link to="/products" className="mt-4 inline-block text-[#0F4C5C]">
          Back to products
        </Link>
      </div>
    );
  }

  const images =
    product.images && product.images.length
      ? product.images.map((i) => i.url)
      : [product.primary_image].filter(Boolean);

  const brandColor = product.brand.primary_color;
  const badges = getProductBadges(product);

  function onAddToCart() {
    addItem(product!, qty);
    setAdded(true);
    if (!reduceMotion && addBtnRef.current) {
      animate(addBtnRef.current, {
        scale: [1, 1.06, 1],
        duration: 360,
        ease: "out(3)",
      });
    }
    window.setTimeout(() => setAdded(false), 1600);
  }

  return (
    <div>
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:gap-10 sm:py-10 lg:grid-cols-2">
        <div ref={galleryRef}>
          <div className="relative overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="aspect-square overflow-hidden bg-slate-100">
              <img
                src={images[activeImg] || "https://placehold.co/800x800"}
                alt={product.name}
                className="h-full w-full object-cover transition duration-500 hover:scale-105"
              />
            </div>
            {badges.length > 0 && (
              <div className="absolute left-4 top-4 flex gap-2">
                {badges.map((b) => (
                  <span
                    key={b.label}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${b.className}`}
                  >
                    {b.label}
                  </span>
                ))}
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {images.map((src, i) => (
                <button
                  key={src + i}
                  type="button"
                  onClick={() => setActiveImg(i)}
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 ${
                    i === activeImg ? "border-[#0F4C5C]" : "border-transparent"
                  }`}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div ref={infoRef}>
          <span
            className="inline-flex rounded-full px-3 py-1 text-xs font-semibold text-white"
            style={{ backgroundColor: brandColor }}
          >
            {product.brand.name}
          </span>
          <p className="mt-3 text-sm text-slate-400">{product.category?.name}</p>
          <h1 className="brand-font mt-1 text-2xl font-bold text-slate-900 sm:text-3xl lg:text-4xl">
            {product.name}
          </h1>
          <p className="mt-2 text-sm text-slate-400">SKU: {product.sku}</p>
          <p className="pd-price mt-4 text-2xl font-semibold text-[#0F4C5C] sm:text-3xl">
            {formatPrice(product.price)}
          </p>
          {product.compare_at_price && (
            <p className="text-sm text-slate-400 line-through">
              {formatPrice(product.compare_at_price)}
            </p>
          )}
          <p className="mt-6 leading-relaxed text-slate-600">{product.description}</p>

          {product.specs && Object.keys(product.specs).length > 0 && (
            <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <tbody>
                  {Object.entries(product.specs).map(([k, v]) => (
                    <tr key={k} className="border-b border-slate-100 last:border-0">
                      <td className="bg-slate-50 px-4 py-2.5 font-medium capitalize text-slate-600">
                        {k.replace(/_/g, " ")}
                      </td>
                      <td className="px-4 py-2.5 text-slate-800">{String(v)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="pd-actions mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="flex h-12 items-center self-start rounded-xl border border-slate-200 bg-white">
              <button
                type="button"
                className="flex h-12 w-12 items-center justify-center text-lg"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="min-w-10 text-center font-medium">{qty}</span>
              <button
                type="button"
                className="flex h-12 w-12 items-center justify-center text-lg"
                onClick={() => setQty((q) => q + 1)}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
            <button
              ref={addBtnRef}
              type="button"
              className="btn-primary min-h-12 w-full rounded-xl bg-[#0F4C5C] px-6 py-3 text-sm font-semibold text-white sm:w-auto"
              onClick={onAddToCart}
            >
              {added ? "Added!" : "Add to cart"}
            </button>
          </div>
          <p className="mt-3 text-sm text-slate-400">
            {product.stock_qty > 0
              ? `${product.stock_qty} in stock`
              : "Currently out of stock"}
          </p>
        </div>
      </div>

      {related.length > 0 && (
        <section className="border-t border-slate-200 bg-white py-12">
          <div className="mx-auto max-w-7xl px-4">
            <h2 className="brand-font text-2xl font-bold text-slate-900">
              Related products
            </h2>
            <p className="mt-1 text-slate-500">More tools you might need</p>
            <div
              ref={relatedRef}
              className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
            >
              {related.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
