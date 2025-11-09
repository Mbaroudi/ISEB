# 🚀 Guide de Démarrage Rapide - ISEB Platform

Guide pour démarrer rapidement avec l'architecture Next.js + Odoo + Alpine.js.

## 📋 Prérequis

- **Docker Desktop** installé et en cours d'exécution
- **Node.js 18+** et **npm 9+**
- **Git**

## ⚡ Démarrage Rapide (5 minutes)

### Option 1: Stack Complète (Frontend + Backend)

```bash
# 1. Démarrer toute la stack avec Docker
docker-compose -f docker-compose.frontend.yml up -d

# 2. Attendre que tous les services soient healthy (1-2 min)
docker-compose -f docker-compose.frontend.yml ps

# 3. Accéder à l'application
# Frontend: http://localhost:3000
# Backend Odoo: http://localhost:8069
```

### Option 2: Développement Frontend Local

```bash
# 1. Démarrer seulement le backend Odoo
docker-compose up -d

# 2. Installer les dépendances frontend
cd frontend
npm install

# 3. Démarrer le serveur de développement
npm run dev

# 4. Accéder à l'application
# Frontend: http://localhost:3000 (avec hot reload)
# Backend Odoo: http://localhost:8069
```

## 🎯 Ce qui a été Implémenté

### ✅ Frontend Next.js
- Landing page moderne avec Alpine.js
- Animations fluides au scroll
- Hero section avec gradients
- 6 Features cards animées
- Section Pricing (3 formules: 200€, 350€, 500€)
- CTA call-to-action
- Design responsive mobile-first

### ✅ Client API Odoo
- Client TypeScript complet
- Authentification JSON-RPC
- Méthodes CRUD (search, read, create, write, unlink)
- Types TypeScript pour tous les modèles
- Gestion d'erreurs

### ✅ Infrastructure
- Docker Compose pour stack complète
- Dockerfile optimisé (multi-stage)
- Configuration Tailwind CSS
- ESLint + Prettier
- Hot reload en développement

## 📁 Structure Créée

```
ISEB/
├── frontend/                    # Application Next.js
│   ├── app/
│   │   ├── page.tsx            # Landing page avec Alpine.js ✅
│   │   ├── layout.tsx          # Layout principal ✅
│   │   └── globals.css         # Styles Tailwind ✅
│   ├── components/
│   │   └── ui/
│   │       └── button.tsx      # Composant Button ✅
│   ├── lib/
│   │   ├── odoo/
│   │   │   ├── client.ts       # Client API Odoo ✅
│   │   │   └── types.ts        # Types TypeScript ✅
│   │   └── utils.ts            # Utilitaires ✅
│   ├── package.json            ✅
│   ├── tsconfig.json           ✅
│   ├── tailwind.config.ts      ✅
│   └── Dockerfile              ✅
├── docker-compose.frontend.yml  ✅
└── IMPLEMENTATION_PLAN.md       ✅
```

## 🚀 Prochaines Étapes

Voir `IMPLEMENTATION_PLAN.md` pour le plan complet (34 jours).

### Phase 1: Compléter Landing Page (1-2 jours)
- [ ] Formulaire de contact
- [ ] FAQ accordion
- [ ] Témoignages clients

### Phase 2: Authentication (3-5 jours)
- [ ] Page de login
- [ ] Page de signup  
- [ ] Protected routes
- [ ] Session management

### Phase 3: Dashboard (7-10 jours)
- [ ] Layout avec sidebar
- [ ] Dashboard avec stats + charts
- [ ] Documents page (upload + list)
- [ ] Expenses page

## 📚 Documentation Complète

- `frontend/README.md` - Guide complet frontend
- `IMPLEMENTATION_PLAN.md` - Plan détaillé 34 jours
- `WEBSITE_ARCHITECTURE.md` - Options d'architecture
