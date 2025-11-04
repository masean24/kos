# OAuth Alternatives for VPS Deployment

Sistem ini saat ini menggunakan Manus OAuth untuk autentikasi. Untuk deployment di VPS sendiri, Anda punya beberapa pilihan:

## Opsi 1: Custom Username/Password Login (Paling Sederhana)

Ganti Manus OAuth dengan sistem login username/password tradisional.

### Langkah-langkah:

1. **Update Database Schema** (`drizzle/schema.ts`):
```typescript
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  password: text("password").notNull(), // Hashed dengan bcrypt
  name: text("name"),
  email: varchar("email", { length: 320 }),
  nomorHp: varchar("nomorHp", { length: 20 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  kamarId: int("kamarId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
```

2. **Install bcrypt**:
```bash
pnpm add bcrypt
pnpm add -D @types/bcrypt
```

3. **Buat Login/Register Procedures** (`server/routers.ts`):
```typescript
import bcrypt from 'bcrypt';

auth: router({
  register: publicProcedure
    .input(z.object({
      username: z.string().min(3),
      password: z.string().min(6),
      name: z.string(),
      email: z.string().email().optional(),
      nomorHp: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const hashedPassword = await bcrypt.hash(input.password, 10);
      const user = await db.createUser({
        ...input,
        password: hashedPassword,
        role: 'user',
      });
      return { success: true, userId: user.id };
    }),

  login: publicProcedure
    .input(z.object({
      username: z.string(),
      password: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const user = await db.getUserByUsername(input.username);
      if (!user) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Username atau password salah' });
      }
      
      const valid = await bcrypt.compare(input.password, user.password);
      if (!valid) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Username atau password salah' });
      }
      
      // Set session cookie
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!);
      ctx.res.cookie('session', token, { httpOnly: true, secure: true });
      
      return { success: true, user: { id: user.id, name: user.name, role: user.role } };
    }),

  me: publicProcedure.query(({ ctx }) => ctx.user),
  
  logout: publicProcedure.mutation(({ ctx }) => {
    ctx.res.clearCookie('session');
    return { success: true };
  }),
}),
```

4. **Update Context** (`server/_core/context.ts`):
```typescript
import jwt from 'jsonwebtoken';

export async function createContext({ req, res }: CreateContextOptions) {
  const token = req.cookies.session;
  let user = null;
  
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
      user = await getUserById(decoded.userId);
    } catch (error) {
      // Invalid token
    }
  }
  
  return { req, res, user };
}
```

5. **Buat Login UI** (`client/src/pages/Login.tsx`):
```typescript
export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      window.location.href = '/admin';
    },
  });

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      loginMutation.mutate({ username, password });
    }}>
      <input value={username} onChange={(e) => setUsername(e.target.value)} />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button type="submit">Login</button>
    </form>
  );
}
```

## Opsi 2: Tetap Pakai Manus OAuth (Gratis)

Manus OAuth tetap bisa dipakai gratis untuk aplikasi Anda sendiri. Tidak perlu ganti sistem auth.

**Keuntungan:**
- Sudah jadi, tidak perlu coding tambahan
- Secure by default
- Support Google, GitHub, Email login

**Cara pakai:**
- Deploy aplikasi ke VPS
- Set environment variables yang sama (`OAUTH_SERVER_URL`, `VITE_OAUTH_PORTAL_URL`, dll)
- Sistem OAuth akan tetap bekerja

## Opsi 3: OAuth Provider Lain (Google, GitHub, dll)

Gunakan library seperti **NextAuth.js** atau **Passport.js** untuk integrasi dengan:
- Google OAuth
- GitHub OAuth
- Facebook Login
- dll

Ini memerlukan perubahan signifikan pada kode auth, tapi memberikan fleksibilitas lebih.

## Rekomendasi

**Untuk VPS pribadi:** Gunakan **Opsi 1** (Custom Login) - paling sederhana dan tidak bergantung pada service eksternal.

**Untuk production dengan banyak user:** Tetap pakai **Opsi 2** (Manus OAuth) atau gunakan **Opsi 3** (Google/GitHub OAuth) untuk UX yang lebih baik.

## Admin Default

Untuk membuat admin pertama kali:

**Dengan Manus OAuth (current):**
- Set `OWNER_OPEN_ID` di environment variables dengan OpenID Anda

**Dengan Custom Login:**
- Jalankan script seed untuk create admin:
```typescript
// seed-admin.ts
import bcrypt from 'bcrypt';
import { db } from './server/db';

async function seedAdmin() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await db.createUser({
    username: 'admin',
    password: hashedPassword,
    name: 'Administrator',
    email: 'admin@example.com',
    role: 'admin',
  });
  console.log('Admin user created: username=admin, password=admin123');
}

seedAdmin();
```

Jalankan: `node seed-admin.mjs`
