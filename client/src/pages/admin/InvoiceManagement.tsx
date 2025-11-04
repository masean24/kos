import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Loader2, Plus, CheckCircle, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function InvoiceManagement() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [bulan, setBulan] = useState("");
  const [tanggalJatuhTempo, setTanggalJatuhTempo] = useState("");

  const utils = trpc.useUtils();
  const { data: invoices, isLoading } = trpc.invoice.list.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
  });

  const generateMutation = trpc.invoice.generateMonthly.useMutation({
    onSuccess: (data) => {
      utils.invoice.list.invalidate();
      setIsGenerateOpen(false);
      setBulan("");
      setTanggalJatuhTempo("");
      toast.success(`Berhasil generate ${data.count} invoice`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateStatusMutation = trpc.invoice.updateStatus.useMutation({
    onSuccess: () => {
      utils.invoice.list.invalidate();
      toast.success("Status invoice berhasil diupdate");
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

  const handleGenerate = () => {
    if (!bulan || !tanggalJatuhTempo) {
      toast.error("Mohon lengkapi semua field");
      return;
    }
    generateMutation.mutate({
      bulan,
      tanggalJatuhTempo: new Date(tanggalJatuhTempo),
    });
  };

  const handleMarkAsPaid = (id: number) => {
    if (confirm("Tandai invoice ini sebagai sudah dibayar?")) {
      updateStatusMutation.mutate({ id, status: "paid" });
    }
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
          <div className="flex items-center gap-4 mb-2">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/admin")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Kelola Invoice</h1>
              <p className="text-sm text-muted-foreground">Manajemen invoice pembayaran</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Daftar Invoice</CardTitle>
            <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Generate Invoice Bulanan
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Generate Invoice Bulanan</DialogTitle>
                  <DialogDescription>
                    Sistem akan otomatis membuat invoice untuk semua penghuni aktif
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="bulan">Bulan (Format: YYYY-MM)</Label>
                    <Input
                      id="bulan"
                      type="month"
                      value={bulan}
                      onChange={(e) => setBulan(e.target.value)}
                      placeholder="2025-01"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tanggalJatuhTempo">Tanggal Jatuh Tempo</Label>
                    <Input
                      id="tanggalJatuhTempo"
                      type="date"
                      value={tanggalJatuhTempo}
                      onChange={(e) => setTanggalJatuhTempo(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsGenerateOpen(false)}>
                    Batal
                  </Button>
                  <Button onClick={handleGenerate} disabled={generateMutation.isPending}>
                    {generateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Generate
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
                          {inv.status === "paid" ? "Paid" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(inv.tanggalJatuhTempo).toLocaleDateString("id-ID")}</TableCell>
                      <TableCell className="text-right">
                        {inv.status === "pending" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsPaid(inv.id)}
                            disabled={updateStatusMutation.isPending}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Tandai Lunas
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Belum ada invoice. Klik "Generate Invoice Bulanan" untuk membuat invoice.
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
