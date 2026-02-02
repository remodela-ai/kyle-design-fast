
# Plan: Design Iteration Review System

## Executive Summary (CTO Vision)

This feature introduces a critical quality control step in the design workflow. Instead of immediately launching the 16-stage pipeline after image generation, designers will have full visibility and control over the AI-extracted insights before committing to the full pipeline execution.

**Business Value:**
- Reduces wasted pipeline runs on incorrect interpretations
- Empowers designers to refine and iterate until satisfied
- Increases final output quality through human-in-the-loop validation
- Unlimited iterations at the insight extraction stage (cheap) vs. re-running 16 agents (expensive)

---

## Current Flow vs. Proposed Flow

```text
CURRENT FLOW:
Conversation -> Generate Image -> "I want my free project" -> Pipeline (16 steps)

PROPOSED FLOW:
Conversation -> Generate Image -> "I want my free project" -> 
  -> DESIGN REVIEW PAGE (NEW) -> [Iterate] or [Approve] -> 
    -> If Iterate: Refine with Kyle -> New insights
    -> If Approve: Pipeline (16 steps)
```

---

## Architecture Design

### New Page: Design Review (`/design-review`)

A dedicated intermediate page between image generation and pipeline execution.

**Components:**
1. **Transcript Panel** - Full conversation history (scrollable)
2. **Insights Panel** - Extracted design insights from Gemini
3. **Preview Image** - The generated design image
4. **Refinement Interface** - Talk to Kyle or edit text
5. **Action Buttons** - "Iterate Design" | "Approve & Run Pipeline"

### Data Flow

```text
                          +------------------+
                          |   KyleContext    |
                          |   (messages,     |
                          |   designSummary) |
                          +--------+---------+
                                   |
                                   v
+----------+    +--------+    +------------+    +--------------+
|  Shazam  |--->| blink- |--->|  Design    |--->|   360 Free   |
|  or Blink|    | design |    |  Review    |    |   Project    |
|  Design  |    | (Gemini|    |  Page      |    |  (Pipeline)  |
+----------+    | + Flux)|    +-----+------+    +--------------+
                +--------+          |
                                    | iterate
                                    v
                          +------------------+
                          |  Kyle Refinement |
                          |  (voice or text) |
                          +------------------+
```

---

## Technical Implementation

### 1. New Page: `src/pages/DesignReview.tsx`

**Props via navigation state:**
- `designImageUrl` - Generated image
- `transcript` - Full conversation (messages array or PDF text)
- `extractedInsights` - Gemini-optimized prompt
- `referenceImage` - Optional reference image

**State Management:**
```typescript
interface DesignReviewState {
  // From navigation
  designImageUrl: string;
  transcript: string;
  extractedInsights: string;
  referenceImage?: string;
  
  // Iteration state
  iterationCount: number;
  isRefining: boolean;
  refinementMessages: ConversationMessage[];
  currentInsights: string;
}
```

**UI Layout:**
```text
+--------------------------------------------------+
|  [Home]            Design Review         [Theme]  |
+--------------------------------------------------+
|                                                   |
|  +-------------------+  +----------------------+  |
|  |   TRANSCRIPT      |  |   DESIGN PREVIEW     |  |
|  |   (scrollable)    |  |   +------------+     |  |
|  |   Kyle: ...       |  |   |            |     |  |
|  |   Client: ...     |  |   |   IMAGE    |     |  |
|  |   Kyle: ...       |  |   |            |     |  |
|  |   Client: ...     |  |   +------------+     |  |
|  +-------------------+  +----------------------+  |
|                                                   |
|  +----------------------------------------------+ |
|  |              EXTRACTED INSIGHTS              | |
|  |  "A modern minimalist living room with..."   | |
|  |                                              | |
|  |  [Edit Insights]                             | |
|  +----------------------------------------------+ |
|                                                   |
|  +----------------------------------------------+ |
|  |            REFINEMENT SECTION                | |
|  |  [Kyle Avatar]   "Add more detail about..."  | |
|  |  [Text Input] or [Talk to Kyle]              | |
|  +----------------------------------------------+ |
|                                                   |
|  +-------------------+  +----------------------+  |
|  | ITERATE DESIGN    |  | APPROVE & RUN        |  |
|  | (regenerate)      |  | PIPELINE             |  |
|  +-------------------+  +----------------------+  |
|                                                   |
|  Iteration: 1/unlimited                           |
+--------------------------------------------------+
```

### 2. Modify Navigation Flow

**From Shazam.tsx and BlinkDesign.tsx:**
```typescript
// BEFORE
navigate("/360-free-project", { 
  state: { designImageUrl, conversationSummary } 
})

// AFTER
navigate("/design-review", { 
  state: { 
    designImageUrl,
    transcript: originalSourceText,
    extractedInsights: optimizedPrompt,
    referenceImage 
  } 
})
```

### 3. New Edge Function: `refine-design-insights`

**Purpose:** Re-extract insights with refinement context

**Input:**
```typescript
{
  originalTranscript: string;
  refinementNotes: string;  // New instructions from designer
  previousInsights: string; // What was extracted before
}
```

**Output:**
```typescript
{
  refinedInsights: string;  // Updated prompt
  changesSummary: string;   // What changed
}
```

### 4. Iteration Workflow

```text
User clicks "Iterate Design":
  1. Open refinement panel
  2. User can:
     a) Talk to Kyle (voice) with additional details
     b) Type refinement notes
     c) Directly edit the insights text
  3. Call refine-design-insights with context
  4. Regenerate image with blink-design
  5. Update preview and insights
  6. Increment iteration counter
  7. Repeat until satisfied

User clicks "Approve & Run Pipeline":
  1. Navigate to /360-free-project
  2. Pass all refined data
  3. Pipeline starts automatically
```

### 5. Files to Create/Modify

**New Files:**
- `src/pages/DesignReview.tsx` - Main review page
- `src/components/TranscriptViewer.tsx` - Scrollable transcript display
- `src/components/InsightsEditor.tsx` - Editable insights panel
- `src/components/RefinementPanel.tsx` - Kyle integration for refinement
- `supabase/functions/refine-design-insights/index.ts` - LLM refinement

**Modified Files:**
- `src/pages/Shazam.tsx` - Update navigation target
- `src/pages/BlinkDesign.tsx` - Update navigation target
- `src/App.tsx` - Add new route
- `supabase/config.toml` - Add new function

---

## UI/UX Considerations

### Visual Design Principles
- Clean, professional interface suitable for interior designers
- Minimal distractions during review
- Clear visual hierarchy: Image > Insights > Transcript
- Prominent action buttons with clear intent

### Iteration Feedback
- Show iteration count (but no limit)
- Visual diff or "what changed" indicator after refinement
- Toast notifications for successful refinements
- Loading states during regeneration

### Mobile Responsiveness
- Stack panels vertically on mobile
- Collapsible transcript section
- Full-width action buttons

---

## Edge Cases & Error Handling

1. **Empty transcript** - Show placeholder, allow manual insight entry
2. **Gemini extraction failure** - Fallback to simple prompt, allow editing
3. **Image generation failure** - Retry button, maintain insights
4. **Session timeout** - Persist state in localStorage
5. **Navigation without required data** - Redirect to Shazam

---

## Implementation Phases

**Phase 1: Core Review Page**
- Create DesignReview.tsx with basic layout
- Display transcript, image, and insights (read-only)
- Approve button navigates to pipeline

**Phase 2: Insight Editing**
- Make insights editable
- Regenerate image with edited insights
- Iteration counter

**Phase 3: Kyle Integration**
- Add voice refinement with Kyle
- Refinement edge function
- Context-aware re-extraction

**Phase 4: Polish**
- Visual diff for changes
- Session persistence
- Error handling
- Mobile optimization

---

## Database Considerations

No new tables required for MVP. For future analytics:
- Track iteration counts per session
- Store refinement history for ML improvement
- Log time spent in review vs. pipeline

---

## Success Metrics

- **Iteration rate:** Average iterations before approval
- **Pipeline success rate:** Fewer failed/restarted pipelines
- **Time to approval:** How long designers spend refining
- **Satisfaction:** Qualitative feedback on output quality

---

## Estimated Effort

| Component | Complexity | Estimated Lines |
|-----------|------------|-----------------|
| DesignReview.tsx | Medium | ~400 |
| TranscriptViewer.tsx | Low | ~80 |
| InsightsEditor.tsx | Low | ~100 |
| RefinementPanel.tsx | Medium | ~150 |
| refine-design-insights | Medium | ~120 |
| Navigation updates | Low | ~20 |
| Route setup | Low | ~10 |

**Total:** ~880 lines of new/modified code
