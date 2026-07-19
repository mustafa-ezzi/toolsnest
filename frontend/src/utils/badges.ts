export function getProductBadges(product: {
  featured?: boolean;
  compare_at_price?: string | null;
  created_at?: string;
}) {
  const badges: { label: string; className: string }[] = [];
  if (product.compare_at_price && Number(product.compare_at_price) > 0) {
    badges.push({
      label: "Sale",
      className: "bg-red-500 text-white",
    });
  }
  if (product.featured) {
    badges.push({
      label: "Featured",
      className: "bg-[#0F4C5C] text-white",
    });
  }
  if (product.created_at) {
    const created = new Date(product.created_at).getTime();
    const days = (Date.now() - created) / (1000 * 60 * 60 * 24);
    if (days <= 30) {
      badges.push({
        label: "New",
        className: "bg-emerald-500 text-white",
      });
    }
  }
  return badges.slice(0, 2);
}
