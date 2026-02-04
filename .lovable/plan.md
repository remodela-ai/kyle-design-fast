

# Implementation Plan: Kyle AI Platform for Kuester Design

## Executive Summary

Based on the conversation with James, we need to evolve Kyle from an internal design tool into a **dual-purpose AI platform** that serves both:
1. **Client-Facing Website Chatbot**: Kyle engages website visitors, gathers project requirements, and generates preliminary designs
2. **Designer Backend Assistant**: Kyle helps the design team with internal workflows, product sourcing, and client communication

This plan builds on the existing architecture without breaking current functionality.

---

## James's Core Requirements Analysis

| Requirement | Current Status | Gap |
|-------------|---------------|-----|
| Kyle chats with website visitors | Partial - Kyle exists but only for designers | Need public-facing Kyle widget |
| Gather project ideas/inspirations | Yes - conversation transcript exists | Need structured data extraction |
| Ask about appliance brands, plumbing brands | No | Need guided conversation prompts |
| Ask about budget | No | Need budget qualification flow |
| Generate beautiful rendering | Yes - Flux 2 Pro integration | Works |
| Provide design fee upfront | No | Need proposal generation |
| Generate design agreement | No | Need legal document generation |
| Kyle assists design team on backend | Partial - iteration exists | Need expanded capabilities |
| Product sourcing and selection | Partial - Items Extraction exists | Need real product database |
| Generate mood boards for client | Yes - pipeline-moodboard | Works |
| Communicate at odd hours (1 AM) | No | Need async messaging system |

---

## Architecture Overview

```text
+----------------------------------------------------------+
|                    PUBLIC WEBSITE                         |
|  +----------------------------------------------------+  |
|  |   Kyle Widget (Embedded Chatbot)                    |  |
|  |   - Greets visitors                                 |  |
|  |   - Collects project requirements                   |  |
|  |   - Generates preliminary visualization             |  |
|  |   - Captures lead data                              |  |
|  +----------------------------------------------------+  |
+----------------------------------------------------------+
                           |
                           v
+----------------------------------------------------------+
|                  LEAD MANAGEMENT LAYER                    |
|  +----------------------------------------------------+  |
|  |  leads table (new)                                  |  |
|  |  - Contact info                                     |  |
|  |  - Project requirements                             |  |
|  |  - Budget range                                     |  |
|  |  - Brand preferences                                |  |
|  |  - Conversation transcript                          |  |
|  |  - Generated design image                           |  |
|  |  - Status (new/qualified/converted)                 |  |
|  +----------------------------------------------------+  |
+----------------------------------------------------------+
                           |
                           v
+----------------------------------------------------------+
|               DESIGNER DASHBOARD (Existing)               |
|  +----------------------------------------------------+  |
|  |  - View incoming leads                              |  |
|  |  - Review Kyle conversations                        |  |
|  |  - Generate proposals                               |  |
|  |  - Send design agreements                           |  |
|  |  - Assign to team members                           |  |
|  +----------------------------------------------------+  |
+----------------------------------------------------------+
                           |
                           v
+----------------------------------------------------------+
|               KYLE BACKEND ASSISTANT                      |
|  +----------------------------------------------------+  |
|  |  - Product sourcing assistance                      |  |
|  |  - Mood board generation                            |  |
|  |  - Client messaging (async)                         |  |
|  |  - Schedule management                              |  |
|  +----------------------------------------------------+  |
+----------------------------------------------------------+
```

---

## Phase 1: Public-Facing Kyle Widget

### 1.1 Create New ElevenLabs Agent for Lead Capture

Create a specialized agent with a system prompt designed for lead qualification:

**Edge Function**: `create-kyle-lead-agent`

The agent will:
- Greet visitors warmly
- Ask about project type (kitchen, bathroom, living room, etc.)
- Inquire about style preferences
- Ask about specific brand preferences (appliances, plumbing fixtures)
- Gather budget range
- Collect contact information
- Trigger design generation with magic phrase

### 1.2 Database Schema Updates

**New Table: `leads`**
```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id UUID REFERENCES offices(id),
  
  -- Contact Information
  name TEXT,
  email TEXT,
  phone TEXT,
  
  -- Project Requirements
  project_type TEXT, -- kitchen, bathroom, bedroom, etc.
  room_dimensions JSONB, -- { width, height, depth }
  style_preferences TEXT[],
  
  -- Brand Preferences (James's specific request)
  appliance_brands TEXT[],
  plumbing_brands TEXT[],
  furniture_brands TEXT[],
  
  -- Budget
  budget_min NUMERIC,
  budget_max NUMERIC,
  budget_flexibility TEXT, -- strict, flexible, open
  
  -- Conversation Data
  conversation_transcript TEXT,
  conversation_id TEXT, -- ElevenLabs conversation ID
  extracted_insights JSONB,
  
  -- Generated Assets
  preliminary_design_url TEXT,
  moodboard_url TEXT,
  
  -- Status Tracking
  status TEXT DEFAULT 'new', -- new, qualified, contacted, proposal_sent, converted, lost
  qualified_at TIMESTAMPTZ,
  assigned_to UUID REFERENCES team_members(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**New Table: `lead_messages`**
For async Kyle-client communication:
```sql
CREATE TABLE lead_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id),
  sender TEXT, -- 'kyle' or 'client' or 'designer'
  content TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 1.3 New Pages

**`/kyle-public` - Embeddable Kyle Widget Page**
- Full-screen Kyle interface for public visitors
- No authentication required
- Leads to design generation and lead capture

**`/leads` - Lead Management Dashboard**
- List of all captured leads
- Filter by status, date, assigned designer
- View conversation transcripts
- One-click proposal generation

### 1.4 Lead Capture Edge Function

**`kyle-lead-capture`**
- Receives webhook from ElevenLabs when conversation ends
- Extracts structured data using Gemini
- Creates lead record in database
- Generates preliminary design with Flux
- Sends notification to design team

---

## Phase 2: Enhanced Designer Assistant

### 2.1 Kyle Tasks Agent Improvements

The existing `kyle-tasks-ai` edge function already handles:
- Task creation
- Task completion
- Alarm setting
- Task listing

**Enhancements needed:**
- Add product sourcing commands
- Add mood board generation commands
- Add client message commands

### 2.2 Product Sourcing Integration

**New Edge Function: `kyle-product-search`**

Integrates with:
- Material vendors database (already exists)
- External APIs for product catalogs
- Price comparison across suppliers

**Commands:**
- "Kyle, find me a modern pendant light under $500"
- "Kyle, search for quartz countertops in white"
- "Kyle, compare prices for Sub-Zero refrigerators"

### 2.3 Async Client Messaging

**New Edge Function: `kyle-send-message`**

Allows Kyle to send messages to leads/clients at any hour:
- Designer records message via voice
- Kyle sends as text/email to client
- Client can respond via chat widget
- Messages appear in lead/client record

---

## Phase 3: Proposal & Agreement Generation

### 3.1 Design Fee Calculator

**New Edge Function: `calculate-design-fee`**

Based on:
- Project type and scope
- Room dimensions
- Selected products
- Complexity factors
- Geographic location

Returns:
- Proposed design fee
- Payment schedule
- Project timeline estimate

### 3.2 Design Agreement Generator

**New Edge Function: `generate-design-agreement`**

Creates legally-compliant design agreement:
- Client information
- Scope of work
- Fee structure
- Terms and conditions
- E-signature ready

Uses a template system with Gemini for customization.

---

## Phase 4: Integration Points

### 4.1 Website Embed Code

Provide simple embed code for client websites:
```html
<script src="https://kuester.design/kyle-widget.js"></script>
<kyle-widget office-id="xxx"></kyle-widget>
```

### 4.2 Email Notifications

- New lead notification to design team
- Client receives design rendering
- Proposal sent notifications
- Agreement signed notifications

### 4.3 CRM Integration

- Sync leads with existing CRM systems
- Update status automatically
- Track conversion rates

---

## Implementation Order

### Sprint 1 (Week 1-2): Lead Capture Foundation
1. Create `leads` and `lead_messages` tables with RLS
2. Create `create-kyle-lead-agent` edge function
3. Create `kyle-lead-capture` webhook handler
4. Build `/kyle-public` page with Kyle widget
5. Build `/leads` dashboard for lead management

### Sprint 2 (Week 3-4): Enhanced Lead Qualification
1. Add brand preference collection to agent
2. Add budget qualification flow
3. Create automated design generation on lead capture
4. Build lead detail view with conversation transcript
5. Add lead assignment to team members

### Sprint 3 (Week 5-6): Proposal System
1. Create `calculate-design-fee` edge function
2. Create `generate-design-agreement` edge function
3. Build proposal preview and editing UI
4. Add e-signature integration (DocuSign/PandaDoc)
5. Build proposal tracking dashboard

### Sprint 4 (Week 7-8): Backend Assistant Enhancements
1. Enhance `kyle-tasks-ai` with product sourcing
2. Build `kyle-product-search` integration
3. Create `kyle-send-message` for async communication
4. Build client messaging interface in lead detail
5. Add notification system

### Sprint 5 (Week 9-10): Polish & Integration
1. Create embeddable widget code
2. Add email notification system
3. Build analytics dashboard
4. Performance optimization
5. Documentation and training materials

---

## Technical Details

### Files to Create

| File | Purpose |
|------|---------|
| `src/pages/KylePublic.tsx` | Public-facing Kyle widget page |
| `src/pages/kustr/Leads.tsx` | Lead management dashboard |
| `src/pages/kustr/LeadDetail.tsx` | Individual lead view |
| `src/pages/kustr/Proposals.tsx` | Proposal management |
| `src/hooks/useLeads.ts` | Lead data management hook |
| `src/hooks/useKyleLeadAgent.ts` | Public Kyle agent hook |
| `src/contexts/LeadContext.tsx` | Lead state management |
| `supabase/functions/create-kyle-lead-agent/index.ts` | Lead capture agent creation |
| `supabase/functions/kyle-lead-capture/index.ts` | Lead processing webhook |
| `supabase/functions/kyle-product-search/index.ts` | Product sourcing AI |
| `supabase/functions/kyle-send-message/index.ts` | Async messaging |
| `supabase/functions/calculate-design-fee/index.ts` | Fee calculation |
| `supabase/functions/generate-design-agreement/index.ts` | Agreement generation |

### Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Add new routes |
| `src/components/AppSidebar.tsx` | Add Leads navigation item |
| `src/pages/kustr/KustrDashboard.tsx` | Add lead stats card |
| `supabase/functions/kyle-tasks-ai/index.ts` | Add product sourcing commands |
| `supabase/config.toml` | Register new edge functions |

### Database Changes

- Create `leads` table
- Create `lead_messages` table
- Add RLS policies for office-scoped access
- Create indexes for performance

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Lead capture rate | 15% of website visitors |
| Lead to proposal time | < 24 hours |
| Proposal acceptance rate | 40% |
| Designer time saved | 5+ hours/week |
| Client satisfaction (NPS) | 50+ |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Kyle misunderstands requirements | Add human review step before proposal |
| Privacy concerns with data collection | Clear opt-in consent, data encryption |
| Integration complexity | Phased rollout, feature flags |
| Agent response quality | Regular prompt tuning, A/B testing |

