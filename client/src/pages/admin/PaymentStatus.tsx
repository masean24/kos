import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Loader2, ArrowLeft, CheckCircle, XCircle, Clock } from "lucide-react";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { useEffect } from "react";

export default function PaymentStatus() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const { data: invoices, isLoading } = trpc.invoice.list.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
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

  // Group invoices by user
  const invoicesByUser = invoices?.reduce((acc, inv) => {
    if (!acc[inv.userId]) {
      acc[inv.userId] = [];
    }
    acc[inv.userId].push(inv);
    return acc;
  }, {} as Record<number, typeof invoices>);

  const pendingCount = invoices?.filter((i) => i.status === "pending").length || 0;
  const paidCount = invoices?.filter((i) => i.status === "paid").length || 0;
  const totalRevenue = invoices
    ?.filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + i.jumlahTagihan, 0) || 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container py-4">
          <div className="flex items-center gap-4 mb-2">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/admin")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Status Pembayaran</h1>
              <p className="text-sm text-muted-foreground">Monitor pembayaran semua penghuni</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8 space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Invoice</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{invoices?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Semua invoice</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <XCircle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
              <p className="text-xs text-muted-foreground">Belum dibayar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lunas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{paidCount}</div>
              <p className="text-xs text-muted-foreground">
                Total: Rp {totalRevenue.toLocaleString("id-ID")}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Payment Status Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Pembayaran Semua Penghuni</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : invoices && invoices.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Kamar</TableHead>
                    <TableHead>Bulan</TableHead>
                    <TableHead>Jumlah</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Jatuh Tempo</TableHead>
                    <TableHead>Dibayar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">{inv.userId}</TableCell>
                      <TableCell>{inv.kamarId}</TableCell>
                      <TableCell>{inv.bulan}</TableCell>
                      <TableCell>Rp {inv.jumlahTagihan.toLocaleString("id-ID")}</TableCell>
                      <TableCell>
                        <Badge variant={inv.status === "paid" ? "default" : "secondary"}>
                          {inv.status === "paid" ? "Lunas" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(inv.tanggalJatuhTempo).toLocaleDateString("id-ID")}
                      </TableCell>
                      <TableCell>
                        {inv.tanggalDibayar
                          ? new Date(inv.tanggalDibayar).toLocaleDateString("id-ID")
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Belum ada data pembayaran
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment by User */}
        {invoicesByUser && Object.keys(invoicesByUser).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Ringkasan per Penghuni</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(invoicesByUser).map(([userId, userInvoices]) => {
                  const pending = userInvoices.filter((i) => i.status === "pending").length;
                  const paid = userInvoices.filter((i) => i.status === "paid").length;
                  const totalPaid = userInvoices
                    .filter((i) => i.status === "paid")
                    .reduce((sum, i) => sum + i.jumlahTagihan, 0);

                  return (
                    <div key={userId} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold">User ID: {userId}</h3>
                        <div className="flex gap-2">
                          <Badge variant="secondary">{pending} Pending</Badge>
                          <Badge variant="default">{paid} Lunas</Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Total dibayar: Rp {totalPaid.toLocaleString("id-ID")}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
