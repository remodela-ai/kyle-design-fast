/**
 * Maps detection labels to catalog category IDs.
 */
export const LABEL_TO_CATEGORY: Record<string, string> = {
  "upper cabinets": "top_cabinet",
  "base cabinets": "bottom_cabinet",
  "countertops": "countertop",
  "countertop": "countertop",
  "backsplash": "backsplash",
  "range hood": "hood",
  "range": "range",
  "stove": "range",
  "sink": "sink",
  "faucet": "faucet",
  "flooring": "flooring",
  "floor": "flooring",
  "pendant lighting": "lighting",
  "pendant light": "lighting",
  "pendant": "lighting",
  "lighting": "lighting",
  "refrigerator": "refrigerator",
  "fridge": "refrigerator",
  "wall color": "wall_color",
  "wall": "wall_color",
  "dishwasher": "dishwasher",
  "microwave": "microwave",
  "upper cabinet": "top_cabinet",
  "lower cabinet": "bottom_cabinet",
  "cabinet": "top_cabinet",
  "kitchen cabinet": "top_cabinet",
  "base cabinet": "bottom_cabinet",
  "counter": "countertop",
  "hood": "hood",
  "oven": "range",
  "cooktop": "range",
  "kitchen sink": "sink",
  "tap": "faucet",
};

export function labelToCategoryId(label: string): string | null {
  const normalized = label.toLowerCase().trim();
  if (LABEL_TO_CATEGORY[normalized]) {
    return LABEL_TO_CATEGORY[normalized];
  }
  for (const [key, catId] of Object.entries(LABEL_TO_CATEGORY)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return catId;
    }
  }
  return null;
}
