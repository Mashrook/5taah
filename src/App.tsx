import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Layout from "./components/layout/Layout";
import AdminLayout from "./components/layout/AdminLayout";
import AuthProvider from "./components/auth/AuthProvider";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import TenantProvider from "./components/tenant/TenantProvider";

// Public Pages
import Index from "./pages/Index";
import Flights from "./pages/Flights";
import FlightPaymentCallback from "./pages/FlightPaymentCallback";
import HotelPaymentCallback from "./pages/HotelPaymentCallback";
import CarBooking from "./pages/CarBooking";
import CarPaymentCallback from "./pages/CarPaymentCallback";
import TourBooking from "./pages/TourBooking";
import TourPaymentCallback from "./pages/TourPaymentCallback";
import TransferBooking from "./pages/TransferBooking";
import TransferPaymentCallback from "./pages/TransferPaymentCallback";
import Hotels from "./pages/Hotels";
import HotelDetails from "./pages/HotelDetails";
import HotelCart from "./pages/HotelCart";
import HotelBooking from "./pages/HotelBooking";
import Cars from "./pages/Cars";
import Tours from "./pages/Tours";
import Activities from "./pages/Activities";
import Transfers from "./pages/Transfers";
import StudyAbroad from "./pages/StudyAbroad";
import Offers from "./pages/Offers";
import Destinations from "./pages/Destinations";
import Articles from "./pages/Articles";
import Festivals from "./pages/Festivals";
import SaudiTourism from "./pages/SaudiTourism";
import News from "./pages/News";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";
import Offline from "./pages/Offline";

// Auth Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// User Dashboard
import Dashboard from "./pages/Dashboard";
import MyBookings from "./pages/dashboard/MyBookings";
import SavedItems from "./pages/dashboard/SavedItems";
import Notifications from "./pages/dashboard/Notifications";
import Settings from "./pages/dashboard/Settings";

// Admin Pages
import AdminLogin from "./pages/admin/AdminLogin";
import AdminForgotPassword from "./pages/admin/AdminForgotPassword";
import AdminResetPassword from "./pages/admin/AdminResetPassword";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminUsersEnhanced from "./pages/admin/AdminUsersEnhanced";
import AdminIntegrations from "./pages/admin/AdminIntegrations";
import AdminRBAC from "./pages/admin/AdminRBAC";
import AdminAuditLogs from "./pages/admin/AdminAuditLogs";
import AdminSessions from "./pages/admin/AdminSessions";
import AdminSecurity from "./pages/admin/AdminSecurity";
import AdminReports from "./pages/admin/AdminReports";
import AdminIncidents from "./pages/admin/AdminIncidents";
import AdminAlerts from "./pages/admin/AdminAlerts";
import AdminRetention from "./pages/admin/AdminRetention";
import AdminHealth from "./pages/admin/AdminHealth";
import AdminTenants from "./pages/admin/AdminTenants";
import AdminTenantBranding from "./pages/admin/AdminTenantBranding";
import AdminFeatureFlags from "./pages/admin/AdminFeatureFlags";
import AdminTenantSettings from "./pages/admin/AdminTenantSettings";
import AdminBilling from "./pages/admin/AdminBilling";
import AdminPlans from "./pages/admin/AdminPlans";
import AdminPromoMedia from "./pages/admin/AdminPromoMedia";
import AdminStudyPrograms from "./pages/admin/AdminStudyPrograms";
import AdminSiteContent from "./pages/admin/AdminSiteContent";
import AdminAmadeusKeys from "./pages/admin/AdminAmadeusKeys";
import AdminHotelApis from "./pages/admin/AdminHotelApis";
import AdminApiLogs from "./pages/admin/AdminApiLogs";
import AdminStats from "./pages/admin/AdminStats";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminActivities from "./pages/admin/AdminActivities";
import AdminApiKeys from "./pages/admin/AdminApiKeys";
import AdminPaymentSettings from "./pages/admin/AdminPaymentSettings";
import AdminArticles from "./pages/admin/AdminArticles";
import AdminDestinations from "./pages/admin/AdminDestinations";
import AdminOffers from "./pages/admin/AdminOffers";
import AdminFlights from "./pages/admin/AdminFlights";
import AdminHotels from "./pages/admin/AdminHotels";
import AdminCars from "./pages/admin/AdminCars";
import AdminTours from "./pages/admin/AdminTours";
import AdminTransfers from "./pages/admin/AdminTransfers";
import AdminSettings from "./pages/admin/AdminSettings";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <TenantProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Layout><Index /></Layout>} />
              <Route path="/flights" element={<Layout><Flights /></Layout>} />
              <Route path="/flights/payment-callback" element={<Layout><FlightPaymentCallback /></Layout>} />
              <Route path="/hotels" element={<Layout><Hotels /></Layout>} />
              <Route path="/hotels/:id" element={<Layout><HotelDetails /></Layout>} />
              <Route path="/hotel-cart" element={<Layout><HotelCart /></Layout>} />
              <Route path="/hotel-booking" element={<Layout><HotelBooking /></Layout>} />
              <Route path="/hotels/payment-callback" element={<Layout><HotelPaymentCallback /></Layout>} />
              <Route path="/cars" element={<Layout><Cars /></Layout>} />
              <Route path="/car-booking" element={<Layout><CarBooking /></Layout>} />
              <Route path="/cars/payment-callback" element={<Layout><CarPaymentCallback /></Layout>} />
              <Route path="/tours" element={<Layout><Tours /></Layout>} />
              <Route path="/tour-booking" element={<Layout><TourBooking /></Layout>} />
              <Route path="/tours/payment-callback" element={<Layout><TourPaymentCallback /></Layout>} />
              <Route path="/activities" element={<Layout><Activities /></Layout>} />
              <Route path="/transfers" element={<Layout><Transfers /></Layout>} />
              <Route path="/transfer-booking" element={<Layout><TransferBooking /></Layout>} />
              <Route path="/transfers/payment-callback" element={<Layout><TransferPaymentCallback /></Layout>} />
              <Route path="/study-abroad" element={<Layout><StudyAbroad /></Layout>} />
              <Route path="/offers" element={<Layout><Offers /></Layout>} />
              <Route path="/destinations" element={<Layout><Destinations /></Layout>} />
              <Route path="/articles" element={<Layout><Articles /></Layout>} />
              <Route path="/festivals" element={<Layout><Festivals /></Layout>} />
              <Route path="/saudi-tourism" element={<Layout><SaudiTourism /></Layout>} />
              <Route path="/news" element={<Layout><News /></Layout>} />
              <Route path="/about" element={<Layout><About /></Layout>} />
              <Route path="/contact" element={<Layout><Contact /></Layout>} />
              <Route path="/privacy" element={<Layout><Privacy /></Layout>} />
              <Route path="/terms" element={<Layout><Terms /></Layout>} />
              <Route path="/offline" element={<Offline />} />

              {/* Tenant slug routes */}
              <Route path="/t/:slug" element={<Layout><Index /></Layout>} />
              <Route path="/t/:slug/*" element={<Layout><Index /></Layout>} />

              {/* Auth Routes */}
              <Route path="/login" element={<Layout><Login /></Layout>} />
              <Route path="/register" element={<Layout><Register /></Layout>} />

              {/* User Dashboard - Protected */}
              <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
              <Route path="/dashboard/bookings" element={<ProtectedRoute><Layout><MyBookings /></Layout></ProtectedRoute>} />
              <Route path="/dashboard/saved" element={<ProtectedRoute><Layout><SavedItems /></Layout></ProtectedRoute>} />
              <Route path="/dashboard/notifications" element={<ProtectedRoute><Layout><Notifications /></Layout></ProtectedRoute>} />
              <Route path="/dashboard/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />
              <Route path="/dashboard/*" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />

              {/* Password Recovery */}
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/forgot-password" element={<AdminForgotPassword />} />
              <Route path="/admin/reset-password" element={<AdminResetPassword />} />
              <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminLayout><AdminDashboard /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/bookings" element={<ProtectedRoute requireAdmin><AdminLayout><AdminBookings /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute requireAdmin><AdminLayout><AdminUsersEnhanced /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/integrations" element={<ProtectedRoute requireAdmin><AdminLayout><AdminIntegrations /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/amadeus-keys" element={<ProtectedRoute requireAdmin><AdminLayout><AdminAmadeusKeys /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/hotel-apis" element={<ProtectedRoute requireAdmin><AdminLayout><AdminHotelApis /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/api-logs" element={<ProtectedRoute requireAdmin><AdminLayout><AdminApiLogs /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/stats" element={<ProtectedRoute requireAdmin><AdminLayout><AdminStats /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/analytics" element={<ProtectedRoute requireAdmin><AdminLayout><AdminAnalytics /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/rbac" element={<ProtectedRoute requireAdmin><AdminLayout><AdminRBAC /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/audit-logs" element={<ProtectedRoute requireAdmin><AdminLayout><AdminAuditLogs /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/sessions" element={<ProtectedRoute requireAdmin><AdminLayout><AdminSessions /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/security" element={<ProtectedRoute requireAdmin><AdminLayout><AdminSecurity /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/reports" element={<ProtectedRoute requireAdmin><AdminLayout><AdminReports /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/incidents" element={<ProtectedRoute requireAdmin><AdminLayout><AdminIncidents /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/alerts" element={<ProtectedRoute requireAdmin><AdminLayout><AdminAlerts /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/retention" element={<ProtectedRoute requireAdmin><AdminLayout><AdminRetention /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/health" element={<ProtectedRoute requireAdmin><AdminLayout><AdminHealth /></AdminLayout></ProtectedRoute>} />
              {/* Multi-tenant admin */}
              <Route path="/admin/tenants" element={<ProtectedRoute requireAdmin><AdminLayout><AdminTenants /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/tenant-branding" element={<ProtectedRoute requireAdmin><AdminLayout><AdminTenantBranding /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/feature-flags" element={<ProtectedRoute requireAdmin><AdminLayout><AdminFeatureFlags /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/tenant-settings" element={<ProtectedRoute requireAdmin><AdminLayout><AdminTenantSettings /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/billing" element={<ProtectedRoute requireAdmin><AdminLayout><AdminBilling /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/plans" element={<ProtectedRoute requireAdmin><AdminLayout><AdminPlans /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/promo-media" element={<ProtectedRoute requireAdmin><AdminLayout><AdminPromoMedia /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/study-programs" element={<ProtectedRoute requireAdmin><AdminLayout><AdminStudyPrograms /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/site-content" element={<ProtectedRoute requireAdmin><AdminLayout><AdminSiteContent /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/activities" element={<ProtectedRoute requireAdmin><AdminLayout><AdminActivities /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/api-keys" element={<ProtectedRoute requireAdmin><AdminLayout><AdminApiKeys /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/payment-settings" element={<ProtectedRoute requireAdmin><AdminLayout><AdminPaymentSettings /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/articles" element={<ProtectedRoute requireAdmin><AdminLayout><AdminArticles /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/destinations" element={<ProtectedRoute requireAdmin><AdminLayout><AdminDestinations /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/offers" element={<ProtectedRoute requireAdmin><AdminLayout><AdminOffers /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/flights" element={<ProtectedRoute requireAdmin><AdminLayout><AdminFlights /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/hotels" element={<ProtectedRoute requireAdmin><AdminLayout><AdminHotels /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/cars" element={<ProtectedRoute requireAdmin><AdminLayout><AdminCars /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/tours" element={<ProtectedRoute requireAdmin><AdminLayout><AdminTours /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/transfers" element={<ProtectedRoute requireAdmin><AdminLayout><AdminTransfers /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/settings" element={<ProtectedRoute requireAdmin><AdminLayout><AdminSettings /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/*" element={<ProtectedRoute requireAdmin><AdminLayout><AdminDashboard /></AdminLayout></ProtectedRoute>} />

              {/* 404 */}
              <Route path="*" element={<Layout><NotFound /></Layout>} />
            </Routes>
          </TenantProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ThemeProvider>
);

export default App;
