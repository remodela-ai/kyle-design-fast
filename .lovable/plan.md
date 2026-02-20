

## Problem

Kyle calls `update_skill_fields` and `advance_step` almost simultaneously because the tool returns instantly. The LLM doesn't truly "wait" -- it fires both tools in quick succession and keeps talking. The typewriter animation runs in the background but Kyle has already moved on.

## Root Cause

The `update_skill_fields` client tool returns a synchronous string immediately. Even though the return message says "wait for animation," the ElevenLabs agent treats the tool call as complete and proceeds to call `advance_step` and speak the transition line right away.

## Solution: Async Client Tool with Built-in Delay

Make `update_skill_fields` an **async function** that returns a Promise resolving only after the typewriter animation completes. ElevenLabs agents natively support async client tools -- when "Wait for response" is enabled in the ElevenLabs tool config, the agent pauses all speech until the Promise resolves.

Additionally, merge `advance_step` into the resolution of `update_skill_fields` so there's a single, atomic operation: fill form, wait for animation, advance step, then let Kyle speak.

### Sequence

```text
User describes role
      |
Kyle calls update_skill_fields({name, role})
      |
[Agent PAUSES - waiting for async response]
      |
Typewriter animation plays on screen (~2-4 seconds)
      |
Animation completes -> step advances -> UI glows
      |
Promise resolves with "Step advanced. Say your transition."
      |
[Agent RESUMES speaking]
      |
Kyle says "Great, now let's add the knowledge base..."
```

## Technical Changes

### 1. `src/hooks/useSkillBuilderVoice.ts`

- **Make `update_skill_fields` async**: Return a `Promise<string>` that resolves only when `onFieldsUpdate` signals completion via a callback.
- **Remove `advance_step` as a separate tool**: Merge step advancement into the resolution of `update_skill_fields`. After animation completes, auto-advance and return the combined response.
- **Add completion callback pattern**: The `onFieldsUpdate` callback receives a `done()` function. The parent component calls `done()` when all typewriter animations for that step finish.
- **Update the system prompt**: Simplify instructions since the agent now only needs to call one tool (`update_skill_fields`), and the sequencing is enforced by code.

### 2. `src/pages/SkillBuilder.tsx`

- **Update `handleVoiceFieldsUpdate`**: Accept a `done` callback parameter. Track active typewriter animations and call `done()` only when all animations for the current batch complete.
- **Wire up `onComplete` in `typeText`**: Each typewriter call tracks completion. When all fields in a batch finish typing, trigger step advance + glow, then call `done()`.

### 3. ElevenLabs Dashboard (Manual Step)

- Ensure the `update_skill_fields` tool has **"Wait for response"** enabled in the ElevenLabs agent configuration UI. Without this, the agent won't actually pause while waiting for the Promise.

## Key Benefits

- Sequencing is enforced by code (async/await), not by hoping the LLM follows instructions
- Single tool call instead of two removes the race condition entirely
- Typewriter animation gets full visual time before Kyle speaks again
- Step unlock glow happens at exactly the right moment

