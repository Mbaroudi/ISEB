# Module Cabinet Portal - ISEB

## Description

Module de gestion pour les cabinets d'expertise comptable permettant de suivre et gérer tous leurs clients depuis une interface centralisée.

## Fonctionnalités

### 1. Dashboard Cabinet
- Vue d'ensemble de tous les clients
- Indicateurs agrégés (CA total, marges moyennes, etc.)
- Suivi du CA du cabinet (honoraires)
- Statistiques de santé des clients
- Tâches et validations en attente

### 2. Gestion Multi-Clients
- Liste des clients avec filtres avancés
- Indicateur de santé financière par client
- Compteurs d'éléments en attente (documents, notes de frais, tâches)
- Accès direct aux dashboards clients
- Notes internes par client

### 3. Gestion des Tâches
- Création et suivi de tâches par client
- Workflow complet (À faire → En cours → Terminé)
- Priorités et deadlines
- Détection automatique des retards
- Vues Kanban et Liste
- Filtres intelligents (mes tâches, en retard, cette semaine, etc.)
- Notification automatiques

### 4. Workflow de Validation
- File d'attente centralisée des documents à valider
- File d'attente centralisée des notes de frais à valider
- Validation/rejet en un clic
- Historique des validations

## Modèles de données

### cabinet.task
Gestion des tâches cabinet pour le suivi client

**Champs principaux:**
- `name`: Titre de la tâche
- `partner_id`: Client concerné
- `assigned_to_id`: Expert-comptable assigné
- `state`: État (todo, in_progress, done, cancelled)
- `priority`: Priorité (0-3)
- `deadline`: Date d'échéance
- `task_type`: Type (déclaration, révision docs, validation notes de frais, etc.)
- `estimated_hours` / `spent_hours`: Suivi du temps

### cabinet.dashboard
Dashboard agrégé pour vue d'ensemble cabinet

**Champs principaux:**
- Statistiques clients (total, actifs, par niveau de santé)
- Agrégation financière (CA total, charges totales, résultat net, marge moyenne)
- CA du cabinet (mensuel, annuel)
- Statistiques de tâches (totales, en retard, cette semaine)
- Éléments en attente de validation

### Extension res.partner
Extension du modèle partenaire pour gestion cabinet

**Nouveaux champs:**
- `cabinet_id`: Cabinet comptable en charge
- `accountant_id`: Expert-comptable référent
- `client_since`: Date de début de collaboration
- `contract_type`: Formule contractuelle (Liberté/Sérénité/PME)
- `monthly_fee`: Honoraires mensuels
- `health_score`: Score de santé financière (excellent/good/warning/critical)
- `documents_pending_count`: Nombre de documents en attente
- `expenses_pending_count`: Nombre de notes de frais en attente
- `tasks_overdue_count`: Nombre de tâches en retard
- `internal_notes`: Notes internes cabinet

## Sécurité

### Groupes d'utilisateurs
1. **Cabinet User** : Lecture seule
2. **Cabinet Accountant** : Gestion clients et validations
3. **Cabinet Manager** : Accès complet (Expert-comptable)

### Règles multi-company
Isolation automatique des données par cabinet (company_id)

## Installation

1. Copier le module dans `addons/`
2. Mettre à jour la liste des modules
3. Installer "Cabinet Portal - ISEB"

**Dépendances requises:**
- base
- account
- portal
- mail
- web
- client_portal

## Utilisation

### Pour créer un dashboard cabinet

```python
dashboard = env['cabinet.dashboard'].create({
    'period_start': '2025-01-01',
    'period_end': '2025-01-31',
})
# Les statistiques sont calculées automatiquement
```

### Pour créer une tâche

```python
task = env['cabinet.task'].create({
    'name': 'Déclaration TVA Janvier',
    'partner_id': partner_id,
    'assigned_to_id': user_id,
    'task_type': 'declaration',
    'priority': '2',
    'deadline': '2025-02-15',
})
```

### Pour assigner un client à un cabinet

```python
partner.write({
    'is_iseb_client': True,
    'cabinet_id': company_id,
    'accountant_id': accountant_user_id,
    'contract_type': 'serenite',
    'monthly_fee': 350.00,
})
```

## Données de démonstration

Le module inclut des données de test:
- 2 experts-comptables (Sophie Martin, Thomas Dubois)
- 3 clients configurés avec informations cabinet
- 5 tâches variées (déclarations, révisions, RDV, relances)
- 1 dashboard cabinet pour janvier 2025

## Intégrations

### Avec client_portal
- Accès aux dashboards clients
- Validation des documents clients
- Validation des notes de frais
- Consultation des données comptables

### Avec french_accounting
- Liens vers déclarations TVA
- Accès aux exports FEC
- Consultation des liasses fiscales

## Roadmap

- [ ] Portail web pour les clients (front-end)
- [ ] Génération automatique de rapports PDF
- [ ] Alertes email automatiques
- [ ] Statistiques avancées et graphiques
- [ ] Intégration calendrier pour RDV
- [ ] Templates de tâches récurrentes
- [ ] Facturation automatique des honoraires

## Support

Pour toute question ou problème:
- Email: support@iseb-accounting.fr
- Documentation: https://docs.iseb-accounting.fr

## Licence

AGPL-3

## Auteur

ISEB Dev Team
