import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { useLocation } from "wouter";
import { getLoginUrl, APP_TITLE } from "@/const";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function TenantRegister() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [nomorHp, setNomorHp] = useState("");
  const [nomorKamar, setNomorKamar] = useState("");
  const [checkingRoom, setCheckingRoom] = useState(false);
  const [roomAvailable, setRoomAvailable] = useState<boolean | null>(null);
  const [roomMessage, setRoomMessage] = useState("");

  const registerMutation = trpc.tenant.register.useMutation({
    onSuccess: () => {
      toast.success("Registrasi berhasil! Selamat datang.");
      setLocation("/tenant");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const checkAvailability = trpc.kamar.checkAvailability.useQuery(
    { nomorKamar },
    {
      enabled: false,
    }
  );

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = getLoginUrl();
    } else if (!authLoading && user && user.kamarId) {
      // Already registered
      setLocation("/tenant");
    }
  }, [user, authLoading, setLocation]);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const handleCheckRoom = async () => {
    if (!nomorKamar) {
      toast.error("Masukkan nomor kamar terlebih dahulu");
      return;
    }

    setCheckingRoom(true);
    try {
      const result = await checkAvailability.refetch();
      if (result.data) {
        setRoomAvailable(result.data.available);
        setRoomMessage(result.data.message || "");
      }
    } catch (error) {
      toast.error("Gagal mengecek ketersediaan kamar");
    } finally {
      setCheckingRoom(false);
    }
  };

  const handleRegister = () => {
    if (!name || !email || !nomorHp || !nomorKamar) {
      toast.error("Mohon lengkapi semua field");
      return;
    }

    if (!roomAvailable) {
      toast.error("Silakan cek ketersediaan kamar terlebih dahulu");
      return;
    }

    if (!user?.openId) {
      toast.error("Session tidak valid");
      return;
    }

    registerMutation.mutate({
      openId: user.openId,
      name,
      email,
      nomorHp,
      nomorKamar,
    });
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Registrasi Penghuni</CardTitle>
          <CardDescription>Lengkapi data diri untuk mendaftar sebagai penghuni kost</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Nama Lengkap</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masukkan nama lengkap"
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
            <Label htmlFor="nomorHp">Nomor HP</Label>
            <Input
              id="nomorHp"
              value={nomorHp}
              onChange={(e) => setNomorHp(e.target.value)}
              placeholder="08xxxxxxxxxx"
            />
          </div>

          <div>
            <Label htmlFor="nomorKamar">Nomor Kamar</Label>
            <div className="flex gap-2">
              <Input
                id="nomorKamar"
                value={nomorKamar}
                onChange={(e) => {
                  setNomorKamar(e.target.value);
                  setRoomAvailable(null);
                  setRoomMessage("");
                }}
                placeholder="Contoh: 101"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleCheckRoom}
                disabled={checkingRoom || !nomorKamar}
              >
                {checkingRoom ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cek"}
              </Button>
            </div>
            {roomAvailable !== null && (
              <div className={`mt-2 flex items-center gap-2 text-sm ${roomAvailable ? "text-green-600" : "text-red-600"}`}>
                {roomAvailable ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>Kamar tersedia!</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4" />
                    <span>{roomMessage}</span>
                  </>
                )}
              </div>
            )}
          </div>

          <Button
            className="w-full"
            onClick={handleRegister}
            disabled={registerMutation.isPending || !roomAvailable}
          >
            {registerMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Daftar Sekarang
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
