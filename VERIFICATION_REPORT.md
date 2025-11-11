# 🔍 RAPPORT DE VÉRIFICATION : Installation & API

**Date** : 11 Novembre 2025
**Branch** : `claude/odoo-saas-accounting-platform-011CUtvteLJZet7GMhVhrMqe`
**Demande** : Vérifier que `./install_all_modules.sh` et toutes les API sont à jour

---

## ❌ PROBLÈME 1 : Script d'Installation Obsolète

### État Actuel

Le script `./install_all_modules.sh` installe **7 modules** sur **11 disponibles**.

**Modules installés** (ligne 28) :
```bash
-i french_accounting,website,client_portal,cabinet_portal,bank_sync,e_invoicing,reporting
```

**Modules disponibles** dans `addons/` :
```
1. ✅ french_accounting      (installé)
2. ✅ client_portal          (installé)
3. ✅ cabinet_portal         (installé)
4. ✅ bank_sync              (installé)
5. ✅ e_invoicing            (installé)
6. ✅ reporting              (installé)
7. ❌ account_import_export  (ABSENT du script)
8. ❌ accounting_collaboration (ABSENT du script)
9. ❌ integrations           (ABSENT du script)
10. ❌ invoice_ocr_config    (ABSENT du script)
11. ❌ web_cors              (ABSENT du script)
```

### Impact

Si on utilise le script actuel, **5 modules critiques ne seront PAS installés** :

| Module Manquant | Impact | Fonctionnalités Perdues |
|-----------------|--------|------------------------|
| **account_import_export** | 🔴 Critique | Import/Export FEC, XIMPORT, CSV - API `/api/accounting/import` et `/api/accounting/export` ne fonctionneront pas |
| **accounting_collaboration** | 🔴 Critique | Questions comptables, fil de discussion - API `/api/collaboration/*` ne fonctionnera pas |
| **invoice_ocr_config** | 🟡 Important | Configuration OCR (Google Vision, AWS Textract, Azure) - Extraction OCR limitée à Tesseract uniquement |
| **integrations** | 🟢 Optionnel | Intégrations tierces (Stripe, PayPal, etc.) |
| **web_cors** | 🟡 Important | Configuration CORS pour frontend Next.js - Problèmes de communication frontend ↔ backend possibles |

### ✅ Correction Recommandée

**Fichier** : `install_all_modules.sh` (ligne 28)

**Remplacer** :
```bash
-i french_accounting,website,client_portal,cabinet_portal,bank_sync,e_invoicing,reporting \
```

**Par** :
```bash
-i french_accounting,website,client_portal,cabinet_portal,accounting_collaboration,invoice_ocr_config,account_import_export,bank_sync,e_invoicing,reporting,integrations,web_cors \
```

**Ordre d'installation recommandé** (respect des dépendances) :
1. `french_accounting` - Base comptable française
2. `website` - Requis pour les assets frontend
3. `web_cors` - Configuration CORS
4. `client_portal` - Portail client avec tous les modèles
5. `cabinet_portal` - Portail cabinet comptable
6. `invoice_ocr_config` - Configuration OCR avancée
7. `accounting_collaboration` - Questions/messages (dépend de client_portal)
8. `account_import_export` - Import/Export comptable
9. `bank_sync` - Synchronisation bancaire
10. `e_invoicing` - Facturation électronique 2026
11. `reporting` - Rapports avancés
12. `integrations` - Intégrations tierces

---

## ❌ PROBLÈME 2 : API Routes Incomplètes

### API Existantes (37 routes) ✅

**Authentification** (3 routes) :
- ✅ `/api/auth/login` - Connexion
- ✅ `/api/auth/logout` - Déconnexion
- ✅ `/api/auth/me` - Profil utilisateur

**Documents** (14 routes) :
- ✅ `/api/documents/upload` - Upload document
- ✅ `/api/documents/list` - Liste documents
- ✅ `/api/documents/search` - Recherche documents
- ✅ `/api/documents/categories` - Catégories
- ✅ `/api/documents/tags` - Tags
- ✅ `/api/documents/[id]` - GET/PUT/DELETE document
- ✅ `/api/documents/[id]/download` - Télécharger
- ✅ `/api/documents/[id]/archive` - Archiver
- ✅ `/api/documents/[id]/validate` - Valider
- ✅ `/api/documents/[id]/ocr` - Résultat OCR
- ✅ `/api/documents/[id]/apply-ocr` - Lancer OCR
- ✅ `/api/documents/[id]/tags` - Gérer tags
- ✅ `/api/documents/[id]/share` - Partager
- ✅ `/api/documents/[id]/transitions` - Workflow

**Fiscal** (9 routes) :
- ✅ `/api/fiscal/obligations` - Liste/Créer obligations
- ✅ `/api/fiscal/obligations/[id]` - GET/PUT/DELETE obligation
- ✅ `/api/fiscal/obligations/[id]/pay` - Marquer payée
- ✅ `/api/fiscal/delegations` - Liste/Créer délégations
- ✅ `/api/fiscal/delegations/[id]` - GET/PUT/DELETE
- ✅ `/api/fiscal/delegations/[id]/sign` - Signer
- ✅ `/api/fiscal/delegations/[id]/suspend` - Suspendre
- ✅ `/api/fiscal/delegations/[id]/revoke` - Révoquer
- ✅ `/api/fiscal/risk-score` - Score de risque fiscal
- ✅ `/api/fiscal/alerts` - Alertes fiscales

**Collaboration** (4 routes) :
- ✅ `/api/collaboration/questions` - Liste/Créer questions
- ✅ `/api/collaboration/questions/[id]` - GET/PUT/DELETE question
- ✅ `/api/collaboration/questions/[id]/messages` - Messages
- ✅ `/api/collaboration/dashboard` - Dashboard collaboration

**Comptabilité** (2 routes) :
- ✅ `/api/accounting/import` - Import FEC/XIMPORT/CSV
- ✅ `/api/accounting/export` - Export FEC

**Rapports** (2 routes) :
- ✅ `/api/reports/generate` - Générer rapport
- ✅ `/api/reports/download` - Télécharger rapport

**Dashboard** (1 route) :
- ✅ `/api/dashboard/stats` - Statistiques dashboard

**Total** : **37 routes API** fonctionnelles

---

### API Manquantes ❌

#### 1. **Bank Sync** (Module `bank_sync`) - 0/8 routes

**Modèles backend présents** :
- `bank.account` - Comptes bancaires
- `bank.provider` - Fournisseurs (Budget Insight, Bridge, etc.)
- `bank.transaction` - Transactions bancaires
- `bank.sync.log` - Logs de synchronisation
- `reconciliation.rule` - Règles de rapprochement

**Routes manquantes** :
```
❌ /api/bank/accounts                      - Liste comptes bancaires
❌ /api/bank/accounts/[id]/sync            - Synchroniser compte
❌ /api/bank/transactions                  - Liste transactions
❌ /api/bank/transactions/[id]/reconcile   - Rapprocher transaction
❌ /api/bank/providers                     - Liste fournisseurs disponibles
❌ /api/bank/providers/[id]/connect        - Connecter fournisseur
❌ /api/bank/sync-logs                     - Logs de synchronisation
❌ /api/bank/reconciliation-rules          - Règles de rapprochement automatique
```

**Impact** : ❌ Fonctionnalité de synchronisation bancaire totalement inaccessible depuis le frontend

---

#### 2. **E-Invoicing** (Module `e_invoicing`) - 0/6 routes

**Modèles backend présents** :
- `account.move` (extension) - Factures électroniques
- `einvoice.format` - Formats (Factur-X, Chorus Pro, UBL)
- `einvoice.log` - Logs d'envoi

**Routes manquantes** :
```
❌ /api/einvoicing/invoices                - Liste factures électroniques
❌ /api/einvoicing/invoices/[id]/send      - Envoyer à Chorus Pro
❌ /api/einvoicing/invoices/[id]/validate  - Valider format
❌ /api/einvoicing/formats                 - Formats disponibles
❌ /api/einvoicing/logs                    - Logs d'envoi
❌ /api/einvoicing/config                  - Configuration Chorus Pro
```

**Impact** : ❌ Conformité facturation électronique 2026 inaccessible

---

#### 3. **Cabinet Portal** (Module `cabinet_portal`) - 0/8 routes

**Modèles backend présents** :
- `cabinet.dashboard` - Dashboard cabinet
- `cabinet.task` - Tâches cabinet
- `cabinet.client` - Clients cabinet

**Routes manquantes** :
```
❌ /api/cabinet/dashboard                  - Dashboard comptable
❌ /api/cabinet/clients                    - Liste clients
❌ /api/cabinet/clients/[id]               - Détail client
❌ /api/cabinet/tasks                      - Liste tâches
❌ /api/cabinet/tasks/[id]                 - Détail tâche
❌ /api/cabinet/tasks/[id]/complete        - Marquer terminée
❌ /api/cabinet/tasks/[id]/assign          - Assigner tâche
❌ /api/cabinet/workload                   - Charge de travail
```

**Impact** : ❌ Portail cabinet comptable inaccessible (uniquement pour usage interne cabinet)

---

#### 4. **Reporting Avancé** (Module `reporting`) - 2/10 routes

**Modèles backend présents** :
- `report.template` - Templates de rapports
- `report.template.line` - Lignes de template
- `report.line` - Lignes de rapport générées

**Routes existantes** :
- ✅ `/api/reports/generate` - Générer rapport
- ✅ `/api/reports/download` - Télécharger rapport

**Routes manquantes** :
```
❌ /api/reports/templates                  - Liste templates
❌ /api/reports/templates/[id]             - Détail template
❌ /api/reports/templates/create           - Créer template personnalisé
❌ /api/reports/history                    - Historique rapports générés
❌ /api/reports/schedule                   - Planifier génération automatique
❌ /api/reports/[id]/share                 - Partager rapport
❌ /api/reports/[id]/export                - Export Excel/PDF
❌ /api/reports/compare                    - Comparer périodes
```

**Impact** : 🟡 Rapports fonctionnels mais personnalisation limitée

---

#### 5. **Expense Notes** (Modèle dans `client_portal`) - 0/6 routes

**Modèle backend présent** :
- `expense.note` - Notes de frais

**Routes manquantes** :
```
❌ /api/expenses                           - Liste notes de frais
❌ /api/expenses/create                    - Créer note de frais
❌ /api/expenses/[id]                      - GET/PUT/DELETE
❌ /api/expenses/[id]/submit               - Soumettre
❌ /api/expenses/[id]/approve              - Approuver
❌ /api/expenses/[id]/reject               - Rejeter
```

**Impact** : ❌ Gestion notes de frais inaccessible depuis frontend

---

### Résumé API Manquantes

| Module | Routes Existantes | Routes Manquantes | Complétude |
|--------|-------------------|-------------------|------------|
| **Documents** | 14 | 0 | ✅ 100% |
| **Fiscal** | 9 | 0 | ✅ 100% |
| **Collaboration** | 4 | 0 | ✅ 100% |
| **Accounting Import/Export** | 2 | 0 | ✅ 100% |
| **Auth** | 3 | 0 | ✅ 100% |
| **Dashboard** | 1 | 0 | ✅ 100% |
| **Reporting** | 2 | 8 | 🟡 20% |
| **Bank Sync** | 0 | 8 | ❌ 0% |
| **E-Invoicing** | 0 | 6 | ❌ 0% |
| **Cabinet Portal** | 0 | 8 | ❌ 0% |
| **Expense Notes** | 0 | 6 | ❌ 0% |

**Total** : 37 routes existantes, 36 routes manquantes

---

## 📊 ANALYSE GLOBALE

### ✅ Ce qui FONCTIONNE

1. ✅ **Module Installation** - Script existe (mais incomplet)
2. ✅ **Core APIs** - Documents, Fiscal, Collaboration = **100% complets**
3. ✅ **Authentication** - Login/Logout/Profile fonctionnels
4. ✅ **Import/Export Comptable** - FEC/XIMPORT/CSV supportés
5. ✅ **Dashboard Stats** - Statistiques disponibles

### ❌ Ce qui NE FONCTIONNE PAS

1. ❌ **Script d'installation incomplet** - 5 modules manquants (45% de modules absents)
2. ❌ **Bank Sync APIs** - 0% implémenté (8 routes manquantes)
3. ❌ **E-Invoicing APIs** - 0% implémenté (6 routes manquantes)
4. ❌ **Cabinet Portal APIs** - 0% implémenté (8 routes manquantes)
5. ❌ **Expense Notes APIs** - 0% implémenté (6 routes manquantes)
6. ❌ **Reporting avancé** - Seulement 20% implémenté

---

## ✅ ACTIONS CORRECTIVES REQUISES

### Priorité 1 : Corriger le Script d'Installation 🔴

**Fichier** : `./install_all_modules.sh`

**Changement** :
```diff
 docker-compose run --rm odoo odoo \
     -d $DB_NAME \
-    -i french_accounting,website,client_portal,cabinet_portal,bank_sync,e_invoicing,reporting \
+    -i french_accounting,website,web_cors,client_portal,cabinet_portal,invoice_ocr_config,accounting_collaboration,account_import_export,bank_sync,e_invoicing,reporting,integrations \
     --stop-after-init \
     --without-demo=all
```

**Temps estimé** : 2 minutes
**Impact** : Critique - Sans cela, 45% des modules ne seront jamais installés

---

### Priorité 2 : Créer Bank Sync APIs 🔴

**Routes à créer** (8 fichiers) :
```
frontend/app/api/bank/
├── accounts/
│   ├── route.ts                    - GET/POST bank accounts
│   └── [id]/
│       ├── route.ts                - GET/PUT/DELETE account
│       └── sync/route.ts           - POST sync account
├── transactions/
│   ├── route.ts                    - GET transactions
│   └── [id]/
│       └── reconcile/route.ts      - POST reconcile
├── providers/
│   ├── route.ts                    - GET providers
│   └── [id]/connect/route.ts       - POST connect provider
├── sync-logs/route.ts              - GET logs
└── reconciliation-rules/route.ts   - GET/POST rules
```

**Modèles Odoo à utiliser** :
- `bank.account`
- `bank.transaction`
- `bank.provider`
- `bank.sync.log`
- `reconciliation.rule`

**Temps estimé** : 4 heures
**Impact** : Critique - Synchronisation bancaire inutilisable sans ces APIs

---

### Priorité 3 : Créer Expense Notes APIs 🟡

**Routes à créer** (6 fichiers) :
```
frontend/app/api/expenses/
├── route.ts                        - GET/POST expenses
├── [id]/
│   ├── route.ts                    - GET/PUT/DELETE
│   ├── submit/route.ts             - POST submit
│   ├── approve/route.ts            - POST approve
│   └── reject/route.ts             - POST reject
```

**Modèle Odoo** : `expense.note`

**Temps estimé** : 2 heures
**Impact** : Important - Notes de frais inaccessibles depuis frontend

---

### Priorité 4 : Créer E-Invoicing APIs 🟢

**Routes à créer** (6 fichiers) :
```
frontend/app/api/einvoicing/
├── invoices/
│   ├── route.ts                    - GET invoices
│   └── [id]/
│       ├── send/route.ts           - POST send to Chorus Pro
│       └── validate/route.ts       - POST validate format
├── formats/route.ts                - GET formats
├── logs/route.ts                   - GET logs
└── config/route.ts                 - GET/PUT config
```

**Modèles Odoo** : `account.move`, `einvoice.format`, `einvoice.log`

**Temps estimé** : 3 heures
**Impact** : Moyen - Requis pour conformité 2026 mais délai encore disponible

---

### Priorité 5 : Compléter Reporting APIs 🟢

**Routes à créer** (8 fichiers supplémentaires) :
```
frontend/app/api/reports/
├── templates/
│   ├── route.ts                    - GET templates
│   ├── [id]/route.ts               - GET/PUT/DELETE
│   └── create/route.ts             - POST create
├── history/route.ts                - GET history
├── schedule/route.ts               - POST schedule
├── [id]/
│   ├── share/route.ts              - POST share
│   └── export/route.ts             - POST export
└── compare/route.ts                - POST compare periods
```

**Modèles Odoo** : `report.template`, `report.template.line`, `report.line`

**Temps estimé** : 3 heures
**Impact** : Moyen - Rapports basiques fonctionnent, mais personnalisation limitée

---

### Priorité 6 : Créer Cabinet Portal APIs 🟢

**Routes à créer** (8 fichiers) :
```
frontend/app/api/cabinet/
├── dashboard/route.ts              - GET dashboard
├── clients/
│   ├── route.ts                    - GET clients
│   └── [id]/route.ts               - GET client
├── tasks/
│   ├── route.ts                    - GET/POST tasks
│   └── [id]/
│       ├── route.ts                - GET/PUT/DELETE
│       ├── complete/route.ts       - POST complete
│       └── assign/route.ts         - POST assign
└── workload/route.ts               - GET workload
```

**Modèles Odoo** : `cabinet.dashboard`, `cabinet.task`, `cabinet.client`

**Temps estimé** : 3 heures
**Impact** : Faible - Usage interne cabinet uniquement

---

## 📝 RÉCAPITULATIF

| Élément | État Actuel | État Requis | Priorité | Temps Estimé |
|---------|-------------|-------------|----------|--------------|
| **Script installation** | 7/11 modules | 11/11 modules | 🔴 P1 | 2 min |
| **Documents APIs** | ✅ 14/14 | ✅ 14/14 | - | - |
| **Fiscal APIs** | ✅ 9/9 | ✅ 9/9 | - | - |
| **Collaboration APIs** | ✅ 4/4 | ✅ 4/4 | - | - |
| **Accounting APIs** | ✅ 2/2 | ✅ 2/2 | - | - |
| **Bank Sync APIs** | ❌ 0/8 | 8/8 | 🔴 P2 | 4h |
| **Expense Notes APIs** | ❌ 0/6 | 6/6 | 🟡 P3 | 2h |
| **E-Invoicing APIs** | ❌ 0/6 | 6/6 | 🟢 P4 | 3h |
| **Reporting APIs** | 🟡 2/10 | 10/10 | 🟢 P5 | 3h |
| **Cabinet APIs** | ❌ 0/8 | 8/8 | 🟢 P6 | 3h |

**Total temps estimé** : **15h 02min** (sans le script)

---

## ⚡ ACTION IMMÉDIATE RECOMMANDÉE

**Étape 1** : Corriger le script d'installation (2 minutes)

```bash
# Éditer install_all_modules.sh ligne 28
# Ajouter les 5 modules manquants
```

**Étape 2** : Tester l'installation complète

```bash
./install_all_modules.sh
# Vérifier que les 11 modules sont installés
```

**Étape 3** : Créer les APIs manquantes (ordre de priorité)

1. 🔴 Bank Sync (4h) - Fonctionnalité critique
2. 🟡 Expense Notes (2h) - Utilisé quotidiennement
3. 🟢 E-Invoicing (3h) - Conformité 2026
4. 🟢 Reporting avancé (3h) - Amélioration UX
5. 🟢 Cabinet Portal (3h) - Usage interne

---

**Voulez-vous que je corrige le script d'installation maintenant ?**

Ensuite, je peux créer les APIs manquantes par ordre de priorité.
