import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
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
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      
      {/* Admin Routes */}
      <Route path={"/admin"} component={AdminDashboard} />
      <Route path={"/admin/rooms"} component={RoomManagement} />
      <Route path={"/admin/tenants"} component={TenantManagement} />
      <Route path="/admin/invoices" component={InvoiceManagement} />
      <Route path="/admin/issues" component={IssueManagement} />
      <Route path="/admin/payments" component={PaymentStatus} />
      
      {/* Tenant Routes */}
      <Route path="/tenant" component={TenantDashboard} />
      <Route path="/tenant/dashboard" component={TenantDashboard} />
      <Route path="/tenant/register" component={TenantRegister} />
      <Route path="/tenant/report" component={TenantReportIssue} />
      <Route path="/tenant/invoices" component={TenantInvoices} />
      <Route path="/tenant/payments" component={TenantPayments} />      
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
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
