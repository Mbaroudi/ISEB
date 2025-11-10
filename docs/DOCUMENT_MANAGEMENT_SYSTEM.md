# Système de Gestion Électronique de Documents (GED)

## Vue d'ensemble

Le système de gestion documentaire ISEB offre une solution complète pour l'archivage, l'organisation et la recherche de documents comptables et administratifs. Il supporte plusieurs backends de stockage et s'intègre avec les modules GED existants d'Odoo.

## Architecture

### 1. Modèles de données (Backend Odoo)

#### `client.document` (étendu)
Modèle principal de document avec métadonnées enrichies :

**Champs de base :**
- `reference` : Référence unique auto-générée (DOC00001, DOC00002...)
- `name` : Nom du document
- `filename` : Nom du fichier
- `file` : Fichier binaire (avec attachment=True)
- `partner_id` : Client propriétaire

**Catégorisation :**
- `document_type` : Type (invoice, contract, receipt, expense, other)
- `category_id` : Catégorie hiérarchique
- `tag_ids` : Tags multiples pour classification

**Métadonnées financières :**
- `document_date` : Date du document (date de facture, etc.)
- `amount_total` : Montant du document
- `currency_id` : Devise
- `supplier_id` : Fournisseur (pour factures d'achat)

**Liens avec autres modules :**
- `invoice_id` : Lien vers facture Odoo (account.move)
- `expense_id` : Lien vers note de frais (hr.expense)

**Cycle de vie :**
- `state` : draft, pending, validated, rejected
- `active` : Actif/Archivé
- `archived_date` : Date d'archivage
- `expiration_date` : Date d'expiration (contrats, assurances)
- `is_expired` : Calculé automatiquement

**Recherche et indexation :**
- `description` : Description HTML détaillée
- `notes` : Notes texte
- `search_keywords` : Mots-clés pour recherche

**Statistiques :**
- `download_count` : Nombre de téléchargements
- `last_download_date` : Dernier téléchargement
- `view_count` : Nombre de vues

**Propriétés techniques :**
- `file_size` : Taille en octets
- `mime_type` : Type MIME
- `checksum` : Hash SHA256 du fichier

#### `client.document.tag`
Tags pour classification des documents :

- `name` : Nom du tag
- `color` : Couleur (0-11) pour l'UI
- `company_id` : Multi-société

**Tags par défaut :**
- Urgent (rouge)
- Important (orange)
- À traiter (jaune)
- Archivé (gris)
- Récurrent (bleu)
- Payé (vert)
- En attente de paiement (violet)
- TVA déductible (cyan)

#### `client.document.category`
Catégories hiérarchiques (arborescence) :

- `name` : Nom de la catégorie
- `complete_name` : Chemin complet (ex: "Comptabilité / Factures / Fournisseurs")
- `parent_id` : Catégorie parente
- `child_ids` : Sous-catégories
- `document_count` : Nombre de documents

**Structure par défaut :**
```
Comptabilité/
├── Factures/
│   ├── Factures fournisseurs
│   └── Factures clients
├── Notes de frais
├── Reçus
├── Banque
└── Fiscalité
Contrats/
Documents légaux/
Ressources humaines/
```

### 2. Stockage des fichiers

#### Option 1 : Base de données PostgreSQL (par défaut)
- Fichiers stockés en base64 dans PostgreSQL
- Champ `file` avec `attachment=True`
- Automatique via `ir.attachment`

**Avantages :**
- Configuration simple
- Backup avec la base de données
- Pas de dépendance externe

**Inconvénients :**
- Peut ralentir la base avec beaucoup de fichiers
- Taille de la base augmente rapidement

#### Option 2 : Stockage objet S3/MinIO (recommandé)
Configuration dans **Paramètres > Documents**

**Amazon S3 :**
```
Type: Amazon S3
Endpoint: https://s3.amazonaws.com
Access Key: VOTRE_ACCESS_KEY
Secret Key: VOTRE_SECRET_KEY
Bucket: iseb-documents
Region: eu-west-1
Use SSL: True
```

**MinIO (auto-hébergé) :**
```
Type: MinIO
Endpoint: http://minio:9000
Access Key: minioadmin
Secret Key: minioadmin
Bucket: iseb-documents
Region: eu-west-1
Use SSL: False
```

**Installation MinIO avec Docker :**
```bash
docker run -d \
  --name minio \
  -p 9000:9000 \
  -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  -v /data/minio:/data \
  minio/minio server /data --console-address ":9001"
```

Console MinIO : http://localhost:9001

**Avantages :**
- Scalabilité infinie
- Performance optimale
- Coût de stockage réduit
- Backup/réplication facilités
- Compatible S3 (standard industrie)

#### Option 3 : Système de fichiers local
- Stockage dans `/var/lib/odoo/filestore/`
- Configuration via `ir.config_parameter`

### 3. Intégration avec modules GED Odoo

Le système utilise un **bridge intelligent** (`document.bridge`) qui détecte automatiquement le module GED disponible :

**Priorité de détection :**
1. `documents.document` (Odoo Enterprise)
2. `dms.file` (DMS Community)
3. `client.document` (Notre implémentation)

**Fonctionnalités du bridge :**
- Détection automatique du module installé
- Mapping des champs entre modèles
- Adaptation des domaines de recherche
- API unifiée pour tous les backends

**Utilisation :**
```python
bridge = self.env['document.bridge']

# Détecter le système disponible
system = bridge.get_available_system()
# {'model': 'documents.document', 'info': {...}}

# Créer un document (adapté automatiquement)
doc = bridge.create_document({
    'name': 'Facture 2024',
    'partner_id': partner.id,
    'file': base64_data,
    'document_type': 'invoice',
})

# Rechercher des documents
docs = bridge.search_documents([
    ('document_type', '=', 'invoice'),
    ('amount_total', '>', 1000)
])
```

### 4. API Frontend

#### POST `/api/documents/search`
Recherche avancée avec filtres multiples.

**Body :**
```json
{
  "search_term": "facture",
  "document_type": "invoice",
  "category_id": 5,
  "tag_ids": [1, 2, 3],
  "date_from": "2024-01-01",
  "date_to": "2024-12-31",
  "amount_min": 100,
  "amount_max": 5000,
  "state": "validated",
  "is_expired": false,
  "archived": false
}
```

**Response :**
```json
[
  {
    "id": 1,
    "name": "Facture Fournisseur ABC",
    "reference": "DOC00001",
    "document_type": "invoice",
    "category_id": [5, "Comptabilité / Factures / Fournisseurs"],
    "tag_ids": [[1, 2], ["Urgent", "TVA déductible"]],
    "document_date": "2024-03-15",
    "amount_total": 1250.00,
    "currency_id": [1, "EUR"],
    "supplier_id": [123, "Fournisseur ABC"],
    "state": "validated",
    "is_expired": false,
    "download_count": 5,
    "view_count": 12,
    "filename": "facture_abc_mars_2024.pdf",
    "file_size": 245678
  }
]
```

#### GET `/api/documents/tags`
Liste tous les tags disponibles.

**Response :**
```json
[
  {"id": 1, "name": "Urgent", "color": 1},
  {"id": 2, "name": "Important", "color": 2},
  {"id": 3, "name": "À traiter", "color": 3}
]
```

#### POST `/api/documents/tags`
Crée un nouveau tag.

**Body :**
```json
{
  "name": "Nouveau tag",
  "color": 4
}
```

#### GET `/api/documents/categories`
Liste toutes les catégories.

**Response :**
```json
[
  {
    "id": 1,
    "name": "Comptabilité",
    "complete_name": "Comptabilité",
    "parent_id": false,
    "document_count": 150
  },
  {
    "id": 2,
    "name": "Factures",
    "complete_name": "Comptabilité / Factures",
    "parent_id": [1, "Comptabilité"],
    "document_count": 85
  }
]
```

#### POST `/api/documents/[id]/archive`
Archive ou désarchive un document.

**Body :**
```json
{
  "archive": true
}
```

#### POST `/api/documents/[id]/tags`
Met à jour les tags d'un document.

**Body :**
```json
{
  "tag_ids": [1, 2, 5]
}
```

## Fonctionnalités principales

### 1. Recherche avancée
- **Full-text** : Recherche dans name, reference, notes, description, keywords
- **Filtres multiples** : Type, catégorie, tags, dates, montants, état
- **Filtres combinés** : ET logique entre tous les filtres
- **Tri** : Par date de document puis date d'upload (desc)

### 2. Organisation
- **Hiérarchie** : Catégories arborescentes illimitées
- **Tags multiples** : Classification flexible avec couleurs
- **Par client** : Documents automatiquement liés au client
- **Liens comptables** : Connexion avec factures et notes de frais

### 3. Cycle de vie
- **États** : draft → pending → validated/rejected
- **Archivage** : Documents archivés (active=False) avec date
- **Expiration** : Calcul automatique is_expired pour contrats

### 4. Statistiques
- **Tracking** : Nombre de vues et téléchargements
- **Historique** : Date dernier téléchargement
- **Métriques** : Taille fichiers, types MIME

### 5. Sécurité
- **Checksum** : Hash SHA256 pour intégrité
- **Permissions** : Basées sur res.partner (client ne voit que ses docs)
- **Audit trail** : Via mail.thread (tracking des modifications)

## Configuration recommandée

### Production avec beaucoup de documents
```
Stockage : MinIO ou S3
Backend GED : Odoo Documents (si Enterprise) ou DMS (Community)
Base de données : PostgreSQL 14+
Backup : S3/MinIO + PostgreSQL dump
```

### Développement/Test
```
Stockage : PostgreSQL (par défaut)
Backend GED : client.document (custom)
Base de données : PostgreSQL
```

### PME (< 10000 documents)
```
Stockage : PostgreSQL ou MinIO local
Backend GED : client.document (custom)
```

### Entreprise (> 10000 documents)
```
Stockage : S3
Backend GED : Odoo Documents Enterprise
OCR : Intégré dans Odoo Documents
Backup : S3 versioning + cross-region replication
```

## Migrations

### Migration vers Odoo Documents Enterprise
```python
# Script de migration
for doc in self.env['client.document'].search([]):
    self.env['document.bridge'].create_document({
        'name': doc.name,
        'partner_id': doc.partner_id.id,
        'datas': doc.file,
        'tag_ids': [(6, 0, doc.tag_ids.ids)],
        'folder_id': doc.category_id.id,
    })
```

### Migration du stockage DB vers S3
1. Configurer S3/MinIO dans Paramètres
2. Exécuter migration :
```python
for attachment in self.env['ir.attachment'].search([
    ('res_model', '=', 'client.document')
]):
    attachment._upload_to_s3(attachment.datas, attachment.store_fname)
```

## Maintenance

### Nettoyage des fichiers orphelins
```python
self.env['ir.attachment'].search([
    ('res_model', '=', 'client.document'),
    ('res_id', 'not in', self.env['client.document'].search([]).ids)
]).unlink()
```

### Calcul des checksums manquants
```python
for doc in self.env['client.document'].search([('checksum', '=', False)]):
    if doc.file:
        doc.checksum = hashlib.sha256(base64.b64decode(doc.file)).hexdigest()
```

### Statistiques stockage
```python
docs = self.env['client.document'].search([])
total_size = sum(doc.file_size for doc in docs)
print(f"Total documents: {len(docs)}")
print(f"Stockage total: {total_size / 1024 / 1024:.2f} MB")
```

## Prochaines étapes

### Interface frontend
- [ ] Page de gestion documentaire avec filtres
- [ ] Vue grille avec aperçus
- [ ] Drag & drop pour upload multiple
- [ ] Édition inline des tags et catégories
- [ ] Historique des versions
- [ ] Prévisualisation PDF/images dans modal

### Fonctionnalités avancées
- [ ] OCR automatique sur upload
- [ ] Extraction automatique des métadonnées (factures)
- [ ] Workflow de validation configurable
- [ ] Génération automatique de documents depuis templates
- [ ] Signature électronique
- [ ] Partage externe avec liens temporaires
- [ ] Compression automatique des images

### Intégrations
- [ ] Google Drive sync
- [ ] Dropbox integration
- [ ] Email to document (mail → upload automatique)
- [ ] Scanner mobile app
- [ ] API REST publique
