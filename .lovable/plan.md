

# Skill Builder - Vibe Coding for Interior Designers

## Overview

A new page at `/skill-builder` where designers describe in natural language the functionality they want. Kyle sends the request to Manus, which creates a "mini app". The result is stored in the database and dynamically rendered as:

1. A new page accessible via a dynamic route (`/skills/:skillId`)
2. A new entry in the left sidebar under a "Custom Skills" section
3. A new skill card in the right Kyle Skills sidebar

## How It Works

```text
+---------------------+       +------------------+       +----------------+
| Designer describes   | ----> | kyle-manus-bridge| ----> | Manus creates  |
| "I want a tool that  |       | (edge function)  |       | the mini app   |
| compares suppliers"  |       +------------------+       +----------------+
+---------------------+                                         |
                                                                 v
                                                    +------------------------+
                                                    | Result stored in       |
                                                    | kyle_custom_skills     |
                                                    | table (name, desc,     |
                                                    | icon, rendered HTML/   |
                                                    | iframe URL, status)    |
                                                    +------------------------+
                                                                 |
                          +----------------------------------+---+---+
                          v                                  v       v
                   Left Sidebar                      Right Sidebar  Dynamic Page
                   "Custom Skills"                   new skill      /skills/:id
                   section (dynamic)                 card            renders content
```

## Technical Plan

### 1. Database Migration

Create a `kyle_custom_skills` table:

- `id` (uuid, PK)
- `office_id` (uuid, nullable) -- scoped to office
- `created_by` (uuid, nullable) -- team member who created it
- `name` (text) -- skill display name
- `description` (text) -- what it does
- `icon` (text, default '🧩') -- emoji icon
- `action_type` (text, default 'create') -- research/create/analyze/automate
- `manus_task_id` (text) -- task ID from Manus
- `status` (text, default 'building') -- building / ready / failed
- `result_url` (text, nullable) -- URL Manus returns (iframe-able)
- `result_html` (text, nullable) -- raw HTML if returned inline
- `prompt` (text) -- original user prompt
- `created_at`, `updated_at` (timestamps)

RLS: public insert, office-scoped select/update/delete.

### 2. New Page: `/skill-builder` (`src/pages/SkillBuilder.tsx`)

The main "Vibe Coding" interface:

- Hero section with title "Skill Builder" and subtitle "Describe it. Kyle builds it."
- Large text area where the designer describes the functionality they want
- "Build Skill" button that sends the prompt to `kyle-manus-bridge` with `action_type: 'create'`
- After submission, shows a progress card with the Manus task status
- Below: a grid of all previously created custom skills from the database, each showing name, icon, description, and status badge (Building / Ready / Failed)
- Click on a "Ready" skill navigates to `/skills/:id`

### 3. Dynamic Skill Page: `/skills/:id` (`src/pages/CustomSkillPage.tsx`)

- Fetches the skill by ID from `kyle_custom_skills`
- If `result_url` exists: renders it in a full-width iframe
- If `result_html` exists: renders it in a sandboxed container
- If status is "building": shows a loading/progress state
- Header with skill name, description, and a "Back to Skill Builder" link

### 4. Left Sidebar Update (`AppSidebar.tsx`)

- Add a new dynamic section "Custom Skills" between Operations and Landings
- Fetch `kyle_custom_skills` where `status = 'ready'` for the current office
- Render each as a `SidebarNavItem` with the skill's emoji as icon and path `/skills/:id`
- Show only when authenticated

### 5. Right Sidebar / KyleSkillsContext Update

- In `KyleSkillsContext.tsx`: add `customSkills` array and a `addCustomSkill` function to the context
- In `KyleSkillsSidebar.tsx`: render custom skills below the default 4 skills grid, with a visual separator and "Custom" label
- Custom skills are clickable and activate the same skill mode workflow

### 6. Edge Function Enhancement

No changes to `kyle-manus-bridge` itself -- it already supports arbitrary commands with `action_type`. The frontend will:
1. Call `kyle-manus-bridge` with the designer's prompt
2. Store the returned `task_id` in the database
3. Optionally poll for task completion (future: webhook)

### 7. Routing (`App.tsx`)

Add two new routes:
```
<Route path="/skill-builder" element={<SkillBuilder />} />
<Route path="/skills/:skillId" element={<CustomSkillPage />} />
```

### 8. Files to Create

| File | Purpose |
|------|---------|
| `src/pages/SkillBuilder.tsx` | Main vibe coding page |
| `src/pages/CustomSkillPage.tsx` | Dynamic skill renderer |
| `src/hooks/useCustomSkills.ts` | Hook to CRUD custom skills from DB |

### 9. Files to Modify

| File | Change |
|------|--------|
| `src/App.tsx` | Add routes + imports |
| `src/components/AppSidebar.tsx` | Add dynamic "Custom Skills" section |
| `src/contexts/KyleSkillsContext.tsx` | Add `customSkills` to context |
| `src/components/KyleSkillsSidebar.tsx` | Render custom skills in grid |

### 10. Sidebar Navigation Entry

Add a static entry to reach the builder itself:
```typescript
// In kyleNavItems or a new section
{ icon: Wand2, label: "Skill Builder", path: "/skill-builder" }
```

