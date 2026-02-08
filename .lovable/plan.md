

# Fix Plan: Post-Merge Build Errors

## Problem Analysis

After the merge from Manus, there are **3 categories of errors** blocking the build:

### Error Category 1: Missing Page Component
**File:** `src/App.tsx` line 55
**Error:** `Cannot find module './pages/DesignStudio'`
**Root Cause:** The `DesignStudio` page was imported but the file doesn't exist in `src/pages/`

### Error Category 2: Missing Database Tables
**Files:** `src/services/kitchenApi.ts` (30+ errors)
**Error:** `Argument of type '"kitchen_projects"' is not assignable to parameter of type 'never'`
**Root Cause:** The `kitchen_projects` and `kitchen_catalog_categories` tables were never created in the database. The schema exists in `supabase/kitchenSchema.sql` but was never applied.

### Error Category 3: Invalid Status Comparison
**File:** `src/pages/Proposals.tsx` lines 12, 47
**Error:** `types '"rendered" | "rendering"...' and '"proposal"' have no overlap`
**Root Cause:** The code checks for `status === "proposal"` but the schema only allows: `upload`, `segmenting`, `segmented`, `rendering`, `rendered`

---

## Solution Overview

```text
┌─────────────────────────────────────────────────────────────────┐
│                    FIX SEQUENCE                                  │
├─────────────────────────────────────────────────────────────────┤
│  Step 1: Create missing DesignStudio.tsx page                   │
│  Step 2: Run database migration to create kitchen tables        │
│  Step 3: Fix Proposals.tsx status comparison logic              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Detailed Fix Steps

### Step 1: Create Missing DesignStudio Page

Create `src/pages/DesignStudio.tsx` - the main studio interface for kitchen redesign projects.

**Component responsibilities:**
- Load project by ID from URL params
- Display original image with segmentation overlay
- Show product catalog sidebar
- Handle AI segmentation and rendering actions
- Navigation to 3D viewer and proposal generation

**Estimated lines:** ~250 lines with proper UI and state management

---

### Step 2: Database Migration - Kitchen Tables

Apply the schema from `supabase/kitchenSchema.sql` via database migration:

**Tables to create:**

| Table | Purpose |
|-------|---------|
| `kitchen_projects` | Main project storage with status, images, items |
| `kitchen_catalog_categories` | Product categories (cabinets, countertops, etc.) |
| `kitchen_catalog_items` | Individual products with pricing |

**Columns in `kitchen_projects`:**
- `id` - BIGSERIAL primary key (not UUID - per Manus schema)
- `user_id` - UUID reference to auth.users
- `name` - Project name
- `status` - Enum: upload/segmenting/segmented/rendering/rendered
- `original_image_url` - Uploaded photo URL
- `redesign_image_url` - AI-rendered result URL  
- `segmentation_data` - JSONB with detected elements
- `items` - JSONB array of selected products
- `layout_3d` - JSONB for 3D visualization data
- `proposal_data` - JSONB for generated proposal

**RLS Policies:**
- Users can only access their own projects
- Catalog is public read for all users

**Also needed:**
- Storage bucket `kitchen-images` for uploaded photos

---

### Step 3: Fix Proposals.tsx Status Logic

The current code checks:
```typescript
p.status === "proposal"  // Invalid - "proposal" is not a valid status
```

The valid statuses are: `upload`, `segmenting`, `segmented`, `rendering`, `rendered`

**Fix:** Change the filter logic to show projects that:
- Have completed rendering (`status === "rendered"`)
- OR have a redesign image URL (alternative condition already present)

---

## Files to Create/Modify

### New Files
| File | Purpose |
|------|---------|
| `src/pages/DesignStudio.tsx` | Main studio interface for project editing |

### Modified Files
| File | Change |
|------|--------|
| `src/pages/Proposals.tsx` | Fix status comparison on lines 12 and 47 |
| Database | Migration to create kitchen_* tables |

### Service Layer (Already Present - No Changes)
- `src/services/kitchenApi.ts` - Already correctly implemented, just needs the tables to exist
- `src/hooks/useKitchenApi.ts` - Already correctly implemented

---

## Technical Details

### DesignStudio Page Structure

```text
┌──────────────────────────────────────────────────────────────┐
│  Header: Project name + status + actions                      │
├────────────────────────────────┬─────────────────────────────┤
│                                │                             │
│      Image Canvas              │    Product Catalog          │
│  - Original photo              │    Sidebar                  │
│  - Segmentation overlay        │  - Categories accordion     │
│  - Bounding boxes              │  - Product cards            │
│  - Click to select elements    │  - Selected items list      │
│                                │                             │
├────────────────────────────────┴─────────────────────────────┤
│  Action Bar: Segment | Render | 3D View | Generate Proposal  │
└──────────────────────────────────────────────────────────────┘
```

### Database ID Type Note

The Manus schema uses `BIGSERIAL` (integer) for `kitchen_projects.id`, but the existing kitchenApi.ts uses `number` types. This is consistent and will work.

However, the `useKitchenApi.ts` hooks pass `id` as `number` while the `.eq("id", projectId)` expects the type to match the database. The migration will ensure proper typing.

---

## Implementation Order

1. **Database migration first** - Create the tables so TypeScript types regenerate
2. **Create DesignStudio.tsx** - The missing page component  
3. **Fix Proposals.tsx** - Remove invalid status comparison
4. **Test build** - Verify all errors resolved

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Storage bucket not created | Include storage bucket creation in migration notes |
| Edge functions missing | Kitchen functions are referenced but not critical for build |
| Catalog empty | Tables created but empty - can seed later |

---

## Post-Fix Verification

After implementation, verify:
1. Build completes without TypeScript errors
2. Navigation to `/kitchen-studio` works
3. Creating a new project succeeds
4. `/projects` page loads without errors
5. `/proposals` page loads without errors

