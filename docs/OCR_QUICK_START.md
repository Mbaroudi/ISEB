# 🚀 Guide Démarrage Rapide - OCR Factures

## Configuration en 15 minutes

Ce guide vous permet de configurer l'OCR pour scanner et saisir automatiquement vos factures.

---

## Étape 1 : Choisir votre solution OCR (2 min)

### Option recommandée : Google Vision API + Module tiers

**Pourquoi ?**
- ✅ Gratuit jusqu'à 1000 factures/mois
- ✅ Précision 98%
- ✅ Configuration simple
- ✅ Pas de limite après (1,50$/1000 pages)

**Coût total :**
- Module AI Invoice OCR : 199€ one-time
- API Google : Gratuit puis ~1$/mois pour 500 factures

---

## Étape 2 : Créer compte Google Cloud (5 min)

### 2.1 Inscription

1. Aller sur https://console.cloud.google.com
2. Se connecter avec compte Google
3. Accepter les conditions
4. Activer essai gratuit (300$ crédits)

### 2.2 Créer un projet

```
1. Cliquer sur "Sélectionner un projet" (en haut)
2. Cliquer sur "Nouveau projet"
3. Nom du projet : "ISEB-OCR-Factures"
4. Créer
```

### 2.3 Activer Vision API

```
1. Menu ☰ → APIs & Services → Bibliothèque
2. Rechercher "Cloud Vision API"
3. Cliquer sur "Cloud Vision API"
4. Cliquer sur "Activer"
```

### 2.4 Créer une clé API

```
1. Menu ☰ → APIs & Services → Identifiants
2. Cliquer sur "+ Créer des identifiants"
3. Sélectionner "Clé API"
4. COPIER LA CLÉ (elle ressemble à : AIzaSyC3xQ...)
5. Cliquer sur "Restreindre la clé" (recommandé)
6. Restrictions API → Sélectionner "Cloud Vision API"
7. Enregistrer
```

**🔒 Important :** Conservez cette clé en sécurité !

---

## Étape 3 : Installer le module Odoo (3 min)

### Option A : AI Invoice OCR (Recommandé)

**Via Odoo Apps Store :**

```
1. Aller sur https://apps.odoo.com
2. Rechercher "AI Invoice OCR"
3. Acheter (199€) ou télécharger version d'essai
4. Télécharger le fichier .zip
```

**Installation dans Odoo :**

```
1. Extraire le .zip
2. Copier le dossier dans /addons/
3. Redémarrer Odoo
4. Apps → Update Apps List
5. Rechercher "AI Invoice OCR"
6. Installer
```

### Option B : Module natif Odoo Enterprise

```
Si vous avez Odoo Enterprise :
1. Apps → Rechercher "Document Digitization"
2. Installer
```

---

## Étape 4 : Configuration dans Odoo (5 min)

### 4.1 Installer notre module helper

```bash
1. Apps → Update Apps List
2. Rechercher "Invoice OCR Configuration Helper"
3. Installer
```

### 4.2 Configurer l'OCR

```
1. Paramètres → Comptabilité
2. Descendre jusqu'à "Configuration OCR Factures"
3. ☑️ Activer OCR
4. Fournisseur OCR : Sélectionner "Google Vision AI"
5. Clé API : Coller votre clé (AIzaSyC...)
6. Seuil de confiance : 85 (laisser par défaut)
7. ☑️ Validation automatique
8. Seuil validation auto : 98 (laisser par défaut)
9. Enregistrer
```

### 4.3 Tester la configuration

```
1. Cliquer sur "Tester la configuration OCR"
2. Vérifier que le message "✓ Configuration valide" apparaît
```

---

## Étape 5 : Premier test (5 min)

### 5.1 Préparer une facture test

Utilisez une facture PDF simple, par exemple :
- Facture Amazon
- Facture EDF
- Facture téléphone

### 5.2 Upload et traitement

**Méthode 1 : Via Documents**

```
1. Aller dans Documents
2. Cliquer sur "Upload"
3. Sélectionner votre facture PDF
4. Attendre 5-10 secondes
5. L'OCR traite automatiquement
```

**Méthode 2 : Via Factures fournisseurs**

```
1. Comptabilité → Fournisseurs → Factures
2. Créer
3. Upload facture
4. Cliquer sur "Extraire les données"
5. L'OCR remplit automatiquement les champs
```

### 5.3 Vérifier les résultats

Vérifiez que l'OCR a extrait :
- ✓ Nom du fournisseur
- ✓ Numéro de facture
- ✓ Date de facture
- ✓ Montant TTC
- ✓ TVA
- ✓ Lignes de facture (si détaillées)

### 5.4 Corriger et valider

```
1. Vérifier chaque champ
2. Corriger si nécessaire (le système apprend)
3. Valider la facture
```

---

## Configuration avancée (Optionnel)

### Activer le traitement par email

```
1. Paramètres → Comptabilité → Configuration OCR
2. ☑️ Traitement email
3. Alias email : factures@votre-domaine.com
4. Enregistrer
```

**Ensuite :**
- Transférer vos factures à cette adresse
- Elles seront traitées automatiquement
- Notification dans Odoo

### Configurer comptes comptables par défaut

```
1. Comptabilité → Configuration → Comptes par défaut
2. Pour chaque fournisseur récurrent :
   - Créer fiche fournisseur complète
   - Définir compte charge par défaut
   - Définir compte TVA
```

**Exemples :**

| Fournisseur | Compte Charge | Compte TVA |
|-------------|---------------|------------|
| EDF         | 606000        | 445660     |
| Orange      | 626000        | 445660     |
| Amazon      | 607000        | 445660     |

---

## Utilisation quotidienne

### Méthode 1 : Upload manuel simple

```
1. Documents → Upload
2. Sélectionner facture(s)
3. Attendre traitement
4. Comptabilité → Factures → Vérifier et valider
```

### Méthode 2 : Email automatique

```
1. Envoyer facture à factures@votre-domaine.com
2. Recevoir notification Odoo
3. Vérifier et valider
```

### Méthode 3 : Traitement par lots

```
1. Collecter toutes les factures du mois
2. Documents → Upload multiple
3. Sélectionner toutes
4. Actions → Traiter OCR par lot
5. Attendre (5-10 min pour 50 factures)
6. Valider en masse
```

---

## Optimisation et apprentissage

### Améliorer la précision

**Semaine 1-2 :** Précision ~85%
- Corriger systématiquement les erreurs
- Le système apprend de vos corrections

**Semaine 3-4 :** Précision ~95%
- Moins de corrections nécessaires
- Validation plus rapide

**Mois 2+ :** Précision ~98%
- Quasi automatique
- Vérification rapide seulement

### Créer des templates fournisseurs

Pour les fournisseurs récurrents :

```
1. Documents → Configuration → Templates fournisseurs
2. Créer template pour chaque fournisseur
3. Mapper les positions des champs :
   - Numéro facture : Ligne 3, colonne 1
   - Montant : Ligne 25, colonne 2
   - etc.
```

---

## Dépannage rapide

### Erreur "Clé API invalide"

**Solution :**
```
1. Vérifier que la clé est complète (commence par AIzaSy...)
2. Vérifier que Vision API est activée
3. Régénérer la clé si nécessaire
```

### Extraction incorrecte

**Causes possibles :**
- ❌ Facture scannée de mauvaise qualité
- ❌ Format inhabituel
- ❌ Langue non supportée

**Solutions :**
- ✅ Utiliser PDF natif si possible
- ✅ Améliorer résolution scan (300 DPI)
- ✅ Corriger manuellement → système apprend

### Fournisseur non trouvé

**Solution :**
```
1. Contacts → Créer
2. Remplir : Nom exact, TVA, Adresse
3. Relancer OCR sur la facture
```

### Performance lente

**Si traitement > 30 secondes :**
```
1. Vérifier connexion internet
2. Vérifier quota Google Cloud
3. Augmenter timeout : Paramètres → OCR → Timeout = 60
```

---

## Monitoring et statistiques

### Dashboard OCR

```
Comptabilité → Rapports → Statistiques OCR

Vous verrez :
- Factures traitées ce mois
- Précision moyenne
- Temps de traitement moyen
- Taux d'erreur
- Crédits Google utilisés
```

### Alertes à configurer

```
1. Si précision < 80% → Vérifier qualité documents
2. Si temps > 30s → Problème réseau/API
3. Si crédits > 80% → Augmenter quota
```

---

## Checklist de démarrage

### Jour 1
- [ ] Créer compte Google Cloud
- [ ] Activer Vision API
- [ ] Créer clé API
- [ ] Installer module OCR dans Odoo
- [ ] Configurer clé API dans Odoo
- [ ] Tester avec 1 facture simple
- [ ] Vérifier résultats

### Semaine 1
- [ ] Traiter 10-20 factures test
- [ ] Corriger erreurs systématiquement
- [ ] Créer fiches fournisseurs récurrents
- [ ] Configurer comptes par défaut
- [ ] Former équipe comptable

### Semaine 2
- [ ] Activer email automatique
- [ ] Tester traitement par lots
- [ ] Créer templates fournisseurs principaux
- [ ] Monitorer précision
- [ ] Ajuster seuils si nécessaire

### Mois 1
- [ ] Évaluer précision globale (objectif: >90%)
- [ ] Calculer temps économisé
- [ ] Optimiser workflow
- [ ] Former nouveaux utilisateurs
- [ ] Planifier montée en charge

---

## Support et aide

### Documentation
- Guide complet : `/docs/OCR_INVOICE_SETUP.md`
- README module : `/addons/invoice_ocr_config/README.md`

### Ressources externes
- **Google Vision** : https://cloud.google.com/vision/docs
- **Odoo OCR** : https://www.odoo.com/documentation/17.0/
- **Forum Odoo** : https://www.odoo.com/forum

### Modules recommandés
- **AI Invoice OCR** : https://apps.odoo.com/apps/modules/17.0/ai_invoice_ocr/
- **Gemini Invoice Capture** : https://apps.odoo.com/apps/modules/17.0/gemini_invoice_ocr/

---

## Prochaines étapes

### Après configuration initiale

1. **Intégrer avec workflow** (optionnel)
   - Lier au système de collaboration
   - Questions automatiques si confiance < 85%

2. **Ajouter règles métier**
   - Validation manager si montant > 5000€
   - Alerte si duplicata détecté
   - Blocage si fournisseur blacklisté

3. **Connecter email**
   - Configurer alias dédié
   - Router vers Documents automatiquement
   - Notification équipe

4. **Optimiser coûts**
   - Monitorer usage Google Cloud
   - Ajuster seuils de traitement
   - Considérer batch nocturne pour gros volumes

---

## ROI attendu

### Gains immédiats (Mois 1)

**Temps économisé :**
- Avant : 10 min/facture × 100 factures = 16,7 heures
- Après : 30 sec/facture × 100 factures = 0,8 heure
- **Gain : 16 heures/mois** = 480€ économisés (à 30€/h)

**Coût :**
- Module : 199€ (one-time)
- Google API : Gratuit (< 1000)
- **Total : 199€**

**ROI Mois 1 :** 480€ - 199€ = +281€

### Gains récurrents (Mois 2+)

**Mois 2-12 :**
- Économie : 480€/mois × 11 = 5 280€
- Coût Google : ~10€/an
- **Gain net annuel : 5 270€**

### Bénéfices non-monétaires

- ✅ Réduction erreurs de saisie : -80%
- ✅ Délais de paiement plus courts : -50%
- ✅ Meilleure relation fournisseurs
- ✅ Audit trail complet
- ✅ Équipe plus productive

---

**Dernière mise à jour :** Novembre 2024
**Version :** 1.0
**Support :** documentation@iseb.com

---

## 🎯 Vous êtes prêt !

Suivez ces étapes et vous aurez un système OCR opérationnel en 15 minutes.

**Questions fréquentes :**
- Combien de factures puis-je traiter ? → Illimité
- Est-ce que ça marche en français ? → Oui, multilingue
- Puis-je annuler si ça ne marche pas ? → Essai gratuit disponible
- Combien de temps pour être rentable ? → 1 mois

**Besoin d'aide ?** Consultez `/docs/OCR_INVOICE_SETUP.md` pour le guide détaillé.
