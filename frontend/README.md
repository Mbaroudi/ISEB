# ISEB Frontend - Next.js + TypeScript

Frontend moderne pour la plateforme ISEB, construite avec Next.js 14, TypeScript, Tailwind CSS et Alpine.js.

## 🚀 Stack Technique

- **Next.js 14** (App Router)
- **TypeScript** (strict mode)
- **Tailwind CSS** (styling)
- **Alpine.js** (animations interactives)
- **Shadcn/ui** (composants UI)
- **TanStack Query** (data fetching)
- **Axios** (HTTP client)
- **Zustand** (state management)
- **Zod** (validation)
- **Framer Motion** (animations avancées)
- **Recharts** (graphiques)

## 📦 Installation

### Prérequis

- Node.js >= 18.17.0
- npm >= 9.0.0

### Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Edit .env.local with your Odoo backend URL
# NEXT_PUBLIC_ODOO_URL=http://localhost:8069
```

## 🛠️ Développement

```bash
# Start development server
npm run dev

# Open http://localhost:3000
```

### Scripts Disponibles

```bash
npm run dev          # Démarrer le serveur de développement
npm run build        # Build pour production
npm run start        # Démarrer le serveur de production
npm run lint         # Linter le code
npm run type-check   # Vérifier les types TypeScript
npm run format       # Formater le code avec Prettier
```

## 🏗️ Structure du Projet

```
frontend/
├── app/                      # Next.js App Router
│   ├── (marketing)/          # Routes publiques (landing page, etc.)
│   │   └── page.tsx
│   ├── (app)/                # Routes authentifiées
│   │   ├── dashboard/
│   │   ├── documents/
│   │   ├── expenses/
│   │   └── settings/
│   ├── api/                  # API routes
│   │   └── auth/
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── ui/                   # Composants UI réutilisables
│   ├── dashboard/            # Composants du dashboard
│   ├── marketing/            # Composants marketing
│   └── shared/               # Composants partagés
├── lib/
│   ├── odoo/                 # Client API Odoo
│   │   ├── client.ts         # OdooClient class
│   │   └── types.ts          # Types TypeScript
│   └── utils.ts              # Fonctions utilitaires
├── public/                   # Assets statiques
├── styles/                   # Styles globaux
├── next.config.mjs           # Configuration Next.js
├── tailwind.config.ts        # Configuration Tailwind
└── tsconfig.json             # Configuration TypeScript
```

## 🔐 Authentification

L'authentification se fait via l'API Odoo JSON-RPC:

```typescript
import { getOdooClient } from "@/lib/odoo/client";

const odoo = getOdooClient();
const user = await odoo.authenticate("username", "password");
```

## 📡 API Odoo

Le client Odoo expose toutes les méthodes nécessaires:

```typescript
// Search & Read
const clients = await odoo.searchRead({
  model: "res.partner",
  domain: [["is_iseb_client", "=", true]],
  fields: ["name", "email", "phone"],
});

// Create
const partnerId = await odoo.create({
  model: "res.partner",
  values: { name: "New Client" },
});

// Update
await odoo.write({
  model: "res.partner",
  ids: [partnerId],
  values: { email: "client@example.com" },
});
```

## 🎨 Composants UI

Utilisation des composants Shadcn/ui:

```tsx
import { Button } from "@/components/ui/button";

export function MyComponent() {
  return (
    <Button variant="gradient" size="xl">
      Click me
    </Button>
  );
}
```

## 🌊 Alpine.js Animations

Les animations sont gérées par Alpine.js:

```tsx
<div
  x-data="{ shown: false }"
  x-init="setTimeout(() => shown = true, 100)"
  x-show="shown"
  x-transition-enter="transition ease-out duration-1000"
>
  Content with fade-in animation
</div>
```

## 🐳 Docker

### Development

```bash
docker build -t iseb-frontend:dev .
docker run -p 3000:3000 iseb-frontend:dev
```

### Production

```bash
docker build -t iseb-frontend:prod --target runner .
docker run -p 3000:3000 iseb-frontend:prod
```

## 📊 Performance

- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **Lighthouse Score**: > 90
- **Bundle Size**: < 200KB (gzipped)

## 🧪 Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:coverage
```

## 🚀 Deployment

### Vercel (Recommandé)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Variables d'environnement

Configurer dans Vercel Dashboard:

```
ODOO_URL=https://your-odoo-instance.com
ODOO_DB=iseb_prod
NEXTAUTH_SECRET=your_secret_here
NEXTAUTH_URL=https://your-domain.com
```

## 📚 Documentation

- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Alpine.js](https://alpinejs.dev/)
- [Shadcn/ui](https://ui.shadcn.com/)
- [Odoo API](https://www.odoo.com/documentation/17.0/developer/reference/external_api.html)

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/amazing-feature`)
3. Commit (`git commit -m 'Add amazing feature'`)
4. Push (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

## 📝 License

ISEB Platform © 2024
