/**
 * Standard kitchen element dimensions (in centimeters).
 * Used as reference anchors for LLM dimension estimation.
 */
export const STANDARD_DIMENSIONS = {
  countertop_height: 91,
  countertop_depth: 60,
  base_cabinet_height: 87,
  base_cabinet_depth: 60,
  upper_cabinet_height: 76,
  upper_cabinet_depth: 30,
  upper_cabinet_gap: 46,
  range_width: 76,
  range_height: 91,
  range_depth: 65,
  refrigerator_height: 175,
  refrigerator_width: 91,
  refrigerator_depth: 76,
  sink_width: 84,
  sink_depth: 56,
  dishwasher_width: 60,
  ceiling_height: 244,
  backsplash_height: 46,
  hood_width: 76,
  hood_height: 46,
  hood_depth: 50,
} as const;

/**
 * A 3D element in the kitchen scene.
 */
export interface KitchenElement3D {
  id: string;
  label: string;
  categoryId: string;
  /** Position in cm from origin (bottom-left-back corner of room) */
  position: { x: number; y: number; z: number };
  /** Dimensions in cm */
  dimensions: { width: number; height: number; depth: number };
  /** Color for 3D rendering */
  color: string;
}

/**
 * The room shell dimensions.
 */
export interface RoomDimensions {
  width: number;
  height: number;
  depth: number;
}

/**
 * Complete 3D kitchen layout estimated by LLM.
 */
export interface KitchenLayout3D {
  room: RoomDimensions;
  elements: KitchenElement3D[];
  confidence: "high" | "medium" | "low";
  notes: string;
}

/**
 * Color palette for 3D elements by category.
 */
export const ELEMENT_3D_COLORS: Record<string, string> = {
  top_cabinet: "#8B7355",
  bottom_cabinet: "#A0926B",
  countertop: "#D4D4D4",
  backsplash: "#E8E0D0",
  hood: "#C0C0C0",
  range: "#404040",
  sink: "#B8B8B8",
  faucet: "#A8A8A8",
  flooring: "#C4A882",
  lighting: "#FFD700",
  refrigerator: "#606060",
  dishwasher: "#808080",
  microwave: "#505050",
  wall_color: "#F5F0E8",
};
