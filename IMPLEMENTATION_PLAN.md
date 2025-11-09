# Plan d'Implémentation - Architecture Next.js + Odoo + Alpine.js

## 🎯 Objectif

Créer une plateforme SaaS moderne type Dougs.fr avec:
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Odoo 17 (API REST/JSON-RPC)
- **Landing Page**: Alpine.js pour animations et interactivité
- **Design**: Shadcn/ui + animations fluides

---

## 📁 Architecture Finale

```
ISEB/
├── frontend/                    # Application Next.js
│   ├── app/                     # App Router (Next.js 14)
│   │   ├── (marketing)/         # Routes publiques
│   │   │   ├── page.tsx         # Landing page (Alpine.js)
│   │   │   ├── pricing/
│   │   │   └── features/
│   │   ├── (app)/               # Routes authentifiées
│   │   │   ├── dashboard/
│   │   │   ├── documents/
│   │   │   ├── expenses/
│   │   │   └── settings/
│   │   ├── api/                 # API routes
│   │   │   ├── auth/
│   │   │   └── odoo/
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                  # Shadcn/ui components
│   │   ├── dashboard/
│   │   ├── marketing/
│   │   └── shared/
│   ├── lib/
│   │   ├── odoo/                # Odoo API client
│   │   │   ├── client.ts
│   │   │   ├── auth.ts
│   │   │   └── models/
│   │   ├── utils.ts
│   │   └── types.ts
│   ├── public/
│   ├── styles/
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   └── next.config.js
│
├── addons/                      # Modules Odoo (backend)
│   ├── french_accounting/
│   ├── client_portal/
│   ├── cabinet_portal/
│   └── ...
│
├── docker-compose.yml           # Odoo + PostgreSQL + Redis
└── docker-compose.frontend.yml  # Next.js (dev/prod)
```

---

## 🚀 Phase 1: Setup Next.js (Semaine 1)

### Jour 1: Initialisation du Projet

1. **Créer le projet Next.js**
   ```bash
   npx create-next-app@latest frontend \
     --typescript \
     --tailwind \
     --app \
     --src-dir \
     --import-alias "@/*"
   ```

2. **Installer les dépendances**
   ```bash
   cd frontend
   npm install \
     @tanstack/react-query \
     axios \
     zod \
     zustand \
     alpinejs \
     @headlessui/react \
     framer-motion \
     recharts \
     date-fns \
     class-variance-authority \
     clsx \
     tailwind-merge
   ```

3. **Installer Shadcn/ui**
   ```bash
   npx shadcn-ui@latest init
   npx shadcn-ui@latest add button card input form dialog
   ```

### Jour 2: Configuration

1. **TypeScript Config**
   - Strict mode
   - Path aliases
   - Types pour Odoo API

2. **Tailwind Config**
   - Custom colors (ISEB branding)
   - Custom fonts
   - Animations

3. **ESLint + Prettier**
   - Code quality
   - Format automatique

### Jour 3-4: Odoo API Client

1. **Créer le client Odoo**
   ```typescript
   // lib/odoo/client.ts
   class OdooClient {
     private baseUrl: string;
     private db: string;

     async authenticate(username: string, password: string)
     async call(model: string, method: string, args: any[])
     async search(model: string, domain: any[])
     async read(model: string, ids: number[], fields: string[])
     async create(model: string, values: any)
     async write(model: string, ids: number[], values: any)
   }
   ```

2. **Types TypeScript pour modèles Odoo**
   ```typescript
   // lib/odoo/models/client.ts
   interface Client {
     id: number;
     name: string;
     email: string;
     company_name?: string;
     is_iseb_client: boolean;
   }

   // lib/odoo/models/document.ts
   interface Document {
     id: number;
     name: string;
     document_type: 'invoice' | 'receipt' | 'contract';
     file_data: string;
     upload_date: string;
   }
   ```

3. **React Query hooks**
   ```typescript
   // lib/odoo/hooks/useClients.ts
   export function useClients() {
     return useQuery({
       queryKey: ['clients'],
       queryFn: () => odooClient.search('res.partner', [['is_iseb_client', '=', true]])
     });
   }
   ```

### Jour 5: Authentication

1. **NextAuth.js ou custom auth**
   ```typescript
   // app/api/auth/[...nextauth]/route.ts
   export const authOptions = {
     providers: [
       CredentialsProvider({
         async authorize(credentials) {
           const user = await odooClient.authenticate(
             credentials.username,
             credentials.password
           );
           return user;
         }
       })
     ],
     session: { strategy: 'jwt' }
   };
   ```

2. **Middleware de protection**
   ```typescript
   // middleware.ts
   export function middleware(request: NextRequest) {
     const token = request.cookies.get('auth-token');
     if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
       return NextResponse.redirect(new URL('/login', request.url));
     }
   }
   ```

---

## 🎨 Phase 2: Landing Page avec Alpine.js (Semaine 1-2)

### Jour 1-2: Landing Page Structure

1. **Hero Section avec Alpine.js**
   ```tsx
   // app/(marketing)/page.tsx
   export default function HomePage() {
     return (
       <>
         {/* Alpine.js animations */}
         <Script src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js" />

         <section
           className="hero"
           x-data="{ shown: false }"
           x-init="setTimeout(() => shown = true, 100)"
           x-show="shown"
           x-transition:enter="transition ease-out duration-1000"
           x-transition:enter-start="opacity-0 transform scale-95"
           x-transition:enter-end="opacity-100 transform scale-100"
         >
           <h1 className="text-6xl font-bold">
             La compta qui vous fait gagner du temps
           </h1>
         </section>
       </>
     );
   }
   ```

2. **Features Cards avec animations**
   ```tsx
   <div
     x-data="{ inView: false }"
     x-intersect="inView = true"
     x-show="inView"
     x-transition:enter="transition ease-out duration-700 delay-100"
     className="grid grid-cols-3 gap-8"
   >
     {features.map((feature, i) => (
       <FeatureCard key={i} {...feature} delay={i * 100} />
     ))}
   </div>
   ```

3. **Pricing avec hover effects**
   ```tsx
   <div
     x-data="{ hovered: false }"
     @mouseenter="hovered = true"
     @mouseleave="hovered = false"
     :class="hovered ? 'scale-105 shadow-2xl' : 'scale-100'"
     className="transition-all duration-300"
   >
     <PricingCard />
   </div>
   ```

### Jour 3: Animations Avancées

1. **Scroll animations avec Alpine.js + Intersection Observer**
2. **Parallax effects**
3. **Number counters** (stats animés)
4. **Smooth scroll** entre sections

### Jour 4: Optimisations

1. **Images WebP** avec Next.js Image
2. **Lazy loading**
3. **Font optimization**
4. **Performance audit** (Lighthouse)

---

## 📊 Phase 3: Dashboard Interactif (Semaine 2-3)

### Jour 1-3: Dashboard Core

1. **Layout avec Sidebar**
   ```tsx
   // app/(app)/layout.tsx
   export default function AppLayout({ children }) {
     return (
       <div className="flex h-screen">
         <Sidebar />
         <main className="flex-1 overflow-y-auto">
           {children}
         </main>
       </div>
     );
   }
   ```

2. **Dashboard Page avec widgets**
   ```tsx
   // app/(app)/dashboard/page.tsx
   export default function DashboardPage() {
     const { data: stats } = useDashboardStats();

     return (
       <div className="grid grid-cols-4 gap-6">
         <StatCard title="Trésorerie" value={stats?.balance} />
         <StatCard title="CA du mois" value={stats?.revenue} />
         <RevenueChart data={stats?.chartData} />
         <RecentTransactions />
       </div>
     );
   }
   ```

3. **Graphiques avec Recharts**
   ```tsx
   // components/dashboard/RevenueChart.tsx
   import { LineChart, Line, XAxis, YAxis } from 'recharts';

   export function RevenueChart({ data }) {
     return (
       <ResponsiveContainer width="100%" height={300}>
         <LineChart data={data}>
           <Line
             type="monotone"
             dataKey="revenue"
             stroke="#8884d8"
             strokeWidth={2}
           />
         </LineChart>
       </ResponsiveContainer>
     );
   }
   ```

### Jour 4-5: Documents & Expenses

1. **Upload de documents** avec drag & drop
2. **Liste de documents** avec filtres
3. **Création de notes de frais**
4. **OCR preview** (si activé)

---

## 🔐 Phase 4: Authentification & Sécurité (Semaine 3)

### Jour 1-2: Auth Flow

1. **Login page**
   ```tsx
   // app/(marketing)/login/page.tsx
   export default function LoginPage() {
     const [login, { isLoading }] = useLogin();

     return (
       <form onSubmit={handleSubmit(login)}>
         <Input {...register('email')} />
         <Input type="password" {...register('password')} />
         <Button disabled={isLoading}>Se connecter</Button>
       </form>
     );
   }
   ```

2. **Session management**
3. **Refresh tokens**
4. **Protected routes**

### Jour 3: Sécurité

1. **CSRF protection**
2. **Rate limiting**
3. **Input validation** (Zod schemas)
4. **XSS prevention**

---

## 🐳 Phase 5: Docker & Deployment (Semaine 4)

### Jour 1-2: Docker Setup

1. **Dockerfile pour Next.js**
   ```dockerfile
   # frontend/Dockerfile
   FROM node:20-alpine AS base

   # Dependencies
   FROM base AS deps
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci

   # Builder
   FROM base AS builder
   WORKDIR /app
   COPY --from=deps /app/node_modules ./node_modules
   COPY . .
   RUN npm run build

   # Runner
   FROM base AS runner
   WORKDIR /app
   ENV NODE_ENV production
   COPY --from=builder /app/.next/standalone ./
   COPY --from=builder /app/.next/static ./.next/static
   EXPOSE 3000
   CMD ["node", "server.js"]
   ```

2. **docker-compose.frontend.yml**
   ```yaml
   services:
     frontend:
       build:
         context: ./frontend
         dockerfile: Dockerfile
       ports:
         - "3000:3000"
       environment:
         NEXT_PUBLIC_ODOO_URL: http://odoo:8069
         ODOO_DB: iseb_prod
       depends_on:
         - odoo
       networks:
         - iseb-network
   ```

3. **Nginx reverse proxy** (optionnel)
   ```nginx
   upstream frontend {
     server frontend:3000;
   }

   upstream backend {
     server odoo:8069;
   }

   server {
     listen 80;

     location / {
       proxy_pass http://frontend;
     }

     location /api/odoo {
       proxy_pass http://backend;
     }
   }
   ```

### Jour 3-4: Deployment

1. **Vercel** (frontend)
   - Push to GitHub
   - Connect Vercel
   - Configure environment variables
   - Deploy

2. **DigitalOcean/AWS** (backend Odoo)
   - Docker Compose sur VPS
   - PostgreSQL managed database
   - Redis cache
   - SSL/HTTPS

### Jour 5: CI/CD

1. **GitHub Actions**
   ```yaml
   # .github/workflows/deploy.yml
   name: Deploy
   on:
     push:
       branches: [main]

   jobs:
     deploy-frontend:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - uses: actions/setup-node@v3
         - run: npm ci
         - run: npm run build
         - uses: vercel/actions@v1

     deploy-backend:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - run: docker build -t iseb-backend .
         - run: docker push iseb-backend
   ```

---

## 📚 Phase 6: Documentation (Continu)

### À créer:

1. **README.md** - Setup instructions
2. **ARCHITECTURE.md** - Architecture détaillée
3. **API.md** - Documentation API Odoo
4. **DEPLOYMENT.md** - Guide de déploiement
5. **CONTRIBUTING.md** - Guide pour contributeurs

---

## ✅ Checklist Complète

### Setup Initial
- [ ] Créer projet Next.js avec TypeScript
- [ ] Configurer Tailwind CSS
- [ ] Installer Shadcn/ui
- [ ] Configurer ESLint/Prettier
- [ ] Setup Git + .gitignore

### Odoo API Integration
- [ ] Créer OdooClient class
- [ ] Implémenter authentication
- [ ] Créer types TypeScript pour modèles
- [ ] Setup React Query
- [ ] Créer hooks personnalisés

### Landing Page
- [ ] Intégrer Alpine.js
- [ ] Hero section avec animations
- [ ] Features cards avec scroll reveal
- [ ] Pricing section interactive
- [ ] Contact form
- [ ] FAQ accordion
- [ ] Testimonials carousel
- [ ] Optimiser images (WebP)
- [ ] Lighthouse score > 90

### Dashboard
- [ ] Layout avec sidebar
- [ ] Dashboard page (stats + charts)
- [ ] Documents page (upload + list)
- [ ] Expenses page (create + list)
- [ ] Settings page
- [ ] Real-time updates
- [ ] Responsive design
- [ ] Loading states
- [ ] Error handling

### Authentication
- [ ] Login page
- [ ] Signup page
- [ ] Password reset
- [ ] Email verification
- [ ] Protected routes middleware
- [ ] Session management
- [ ] Logout functionality

### Performance
- [ ] Code splitting
- [ ] Lazy loading
- [ ] Image optimization
- [ ] Bundle size < 200KB
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s

### Security
- [ ] CSRF protection
- [ ] XSS prevention
- [ ] SQL injection prevention
- [ ] Rate limiting
- [ ] Input validation (Zod)
- [ ] Secure headers

### Docker & Deployment
- [ ] Dockerfile frontend
- [ ] docker-compose.yml
- [ ] Environment variables
- [ ] Deploy to Vercel
- [ ] Configure domain
- [ ] SSL certificate
- [ ] CDN setup

### Testing
- [ ] Unit tests (Jest)
- [ ] Integration tests
- [ ] E2E tests (Playwright)
- [ ] API tests
- [ ] Coverage > 80%

### Documentation
- [ ] README.md
- [ ] API documentation
- [ ] Component Storybook
- [ ] Architecture diagram
- [ ] Deployment guide

---

## 🎯 Priorités

### MVP (2 semaines)
1. ✅ Setup Next.js + Odoo API
2. ✅ Landing page avec Alpine.js
3. ✅ Authentication
4. ✅ Dashboard basique
5. ✅ Upload documents

### V1 (4 semaines)
1. ✅ Tout MVP +
2. ✅ Graphiques interactifs
3. ✅ Notes de frais
4. ✅ Responsive design
5. ✅ Deployment Vercel

### V2 (8 semaines)
1. ✅ Tout V1 +
2. ✅ Real-time notifications
3. ✅ Advanced analytics
4. ✅ Mobile app (React Native)
5. ✅ API publique

---

## 📈 Timeline Estimé

| Phase | Durée | Jalons |
|-------|-------|--------|
| **Phase 1: Setup** | 5 jours | Next.js + API Odoo |
| **Phase 2: Landing** | 4 jours | Page marketing complète |
| **Phase 3: Dashboard** | 10 jours | App fonctionnelle |
| **Phase 4: Auth** | 5 jours | Sécurité complète |
| **Phase 5: Deploy** | 5 jours | Production ready |
| **Phase 6: Polish** | 5 jours | Tests + docs |
| **TOTAL** | **34 jours** | **MVP production** |

---

## 🚀 Commandes Rapides

```bash
# Setup initial
npx create-next-app@latest frontend --typescript --tailwind --app
cd frontend
npm install @tanstack/react-query axios zod zustand alpinejs

# Development
npm run dev              # http://localhost:3000

# Build
npm run build
npm run start

# Docker
docker-compose -f docker-compose.frontend.yml up -d

# Deploy
vercel --prod
```

---

## 💡 Conseils

1. **Commencer simple**: MVP d'abord, features avancées ensuite
2. **Tester tôt**: Tests dès le début, pas à la fin
3. **Performance d'abord**: Optimiser dès le début
4. **Mobile-first**: Designer pour mobile d'abord
5. **Documenter**: README à jour à chaque feature

---

## 📞 Support

- Documentation Next.js: https://nextjs.org/docs
- Documentation Odoo API: https://www.odoo.com/documentation/17.0/developer/reference/external_api.html
- Alpine.js: https://alpinejs.dev/
- Shadcn/ui: https://ui.shadcn.com/

---

**Prêt à démarrer? Commençons par Phase 1! 🚀**
