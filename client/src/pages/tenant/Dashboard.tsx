import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2, FileText, User, Home, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { useEffect } from "react";

export default function TenantDashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const [, setLocation] = useLocation();

  const { data: invoices, isLoading } = trpc.invoice.list.useQuery(undefined, {
    enabled: !!user && user.role === "penghuni",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = getLoginUrl();
    } else if (!authLoading && user && user.role === "admin") {
      setLocation("/admin");
    } else if (!authLoading && user && !user.kamarId) {
      setLocation("/tenant/register");
    }
  }, [user, authLoading, setLocation]);

  if (authLoading || !user || user.role !== "penghuni") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const pendingInvoices = invoices?.filter((inv) => inv.status === "pending") || [];
  const paidInvoices = invoices?.filter((inv) => inv.status === "paid") || [];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard Penghuni</h1>
            <p className="text-sm text-muted-foreground">Selamat datang, {user.name}</p>
          </div>
          <Button variant="outline" onClick={() => logout()}>
            Logout
          </Button>
        </div>
      </header>

      <main className="container py-8">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informasi Penghuni
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nama:</span>
                <span className="font-medium">{user.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nomor HP:</span>
                <span className="font-medium">{user.nomorHp || "-"}</span>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Invoice Pending</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingInvoices.length}</div>
                <p className="text-xs text-muted-foreground">Menunggu pembayaran</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Invoice Lunas</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{paidInvoices.length}</div>
                <p className="text-xs text-muted-foreground">Sudah dibayar</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Invoice Terbaru</CardTitle>
              <CardDescription>Daftar invoice pembayaran sewa kamar</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : invoices && invoices.length > 0 ? (
                <div className="space-y-3">
                  {invoices.slice(0, 5).map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">Bulan {inv.bulan}</p>
                        <p className="text-sm text-muted-foreground">
                          Rp {inv.jumlahTagihan.toLocaleString("id-ID")}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                            inv.status === "paid"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {inv.status === "paid" ? "Lunas" : "Pending"}
                        </span>
                        <p className="text-xs text-muted-foreground mt-1">
                          Jatuh tempo: {new Date(inv.tanggalJatuhTempo).toLocaleDateString("id-ID")}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setLocation("/tenant/invoices")}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Lihat Semua Invoice
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setLocation("/tenant/report")}
                    >
                      <AlertCircle className="mr-2 h-4 w-4" />
                      Lapor Masalah
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Belum ada invoice
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
