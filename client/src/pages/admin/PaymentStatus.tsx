import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Loader2, ArrowLeft, CheckCircle, XCircle, Clock, Eye, Download } from "lucide-react";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function PaymentStatus() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [rejectInvoiceId, setRejectInvoiceId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  const exportToCSV = () => {
    if (!invoices || invoices.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    const headers = ["Nama Penghuni", "Email", "Bulan", "Jumlah", "Status", "Metode Pembayaran", "Status Approval", "Jatuh Tempo"];
    const rows = invoices.map((inv: any) => [
      inv.tenantName || 'N/A',
      inv.tenantEmail || 'N/A',
      inv.bulan,
      inv.jumlahTagihan,
      inv.status === 'paid' ? 'Lunas' : 'Pending',
      inv.paymentMethod === 'manual' ? 'Manual' : inv.paymentMethod === 'xendit' ? 'Xendit' : 'N/A',
      inv.approvalStatus === 'approved' ? 'Disetujui' : inv.approvalStatus === 'rejected' ? 'Ditolak' : inv.approvalStatus === 'pending' ? 'Menunggu' : 'N/A',
      new Date(inv.tanggalJatuhTempo).toLocaleDateString('id-ID')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `\"${cell}\"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `payment-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success("Data berhasil diekspor");
  };

  const utils = trpc.useUtils();
  const { data: invoices, isLoading } = trpc.invoice.list.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
  });

  const approveMutation = trpc.invoice.approvePayment.useMutation({
    onSuccess: () => {
      utils.invoice.list.invalidate();
      toast.success("Pembayaran berhasil disetujui");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const rejectMutation = trpc.invoice.rejectPayment.useMutation({
    onSuccess: () => {
      utils.invoice.list.invalidate();
      setRejectInvoiceId(null);
      setRejectionReason("");
      toast.success("Pembayaran ditolak");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = getLoginUrl();
    } else if (!authLoading && user && user.role !== "admin") {
      setLocation("/tenant");
    }
  }, [user, authLoading, setLocation]);

  const handleApprove = (invoiceId: number) => {
    if (confirm("Setujui pembayaran ini?")) {
      approveMutation.mutate({ invoiceId });
    }
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      toast.error("Mohon berikan alasan penolakan");
      return;
    }
    if (rejectInvoiceId) {
      rejectMutation.mutate({
        invoiceId: rejectInvoiceId,
        reason: rejectionReason,
      });
    }
  };

  const getStatusBadge = (inv: any) => {
    if (inv.status === "paid") {
      return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Lunas</Badge>;
    }
    
    if (inv.paymentMethod === "manual") {
      if (inv.approvalStatus === "pending") {
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Menunggu Verifikasi</Badge>;
      }
      if (inv.approvalStatus === "rejected") {
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Ditolak</Badge>;
      }
    }
    
    return <Badge variant="secondary">Belum Bayar</Badge>;
  };

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
        <div className="container py-4">
          <div className="flex items-center justify-between gap-4 mb-2">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => setLocation("/admin")}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Review Pembayaran Manual</h1>
                <p className="text-sm text-muted-foreground">Setujui atau tolak bukti pembayaran dari penghuni</p>
              </div>
            </div>
            <Button onClick={exportToCSV} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <Card>
          <CardHeader className="space-y-4">
            <CardTitle>Daftar Pembayaran Manual</CardTitle>
            <div className="flex flex-wrap gap-2">
                <Button 
                  variant={filter === 'pending' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setFilter('pending')}
                >
                  <Clock className="h-4 w-4 mr-1" />
                  Menunggu Review
                </Button>
                <Button 
                  variant={filter === 'approved' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setFilter('approved')}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Disetujui
                </Button>
                <Button 
                  variant={filter === 'rejected' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setFilter('rejected')}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Ditolak
                </Button>
                <Button 
                  variant={filter === 'all' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setFilter('all')}
                >
                  Semua
                </Button>
              </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : invoices && invoices.length > 0 ? (() => {
              const filteredInvoices = invoices.filter((inv: any) => {
                if (filter === 'pending') return inv.paymentMethod === 'manual' && inv.approvalStatus === 'pending';
                if (filter === 'approved') return inv.status === 'paid' && inv.paymentMethod === 'manual';
                if (filter === 'rejected') return inv.approvalStatus === 'rejected';
                return inv.paymentMethod === 'manual'; // all manual payments
              });
              
              if (filteredInvoices.length === 0) {
                return (
                  <div className="text-center py-12">
                    <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg font-medium text-foreground mb-2">
                      Tidak ada pembayaran
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {filter === 'pending' && 'Tidak ada pembayaran yang menunggu review'}
                      {filter === 'approved' && 'Belum ada pembayaran yang disetujui'}
                      {filter === 'rejected' && 'Tidak ada pembayaran yang ditolak'}
                      {filter === 'all' && 'Belum ada pembayaran manual'}
                    </p>
                  </div>
                );
              }
              
              return (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Penghuni</TableHead>
                    <TableHead>Kamar</TableHead>
                    <TableHead>Bulan</TableHead>
                    <TableHead>Jumlah</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Jatuh Tempo</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((inv: any) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">
                        {inv.tenantName || `User #${inv.userId}`}
                        {inv.tenantEmail && (
                          <div className="text-xs text-muted-foreground">{inv.tenantEmail}</div>
                        )}
                      </TableCell>
                      <TableCell>{inv.kamarId}</TableCell>
                      <TableCell>{inv.bulan}</TableCell>
                      <TableCell>Rp {inv.jumlahTagihan.toLocaleString("id-ID")}</TableCell>
                      <TableCell>{getStatusBadge(inv)}</TableCell>
                      <TableCell>{new Date(inv.tanggalJatuhTempo).toLocaleDateString("id-ID")}</TableCell>
                      <TableCell className="text-right">
                        {inv.paymentMethod === "manual" && inv.approvalStatus === "pending" && inv.paymentProof && (
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const win = window.open();
                                if (win) {
                                  win.document.write(`<img src="${inv.paymentProof}" style="max-width:100%;height:auto;" />`);
                                }
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Lihat Bukti
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleApprove(inv.id)}
                              disabled={approveMutation.isPending}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Setujui
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setRejectInvoiceId(inv.id)}
                              disabled={rejectMutation.isPending}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Tolak
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              );
            })() : (
              <div className="text-center py-8 text-muted-foreground">
                Belum ada data pembayaran
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reject Dialog */}
        <Dialog open={!!rejectInvoiceId} onOpenChange={() => setRejectInvoiceId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tolak Pembayaran</DialogTitle>
              <DialogDescription>
                Berikan alasan penolakan pembayaran
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="reason">Alasan Penolakan</Label>
                <Textarea
                  id="reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Contoh: Bukti transfer tidak jelas, nominal tidak sesuai, dll"
                  rows={4}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectInvoiceId(null)}>
                Batal
              </Button>
              <Button variant="destructive" onClick={handleReject} disabled={rejectMutation.isPending}>
                {rejectMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Tolak Pembayaran
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
