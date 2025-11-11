# 🔍 DIAGNOSTIC : Fonctionnalités Invisibles

**Date** : 11 Novembre 2025
**Problème** : Code développé mais non visible dans backoffice/frontend

---

## ❌ PROBLÈME IDENTIFIÉ

Le code pour OCR, GED, Collaboration et Gestion Fiscale **existe** mais n'est **PAS VISIBLE** car :

1. ❌ **Vues XML manquantes** pour les nouveaux modèles Odoo
2. ❌ **Modules non installés** dans Odoo
3. ❌ **Frontend non démarré** ou non accessible

---

## 📊 ANALYSE DÉTAILLÉE

### 1. MODULE OCR (invoice_ocr_config)

#### ✅ CE QUI EXISTE (Backend)
```
addons/invoice_ocr_config/
├── models/              # Aucun modèle (juste config)
├── views/
│   ├── ocr_config_views.xml          ✅ Existe
│   └── res_config_settings_views.xml ✅ Existe
└── data/ocr_config_data.xml          ✅ Existe
```

#### ✅ CE QUI EXISTE (Frontend)
```
frontend/app/api/documents/[id]/
├── ocr/route.ts          ✅ API extraction OCR
└── apply-ocr/route.ts    ✅ API application données
```

#### ❌ CE QUI MANQUE (Backend)
- **Menu Odoo pour OCR config** : ❌ ABSENT
- Le module existe mais le menu est probablement dans Paramètres

#### ❌ CE QUI MANQUE (Frontend)
- **Interface visible** : Bouton OCR existe dans code mais frontend pas démarré

**STATUT** : ⚠️ Code complet mais **MODULE NON INSTALLÉ** + **Frontend non démarré**

---

### 2. MODULE client_portal (OCR + Documents)

#### ✅ CE QUI EXISTE (Modèles Python)
```
addons/client_portal/models/
├── client_dashboard.py           ✅ Vue XML existe
├── client_document.py            ✅ Vue XML existe
├── expense_note.py               ✅ Vue XML existe
├── document_ocr.py               ❌ PAS de vue XML
├── document_workflow.py          ❌ PAS de vue XML
├── document_share.py             ❌ PAS de vue XML
├── document_tag.py               ❌ PAS de vue XML
├── document_bridge.py            ❌ PAS de vue XML
├── fiscal_obligation.py          ❌ PAS de vue XML
├── fiscal_payment_delegation.py  ❌ PAS de vue XML
├── fiscal_risk_score.py          ❌ PAS de vue XML
├── ir_attachment_storage.py      ❌ PAS de vue XML
├── mail_notifications.py         ❌ PAS de vue XML
├── client_document_extended.py   ❌ PAS de vue XML
└── res_partner.py                ✅ Extension (pas besoin vue)
```

**RÉSULTAT** :
- 3 modèles de base ont des vues XML ✅
- **12 nouveaux modèles N'ONT PAS de vues XML** ❌

#### ❌ VUES XML MANQUANTES À CRÉER

1. **document_ocr_views.xml** - Interface gestion OCR
   - Formulaire document OCR
   - Liste documents avec résultats OCR
   - Bouton "Extract OCR" sur documents
   - Vue review/correction OCR

2. **document_workflow_views.xml** - Workflow documents
   - Vue Kanban workflow (draft → pending → validated)
   - Timeline transitions
   - Boutons d'action workflow

3. **document_share_views.xml** - Partage documents
   - Formulaire création lien partage
   - Liste liens partage avec tokens
   - Boutons copier/révoquer

4. **document_tag_views.xml** - Tags documents
   - Formulaire tags
   - Widget tags dans documents
   - Filtres par tags

5. **fiscal_obligation_views.xml** - Obligations fiscales
   - Formulaire obligations
   - Liste échéances
   - Dashboard fiscal
   - Kanban statuts

6. **fiscal_delegation_views.xml** - Délégations paiement
   - Formulaire délégations
   - Workflow signature/validation
   - Liste délégations actives

7. **fiscal_risk_score_views.xml** - Score risque fiscal
   - Formulaire score
   - Graphiques risques
   - Indicateurs alertes

---

### 3. MODULE accounting_collaboration

#### ✅ CE QUI EXISTE (Backend)
```
addons/accounting_collaboration/
├── models/
│   ├── accounting_question.py    ✅ Modèle complet
│   ├── accounting_message.py     ✅ Modèle complet
│   ├── account_move.py           ✅ Extension
│   └── client_portal_document.py ✅ Extension
└── views/
    ├── accounting_question_views.xml ✅ Existe (formulaire, liste, kanban)
    ├── accounting_message_views.xml  ✅ Existe
    ├── account_move_views.xml        ✅ Existe
    └── menu_views.xml                ✅ Existe
```

#### ✅ CE QUI EXISTE (Frontend)
```
frontend/app/
├── api/collaboration/
│   ├── dashboard/route.ts         ✅ Dashboard stats
│   ├── questions/route.ts         ✅ CRUD questions
│   └── questions/[id]/
│       ├── route.ts               ✅ Détails question
│       └── messages/route.ts      ✅ Messages
├── collaboration/page.tsx         ✅ Page principale
└── questions/[id]/page.tsx        ✅ Page détail question
```

**STATUT** : ✅ Module **COMPLET** mais **NON INSTALLÉ**

#### ❌ CE QUI MANQUE
- Module installé ? ❌ Probablement NON
- Frontend démarré ? ❌ NON

---

### 4. MODULE account_import_export

#### ✅ CE QUI EXISTE
```
addons/account_import_export/
├── models/
│   ├── fec_parser.py              ✅ Parser FEC
│   ├── ximport_parser.py          ✅ Parser XIMPORT
│   └── account_move.py            ✅ Extension
├── wizards/
│   ├── account_export_wizard.py   ✅ Wizard export
│   ├── account_import_wizard.py   ✅ Wizard import
│   └── *_view.xml                 ✅ Vues wizards
└── views/
    ├── account_move_views.xml     ✅ Boutons import/export
    └── menu_views.xml             ✅ Menus
```

#### ✅ CE QUI EXISTE (Frontend)
```
frontend/app/api/accounting/
├── import/route.ts                ✅ API import
└── export/route.ts                ✅ API export
```

**STATUT** : ✅ Module **COMPLET** mais **NON INSTALLÉ**

---

### 5. FRONTEND Next.js

#### ✅ CE QUI EXISTE
```
frontend/
├── app/(app)/
│   ├── dashboard/page.tsx         ✅
│   ├── documents/page.tsx         ✅ UI OCR complète
│   ├── expenses/page.tsx          ✅
│   ├── fiscal/
│   │   ├── page.tsx               ✅ Obligations fiscales
│   │   └── delegations/page.tsx   ✅ Délégations
│   ├── reports/page.tsx           ✅
│   └── settings/page.tsx          ✅
├── collaboration/page.tsx         ✅
└── questions/[id]/page.tsx        ✅
```

#### ✅ API ROUTES (Toutes existent)
- `/api/documents/*` - ✅ Complet (upload, OCR, share, tags, workflow)
- `/api/fiscal/*` - ✅ Complet (obligations, délégations, risk-score)
- `/api/collaboration/*` - ✅ Complet (questions, messages)
- `/api/accounting/*` - ✅ Complet (import, export)
- `/api/reports/*` - ✅ Complet

#### ❌ CE QUI MANQUE
- **Frontend démarré ?** ❌ **NON**
- **Accessible ?** ❌ **NON**

---

## 📋 RÉCAPITULATIF

| Fonctionnalité | Code Backend | Vues XML Odoo | API Frontend | Pages Frontend | Installé ? | Visible ? |
|----------------|--------------|---------------|--------------|----------------|------------|-----------|
| **OCR Module** | ✅ Complet | ✅ Config | ✅ Complet | ✅ Complet | ❌ NON | ❌ NON |
| **Document OCR** | ✅ Modèle | ❌ **MANQUE** | ✅ API | ✅ UI | ❌ NON | ❌ NON |
| **Document Workflow** | ✅ Modèle | ❌ **MANQUE** | ✅ API | ✅ UI | ❌ NON | ❌ NON |
| **Document Share** | ✅ Modèle | ❌ **MANQUE** | ✅ API | ✅ UI | ❌ NON | ❌ NON |
| **Document Tags** | ✅ Modèle | ❌ **MANQUE** | ✅ API | ✅ UI | ❌ NON | ❌ NON |
| **Fiscal Obligations** | ✅ Modèle | ❌ **MANQUE** | ✅ API | ✅ Page | ❌ NON | ❌ NON |
| **Fiscal Délégations** | ✅ Modèle | ❌ **MANQUE** | ✅ API | ✅ Page | ❌ NON | ❌ NON |
| **Fiscal Risk Score** | ✅ Modèle | ❌ **MANQUE** | ✅ API | ✅ API | ❌ NON | ❌ NON |
| **Collaboration** | ✅ Complet | ✅ Complet | ✅ Complet | ✅ Complet | ❌ NON | ❌ NON |
| **Import/Export** | ✅ Complet | ✅ Complet | ✅ Complet | N/A | ❌ NON | ❌ NON |

---

## 🎯 CONCLUSION

### Problèmes principaux :

1. **12 modèles Python sans vues XML Odoo** ❌
   - Les modèles existent mais aucune interface Odoo pour les utiliser
   - Impossible d'accéder aux données depuis le backoffice

2. **Modules non installés** ❌
   - `accounting_collaboration`
   - `invoice_ocr_config`
   - `account_import_export`
   - `client_portal` probablement pas à jour

3. **Frontend non démarré** ❌
   - Code complet mais serveur Next.js pas lancé
   - Pages inaccessibles

---

## ✅ PLAN D'ACTION

### Phase 1 : Créer les vues XML manquantes (URGENT)

1. **document_ocr_views.xml** - Interface OCR Odoo
2. **document_workflow_views.xml** - Workflow Kanban
3. **document_share_views.xml** - Gestion partages
4. **document_tag_views.xml** - Système tags
5. **fiscal_views.xml** - Toutes vues fiscales (obligations, délégations, scores)

### Phase 2 : Mettre à jour le manifest

Ajouter toutes les nouvelles vues dans `client_portal/__manifest__.py`

### Phase 3 : Installer les modules

```bash
# Dans Odoo
Apps > Update Apps List
Installer :
- Client Portal ISEB (upgrade)
- Accounting Collaboration
- Invoice OCR Config
- Account Import/Export
```

### Phase 4 : Démarrer le frontend

```bash
cd frontend
npm install
npm run dev
# Accès : http://localhost:3000
```

---

## 🚀 PROCHAINE ÉTAPE IMMÉDIATE

**Créer les 7 fichiers de vues XML manquants** pour rendre les fonctionnalités accessibles dans le backoffice Odoo.

Voulez-vous que je commence par créer ces vues XML ?
