import { Outlet } from "react-router-dom";
import AnnouncementBar from "./AnnouncementBar";
import Header from "./Header";
import Footer from "./Footer";
import WhatsAppFloat from "./WhatsAppFloat";

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--neo-bg)]">
      <AnnouncementBar />
      <Header />
      <main className="page-bottom-safe flex-1">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppFloat />
    </div>
  );
}
