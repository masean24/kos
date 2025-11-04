import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Loader2, Plus, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function RoomManagement() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any>(null);
  const [nomorKamar, setNomorKamar] = useState("");
  const [hargaSewa, setHargaSewa] = useState("");

  const utils = trpc.useUtils();
  const { data: rooms, isLoading } = trpc.kamar.list.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
  });

  const createMutation = trpc.kamar.create.useMutation({
    onSuccess: () => {
      utils.kamar.list.invalidate();
      setIsCreateOpen(false);
      setNomorKamar("");
      setHargaSewa("");
      toast.success("Kamar berhasil ditambahkan");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = trpc.kamar.update.useMutation({
    onSuccess: () => {
      utils.kamar.list.invalidate();
      setIsEditOpen(false);
      setEditingRoom(null);
      toast.success("Kamar berhasil diupdate");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = trpc.kamar.delete.useMutation({
    onSuccess: () => {
      utils.kamar.list.invalidate();
      toast.success("Kamar berhasil dihapus");
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
    createMutation.mutate({
      nomorKamar,
      hargaSewa: parseInt(hargaSewa),
    });
  };

  const handleEdit = () => {
    if (!editingRoom) return;
    updateMutation.mutate({
      id: editingRoom.id,
      nomorKamar,
      hargaSewa: parseInt(hargaSewa),
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Yakin ingin menghapus kamar ini?")) {
      deleteMutation.mutate({ id });
    }
  };

  const openEditDialog = (room: any) => {
    setEditingRoom(room);
    setNomorKamar(room.nomorKamar);
    setHargaSewa(room.hargaSewa.toString());
    setIsEditOpen(true);
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
              <h1 className="text-2xl font-bold text-foreground">Kelola Kamar</h1>
              <p className="text-sm text-muted-foreground">Manajemen kamar kost</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Daftar Kamar</CardTitle>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Kamar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tambah Kamar Baru</DialogTitle>
                  <DialogDescription>Masukkan informasi kamar yang akan ditambahkan</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="nomorKamar">Nomor Kamar</Label>
                    <Input
                      id="nomorKamar"
                      value={nomorKamar}
                      onChange={(e) => setNomorKamar(e.target.value)}
                      placeholder="Contoh: 101"
                    />
                  </div>
                  <div>
                    <Label htmlFor="hargaSewa">Harga Sewa (Rp)</Label>
                    <Input
                      id="hargaSewa"
                      type="number"
                      value={hargaSewa}
                      onChange={(e) => setHargaSewa(e.target.value)}
                      placeholder="Contoh: 1500000"
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
            ) : rooms && rooms.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nomor Kamar</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Harga Sewa</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rooms.map((room) => (
                    <TableRow key={room.id}>
                      <TableCell className="font-medium">{room.nomorKamar}</TableCell>
                      <TableCell>
                        <Badge variant={room.status === "kosong" ? "default" : "secondary"}>
                          {room.status === "kosong" ? "Kosong" : "Terisi"}
                        </Badge>
                      </TableCell>
                      <TableCell>Rp {room.hargaSewa.toLocaleString("id-ID")}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(room)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(room.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Belum ada kamar. Klik tombol "Tambah Kamar" untuk menambahkan.
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Kamar</DialogTitle>
              <DialogDescription>Ubah informasi kamar</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="editNomorKamar">Nomor Kamar</Label>
                <Input
                  id="editNomorKamar"
                  value={nomorKamar}
                  onChange={(e) => setNomorKamar(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="editHargaSewa">Harga Sewa (Rp)</Label>
                <Input
                  id="editHargaSewa"
                  type="number"
                  value={hargaSewa}
                  onChange={(e) => setHargaSewa(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleEdit} disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
