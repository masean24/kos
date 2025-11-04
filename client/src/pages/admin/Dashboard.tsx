import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Building2, Users, FileText, DollarSign, Loader2, AlertCircle, Bell } from "lucide-react";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { useEffect } from "react";

export default function AdminDashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const [, setLocation] = useLocation();
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
      <header className="border-b bg-card">
        <div className="container py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Kost Management System</p>
          </div>
          <div className="flex gap-2 items-center">
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
            <Button variant="outline" onClick={() => logout()}>
              Logout
            </Button>
          </div>
        </div>
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
              <CardContent className="flex flex-wrap gap-3">
                <Button onClick={() => setLocation("/admin/rooms")}>
                  <Building2 className="mr-2 h-4 w-4" />
                  Kelola Kamar
                </Button>
                <Button onClick={() => setLocation("/admin/tenants")} variant="outline">
                  <Users className="mr-2 h-4 w-4" />
                  Lihat Penghuni
                </Button>
                <Button onClick={() => setLocation("/admin/invoices")} variant="outline">
                  <FileText className="mr-2 h-4 w-4" />
                  Kelola Invoice
                </Button>
                <Button variant="outline" onClick={() => setLocation("/admin/issues")} className="relative">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Kelola Laporan
                  {notifications && notifications.openIssues > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {notifications.openIssues}
                    </span>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
