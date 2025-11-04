import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, CheckCircle, Clock, Loader2, XCircle, Printer } from "lucide-react";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { useEffect } from "react";

export default function TenantInvoices() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const { data: invoices, isLoading } = trpc.invoice.list.useQuery(undefined, {
    enabled: !!user && user.role === "penghuni",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = getLoginUrl();
    }
  }, [user, authLoading]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Memuat halaman...</p>
        </div>
      </div>
    );
  }

  const printInvoice = (inv: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${inv.bulan}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          .header { text-align: center; margin-bottom: 30px; }
          .invoice-details { margin: 20px 0; }
          .invoice-details table { width: 100%; border-collapse: collapse; }
          .invoice-details td { padding: 8px; border-bottom: 1px solid #eee; }
          .invoice-details td:first-child { font-weight: bold; width: 200px; }
          .total { font-size: 18px; font-weight: bold; margin-top: 20px; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>INVOICE PEMBAYARAN KOS</h1>
          <p>Invoice #${inv.id}</p>
        </div>
        <div class="invoice-details">
          <table>
            <tr><td>Bulan</td><td>${inv.bulan}</td></tr>
            <tr><td>Tanggal Jatuh Tempo</td><td>${new Date(inv.tanggalJatuhTempo).toLocaleDateString('id-ID')}</td></tr>
            <tr><td>Status</td><td>${inv.status === 'paid' ? 'LUNAS' : 'BELUM DIBAYAR'}</td></tr>
          </table>
          <div class="total">
            <p>Total: Rp ${inv.jumlahTagihan.toLocaleString('id-ID')}</p>
          </div>
        </div>
        <button onclick="window.print()" style="margin-top: 20px; padding: 10px 20px; background: #6366f1; color: white; border: none; border-radius: 4px; cursor: pointer;">Cetak</button>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const getStatusBadge = (inv: any) => {
    if (inv.status === "paid") {
      return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Lunas</Badge>;
    }
    if (inv.paymentMethod === "manual" && inv.approvalStatus === "pending") {
      return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Menunggu Verifikasi</Badge>;
    }
    if (inv.paymentMethod === "manual" && inv.approvalStatus === "rejected") {
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Ditolak</Badge>;
    }
    return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 overflow-y-auto">
      <header className="border-b bg-white shadow-sm">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/tenant/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Riwayat Invoice</h1>
              <p className="text-sm text-muted-foreground">Daftar pembayaran sewa kamar</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle>Daftar Invoice</CardTitle>
            <CardDescription>Riwayat invoice pembayaran Anda</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
                  <p className="text-gray-600">Memuat invoice...</p>
                </div>
              </div>
            ) : !invoices || invoices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Belum ada invoice
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bulan</TableHead>
                    <TableHead>Jumlah</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Jatuh Tempo</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv: any, index: number) => (
                    <TableRow key={inv.id} className="hover:bg-indigo-50/50 transition-colors duration-200 animate-in slide-in-from-left" style={{ animationDelay: `${index * 30}ms` }}>
                      <TableCell className="font-medium">{inv.bulan}</TableCell>
                      <TableCell>Rp {inv.jumlahTagihan.toLocaleString("id-ID")}</TableCell>
                      <TableCell>{getStatusBadge(inv)}</TableCell>
                      <TableCell>{new Date(inv.tanggalJatuhTempo).toLocaleDateString("id-ID")}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => printInvoice(inv)}
                            className="hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-200"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          {inv.status !== "paid" && (
                            <Button 
                              size="sm" 
                              onClick={() => setLocation(`/tenant/payments?invoice=${inv.id}`)}
                              className="hover:shadow-md transition-all duration-200"
                            >
                              Bayar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
