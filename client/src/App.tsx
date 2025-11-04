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
import TenantDashboard from "./pages/tenant/Dashboard";
import TenantInvoices from "./pages/tenant/Invoices";
import TenantRegister from "./pages/tenant/Register";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      
      {/* Admin Routes */}
      <Route path={"/admin"} component={AdminDashboard} />
      <Route path={"/admin/rooms"} component={RoomManagement} />
      <Route path={"/admin/tenants"} component={TenantManagement} />
      <Route path={"/admin/invoices"} component={InvoiceManagement} />
      
      {/* Tenant Routes */}
      <Route path={"/tenant"} component={TenantDashboard} />
      <Route path={"/tenant/invoices"} component={TenantInvoices} />
      <Route path={"/tenant/register"} component={TenantRegister} />
      
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
