import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Loader2, ArrowLeft, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { useEffect } from "react";
import { toast } from "sonner";

export default function IssueManagement() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const utils = trpc.useUtils();
  const { data: issues, isLoading } = trpc.issue.list.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
  });

  const updateStatusMutation = trpc.issue.updateStatus.useMutation({
    onSuccess: () => {
      utils.issue.list.invalidate();
      toast.success("Status berhasil diupdate");
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

  const handleStatusChange = (issueId: number, newStatus: "open" | "in_progress" | "resolved") => {
    updateStatusMutation.mutate({ id: issueId, status: newStatus });
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
              <h1 className="text-2xl font-bold text-foreground">Kelola Laporan</h1>
              <p className="text-sm text-muted-foreground">Kelola laporan masalah dari penghuni</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>Semua Laporan</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : issues && issues.length > 0 ? (
              <div className="space-y-4">
                {issues.map((issue) => (
                  <div key={issue.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{issue.judul}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{issue.deskripsi}</p>
                      </div>
                      {getStatusBadge(issue.status)}
                    </div>
                    
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>User ID: {issue.userId}</span>
                      {issue.kamarId && <span>Kamar ID: {issue.kamarId}</span>}
                      <span>Prioritas: {getPrioritasLabel(issue.prioritas)}</span>
                      <span>Dibuat: {new Date(issue.createdAt).toLocaleDateString("id-ID")}</span>
                      {issue.resolvedAt && (
                        <span>Selesai: {new Date(issue.resolvedAt).toLocaleDateString("id-ID")}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Update Status:</span>
                      <Select
                        value={issue.status}
                        onValueChange={(v: any) => handleStatusChange(issue.id, v)}
                        disabled={updateStatusMutation.isPending}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Baru</SelectItem>
                          <SelectItem value="in_progress">Diproses</SelectItem>
                          <SelectItem value="resolved">Selesai</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Belum ada laporan masalah
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
