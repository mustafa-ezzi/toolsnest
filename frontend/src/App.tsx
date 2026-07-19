import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import LandingPage from "./pages/LandingPage";
import ProductsPage from "./pages/ProductsPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderSuccessPage from "./pages/OrderSuccessPage";
import AboutPage from "./pages/AboutPage";
import SupportPage from "./pages/SupportPage";
import { AdminAuthProvider } from "./admin/AuthContext";
import AdminLayout from "./admin/AdminLayout";
import { AdminProtectedRoute } from "./admin/AdminProtectedRoute";
import AdminLoginPage from "./admin/pages/LoginPage";
import DashboardPage from "./admin/pages/DashboardPage";
import AdminProductsPage from "./admin/pages/ProductsPage";
import AdminOrdersPage from "./admin/pages/OrdersPage";
import AdminBrandsPage from "./admin/pages/BrandsPage";
import AdminCategoriesPage from "./admin/pages/CategoriesPage";
import AdminBannersPage from "./admin/pages/BannersPage";
import AdminReportsPage from "./admin/pages/ReportsPage";
import OrderLookupPage from "./pages/OrderLookupPage";
import AdminCouponsPage from "./admin/pages/CouponsPage";

export default function App() {
  return (
    <AdminAuthProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<LandingPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/:slug" element={<ProductDetailPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="order-success/:orderNumber" element={<OrderSuccessPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="support" element={<SupportPage />} />
          <Route path="track-order" element={<OrderLookupPage />} />
        </Route>

        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route element={<AdminProtectedRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="brands" element={<AdminBrandsPage />} />
            <Route path="categories" element={<AdminCategoriesPage />} />
            <Route path="banners" element={<AdminBannersPage />} />
            <Route path="coupons" element={<AdminCouponsPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AdminAuthProvider>
  );
}
