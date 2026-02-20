# Kyle Voice Agent UI Consistency Rules

## Avatar: Always use `<KyleAvatar />`
Every voice agent interface in the app MUST use the `KyleAvatar` component (`src/components/KyleAvatar.tsx`). Never use plain buttons, icons, or custom mic buttons as a substitute.

### Required props pattern:
```tsx
<KyleAvatar 
  size="lg"  // sm | md | lg | xl | xxl — use "lg" as default
  onClickOverride={toggleFunction}
  isConnectedOverride={isConnected}
  isSpeakingOverride={isSpeaking}
/>
```

### Layout pattern:
- Kyle avatar is always **centered** above or within the content area
- Below the avatar: `AudioWaves` component for visual feedback when connected
- Below waves: status text ("Kyle is speaking..." / "Kyle is listening...")
- Below status: transcript area (if applicable)
- Below transcript: "End conversation" ghost button

### Sizing consistency:
- **Full-page hero** (Shazam, landings): `size="xxl"` (w-64 h-64)
- **Primary interaction** (voice agents, builders): `size="lg"` (w-36 h-36)  
- **Secondary/inline** (review panels, cards): `size="md"` (w-24 h-24)
- **Compact/sidebar**: `size="sm"` (w-16 h-16)

### Never do:
- ❌ Plain `<Button>` with `<Mic />` icon as Kyle's voice trigger
- ❌ Custom avatar implementations with `<img src={kyleAvatar} />`
- ❌ Different glow colors or ring styles than what KyleAvatar provides
- ❌ Positioning Kyle differently across pages (always centered in its section)

### AudioWaves companion:
Always pair KyleAvatar with `<AudioWaves />` when voice is active:
```tsx
<AudioWaves isActive={true} isSpeaking={isSpeaking} barCount={5} className="h-6" />
```
