

# Skill Builder Redesign: Simple Voice-First Flow

## Current Problems
- The page has too many phases and states (conversation, analyzing, documentation, building, complete, error)
- The conversation + form hybrid is confusing
- Kyle's Computer terminal shows fake code snippets that don't correspond to anything real
- The "Done -- Build it" button only appears after 4 transcript lines, which is arbitrary

## New Flow (3 screens only)

```text
Screen 1: CONVERSATION
  - Kyle avatar centered, tap to start
  - Live transcript scrolls below
  - Kyle naturally wraps up after 3-5 exchanges
  - User taps "Let's build it" button (visible once conversation has content)

Screen 2: KYLE'S COMPUTER (building)
  - Transcript is sent to analyze-skill-transcript edge function
  - Documentation (bullets) appears at the top as a summary card
  - Below: Kyle's Computer terminal streams code + 4-step pipeline
  - Pipeline: Analyzing -> Coding -> Testing -> Deploying
  - No separate "documentation review" screen -- bullets are shown inline above the terminal

Screen 3: COMPLETE
  - Success message with the skill name
  - Bullet summary stays visible
  - "Build Another" button
```

## Technical Changes

### 1. Simplify page phases
Reduce from 6 phases to 3:
- `conversation` -- talking to Kyle
- `building` -- analyzing transcript + generating documentation + Kyle's Computer all in one
- `complete` -- done

### 2. Merge "analyzing" + "documentation" + "building" into one screen
When user clicks "Let's build it":
1. Stop conversation
2. Show Kyle's Computer immediately
3. First pipeline step ("Analyzing") calls `analyze-skill-transcript` to get bullets + prompt
4. Bullets appear in a card above the terminal as they're ready
5. Pipeline continues with Coding -> Testing -> Deploying (calls `createSkill`)
6. Transcript is collapsed at the bottom

### 3. Update `SkillBuilder.tsx`
- Remove `documentation` and `analyzing` as separate phases
- Single `handleBuildIt` function that:
  1. Stops voice
  2. Sets phase to `building`
  3. Calls analyze-skill-transcript (during "Analyzing" pipeline step)
  4. Sets the skillDoc state (bullets appear)
  5. Calls createSkill (starts Coding -> Testing -> Deploying)
  6. On complete, sets phase to `complete`
- Conversation screen: simpler layout, just avatar + transcript + "Let's build it" button
- Building screen: skill summary card (once ready) + Kyle's Computer terminal + pipeline

### 4. Voice hook -- no changes needed
`useSkillBuilderVoice.ts` already works correctly with the agent ID `agent_2801khy9cgzfehzr50j4bwnpejwj`.

### 5. Edge function -- no changes needed
`analyze-skill-transcript` already returns the right format.

### 6. `useCustomSkills` -- no changes needed
The existing `simulateGeneration` and `createSkill` flow works fine.

## Result
- Tap Kyle -> talk -> tap "Let's build it" -> watch Kyle's Computer -> done
- No manual form, no multi-step review, no separate documentation screen
- Bullets from transcript analysis appear naturally as part of the build process
- Maximum 2 clicks: start conversation + build it

