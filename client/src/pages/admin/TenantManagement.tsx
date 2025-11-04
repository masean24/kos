import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { Loader2, ArrowLeft, Plus } from "lucide-react";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function TenantManagement() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [nomorHp, setNomorHp] = useState("");
  const [nomorKamar, setNomorKamar] = useState("");

  const utils = trpc.useUtils();
  const { data: tenants, isLoading } = trpc.tenant.list.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
  });

  const createMutation = trpc.tenant.createByAdmin.useMutation({
    onSuccess: () => {
      utils.tenant.list.invalidate();
      utils.kamar.list.invalidate();
      setIsCreateOpen(false);
      setUsername("");
      setPassword("");
      setName("");
      setEmail("");
      setNomorHp("");
      setNomorKamar("");
      toast.success("Penghuni berhasil ditambahkan");
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

  const handleCreate = () => {
    if (!username || !password || !name || !email || !nomorHp || !nomorKamar) {
      toast.error("Mohon lengkapi semua field");
      return;
    }
    if (password.length < 6) {
      toast.error("Password minimal 6 karakter");
      return;
    }
    createMutation.mutate({ username, password, name, email, nomorHp, nomorKamar });
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
              <h1 className="text-2xl font-bold text-foreground">Daftar Penghuni</h1>
              <p className="text-sm text-muted-foreground">Manajemen penghuni kost</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Daftar Penghuni Aktif</CardTitle>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Penghuni
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tambah Penghuni Baru</DialogTitle>
                  <DialogDescription>
                    Buat akun penghuni dan assign kamar secara langsung
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Username untuk login"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">Nama Lengkap</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nama penghuni"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="nomorHp">Nomor HP (WhatsApp)</Label>
                    <Input
                      id="nomorHp"
                      value={nomorHp}
                      onChange={(e) => setNomorHp(e.target.value)}
                      placeholder="08xxxxxxxxxx"
                    />
                  </div>
                  <div>
                    <Label htmlFor="nomorKamar">Nomor Kamar</Label>
                    <Input
                      id="nomorKamar"
                      value={nomorKamar}
                      onChange={(e) => setNomorKamar(e.target.value)}
                      placeholder="Contoh: 101"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Batal
                  </Button>
                  <Button onClick={handleCreate} disabled={createMutation.isPending}>
                    {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Simpan
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
            ) : tenants && tenants.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Nomor HP</TableHead>
                    <TableHead>Tanggal Bergabung</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenants.map((tenant) => (
                    <TableRow key={tenant.id}>
                      <TableCell className="font-medium">{tenant.name || "-"}</TableCell>
                      <TableCell>{tenant.email || "-"}</TableCell>
                      <TableCell>{tenant.nomorHp || "-"}</TableCell>
                      <TableCell>{new Date(tenant.createdAt).toLocaleDateString("id-ID")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Belum ada penghuni terdaftar.
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
