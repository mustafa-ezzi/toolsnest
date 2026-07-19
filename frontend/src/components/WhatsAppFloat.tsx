import { WHATSAPP_OWNER_NUMBER, buildWhatsAppUrl } from "../utils/whatsapp";

export default function WhatsAppFloat() {
  const href = buildWhatsAppUrl(
    "Hi ToolsNest! I need help choosing tools / with my order."
  );

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat on WhatsApp"
      title={`WhatsApp +${WHATSAPP_OWNER_NUMBER}`}
      className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[8px_8px_20px_rgba(163,177,198,0.55),-6px_-6px_16px_rgba(255,255,255,0.8)] transition hover:scale-110 hover:brightness-95"
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.5 3.5A11 11 0 0 0 2.1 17.8L1 23l5.4-1.4A11 11 0 1 0 20.5 3.5zm-8.5 17a9 9 0 0 1-4.6-1.3l-.3-.2-3.2.8.9-3.1-.2-.3a9 9 0 1 1 7.4 4.1zm5-6.7c-.3-.1-1.6-.8-1.8-.9s-.4-.1-.6.1-.7.9-.8 1-.3.2-.6.1a7.4 7.4 0 0 1-2.2-1.4 8.2 8.2 0 0 1-1.5-1.9c-.2-.3 0-.4.1-.6l.4-.5c.1-.2.2-.3.3-.5s0-.4 0-.5-.6-1.4-.8-1.9-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3s-1 1-1 2.4 1 2.8 1.2 3 .9 1.9 3.5 3.1a12 12 0 0 0 1.2.5 2.9 2.9 0 0 0 1.3.1c.4-.1 1.6-.7 1.8-1.3s.2-1.2.2-1.3-.2-.2-.4-.3z" />
      </svg>
    </a>
  );
}
