import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import { AnimatePresence } from "framer-motion";
import PageTransition from "./components/PageTransition";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import AdminDashboard from "./pages/admin/Dashboard";
import RoomManagement from "./pages/admin/RoomManagement";
import TenantManagement from "./pages/admin/TenantManagement";
import InvoiceManagement from "./pages/admin/InvoiceManagement";
import IssueManagement from "./pages/admin/IssueManagement";
import PaymentStatus from "./pages/admin/PaymentStatus";
import TenantDashboard from "./pages/tenant/Dashboard";
import TenantRegister from "./pages/tenant/Register";
import TenantReportIssue from "./pages/tenant/ReportIssue";
import TenantInvoices from "./pages/tenant/Invoices";
import TenantPayments from "./pages/tenant/Payments";

function Router() {
  const [location] = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Switch location={location} key={location}>
      <Route path={"/"}>
        <PageTransition>
          <Home />
        </PageTransition>
      </Route>
      
      {/* Admin Routes */}
      <Route path={"/admin"}>
        <PageTransition>
          <AdminDashboard />
        </PageTransition>
      </Route>
      <Route path={"/admin/rooms"}>
        <PageTransition>
          <RoomManagement />
        </PageTransition>
      </Route>
      <Route path={"/admin/tenants"}>
        <PageTransition>
          <TenantManagement />
        </PageTransition>
      </Route>
      <Route path="/admin/invoices">
        <PageTransition>
          <InvoiceManagement />
        </PageTransition>
      </Route>
      <Route path="/admin/issues">
        <PageTransition>
          <IssueManagement />
        </PageTransition>
      </Route>
      <Route path="/admin/payments">
        <PageTransition>
          <PaymentStatus />
        </PageTransition>
      </Route>
      
      {/* Tenant Routes */}
      <Route path="/tenant">
        <PageTransition>
          <TenantDashboard />
        </PageTransition>
      </Route>
      <Route path="/tenant/dashboard">
        <PageTransition>
          <TenantDashboard />
        </PageTransition>
      </Route>
      <Route path="/tenant/register">
        <PageTransition>
          <TenantRegister />
        </PageTransition>
      </Route>
      <Route path="/tenant/report">
        <PageTransition>
          <TenantReportIssue />
        </PageTransition>
      </Route>
      <Route path="/tenant/invoices">
        <PageTransition>
          <TenantInvoices />
        </PageTransition>
      </Route>
      <Route path="/tenant/payments">
        <PageTransition>
          <TenantPayments />
        </PageTransition>
      </Route>      
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
    </AnimatePresence>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
