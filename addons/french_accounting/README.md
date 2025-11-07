# Module French Accounting - ISEB

Module de comptabilité française conforme aux normes légales et fiscales françaises.

## <¯ Fonctionnalités

### Export FEC (Fichier des Écritures Comptables)
- Export conforme à l'article A47 A-1 du LPF
- 18 colonnes obligatoires
- Format TXT avec séparateur pipe (|)
- Vérification de conformité automatique
- Déduplication intelligente
- Traçabilité complète (audit trail)

### Déclarations de TVA
- Calcul automatique de la TVA collectée et déductible
- Support des taux français: 20%, 10%, 5.5%, 2.1%
- Régimes supportés:
  - Réel normal (CA3 - mensuel)
  - Réel simplifié (CA12/CA12E - trimestriel/annuel)
  - Franchise en base
- Gestion du crédit de TVA
- Workflow de validation

### Liasses Fiscales
- Liasse 2033 (BIC réel simplifié)
- Liasse 2035 (BNC)
- Liasse 2050 (BIC réel normal)

### Conformité légale
-  Code de commerce art. L123-22 (intouchabilité des écritures)
-  Numérotation séquentielle obligatoire
-  Validation avant export FEC
-  Empêche modification écritures exportées

## =æ Installation

### Prérequis
- Odoo 17.0
- Module `account` (standard Odoo)
- Module `mail` (standard Odoo)

### Installation du module

```bash
# 1. Copier le module dans addons
cp -r addons/french_accounting /path/to/odoo/addons/

# 2. Mettre à jour la liste des modules
Odoo > Apps > Update Apps List

# 3. Rechercher "French Accounting ISEB"
# 4. Cliquer sur "Install"
```

## =€ Utilisation

### Export FEC

1. **Accès** : Menu "Comptabilité FR" > "Export FEC"

2. **Créer un export** :
   - Cliquer sur "Créer"
   - Renseigner la période (date début/fin)
   - Choisir le type d'export (complet/partiel)
   - Cliquer sur "Générer FEC"

3. **Téléchargement** :
   - Une fois généré, cliquer sur "Télécharger"
   - Fichier au format: `SIREN_FEC_YYYYMMDD.txt`

4. **Validation** :
   - Vérifier avec un logiciel de contrôle FEC
   - Ou utiliser le bouton "Valider"

### Déclaration de TVA

1. **Accès** : Menu "Comptabilité FR" > "Déclarations TVA"

2. **Créer une déclaration** :
   - Cliquer sur "Créer"
   - Sélectionner le régime TVA
   - Renseigner la période
   - Cliquer sur "Calculer TVA"

3. **Workflow** :
   ```
   Brouillon ’ Calculée ’ Déclarée ’ Payée
   ```

4. **Vérification** :
   - Onglet "TVA Collectée" : vérifier les montants par taux
   - Onglet "TVA Déductible" : vérifier déductions
   - Onglet "Calcul Final" : montant à payer

### Liasses Fiscales

1. **Accès** : Menu "Comptabilité FR" > "Liasses Fiscales"

2. **Créer une liasse** :
   - Cliquer sur "Créer"
   - Choisir le type (2033, 2035, 2050)
   - Renseigner l'exercice fiscal
   - Générer/Importer le PDF

## = Sécurité et Permissions

### Groupes de sécurité

| Groupe | Droits |
|--------|--------|
| **Utilisateur Comptabilité FR** | Lecture seule |
| **Comptable** | Lecture + Écriture + Création |
| **Expert-comptable** | Tous droits (y compris suppression) |

### Permissions par modèle

- **FEC Export** : Création par comptables, validation par experts
- **TVA Declaration** : Idem
- **Liasse Fiscale** : Idem

### Règles de sécurité

- Multi-société : chaque utilisateur ne voit que ses sociétés
- Intouchabilité : écritures validées ne peuvent être modifiées
- Audit trail : toutes les modifications sont tracées

## =Ê Modèles de données

### fec.export
```python
- name: Nom de l'export
- company_id: Société
- date_from/date_to: Période
- state: État (draft, generating, done, error)
- file_data: Fichier FEC généré
- move_count: Nombre d'écritures
- line_count: Nombre de lignes
```

### tva.declaration
```python
- name: Numéro de déclaration
- regime_tva: Régime (réel normal, simplifié, franchise)
- period_start/period_end: Période
- tva_collectee_*: TVA collectée par taux
- tva_deductible_*: TVA déductible
- tva_a_payer: Montant final
- state: workflow
```

### liasse.fiscale
```python
- name: Nom de la liasse
- fiscal_year: Exercice
- type: 2033, 2035, 2050
- file: PDF généré
```

## >ê Tests

```bash
# Tests unitaires
docker-compose run --rm odoo odoo -u french_accounting --test-enable --stop-after-init

# Tests d'intégration
python3 -m pytest addons/french_accounting/tests/
```

## =Ý Conformité

### FEC (Fichier des Écritures Comptables)

Colonnes exportées (18 obligatoires) :
1. JournalCode
2. JournalLib
3. EcritureNum
4. EcritureDate
5. CompteNum
6. CompteLib
7. CompAuxNum
8. CompAuxLib
9. PieceRef
10. PieceDate
11. EcritureLib
12. Debit
13. Credit
14. EcritureLet
15. DateLet
16. ValidDate
17. Montantdevise
18. Idevise

### Vérifications automatiques

- Numérotation séquentielle
- Équilibre débit/crédit
- Comptes comptables valides
- Libellés obligatoires
- Dates cohérentes

## <˜ Support

- Documentation : `/docs/`
- Issues : GitHub Issues
- Email : support@iseb-accounting.fr

## =Ü Licence

AGPL-3.0

## =e Auteurs

ISEB Dev Team

---

**Version** : 17.0.1.0.0
**Date** : Novembre 2025
