import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Building2, Users, FileText, CreditCard } from "lucide-react";
import { APP_TITLE, getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Home() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && user) {
      if (user.role === "admin") {
        setLocation("/admin");
      } else if (user.role === "penghuni") {
        if (user.kamarId) {
          setLocation("/tenant");
        } else {
          setLocation("/tenant/register");
        }
      }
    }
  }, [user, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b bg-card">
        <div className="container py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-foreground">{APP_TITLE}</h1>
          <Button onClick={() => (window.location.href = getLoginUrl())}>
            Login
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <section className="container py-20 text-center">
          <h2 className="text-4xl font-bold mb-4 text-foreground">
            Sistem Manajemen Kost Modern
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Platform lengkap untuk mengelola kamar, penghuni, dan pembayaran kost dengan mudah dan efisien
          </p>
          <Button size="lg" onClick={() => (window.location.href = getLoginUrl())}>
            Mulai Sekarang
          </Button>
        </section>

        <section className="container py-16">
          <h3 className="text-2xl font-bold text-center mb-12 text-foreground">Fitur Utama</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <Building2 className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Manajemen Kamar</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Kelola semua kamar kost dengan mudah. Tambah, edit, dan monitor status ketersediaan kamar secara real-time.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Data Penghuni</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Registrasi penghuni otomatis dengan validasi kamar. Sistem akan mengecek ketersediaan kamar saat pendaftaran.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <FileText className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Invoice Otomatis</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Generate invoice bulanan untuk semua penghuni secara otomatis. Hemat waktu dan hindari kesalahan manual.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CreditCard className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Pembayaran Digital</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Integrasi dengan Xendit untuk pembayaran via Virtual Account, QRIS, dan e-wallet. Update status otomatis.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="container py-16">
          <Card className="bg-primary text-primary-foreground">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl mb-4">Siap Memulai?</CardTitle>
              <CardDescription className="text-primary-foreground/80 text-lg">
                Login sekarang untuk mengakses dashboard dan mulai mengelola kost Anda
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button
                size="lg"
                variant="secondary"
                onClick={() => (window.location.href = getLoginUrl())}
              >
                Login Sekarang
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>

      <footer className="border-t bg-card py-6">
        <div className="container text-center text-sm text-muted-foreground">
          <p>&copy; 2025 {APP_TITLE}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
