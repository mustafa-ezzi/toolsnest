import { Link } from "react-router-dom";

export default function AboutPage() {
  return (
    <div>
      <section className="bg-[#0F4C5C] px-4 py-20 text-white">
        <div className="mx-auto max-w-3xl animate-fade-up text-center">
          <h1 className="brand-font text-4xl font-bold sm:text-5xl">About ToolsNest</h1>
          <p className="mt-4 text-lg text-white/85">
            Built by tradespeople, for tradespeople.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-3xl px-4 py-16 leading-relaxed text-slate-600">
        <p className="animate-fade-up">
          ToolsNest is a multi-brand hardware marketplace focused on
          professional-grade power tools, hand tools, and jobsite essentials.
          We organize inventory by brand—Total, Ingco, Makita, DeWalt, Stanley,
          and more—so you can shop with the colors and trust signals you already
          know.
        </p>
        <p className="mt-4 animate-fade-up" style={{ animationDelay: "0.1s" }}>
          Our mission is simple: honest prices, clear specs, and fast support
          when you need a recommendation for the next build.
        </p>
        <Link
          to="/products"
          className="btn-primary mt-8 inline-flex rounded-xl bg-[#0F4C5C] px-6 py-3 text-sm font-semibold text-white"
        >
          Shop the catalog
        </Link>
      </section>
    </div>
  );
}
