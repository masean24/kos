import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Loader2, ArrowLeft, CreditCard, ExternalLink } from "lucide-react";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { useEffect } from "react";
import { toast } from "sonner";

export default function TenantInvoices() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const utils = trpc.useUtils();
  const { data: invoices, isLoading } = trpc.invoice.list.useQuery(undefined, {
    enabled: !!user && user.role === "penghuni",
  });

  const createPaymentMutation = trpc.invoice.createPayment.useMutation({
    onSuccess: (data) => {
      if (data.success && data.paymentUrl) {
        window.open(data.paymentUrl, "_blank");
        toast.success("Redirect ke halaman pembayaran Xendit");
      } else {
        toast.info(data.message || "Xendit belum dikonfigurasi");
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = getLoginUrl();
    } else if (!authLoading && user && user.role !== "penghuni") {
      setLocation("/admin");
    }
  }, [user, authLoading, setLocation]);

  const handlePayment = (invoiceId: number) => {
    createPaymentMutation.mutate({ invoiceId });
  };

  if (authLoading || !user || user.role !== "penghuni") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container py-4">
          <div className="flex items-center gap-4 mb-2">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/tenant")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Riwayat Invoice</h1>
              <p className="text-sm text-muted-foreground">Daftar pembayaran sewa kamar</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>Daftar Invoice</CardTitle>
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
                    <TableHead>Bulan</TableHead>
                    <TableHead>Jumlah</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Jatuh Tempo</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">{inv.bulan}</TableCell>
                      <TableCell>Rp {inv.jumlahTagihan.toLocaleString("id-ID")}</TableCell>
                      <TableCell>
                        <Badge variant={inv.status === "paid" ? "default" : "secondary"}>
                          {inv.status === "paid" ? "Lunas" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(inv.tanggalJatuhTempo).toLocaleDateString("id-ID")}
                      </TableCell>
                      <TableCell className="text-right">
                        {inv.status === "pending" && (
                          <>
                            {inv.xenditInvoiceUrl ? (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => window.open(inv.xenditInvoiceUrl!, "_blank")}
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Bayar
                              </Button>
                            ) : (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handlePayment(inv.id)}
                                disabled={createPaymentMutation.isPending}
                              >
                                {createPaymentMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <CreditCard className="h-4 w-4 mr-2" />
                                )}
                                Bayar
                              </Button>
                            )}
                          </>
                        )}
                        {inv.status === "paid" && inv.tanggalDibayar && (
                          <span className="text-sm text-muted-foreground">
                            Dibayar: {new Date(inv.tanggalDibayar).toLocaleDateString("id-ID")}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Belum ada invoice
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
