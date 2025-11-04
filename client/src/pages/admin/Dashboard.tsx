import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Building2, Users, FileText, DollarSign, Loader2, AlertCircle, Bell, Menu, X, Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { useEffect, useState } from "react";

export default function AdminDashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
  });
  
  const { data: notifications } = trpc.dashboard.notifications.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = getLoginUrl();
    } else if (!authLoading && user && user.role !== "admin") {
      setLocation("/tenant");
    }
  }, [user, authLoading, setLocation]);

  if (authLoading || !user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Kost Management System</p>
          </div>
          
          {/* Mobile menu button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>

          {/* Desktop navigation */}
          <div className="hidden md:flex gap-2 items-center">
            {notifications && (notifications.pendingPayments > 0 || notifications.openIssues > 0) && (
              <div className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-800 rounded-md text-sm">
                <Bell className="h-4 w-4" />
                <span>
                  {notifications.pendingPayments > 0 && `${notifications.pendingPayments} pembayaran menunggu`}
                  {notifications.pendingPayments > 0 && notifications.openIssues > 0 && " • "}
                  {notifications.openIssues > 0 && `${notifications.openIssues} laporan baru`}
                </span>
              </div>
            )}
            <Button variant="outline" onClick={() => setLocation("/admin/rooms")}>
              Kelola Kamar
            </Button>
            <Button variant="outline" onClick={() => setLocation("/admin/payments")} className="relative">
              Status Pembayaran
              {notifications && notifications.pendingPayments > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {notifications.pendingPayments}
                </span>
              )}
            </Button>
            <Button variant="outline" onClick={() => setLocation("/admin/invoices")}>
              Kelola Invoice
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button variant="outline" onClick={() => logout()}>
              Logout
            </Button>
          </div>
        </div>
        
        {/* Mobile navigation menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-card">
            <div className="container py-4 flex flex-col gap-2">
              {notifications && (notifications.pendingPayments > 0 || notifications.openIssues > 0) && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-800 rounded-md text-sm">
                  <Bell className="h-4 w-4" />
                  <span>
                    {notifications.pendingPayments > 0 && `${notifications.pendingPayments} pembayaran menunggu`}
                    {notifications.pendingPayments > 0 && notifications.openIssues > 0 && " • "}
                    {notifications.openIssues > 0 && `${notifications.openIssues} laporan baru`}
                  </span>
                </div>
              )}
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => {
                  setLocation("/admin/rooms");
                  setMobileMenuOpen(false);
                }}
              >
                Kelola Kamar
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start relative"
                onClick={() => {
                  setLocation("/admin/payments");
                  setMobileMenuOpen(false);
                }}
              >
                Status Pembayaran
                {notifications && notifications.pendingPayments > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                    {notifications.pendingPayments}
                  </span>
                )}
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => {
                  setLocation("/admin/invoices");
                  setMobileMenuOpen(false);
                }}
              >
                Kelola Invoice
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={toggleTheme}
              >
                {theme === 'dark' ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
              >
                Logout
              </Button>
            </div>
          </div>
        )}
      </header>

      <main className="container py-8">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Kamar</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalRooms || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.occupiedRooms || 0} terisi, {stats?.emptyRooms || 0} kosong
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Penghuni</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalTenants || 0}</div>
                  <p className="text-xs text-muted-foreground">Anak kos aktif</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Invoice Pending</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.pendingInvoices || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.paidInvoices || 0} sudah dibayar
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pemasukan Bulan Ini</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    Rp {(stats?.currentMonthRevenue || 0).toLocaleString("id-ID")}
                  </div>
                  <p className="text-xs text-muted-foreground">Total pembayaran diterima</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Akses cepat ke fitur utama</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <Button onClick={() => setLocation("/admin/rooms")} size="lg" className="h-auto py-4 flex-col gap-2">
                    <Building2 className="h-6 w-6" />
                    <span>Kelola Kamar</span>
                  </Button>
                  <Button onClick={() => setLocation("/admin/tenants")} variant="outline" size="lg" className="h-auto py-4 flex-col gap-2">
                    <Users className="h-6 w-6" />
                    <span>Lihat Penghuni</span>
                  </Button>
                  <Button onClick={() => setLocation("/admin/invoices")} variant="outline" size="lg" className="h-auto py-4 flex-col gap-2">
                    <FileText className="h-6 w-6" />
                    <span>Kelola Invoice</span>
                  </Button>
                  <Button variant="outline" onClick={() => setLocation("/admin/issues")} size="lg" className="h-auto py-4 flex-col gap-2 relative">
                    <AlertCircle className="h-6 w-6" />
                    <span>Kelola Laporan</span>
                    {notifications && notifications.openIssues > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {notifications.openIssues}
                      </span>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
