import { useState } from "react";

const FAQS = [
  {
    q: "Do I need an account to order?",
    a: "No. Guest checkout is supported—just provide name, email, phone, and address.",
  },
  {
    q: "Which brands do you carry?",
    a: "We stock multi-brand inventory including Total, Ingco, Makita, DeWalt, Stanley, and more.",
  },
  {
    q: "How do I track my order?",
    a: "You will receive an order number at checkout. Full order-status lookup ships in a later phase.",
  },
  {
    q: "Can I get help picking the right tool?",
    a: "Yes—call 1-800-TOOL-PRO or WhatsApp our specialists during business hours.",
  },
];

export default function SupportPage() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="brand-font text-4xl font-bold text-slate-900">Support</h1>
      <p className="mt-3 text-slate-500">
        FAQ and contact options for ToolsNest customers.
      </p>

      <div className="mt-10 space-y-3">
        {FAQS.map((item, i) => {
          const isOpen = open === i;
          return (
            <div
              key={item.q}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <button
                type="button"
                className="flex w-full items-center justify-between px-5 py-4 text-left font-semibold text-slate-900"
                onClick={() => setOpen(isOpen ? null : i)}
              >
                {item.q}
                <span className="text-[#0F4C5C]">{isOpen ? "−" : "+"}</span>
              </button>
              <div
                className={`grid transition-all duration-300 ${
                  isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <p className="px-5 pb-4 text-sm leading-relaxed text-slate-600">
                    {item.a}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-10 rounded-2xl bg-[#0F4C5C] p-6 text-white animate-fade-up">
        <h2 className="brand-font text-xl font-bold">Still need help?</h2>
        <p className="mt-2 text-white/85">
          Email support@toolsnest.tools or call 1-800-TOOL-PRO.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href="mailto:support@toolsnest.tools"
            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#0F4C5C]"
          >
            Email us
          </a>
          <a
            href="https://wa.me/18008665776"
            target="_blank"
            rel="noreferrer"
            className="rounded-xl bg-[#25D366] px-4 py-2 text-sm font-semibold text-white"
          >
            WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
