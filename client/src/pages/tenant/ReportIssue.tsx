import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Loader2, ArrowLeft, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function ReportIssue() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [judul, setJudul] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [prioritas, setPrioritas] = useState<"low" | "medium" | "high">("medium");

  const utils = trpc.useUtils();
  const { data: issues, isLoading } = trpc.issue.list.useQuery(undefined, {
    enabled: !!user && user.role === "penghuni",
  });

  const createMutation = trpc.issue.create.useMutation({
    onSuccess: () => {
      utils.issue.list.invalidate();
      setJudul("");
      setDeskripsi("");
      setPrioritas("medium");
      toast.success("Laporan berhasil dikirim");
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

  const handleSubmit = () => {
    if (!judul || !deskripsi) {
      toast.error("Mohon lengkapi judul dan deskripsi");
      return;
    }
    createMutation.mutate({ judul, deskripsi, prioritas });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge variant="secondary"><AlertCircle className="h-3 w-3 mr-1" />Baru</Badge>;
      case "in_progress":
        return <Badge variant="default"><Clock className="h-3 w-3 mr-1" />Diproses</Badge>;
      case "resolved":
        return <Badge variant="default" className="bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Selesai</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPrioritasLabel = (prioritas: string) => {
    switch (prioritas) {
      case "low":
        return "Rendah";
      case "medium":
        return "Sedang";
      case "high":
        return "Tinggi";
      default:
        return prioritas;
    }
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
              <h1 className="text-2xl font-bold text-foreground">Lapor Masalah</h1>
              <p className="text-sm text-muted-foreground">Laporkan masalah atau keluhan Anda</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Buat Laporan Baru</CardTitle>
            <CardDescription>
              Laporkan masalah terkait kamar atau fasilitas kost
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="judul">Judul Masalah</Label>
              <Input
                id="judul"
                value={judul}
                onChange={(e) => setJudul(e.target.value)}
                placeholder="Contoh: AC tidak dingin"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deskripsi">Deskripsi Detail</Label>
              <Textarea
                id="deskripsi"
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
                placeholder="Jelaskan masalah secara detail..."
                rows={5}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prioritas">Prioritas</Label>
              <Select value={prioritas} onValueChange={(v: any) => setPrioritas(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Rendah</SelectItem>
                  <SelectItem value="medium">Sedang</SelectItem>
                  <SelectItem value="high">Tinggi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSubmit} disabled={createMutation.isPending} className="w-full">
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Kirim Laporan
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Riwayat Laporan</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : issues && issues.length > 0 ? (
              <div className="space-y-4">
                {issues.map((issue) => (
                  <div key={issue.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold">{issue.judul}</h3>
                      {getStatusBadge(issue.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">{issue.deskripsi}</p>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>Prioritas: {getPrioritasLabel(issue.prioritas)}</span>
                      <span>Dibuat: {new Date(issue.createdAt).toLocaleDateString("id-ID")}</span>
                      {issue.resolvedAt && (
                        <span>Selesai: {new Date(issue.resolvedAt).toLocaleDateString("id-ID")}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Belum ada laporan
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
