# OCR System - Hybrid Multi-Backend Architecture

Le module `client_portal` dispose d'un système OCR hybride qui supporte **deux backends** :

## 🎯 Backends Disponibles

### 1. **Tesseract OCR** (Recommandé pour la plupart des utilisateurs)
- ✅ **Gratuit** et open-source
- ✅ **Léger** (CPU uniquement, ~50MB)
- ✅ **Rapide** pour documents standards
- ✅ **Support français** excellent
- ⚠️ Précision moyenne (~85-90%)

**Use case**: PME, indépendants, serveurs sans GPU

### 2. **DeepSeek-OCR** (Premium - IA avancée)
- ✅ **Précision maximale** (~95%+)
- ✅ **IA de pointe** (modèle DeepSeek)
- ✅ **Layout preservation** (markdown)
- ✅ **Grounding** (localisation spatiale)
- ⚠️ Nécessite **GPU** (NVIDIA avec CUDA)
- ⚠️ **Lourd** (~2GB modèle + 8GB VRAM)

**Use case**: Cabinets comptables, grandes entreprises, serveurs GPU

---

## 📦 Installation

### Installation de base (Tesseract uniquement)

```bash
# 1. Installer Tesseract système
sudo apt-get update
sudo apt-get install tesseract-ocr tesseract-ocr-fra

# 2. Installer dépendances Python
pip install pytesseract Pillow xlsxwriter reportlab

# 3. Vérifier l'installation
tesseract --version
```

### Installation avancée (avec DeepSeek-OCR)

```bash
# Prérequis: CUDA 11.8+ installé

# 1. Installer PyTorch avec support CUDA
pip install torch==2.6.0 torchvision==0.21.0 torchaudio==2.6.0 \
    --index-url https://download.pytorch.org/whl/cu118

# 2. Installer transformers
pip install transformers>=4.51.1

# 3. Installer Flash Attention (accélération)
pip install flash-attn==2.7.3 --no-build-isolation

# 4. Le modèle sera téléchargé automatiquement (~2GB) au premier usage
```

---

## 🔧 Configuration

### Sélection automatique du backend

Par défaut, le système choisit automatiquement le meilleur backend disponible :

```python
# Ordre de priorité:
1. DeepSeek-OCR (si GPU disponible et modèle chargé)
2. Tesseract (si installé)
3. Erreur (aucun backend disponible)
```

### Sélection manuelle du backend

Vous pouvez forcer l'utilisation d'un backend spécifique :

```javascript
// Frontend - Appel AJAX
$.ajax({
    url: '/my/expense/ocr',
    type: 'POST',
    data: JSON.stringify({
        image: imageDataBase64,
        backend: 'deepseek'  // ou 'tesseract' ou 'auto'
    }),
    success: function(data) {
        console.log('Backend utilisé:', data.backend);
        console.log('Confiance:', data.confidence);
    }
});
```

```python
# Backend - Appel direct
ocr_service = OCRService()
result = ocr_service.perform_ocr(image_data, backend='tesseract')
```

### Vérifier les backends disponibles

```javascript
// Endpoint de configuration
fetch('/my/ocr/config')
    .then(res => res.json())
    .then(config => {
        console.log('Backends disponibles:', config.available_backends);
        console.log('Backend par défaut:', config.default_backend);
        console.log('DeepSeek disponible:', config.deepseek_available);
        console.log('Tesseract disponible:', config.tesseract_available);
    });
```

---

## 🚀 Utilisation

### Endpoint 1: OCR de notes de frais

**URL**: `/my/expense/ocr`
**Méthode**: `POST` (JSON)

**Paramètres**:
```json
{
    "image": "data:image/png;base64,iVBORw0KG...",
    "backend": "auto"  // optionnel
}
```

**Réponse**:
```json
{
    "success": true,
    "amount": 42.50,
    "tva_amount": 8.50,
    "date": "2024-01-15",
    "vendor": "RESTAURANT LE BISTROT",
    "category": "meal",
    "confidence": 0.92,
    "backend": "deepseek",
    "raw_text": "RESTAURANT LE BISTROT\nTotal: 42.50€\n..."
}
```

### Endpoint 2: OCR de documents

**URL**: `/my/document/ocr`
**Méthode**: `POST` (JSON)

**Paramètres**:
```json
{
    "image": "data:image/png;base64,iVBORw0KG...",
    "document_type": "invoice",  // ou "rib"
    "backend": "tesseract"
}
```

**Réponse (facture)**:
```json
{
    "success": true,
    "invoice_number": "FA-2024-001",
    "amount": 1250.00,
    "tva_amount": 250.00,
    "date": "2024-01-20",
    "vendor": "ACME SERVICES",
    "confidence": 0.88,
    "backend": "tesseract"
}
```

**Réponse (RIB)**:
```json
{
    "success": true,
    "iban": "FR7612345678901234567890123",
    "bic": "BNPAFRPP",
    "bank_name": "BNP PARIBAS",
    "confidence": 0.95,
    "backend": "deepseek"
}
```

### Endpoint 3: Configuration OCR

**URL**: `/my/ocr/config`
**Méthode**: `GET` (JSON)

**Réponse**:
```json
{
    "available_backends": ["deepseek", "tesseract"],
    "default_backend": "deepseek",
    "deepseek_available": true,
    "tesseract_available": true
}
```

---

## 📊 Comparaison des performances

| Critère | Tesseract | DeepSeek-OCR |
|---------|-----------|--------------|
| **Précision** | 85-90% | 95%+ |
| **Vitesse** | Rapide (CPU) | Très rapide (GPU) |
| **Coût infrastructure** | Minimal | Élevé (GPU) |
| **Taille mémoire** | 512MB RAM | 8GB+ VRAM |
| **Installation** | Simple | Complexe |
| **Support français** | Excellent | Excellent |
| **Layout preservation** | Non | Oui |
| **Localisation** | Non | Oui |

---

## 🛠️ Système de fallback

Le système dispose d'un **fallback automatique** pour garantir la disponibilité :

```
1. Tentative avec DeepSeek-OCR
   ↓ (si échec ou indisponible)
2. Fallback sur Tesseract
   ↓ (si échec ou indisponible)
3. Erreur retournée
```

**Exemple de log** :
```
[INFO] DeepSeek-OCR: Available and GPU detected
[INFO] Processing image with DeepSeek-OCR
[ERROR] DeepSeek-OCR failed: CUDA out of memory
[INFO] Falling back to Tesseract
[INFO] Tesseract OCR: Processing complete (confidence: 0.87)
```

---

## 📈 Extraction de données

Le système extrait automatiquement les données suivantes :

### Notes de frais (reçus)
- ✅ Montant total
- ✅ Montant TVA
- ✅ Date
- ✅ Nom du vendeur
- ✅ Catégorie automatique (restaurant, carburant, transport, hôtel, parking)

### Factures
- ✅ Numéro de facture
- ✅ Montant HT/TTC
- ✅ TVA
- ✅ Date d'émission
- ✅ Émetteur

### RIB
- ✅ IBAN
- ✅ BIC/SWIFT
- ✅ Nom de la banque

---

## 🔍 Patterns de détection

Le système utilise des **regex optimisées** pour extraire les données :

```python
# Montants
TOTAL: 42.50€
NET A PAYER: 42.50€
MONTANT: 42.50 EUR

# Dates
15/01/2024
15-01-24
15.01.2024

# TVA
TVA: 8.50€
T.V.A: 8.50
VAT: 8.50€

# IBAN
FR76 1234 5678 9012 3456 7890 123
```

---

## 🎓 Catégorisation automatique

Le système devine automatiquement la catégorie de dépense :

| Catégorie | Mots-clés détectés |
|-----------|-------------------|
| **meal** | RESTAURANT, CAFE, BRASSERIE, PIZZERIA, SANDWICHERIE |
| **fuel** | STATION, ESSENCE, CARBURANT, DIESEL, TOTAL, SHELL, BP |
| **transport** | TAXI, UBER, SNCF, TRAIN, BUS, METRO, PEAGE |
| **accommodation** | HOTEL, AUBERGE, RESIDENCE, AIRBNB, BOOKING |
| **parking** | PARKING, STATIONNEMENT, PARCMETRE, GARAGE |

---

## 🔒 Sécurité et confidentialité

- ✅ Les images sont traitées **localement** (pas d'API externe)
- ✅ Les fichiers temporaires sont **supprimés immédiatement**
- ✅ Pas de stockage des images brutes (seulement texte extrait)
- ✅ DeepSeek-OCR utilise `trust_remote_code=True` (vérifié et sécurisé)

---

## 📝 Logs et debug

Activer les logs OCR dans Odoo :

```python
# Dans odoo.conf
[options]
log_level = debug
log_handler = odoo.addons.client_portal.controllers.ocr:DEBUG
```

Les logs afficheront :
- Backend utilisé
- Temps de traitement
- Confiance de reconnaissance
- Erreurs et fallbacks

---

## 🚨 Dépannage

### Problème: "No OCR backend available"

**Solution**: Installer au moins Tesseract :
```bash
sudo apt-get install tesseract-ocr tesseract-ocr-fra
pip install pytesseract Pillow
```

### Problème: "CUDA out of memory" avec DeepSeek

**Solutions**:
1. Réduire la taille d'image avant traitement
2. Utiliser `torch.float16` au lieu de `float32` (déjà fait)
3. Libérer la mémoire GPU : `torch.cuda.empty_cache()`
4. Forcer l'utilisation de Tesseract : `backend='tesseract'`

### Problème: DeepSeek ne se charge pas

**Vérifications**:
```bash
# Vérifier CUDA
nvidia-smi

# Vérifier PyTorch
python -c "import torch; print(torch.cuda.is_available())"

# Vérifier transformers
python -c "from transformers import AutoModel; print('OK')"
```

---

## 📚 Ressources

- **DeepSeek-OCR**: https://github.com/deepseek-ai/DeepSeek-OCR
- **Tesseract**: https://github.com/tesseract-ocr/tesseract
- **Documentation Odoo**: https://www.odoo.com/documentation/17.0/

---

## 🎉 Conclusion

Ce système OCR hybride offre :

✅ **Flexibilité** : Choisissez le backend adapté à votre infrastructure
✅ **Fiabilité** : Fallback automatique en cas d'erreur
✅ **Performance** : IA de pointe (DeepSeek) ou légèreté (Tesseract)
✅ **Facilité** : Installation simple, configuration auto

**Recommandation** : Commencez avec Tesseract, passez à DeepSeek si vous avez un serveur GPU.
