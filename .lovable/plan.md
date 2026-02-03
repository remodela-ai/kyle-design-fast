

# Plan: Kustr Design Multi-Office Platform

## Executive Summary

Transform the current application into an enterprise platform for **Kustr Design**, an interior design firm with three offices (New York, Arizona, Wisconsin). Each office will have its own Managing Partner, team of collaborators, and independent databases for clients, providers, projects, and marketing tools.

---

## System Architecture

```text
                    +---------------------------+
                    |      KUSTR DESIGN         |
                    |    (Main Firm)            |
                    +---------------------------+
                              |
       +----------------------+----------------------+
       |                      |                      |
+------v------+       +-------v------+       +------v------+
|  NEW YORK   |       |   ARIZONA    |       |  WISCONSIN  |
|   Office    |       |    Office    |       |    Office   |
+------+------+       +-------+------+       +------+------+
       |                      |                      |
  +----+----+            +----+----+            +----+----+
  |Managing |            |Managing |            |Managing |
  | Partner |            | Partner |            | Partner |
  +---------+            +---------+            +---------+
       |                      |                      |
  +----+----+            +----+----+            +----+----+
  |  Team   |            |  Team   |            |  Team   |
  |Members  |            |Members  |            |Members  |
  +---------+            +---------+            +---------+
```

---

## Phase 1: Database Structure

### 1.1 New Tables

#### Table: `offices`
Represents each of the three Kustr Design offices.

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Unique identifier |
| name | text | Office name (e.g., "New York") |
| location | text | City/State |
| address | text | Physical address |
| phone | text | Contact phone |
| email | text | Office email |
| timezone | text | Timezone |
| created_at | timestamp | Creation date |

#### Table: `user_roles`
Role system for secure access control.

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Unique identifier |
| user_id | uuid | Reference to auth.users |
| role | enum | 'managing_partner', 'collaborator', 'admin' |
| office_id | uuid | Assigned office |

#### Table: `team_members`
Extended profiles for team members.

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Unique identifier |
| user_id | uuid | Reference to auth.users |
| office_id | uuid | Office they belong to |
| display_name | text | Display name |
| title | text | Job title (e.g., "Senior Designer") |
| avatar_url | text | Profile photo URL |
| phone | text | Phone number |
| bio | text | Biography |
| is_active | boolean | Active/inactive status |
| onboarding_completed | boolean | Onboarding completed |
| created_at | timestamp | Creation date |

#### Table: `clients`
Client database per office.

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Unique identifier |
| office_id | uuid | Owner office |
| name | text | Client name |
| company | text | Company (if applicable) |
| email | text | Contact email |
| phone | text | Phone |
| address | text | Address |
| notes | text | Additional notes |
| status | enum | 'lead', 'active', 'completed', 'inactive' |
| created_at | timestamp | Creation date |

#### Table: `service_providers`
Service providers (contractors, architects, etc.)

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Unique identifier |
| office_id | uuid | Owner office |
| name | text | Provider name |
| category | text | Service category |
| contact_name | text | Contact person |
| email | text | Email |
| phone | text | Phone |
| website | text | Website |
| rating | integer | Rating 1-5 |
| notes | text | Notes |

#### Table: `material_vendors`
Material and product vendors.

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Unique identifier |
| office_id | uuid | Owner office |
| name | text | Vendor name |
| category | text | Category (furniture, textiles, lighting) |
| contact_name | text | Contact person |
| email | text | Email |
| phone | text | Phone |
| website | text | Website |
| discount_terms | text | Discount terms |
| notes | text | Notes |

#### Table: `strategic_alliances`
Strategic alliances for each office.

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Unique identifier |
| office_id | uuid | Owner office |
| partner_name | text | Partner name |
| partnership_type | text | Alliance type |
| contact_name | text | Contact person |
| email | text | Email |
| phone | text | Phone |
| agreement_details | text | Agreement details |
| start_date | date | Start date |
| end_date | date | End date |

#### Table: `projects`
Design projects per office.

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Unique identifier |
| office_id | uuid | Owner office |
| client_id | uuid | Associated client |
| name | text | Project name |
| description | text | Description |
| status | enum | 'planning', 'in_progress', 'review', 'completed' |
| budget | decimal | Budget |
| start_date | date | Start date |
| end_date | date | Estimated end date |
| cover_image_url | text | Cover image |
| assigned_members | uuid[] | Assigned members |

#### Table: `project_files`
Files associated with projects.

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Unique identifier |
| project_id | uuid | Associated project |
| file_name | text | File name |
| file_url | text | Storage URL |
| file_type | text | Type (image, document, etc.) |
| uploaded_by | uuid | User who uploaded |
| created_at | timestamp | Upload date |

#### Table: `marketing_posts`
Marketing posts per office.

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Unique identifier |
| office_id | uuid | Owner office |
| title | text | Post title |
| content | text | Post content |
| platform | enum | 'linkedin', 'facebook', 'instagram', 'tiktok', 'x' |
| status | enum | 'draft', 'scheduled', 'published' |
| scheduled_date | timestamp | Scheduled date |
| image_urls | text[] | Image URLs |
| created_by | uuid | Creator user |
| created_at | timestamp | Creation date |

#### Table: `marketing_budgets`
Monthly marketing budgets.

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Unique identifier |
| office_id | uuid | Owner office |
| month | date | Budget month |
| total_budget | decimal | Total budget |
| linkedin_budget | decimal | LinkedIn budget |
| facebook_budget | decimal | Facebook budget |
| instagram_budget | decimal | Instagram budget |
| tiktok_budget | decimal | TikTok budget |
| x_budget | decimal | X budget |
| notes | text | Notes |

---

## Phase 2: Authentication and Role System

### 2.1 Managing Partner Registration Flow

1. Managing Partner accesses `/kustr/onboarding`
2. Registers with email and password
3. Completes basic onboarding:
   - Personal information
   - Office selection
   - Contact information
4. System creates profile in `team_members` with `managing_partner` role
5. Redirects to office dashboard

### 2.2 Access Control (RLS)

- Managing Partners: Full access to their office data
- Collaborators: Limited access based on permissions
- Data from one office is NOT visible to other offices

---

## Phase 3: Page Structure

### 3.1 New Pages to Create

```text
/kustr                      - Kustr Design Landing
/kustr/auth                 - Login/Registration
/kustr/onboarding           - Managing Partners Onboarding
/kustr/dashboard            - Main Office Dashboard
/kustr/team                 - Team Management
/kustr/clients              - Client Database
/kustr/providers            - Service Providers
/kustr/vendors              - Material Vendors
/kustr/alliances            - Strategic Alliances
/kustr/projects             - Project Folder
/kustr/projects/[id]        - Project Details
/kustr/marketing            - Marketing Platform
/kustr/marketing/posts      - Post Management
/kustr/marketing/budget     - Budget Management
/kustr/settings             - Office Settings
```

### 3.2 Main Components

- `KustrSidebar` - Specific side navigation
- `OfficeProvider` - Current office context
- `TeamMemberCard` - Team member card
- `ClientsTable` - Clients table
- `ProvidersTable` - Providers table
- `ProjectCard` - Project card
- `MarketingPostEditor` - Post editor
- `BudgetAllocator` - Budget allocator

---

## Phase 4: Office Dashboard

### 4.1 Dashboard Elements

- **Header**: Kustr logo + office name + user
- **Stats Cards**: 
  - Active projects
  - Total clients
  - Team (members)
  - Monthly marketing budget
- **Recent Projects**: List of last 5 projects
- **Team Activity**: Recent actions
- **Marketing**: Upcoming scheduled posts

---

## Phase 5: Marketing Module

### 5.1 Post Generation

- Visual editor to create posts
- Platform-specific preview (LinkedIn, Facebook, etc.)
- Post scheduling
- Project image library

### 5.2 Budget Management

- Monthly budget view
- Platform allocation
- Expense history
- Distribution charts

---

## Implementation Sequence

| Order | Task | Description |
|-------|------|-------------|
| 1 | DB Migration | Create all tables and RLS policies |
| 2 | Role System | Implement `user_roles` with `has_role()` function |
| 3 | Kustr Auth | Specific login/registration page |
| 4 | MP Onboarding | Onboarding flow for Managing Partners |
| 5 | Office Context | Provider to manage current office |
| 6 | Dashboard | Main office dashboard |
| 7 | Team Module | Team member CRUD |
| 8 | Clients Module | Clients CRUD |
| 9 | Providers Module | Service providers CRUD |
| 10 | Vendors Module | Material vendors CRUD |
| 11 | Alliances Module | Strategic alliances CRUD |
| 12 | Projects Module | Projects CRUD with files |
| 13 | Marketing Posts | Editor and post management |
| 14 | Marketing Budget | Budget management |

---

## Technical Considerations

### Security
- Strict RLS by `office_id` on all tables
- Roles managed via `has_role()` function to avoid recursion
- Permission validation on each operation

### Storage
- `kustr-assets` bucket for office files
- Structure: `/{office_id}/projects/{project_id}/`
- `kustr-marketing` bucket for marketing images

### Performance
- Indexes on `office_id` for frequent queries
- Pagination on large lists (clients, projects)

---

## Questions for Confirmation

Before implementing, I need to confirm a few details:

1. Do the three offices already have defined Managing Partners? (to pre-create offices)
2. Should collaborators be able to register themselves or only Managing Partners can invite them?
3. For the marketing module, do you want real integration with social media APIs or just content generation?
4. Do you need consolidated reports at the firm level (all offices) or only per office?

