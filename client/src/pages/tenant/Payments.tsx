import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { Loader2, ArrowLeft, Upload, CheckCircle, XCircle, Clock } from "lucide-react";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { useEffect, useState } from "react";
import { toast } from "sonner";


export default function TenantPayments() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);

  const utils = trpc.useUtils();
  const { data: invoices, isLoading } = trpc.invoice.list.useQuery(undefined, {
    enabled: !!user && user.role === "penghuni",
  });

  const uploadProofMutation = trpc.invoice.uploadPaymentProof.useMutation({
    onSuccess: () => {
      utils.invoice.list.invalidate();
      setSelectedInvoice(null);
      setProofFile(null);
      toast.success("Bukti pembayaran berhasil diupload");
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Ukuran file maksimal 5MB");
        return;
      }
      setProofFile(file);
    }
  };

  const handleUploadProof = () => {
    if (!proofFile || !selectedInvoice) return;

    setUploading(true);
    // Convert file to base64
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64String = reader.result as string;
        
        // Save base64 to database
        await uploadProofMutation.mutateAsync({
          invoiceId: selectedInvoice.id,
          proofUrl: base64String, // data:image/png;base64,iVBORw0KG...
        });
      } catch (error) {
        toast.error("Gagal upload bukti pembayaran");
        console.error(error);
      } finally {
        setUploading(false);
      }
    };
    reader.onerror = () => {
      toast.error("Gagal membaca file");
      setUploading(false);
    };
    reader.readAsDataURL(proofFile);
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
              <h1 className="text-2xl font-bold text-foreground">Riwayat Pembayaran</h1>
              <p className="text-sm text-muted-foreground">Lihat semua tagihan dan status pembayaran</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>Daftar Tagihan</CardTitle>
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
                    <TableHead>Jatuh Tempo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">{inv.bulan}</TableCell>
                      <TableCell>Rp {inv.jumlahTagihan.toLocaleString("id-ID")}</TableCell>
                      <TableCell>{new Date(inv.tanggalJatuhTempo).toLocaleDateString("id-ID")}</TableCell>
                      <TableCell>{getStatusBadge(inv)}</TableCell>
                      <TableCell className="text-right">
                        {inv.status === "pending" && (
                          <>
                            {inv.approvalStatus === "rejected" && inv.rejectionReason && (
                              <div className="text-xs text-destructive mb-2">
                                Alasan: {inv.rejectionReason}
                              </div>
                            )}
                            {(!inv.paymentProof || inv.approvalStatus === "rejected") && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedInvoice(inv)}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload Bukti
                              </Button>
                            )}
                            {inv.approvalStatus === "pending" && (
                              <div className="text-xs text-muted-foreground">
                                Menunggu verifikasi admin
                              </div>
                            )}
                          </>
                        )}
                        {inv.status === "paid" && inv.tanggalDibayar && (
                          <div className="text-xs text-muted-foreground">
                            Dibayar: {new Date(inv.tanggalDibayar).toLocaleDateString("id-ID")}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Belum ada tagihan
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upload Payment Proof Dialog */}
        <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Bukti Pembayaran</DialogTitle>
              <DialogDescription>
                Upload bukti transfer untuk invoice bulan {selectedInvoice?.bulan}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  <div className="font-medium mb-2">Jumlah yang harus dibayar:</div>
                  <div className="text-2xl font-bold">
                    Rp {selectedInvoice?.jumlahTagihan.toLocaleString("id-ID")}
                  </div>
                </AlertDescription>
              </Alert>

              <div>
                <Label htmlFor="proof">Bukti Pembayaran (JPG, PNG, PDF - Max 5MB)</Label>
                <Input
                  id="proof"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  disabled={uploading}
                />
                {proofFile && (
                  <p className="text-sm text-muted-foreground mt-2">
                    File: {proofFile.name} ({(proofFile.size / 1024).toFixed(2)} KB)
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedInvoice(null)} disabled={uploading}>
                Batal
              </Button>
              <Button onClick={handleUploadProof} disabled={!proofFile || uploading}>
                {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Upload
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
