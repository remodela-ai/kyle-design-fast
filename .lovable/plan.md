
# Implementation Plan: Complete Sales Funnel Automation

This plan covers the four missing stages in your interior design studio's business process: **Automated Nurturing**, **Demo Scheduling**, **Electronic Signatures**, and **Payment Processing**.

---

## Overview

The current system handles:
- Content generation (Marketing)
- Lead capture (Kyle Widget)
- Lead qualification and status management
- Proposal generation with fee calculation
- Basic email notifications

We'll add the missing automation to create a complete end-to-end sales funnel.

---

## Phase 1: Automated Nurturing Sequences

### What This Does
Automatically sends follow-up emails based on lead status changes and time elapsed, keeping leads engaged without manual intervention.

### Database Changes

**New table: `nurturing_sequences`**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| office_id | uuid | FK to offices |
| name | text | "New Lead Welcome", "Post-Qualification", etc. |
| trigger_status | lead_status | Status that activates sequence |
| is_active | boolean | Enable/disable sequence |

**New table: `nurturing_steps`**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| sequence_id | uuid | FK to nurturing_sequences |
| step_order | integer | 1, 2, 3... |
| delay_hours | integer | Hours after previous step |
| email_subject | text | Subject template |
| email_body | text | HTML body template |
| include_moodboard | boolean | Attach generated moodboard |

**New table: `nurturing_log`**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| lead_id | uuid | FK to leads |
| step_id | uuid | FK to nurturing_steps |
| sent_at | timestamp | When email was sent |
| opened_at | timestamp | Email open tracking |
| clicked_at | timestamp | Link click tracking |

### Backend Functions

**`nurturing-scheduler`** (Edge Function)
- Runs on a schedule (every 15 minutes via external cron or Supabase pg_cron)
- Queries leads that have pending nurturing steps
- Sends emails via Resend with personalized content
- Logs delivery status

**`nurturing-trigger`** (Edge Function)
- Called when lead status changes
- Enrolls lead in appropriate sequence
- Cancels previous sequences if status changes

### UI Components

**Nurturing Settings Page** (`/kustr/settings/nurturing`)
- List of sequences with on/off toggles
- Sequence editor with drag-and-drop step ordering
- Email template editor with variable placeholders
- Preview mode to test emails

---

## Phase 2: Demo Scheduling with Calendar Integration

### What This Does
Allows leads to book consultation appointments directly, with automatic calendar sync and reminders.

### Integration Approach

**Option A: Google Calendar Connector** (Recommended)
- Uses existing connector gateway infrastructure
- Team members connect their Google Calendar
- Available slots calculated from calendar free/busy
- Events created automatically when booked

**Option B: Calendly Embed**
- Simpler implementation
- Embed Calendly widget in lead-facing pages
- Webhook integration for booking notifications

### Database Changes

**New table: `scheduling_availability`**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| team_member_id | uuid | FK to team_members |
| day_of_week | integer | 0-6 (Sunday-Saturday) |
| start_time | time | e.g., "09:00" |
| end_time | time | e.g., "17:00" |

**New table: `appointments`**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| lead_id | uuid | FK to leads |
| team_member_id | uuid | FK to team_members |
| scheduled_at | timestamp | Appointment time |
| duration_minutes | integer | 30, 60, 90 |
| type | text | "discovery", "site_visit", "design_review" |
| location | text | Address or "Virtual" |
| video_link | text | Zoom/Meet link |
| status | text | "scheduled", "completed", "cancelled", "no_show" |
| notes | text | Pre-appointment notes |
| reminder_sent | boolean | Tracking flag |

### Backend Functions

**`scheduling-availability`** (Edge Function)
- Queries team member availability
- Checks Google Calendar for conflicts
- Returns available time slots for next 2 weeks

**`scheduling-book`** (Edge Function)
- Creates appointment record
- Creates Google Calendar event
- Sends confirmation email to lead
- Updates lead status to "contacted"

**`scheduling-reminders`** (Edge Function)
- Runs daily
- Sends 24-hour and 1-hour reminders
- Includes video link for virtual appointments

### UI Components

**Booking Widget** (Public-facing)
- Embedded in lead email nurturing
- Shows available team members
- Calendar date picker
- Time slot selection
- Confirmation screen

**Appointments Dashboard** (`/kustr/appointments`)
- Daily/weekly calendar view
- Upcoming appointments list
- Quick actions: reschedule, cancel, mark complete
- Integration with lead detail page

---

## Phase 3: Electronic Contract Signing

### What This Does
Enables legally-binding digital signatures on design agreements, eliminating paper contracts.

### Integration Approach

**In-house Solution** (Recommended for cost control)
- Custom signature capture component
- Signature stored as image in storage bucket
- Legally compliant with timestamp and IP logging
- PDF generation of signed contract

### Database Changes

**New columns on `proposals` table:**
| Column | Type | Description |
|--------|------|-------------|
| signature_url | text | Stored signature image URL |
| signed_by_name | text | Typed name confirmation |
| signed_by_email | text | Email used for signing |
| signed_at | timestamp | Legal timestamp |
| signed_ip | text | IP address for legal record |
| pdf_url | text | Final signed PDF URL |

**New table: `signature_audit_log`**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| proposal_id | uuid | FK to proposals |
| event_type | text | "viewed", "signed", "downloaded" |
| ip_address | text | Client IP |
| user_agent | text | Browser info |
| timestamp | timestamp | Event time |

### Backend Functions

**`proposal-sign`** (Edge Function)
- Validates signature data
- Stores signature image to storage
- Updates proposal status to "signed"
- Generates signed PDF
- Logs audit trail
- Triggers payment flow

**`proposal-pdf`** (Edge Function)
- Converts agreement HTML to PDF
- Overlays signature image
- Adds timestamp and legal footer
- Stores in storage bucket

### UI Components

**Public Proposal View** (`/proposal/:id`)
- Professional proposal presentation
- Signature pad component (touch-enabled)
- "I agree to terms" checkbox
- Type-to-sign option
- Download signed PDF button

**Signature Tracking in Lead Detail**
- Shows signature status
- Link to signed PDF
- Audit log viewer

---

## Phase 4: Payment Processing with Stripe

### What This Does
Collects deposits and milestone payments automatically, with installment support.

### Integration Approach

**Stripe Integration** (via Lovable's built-in tool)
- One-time setup with secret key
- Payment links for each milestone
- Automatic invoice generation
- Webhook handling for payment events

### Database Changes

**New table: `payments`**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| proposal_id | uuid | FK to proposals |
| lead_id | uuid | FK to leads |
| amount | numeric | Payment amount |
| milestone | text | "deposit", "design_milestone", "final" |
| stripe_payment_intent_id | text | Stripe reference |
| stripe_invoice_id | text | Invoice reference |
| status | text | "pending", "processing", "completed", "failed" |
| paid_at | timestamp | When payment completed |
| receipt_url | text | Stripe receipt URL |

**New table: `payment_schedules`**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| proposal_id | uuid | FK to proposals |
| milestone | text | Payment milestone name |
| percentage | integer | e.g., 50, 25, 25 |
| due_date | date | When payment is due |
| reminder_sent | boolean | Tracking flag |

### Backend Functions

**`payment-create-session`** (Edge Function)
- Creates Stripe Checkout session
- Includes customer info from lead
- Sets up payment schedule
- Returns checkout URL

**`payment-webhook`** (Edge Function)
- Handles Stripe webhook events
- Updates payment status
- Triggers next phase when paid
- Sends receipt emails
- Updates lead status on deposit

**`payment-reminders`** (Edge Function)
- Runs daily
- Checks for upcoming due dates
- Sends payment reminder emails

### UI Components

**Payment Button in Proposal**
- "Pay Deposit" button after signing
- Stripe Checkout redirect
- Success/failure handling

**Payments Dashboard** (`/kustr/payments`)
- Outstanding balances
- Payment history
- Invoice management
- Manual payment recording

**Payment Status in Lead Detail**
- Visual payment progress
- Individual milestone status
- Quick link to send reminder

---

## Implementation Order

### Sprint 1: Foundation (Week 1-2)
1. Create all new database tables with migrations
2. Set up Stripe integration using Lovable tool
3. Implement basic payment collection flow
4. Add payment status to proposal page

### Sprint 2: Signatures (Week 3)
1. Build signature pad component
2. Create public proposal view
3. Implement PDF generation
4. Add audit logging

### Sprint 3: Scheduling (Week 4-5)
1. Connect Google Calendar via connector
2. Build availability management UI
3. Create public booking widget
4. Implement appointment reminders

### Sprint 4: Nurturing (Week 6-7)
1. Build nurturing sequence editor
2. Implement email templates with variables
3. Create scheduler function
4. Add analytics tracking

### Sprint 5: Integration & Polish (Week 8)
1. Connect all stages into unified flow
2. Add dashboard overview metrics
3. Test complete lead-to-client journey
4. Performance optimization

---

## Updated Lead Status Flow

```text
NEW ──────────────────────────────────────────────────────────────────────► LOST
  │                                                                           ▲
  │ [Kyle captures lead]                                                      │
  │ [Nurturing: Welcome sequence starts]                                      │
  ▼                                                                           │
QUALIFIED ────────────────────────────────────────────────────────────────────┤
  │                                                                           │
  │ [AI analyzes budget & requirements]                                       │
  │ [Nurturing: Qualification sequence]                                       │
  ▼                                                                           │
CONTACTED ────────────────────────────────────────────────────────────────────┤
  │                                                                           │
  │ [Appointment booked & completed]                                          │
  │ [Calendar: Demo scheduled]                                                │
  ▼                                                                           │
PROPOSAL_SENT ────────────────────────────────────────────────────────────────┤
  │                                                                           │
  │ [Proposal viewed & signed]                                                │
  │ [E-signature: Contract signed]                                            │
  ▼                                                                           │
CONVERTED ────────────────────────────────────────────────────────────────────┘
  │
  │ [Deposit paid via Stripe]
  │ [Payment: Deposit collected]
  ▼
[PROJECT EXECUTION PIPELINE]
```

---

## Technical Considerations

### Security
- All new tables will have RLS policies scoped to office_id
- Signature data encrypted at rest
- Payment webhooks validated with Stripe signature
- Audit logs for compliance

### Required API Keys
- **Stripe Secret Key**: For payment processing (will use Lovable's Stripe tool)
- **Google Calendar**: Via connector gateway (already available)
- **Resend**: Already configured for emails

### Performance
- Scheduler functions use background tasks
- PDF generation is async with storage
- Calendar queries cached for 5 minutes

---

## Files to Create/Modify

### New Edge Functions
- `supabase/functions/nurturing-scheduler/index.ts`
- `supabase/functions/nurturing-trigger/index.ts`
- `supabase/functions/scheduling-availability/index.ts`
- `supabase/functions/scheduling-book/index.ts`
- `supabase/functions/scheduling-reminders/index.ts`
- `supabase/functions/proposal-sign/index.ts`
- `supabase/functions/proposal-pdf/index.ts`
- `supabase/functions/payment-create-session/index.ts`
- `supabase/functions/payment-webhook/index.ts`
- `supabase/functions/payment-reminders/index.ts`

### New Frontend Pages
- `src/pages/kustr/Appointments.tsx`
- `src/pages/kustr/Payments.tsx`
- `src/pages/kustr/NurturingSettings.tsx`
- `src/pages/public/ProposalView.tsx`
- `src/pages/public/BookAppointment.tsx`

### New Components
- `src/components/kustr/SignaturePad.tsx`
- `src/components/kustr/CalendarBooking.tsx`
- `src/components/kustr/PaymentProgress.tsx`
- `src/components/kustr/NurturingSequenceEditor.tsx`
- `src/components/kustr/AppointmentCalendar.tsx`

### Modified Files
- `src/hooks/useLeads.ts` - Add nurturing status tracking
- `src/pages/kustr/LeadDetail.tsx` - Add appointments, payments sections
- `src/pages/kustr/Proposal.tsx` - Add signature and payment buttons
- `src/App.tsx` - Add new routes
- `supabase/config.toml` - Register new functions

---

## Success Metrics

After implementation, you'll be able to track:
- **Nurturing effectiveness**: Open rates, click rates, time-to-qualification
- **Scheduling efficiency**: Booking rate, no-show rate, time-to-appointment
- **Signature conversion**: View-to-sign rate, time-to-sign
- **Payment performance**: Collection rate, time-to-payment, outstanding balances
- **Overall funnel**: Lead-to-client conversion rate, average sales cycle length

