# Frontend Consolidation Plan - (app) vs (dashboard)

## Executive Summary

During the frontend integration, we discovered **duplicate frontend structures** in the Next.js app:
- `(app)` - Legacy structure with 7 pages
- `(dashboard)` - New structure with 17 pages

**Recommendation**: Consolidate into `(dashboard)` as the single source of truth, migrate unique features from `(app)`, then deprecate `(app)`.

---

## Current State Analysis

### (app) Structure - 7 Pages

| Page | Features | Status |
|------|----------|--------|
| `/dashboard` | Generic stats dashboard | ⚠️ Different from cabinet dashboard |
| `/documents` | **OCR-enabled document management** | ✅ UNIQUE - Must migrate |
| `/expenses` | Older expenses with camera upload | ⚠️ Duplicate (different implementation) |
| `/fiscal` | Fiscal obligations tracking, risk score | ✅ UNIQUE - Must migrate |
| `/fiscal/delegations` | Fiscal delegations management | ✅ UNIQUE - Must migrate |
| `/reports` | Basic report generation | ⚠️ Duplicate (limited features) |
| `/settings` | Import/Export, Profile, Security, Billing | ✅ UNIQUE - Must migrate |

### (dashboard) Structure - 17 Pages

| Category | Pages | Features |
|----------|-------|----------|
| **Bank Sync** | 4 pages | accounts, transactions, providers, account detail |
| **Cabinet Portal** | 5 pages | dashboard, clients, tasks, client detail, workload |
| **E-Invoicing** | 3 pages | invoices, config, logs |
| **Expenses** | 2 pages | list, detail |
| **Reporting** | 4 pages | templates, template editor, compare, history |

**Technologies:**
- React Query hooks (38 hooks)
- TypeScript strict typing
- shadcn/ui components
- French localization
- Optimistic updates

---

## Feature Comparison Matrix

| Feature | (app) | (dashboard) | Winner | Action |
|---------|-------|-------------|--------|--------|
| **Dashboard** | Generic stats | Cabinet-specific stats | (dashboard) | Keep (dashboard), deprecate (app) |
| **Documents** | Full OCR, comprehensive | ❌ Missing | (app) | **MIGRATE to (dashboard)** |
| **Expenses** | Camera upload, old hooks | React Query, workflow | (dashboard) | Keep (dashboard), deprecate (app) |
| **Fiscal Obligations** | Full tracking, risk score | ❌ Missing | (app) | **MIGRATE to (dashboard)** |
| **Reports** | Basic generation | Templates, compare, history | (dashboard) | Keep (dashboard), deprecate (app) |
| **Settings** | Import/Export FEC/XIMPORT | ❌ Missing | (app) | **MIGRATE to (dashboard)** |
| **Bank Sync** | ❌ Missing | Full integration | (dashboard) | Keep (dashboard) |
| **Cabinet Portal** | ❌ Missing | Full portal | (dashboard) | Keep (dashboard) |
| **E-Invoicing** | ❌ Missing | Chorus Pro integration | (dashboard) | Keep (dashboard) |

---

## Migration Plan

### Phase 1: Migrate Unique Features (Priority 1) ⏰ 4-6 hours

#### 1.1 Documents Management
**Source**: `frontend/app/(app)/documents/page.tsx` (1,353 lines)

**Features to migrate**:
- ✅ Full OCR integration (Tesseract, Google Vision, AWS, Azure)
- ✅ Advanced search with 10+ filters
- ✅ Drag & drop upload
- ✅ Document categories and tags system
- ✅ Preview modal (PDF + images)
- ✅ Bulk operations (archive, delete)
- ✅ Grid and list view modes
- ✅ View/download count tracking

**Migration steps**:
1. Create `frontend/app/(dashboard)/documents/page.tsx`
2. Update imports to use `@/lib/hooks/useDocuments` (create new hook file)
3. Migrate API routes from `/api/documents/*`
4. Test OCR functionality
5. Verify search performance

**Estimated time**: 2-3 hours

#### 1.2 Fiscal Obligations
**Source**:
- `frontend/app/(app)/fiscal/page.tsx` (498 lines)
- `frontend/app/(app)/fiscal/delegations/page.tsx`

**Features to migrate**:
- ✅ Fiscal obligations tracking (TVA, IS, IR, URSSAF, DSN)
- ✅ Risk score calculation and display
- ✅ Alerts dashboard (overdue, urgent, upcoming)
- ✅ Delegations management
- ✅ Payment tracking and penalties

**Migration steps**:
1. Create `frontend/app/(dashboard)/fiscal/page.tsx`
2. Create `frontend/app/(dashboard)/fiscal/delegations/page.tsx`
3. Create `frontend/lib/hooks/useFiscal.ts` (8-10 hooks)
4. Migrate API routes from `/api/fiscal/*`
5. Test risk score calculation
6. Verify alerts system

**Estimated time**: 1.5-2 hours

#### 1.3 Settings & Import/Export
**Source**: `frontend/app/(app)/settings/page.tsx` (751 lines)

**Features to migrate**:
- ✅ Profile management
- ✅ Company information
- ✅ FEC export (French regulatory format)
- ✅ XIMPORT export (Ciel/EBP/Sage compatibility)
- ✅ CSV/FEC/XIMPORT import
- ✅ Notifications preferences
- ✅ Security settings
- ✅ Billing information

**Migration steps**:
1. Create `frontend/app/(dashboard)/settings/page.tsx`
2. Preserve import/export logic (critical for compliance)
3. Verify FEC format compliance (mandatory for DGFIP audits)
4. Test XIMPORT compatibility
5. Create `useSettings` hook

**Estimated time**: 1 hour

---

### Phase 2: Clean Up Duplicates (Priority 2) ⏰ 30 minutes

#### 2.1 Expenses
- ✅ **Keep**: `frontend/app/(dashboard)/expenses/*` (React Query implementation)
- ❌ **Delete**: `frontend/app/(app)/expenses/page.tsx` (old implementation)

**Why (dashboard) wins:**
- Uses React Query for better caching
- Workflow support (draft → submitted → approved/rejected)
- TypeScript strict typing
- Better error handling

#### 2.2 Reports
- ✅ **Keep**: `frontend/app/(dashboard)/reports/*` (4 pages: templates, compare, history)
- ❌ **Delete**: `frontend/app/(app)/reports/page.tsx` (basic generation only)

**Why (dashboard) wins:**
- Template management system
- Period comparison
- Report history tracking
- More comprehensive features

#### 2.3 Dashboard
- ✅ **Keep**: `frontend/app/(dashboard)/cabinet/page.tsx` (cabinet-specific)
- ❌ **Delete**: `frontend/app/(app)/dashboard/page.tsx` (generic stats)

**Why (dashboard) wins:**
- Cabinet-specific metrics (client health, revenue tracking)
- Pending validations tracking
- Task management integration
- More detailed financial stats

---

### Phase 3: Update Routing & Navigation (Priority 3) ⏰ 1 hour

#### 3.1 Layout Updates
**File**: `frontend/app/(app)/layout.tsx`

**Changes**:
- Move sidebar navigation from `(app)` layout to `(dashboard)` layout
- Add new menu items:
  - Documents (with OCR badge)
  - Fiscal (with alerts counter)
  - Settings
- Update active route detection

#### 3.2 Root Redirect
**File**: `frontend/app/page.tsx`

**Current**: May redirect to `/dashboard` (app structure)
**Update**: Redirect to `/cabinet` (dashboard structure)

#### 3.3 Navigation Links
**Files to update**:
- All `<Link>` components pointing to old routes
- Breadcrumbs
- Navigation menus
- Quick action buttons

**Example changes**:
```tsx
// Before
<Link href="/dashboard">Dashboard</Link>
<Link href="/reports">Reports</Link>

// After
<Link href="/cabinet">Cabinet</Link>
<Link href="/reports/templates">Reports</Link>
```

---

### Phase 4: Deprecate (app) Structure (Priority 4) ⏰ 15 minutes

#### 4.1 Create Redirect Pages
Replace all `(app)` pages with redirect pages:

```tsx
// frontend/app/(app)/dashboard/page.tsx
import { redirect } from "next/navigation";

export default function OldDashboardRedirect() {
  redirect("/cabinet");
}
```

#### 4.2 Add Deprecation Warnings (Optional)
For 1-2 weeks, show toast warnings:

```tsx
"use client";
import { useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function DeprecatedPage() {
  const router = useRouter();

  useEffect(() => {
    toast.warning("Cette page a été déplacée. Redirection...");
    setTimeout(() => router.push("/new-route"), 2000);
  }, []);

  return <div>Redirection en cours...</div>;
}
```

#### 4.3 Final Removal
After confirming no 404 errors:
1. Delete `frontend/app/(app)` directory
2. Remove old API routes (if no longer used)
3. Clean up unused imports in `@/lib/odoo/hooks`
4. Update documentation

---

## Technical Migration Details

### API Routes to Create/Update

#### Documents APIs
- `POST /api/documents/search` - Advanced search
- `GET /api/documents/tags` - Get all tags
- `GET /api/documents/categories` - Get categories
- `POST /api/documents/{id}/ocr` - Extract OCR
- `POST /api/documents/{id}/apply-ocr` - Apply OCR data
- `POST /api/documents/{id}/archive` - Archive document
- `GET /api/documents/{id}/download` - Download file

#### Fiscal APIs
- `GET /api/fiscal/alerts` - Get alerts dashboard
- `GET /api/fiscal/risk-score` - Calculate risk score
- `GET /api/fiscal/obligations` - List obligations
- `POST /api/fiscal/obligations` - Create obligation
- `GET /api/fiscal/{id}` - Get obligation detail
- `POST /api/fiscal/{id}/pay` - Mark as paid
- `GET /api/fiscal/delegations` - List delegations

#### Settings/Import-Export APIs
- `POST /api/accounting/import` - Import FEC/XIMPORT/CSV
- `POST /api/accounting/export` - Export FEC/XIMPORT
- `GET /api/settings/profile` - Get user profile
- `PUT /api/settings/profile` - Update profile
- `GET /api/settings/company` - Get company info
- `PUT /api/settings/company` - Update company

### React Query Hooks to Create

#### useDocuments.ts (10 hooks)
```typescript
export function useDocuments(filters?: DocumentFilters)
export function useDocument(id: number)
export function useUploadDocument()
export function useDeleteDocument()
export function useArchiveDocument()
export function useDocumentTags()
export function useDocumentCategories()
export function useExtractOCR()
export function useApplyOCR()
export function useSearchDocuments()
```

#### useFiscal.ts (8 hooks)
```typescript
export function useFiscalAlerts()
export function useRiskScore()
export function useFiscalObligations(state?: string)
export function useObligation(id: number)
export function useCreateObligation()
export function usePayObligation()
export function useDelegations()
export function useCreateDelegation()
```

#### useSettings.ts (6 hooks)
```typescript
export function useProfile()
export function useUpdateProfile()
export function useCompanyInfo()
export function useUpdateCompany()
export function useImportAccounting()
export function useExportAccounting()
```

---

## Timeline & Effort Estimation

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| **Phase 1** | Migrate unique features | 4-6 hours |
| - Documents | Migration + testing | 2-3 hours |
| - Fiscal | Migration + testing | 1.5-2 hours |
| - Settings | Migration + testing | 1 hour |
| **Phase 2** | Clean up duplicates | 30 minutes |
| **Phase 3** | Update routing | 1 hour |
| **Phase 4** | Deprecate (app) | 15 minutes |
| **Total** | Complete consolidation | **6-8 hours** |

---

## Risk Assessment & Mitigation

### High Risk Items

#### 1. OCR Integration (Documents)
**Risk**: OCR functionality breaks during migration

**Mitigation**:
- Test all OCR providers (Tesseract, Google Vision, AWS, Azure)
- Create comprehensive test suite
- Verify base64 encoding/decoding
- Test file upload limits (10MB)

#### 2. FEC Export Compliance (Settings)
**Risk**: FEC export format doesn't meet DGFIP requirements

**Mitigation**:
- Verify FEC format specification (BOI-CF-IOR-60-40-20)
- Test with "Test Compta Demat" tool from DGFIP
- Validate filename format: SIRENFECAAAAMMJJ.txt
- Ensure all mandatory fields present

#### 3. Fiscal Risk Score Calculation
**Risk**: Risk score calculation logic lost

**Mitigation**:
- Document current algorithm
- Create unit tests for score calculation
- Verify against existing data
- Test edge cases (no obligations, all overdue, etc.)

### Medium Risk Items

#### 4. Import File Parsing
**Risk**: XIMPORT/FEC parsing fails for some formats

**Mitigation**:
- Test with real files from Ciel, EBP, Sage
- Handle encoding issues (UTF-8, Latin-1)
- Validate line formats
- Provide clear error messages

#### 5. Document Search Performance
**Risk**: Search becomes slow with many documents

**Mitigation**:
- Implement pagination (already present)
- Add database indexes on search fields
- Consider full-text search indexes
- Test with 1000+ documents

---

## Validation Checklist

### Before Migration
- [ ] Backup current database
- [ ] Document all API endpoints in (app)
- [ ] Screenshot all (app) pages for reference
- [ ] List all environment variables used
- [ ] Identify shared components

### During Migration
- [ ] Create feature branch: `feature/consolidate-frontend`
- [ ] Migrate one feature at a time
- [ ] Test each feature independently
- [ ] Update tests for migrated features
- [ ] Document any breaking changes

### After Migration
- [ ] All pages in (dashboard) functional
- [ ] No 404 errors on old routes (redirects work)
- [ ] OCR extraction works for all providers
- [ ] FEC export passes DGFIP validation
- [ ] XIMPORT export compatible with Ciel/EBP/Sage
- [ ] Fiscal risk score calculates correctly
- [ ] Document search returns correct results
- [ ] All React Query hooks invalidate properly
- [ ] TypeScript compiles without errors
- [ ] No console errors in browser
- [ ] Performance acceptable (Lighthouse > 90)

### Testing Scenarios
1. Upload PDF document → Extract OCR → Apply to document → Verify fields populated
2. Create fiscal obligation → Mark overdue → Verify risk score increases → Pay → Verify alerts cleared
3. Export FEC for 2024 → Validate with Test Compta Demat → Import back → Verify data integrity
4. Search documents with 5+ filters → Verify results correct → Export search → Verify CSV format
5. Update company SIRET → Verify FEC filename updates → Export → Check filename format

---

## File Structure After Migration

```
frontend/app/
├── (auth)/                    # Authentication pages
│   ├── login/
│   └── signup/
├── (dashboard)/               # ✅ MAIN STRUCTURE (consolidated)
│   ├── bank/                  # Bank sync (4 pages)
│   ├── cabinet/               # Cabinet portal (5 pages)
│   ├── documents/             # ✅ MIGRATED - Document management with OCR
│   ├── einvoicing/            # E-invoicing (3 pages)
│   ├── expenses/              # Expenses (2 pages)
│   ├── fiscal/                # ✅ MIGRATED - Fiscal obligations
│   │   ├── page.tsx
│   │   └── delegations/
│   ├── reports/               # Reporting (4 pages)
│   ├── settings/              # ✅ MIGRATED - Settings with import/export
│   └── layout.tsx             # Main layout with navigation
├── collaboration/             # Collaboration features
├── questions/                 # Questions feature
└── page.tsx                   # Root page (redirect to /cabinet)
```

**Deprecated** (to be removed):
```
frontend/app/(app)/            # ❌ DELETE after migration
```

---

## Next Steps - Immediate Actions

### 1. Get User Approval (5 minutes)
- Review this plan with user
- Confirm priority: migrate documents → fiscal → settings
- Agree on timeline (1-2 days vs 1 week)

### 2. Start Phase 1 - Documents Migration (2-3 hours)
```bash
# Create branch
git checkout -b feature/consolidate-frontend

# Create files
mkdir -p frontend/app/(dashboard)/documents
mkdir -p frontend/lib/hooks

# Start migration
cp frontend/app/(app)/documents/page.tsx frontend/app/(dashboard)/documents/page.tsx

# Update imports and test
```

### 3. Create Migration Tracking Issue
Document progress:
- [ ] Documents migrated
- [ ] Fiscal migrated
- [ ] Settings migrated
- [ ] Duplicates removed
- [ ] Routing updated
- [ ] (app) deprecated
- [ ] Tests passing
- [ ] Documentation updated

---

## Conclusion

**Current State**: 2 parallel frontend structures causing confusion

**Target State**: Single consolidated `(dashboard)` structure with all features

**Benefits**:
- ✅ Single source of truth
- ✅ No duplicate code
- ✅ Easier maintenance
- ✅ Better developer experience
- ✅ All features accessible from one layout

**Effort**: 6-8 hours total work

**Recommendation**: **Proceed with migration** - The benefits far outweigh the effort, and we'll have a clean, maintainable codebase.
