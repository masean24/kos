import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Building2, CreditCard, FileText, Loader2, LogOut, Menu, X, AlertCircle, Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function TenantDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const { data: invoices, isLoading: invoicesLoading } = trpc.invoice.list.useQuery(undefined, {
    enabled: !!user && user.role === "penghuni",
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      toast.success("Logout berhasil");
      window.location.href = getLoginUrl();
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = getLoginUrl();
    }
  }, [user, authLoading]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  const pendingInvoices = invoices?.filter((inv: any) => inv.status === "pending") || [];
  const paidInvoices = invoices?.filter((inv: any) => inv.status === "paid") || [];
  const totalPending = pendingInvoices.reduce((sum: number, inv: any) => sum + (inv.jumlahTagihan || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b shadow-sm sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Dashboard Penghuni
              </h1>
              <p className="text-sm text-muted-foreground">Selamat datang, {user.name}</p>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2">
              <Button variant="outline" onClick={() => setLocation("/tenant/invoices")}>
                <FileText className="h-4 w-4 mr-2" />
                Invoice
              </Button>
              <Button variant="outline" onClick={() => setLocation("/tenant/payments")}>
                <CreditCard className="h-4 w-4 mr-2" />
                Pembayaran
              </Button>
              <Button variant="outline" onClick={() => setLocation("/tenant/report")}>
                <AlertCircle className="h-4 w-4 mr-2" />
                Lapor Masalah
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              <Button variant="ghost" onClick={() => logoutMutation.mutate()}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 space-y-2 animate-in slide-in-from-top-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  setLocation("/tenant/invoices");
                  setMobileMenuOpen(false);
                }}
              >
                <FileText className="h-4 w-4 mr-2" />
                Invoice
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  setLocation("/tenant/payments");
                  setMobileMenuOpen(false);
                }}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Pembayaran
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  setLocation("/tenant/report");
                  setMobileMenuOpen(false);
                }}
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                Lapor Masalah
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
                variant="ghost"
                className="w-full justify-start"
                onClick={() => logoutMutation.mutate()}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-l-4 border-l-indigo-500 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Invoice</CardTitle>
            </CardHeader>
            <CardContent>
              {invoicesLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
              ) : (
                <div className="text-3xl font-bold text-foreground">{invoices?.length || 0}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">Semua tagihan</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Belum Dibayar</CardTitle>
            </CardHeader>
            <CardContent>
              {invoicesLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
              ) : (
                <>
                  <div className="text-3xl font-bold text-foreground">{pendingInvoices.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total: Rp {totalPending.toLocaleString("id-ID")}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Sudah Dibayar</CardTitle>
            </CardHeader>
            <CardContent>
              {invoicesLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-green-600" />
              ) : (
                <div className="text-3xl font-bold text-foreground">{paidInvoices.length}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">Invoice lunas</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-8 hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle>Aksi Cepat</CardTitle>
            <CardDescription>Navigasi ke fitur utama</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-24 flex-col gap-2 hover:bg-accent hover:border-primary transition-all duration-300"
                onClick={() => setLocation("/tenant/invoices")}
              >
                <FileText className="h-8 w-8 text-indigo-600" />
                <span className="font-semibold">Lihat Invoice</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex-col gap-2 hover:bg-accent hover:border-primary transition-all duration-300"
                onClick={() => setLocation("/tenant/payments")}
              >
                <CreditCard className="h-8 w-8 text-purple-600" />
                <span className="font-semibold">Bayar Tagihan</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex-col gap-2 hover:bg-accent hover:border-destructive transition-all duration-300"
                onClick={() => setLocation("/tenant/report")}
              >
                <AlertCircle className="h-8 w-8 text-rose-600" />
                <span className="font-semibold">Lapor Masalah</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle>Invoice Terbaru</CardTitle>
            <CardDescription>Daftar tagihan yang perlu perhatian</CardDescription>
          </CardHeader>
          <CardContent>
            {invoicesLoading ? (
              <div className="flex justify-center py-12">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
                  <p className="text-muted-foreground">Memuat invoice...</p>
                </div>
              </div>
            ) : !invoices || invoices.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">Belum ada invoice</p>
                <p className="text-sm text-muted-foreground/70 mt-1">Invoice akan muncul di sini</p>
              </div>
            ) : (
              <div className="space-y-3">
                {invoices.slice(0, 5).map((inv: any, index: number) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-all duration-200 animate-in slide-in-from-left"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex-1">
                      <div className="font-semibold text-foreground">{inv.bulan}</div>
                      <div className="text-sm text-muted-foreground">
                        Jatuh tempo: {new Date(inv.tanggalJatuhTempo).toLocaleDateString("id-ID")}
                      </div>
                    </div>
                    <div className="text-right mr-4">
                      <div className="font-bold text-foreground">
                        Rp {inv.jumlahTagihan.toLocaleString("id-ID")}
                      </div>
                    </div>
                    <div>
                      {inv.status === "paid" ? (
                        <Badge className="bg-green-500">Lunas</Badge>
                      ) : inv.approvalStatus === "pending" ? (
                        <Badge variant="secondary">Verifikasi</Badge>
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
