import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, CheckCircle, Clock, CreditCard, Loader2, Upload, XCircle } from "lucide-react";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function TenantPayments() {
  const [location, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'xendit' | 'manual'>('xendit');
  const [uploading, setUploading] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);

  const utils = trpc.useUtils();
  const { data: invoices, isLoading } = trpc.invoice.list.useQuery(undefined, {
    enabled: !!user && user.role === "penghuni",
  });

  const createPaymentMutation = trpc.invoice.createPayment.useMutation({
    onSuccess: (data) => {
      if (data.success && data.paymentUrl) {
        window.open(data.paymentUrl, "_blank");
        toast.success("Redirect ke halaman pembayaran Xendit");
        setSelectedInvoice(null);
      } else {
        toast.info(data.message || "Xendit belum dikonfigurasi");
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const uploadProofMutation = trpc.invoice.uploadPaymentProof.useMutation({
    onSuccess: () => {
      toast.success("Bukti pembayaran berhasil diupload");
      setSelectedInvoice(null);
      setProofFile(null);
      utils.invoice.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = getLoginUrl();
    }
  }, [user, authLoading]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Ukuran file maksimal 5MB");
        return;
      }
      setProofFile(file);
    }
  };

  const handlePayment = () => {
    if (!selectedInvoice) return;

    if (paymentMethod === 'xendit') {
      createPaymentMutation.mutate({ invoiceId: selectedInvoice.id });
    } else if (paymentMethod === 'manual') {
      if (!proofFile) {
        toast.error("Pilih file bukti pembayaran");
        return;
      }

      setUploading(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64String = reader.result as string;
          await uploadProofMutation.mutateAsync({
            invoiceId: selectedInvoice.id,
            proofUrl: base64String,
          });
        } catch (error: any) {
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
    }
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
    return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Belum Bayar</Badge>;
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Memuat halaman...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-y-auto">
      <header className="border-b bg-card shadow-sm">
        <div className="container py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/tenant/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Riwayat Pembayaran</h1>
              <p className="text-sm text-muted-foreground">Lihat semua tagihan dan status pembayaran</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <Card className="hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle>Daftar Tagihan</CardTitle>
            <CardDescription>Pilih invoice untuk melakukan pembayaran</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
                  <p className="text-gray-600">Memuat tagihan...</p>
                </div>
              </div>
            ) : !invoices || invoices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Belum ada tagihan
              </div>
            ) : (
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
                  {invoices.map((inv: any, index: number) => (
                    <TableRow key={inv.id} className="hover:bg-indigo-50/50 transition-colors duration-200 animate-in slide-in-from-left" style={{ animationDelay: `${index * 30}ms` }}>
                      <TableCell className="font-medium">{inv.bulan}</TableCell>
                      <TableCell>Rp {inv.jumlahTagihan.toLocaleString("id-ID")}</TableCell>
                      <TableCell>{new Date(inv.tanggalJatuhTempo).toLocaleDateString("id-ID")}</TableCell>
                      <TableCell>{getStatusBadge(inv)}</TableCell>
                      <TableCell className="text-right">
                        {inv.status === "pending" && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setPaymentMethod('xendit');
                              setProofFile(null);
                            }}
                            className="hover:shadow-md transition-all duration-200"
                          >
                            Bayar
                          </Button>
                        )}
                        {inv.status === "paid" && inv.tanggalDibayar && (
                          <div className="text-xs text-muted-foreground">
                            Dibayar: {new Date(inv.tanggalDibayar).toLocaleDateString("id-ID")}
                          </div>
                        )}
                        {inv.approvalStatus === "rejected" && inv.rejectionReason && (
                          <div className="text-xs text-destructive">
                            Ditolak: {inv.rejectionReason}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Payment Dialog */}
      <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Pilih Metode Pembayaran</DialogTitle>
            <DialogDescription>
              Invoice bulan {selectedInvoice?.bulan} - Rp {selectedInvoice?.jumlahTagihan.toLocaleString("id-ID")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'xendit' | 'manual')}>
              <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-200" onClick={() => setPaymentMethod('xendit')}>
                <RadioGroupItem value="xendit" id="xendit" />
                <Label htmlFor="xendit" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    <div>
                      <div className="font-semibold">Bayar via Xendit</div>
                      <div className="text-xs text-muted-foreground">Transfer bank, e-wallet, QRIS</div>
                    </div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-purple-50 hover:border-purple-300 transition-all duration-200" onClick={() => setPaymentMethod('manual')}>
                <RadioGroupItem value="manual" id="manual" />
                <Label htmlFor="manual" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    <div>
                      <div className="font-semibold">Upload Bukti Transfer</div>
                      <div className="text-xs text-muted-foreground">Transfer manual + upload bukti</div>
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>

            {paymentMethod === 'manual' && (
              <div className="space-y-2">
                <Label htmlFor="proof">Bukti Pembayaran (JPG, PNG, PDF - Max 5MB)</Label>
                <Input
                  id="proof"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                />
                {proofFile && (
                  <p className="text-sm text-muted-foreground">
                    File: {proofFile.name} ({(proofFile.size / 1024).toFixed(2)} KB)
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedInvoice(null)}>
              Batal
            </Button>
            <Button 
              onClick={handlePayment}
              disabled={uploading || createPaymentMutation.isPending || (paymentMethod === 'manual' && !proofFile)}
            >
              {(uploading || createPaymentMutation.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {paymentMethod === 'xendit' ? 'Lanjut ke Xendit' : 'Upload Bukti'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
