import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RoomDimensions {
  width: number;  // feet
  height: number; // feet
  depth: number;  // feet
}

interface DesignFeeRequest {
  project_type: 'kitchen' | 'bathroom' | 'bedroom' | 'living_room' | 'dining_room' | 'office';
  room_dimensions: RoomDimensions;
  style_complexity: 'simple' | 'moderate' | 'luxury';
  includes_appliances: boolean;
  includes_custom_furniture: boolean;
}

interface Adjustment {
  name: string;
  amount: number;
  description: string;
}

interface PaymentMilestone {
  name: string;
  percentage: number;
  amount: number;
}

interface DesignFeeResponse {
  base_fee: number;
  adjustments: Adjustment[];
  total_fee: number;
  payment_schedule: PaymentMilestone[];
  breakdown: {
    project_type: string;
    square_footage: number;
    complexity_multiplier: number;
  };
}

// Base fees by project type
const BASE_FEES: Record<string, number> = {
  kitchen: 5000,
  bathroom: 3000,
  bedroom: 2500,
  living_room: 4000,
  dining_room: 3500,
  office: 3000,
};

// Complexity multipliers
const COMPLEXITY_MULTIPLIERS: Record<string, number> = {
  simple: 1.0,
  moderate: 1.3,
  luxury: 1.8,
};

// Add-on costs
const APPLIANCES_ADDON = 1500;
const CUSTOM_FURNITURE_ADDON = 2000;

// Size rate: per 100 sqft
const SIZE_RATE_PER_100_SQFT = 500;

function calculateDesignFee(request: DesignFeeRequest): DesignFeeResponse {
  const { project_type, room_dimensions, style_complexity, includes_appliances, includes_custom_furniture } = request;
  
  // Calculate square footage (width * depth)
  const squareFootage = room_dimensions.width * room_dimensions.depth;
  
  // Get base fee for project type
  const baseFee = BASE_FEES[project_type] || 3000;
  
  // Get complexity multiplier
  const complexityMultiplier = COMPLEXITY_MULTIPLIERS[style_complexity] || 1.0;
  
  // Calculate size adjustment
  const sizeAdjustment = (squareFootage / 100) * SIZE_RATE_PER_100_SQFT;
  
  // Build adjustments array
  const adjustments: Adjustment[] = [];
  
  // Size adjustment
  adjustments.push({
    name: 'Size Adjustment',
    amount: sizeAdjustment,
    description: `${squareFootage} sq ft at $${SIZE_RATE_PER_100_SQFT}/100 sq ft`,
  });
  
  // Complexity adjustment (if not simple)
  if (complexityMultiplier !== 1.0) {
    const complexityIncrease = baseFee * (complexityMultiplier - 1);
    adjustments.push({
      name: 'Complexity Premium',
      amount: complexityIncrease,
      description: `${style_complexity} style (${complexityMultiplier}x multiplier)`,
    });
  }
  
  // Appliances add-on
  if (includes_appliances) {
    adjustments.push({
      name: 'Appliance Selection',
      amount: APPLIANCES_ADDON,
      description: 'Appliance sourcing and specification',
    });
  }
  
  // Custom furniture add-on
  if (includes_custom_furniture) {
    adjustments.push({
      name: 'Custom Furniture',
      amount: CUSTOM_FURNITURE_ADDON,
      description: 'Custom furniture design and sourcing',
    });
  }
  
  // Calculate total
  const adjustedBaseFee = baseFee * complexityMultiplier;
  const totalAdjustments = sizeAdjustment + 
    (includes_appliances ? APPLIANCES_ADDON : 0) + 
    (includes_custom_furniture ? CUSTOM_FURNITURE_ADDON : 0);
  const totalFee = adjustedBaseFee + totalAdjustments;
  
  // Round to nearest dollar
  const roundedTotal = Math.round(totalFee);
  
  // Calculate payment schedule
  const paymentSchedule: PaymentMilestone[] = [
    {
      name: 'Deposit',
      percentage: 50,
      amount: Math.round(roundedTotal * 0.50),
    },
    {
      name: 'Design Milestone',
      percentage: 25,
      amount: Math.round(roundedTotal * 0.25),
    },
    {
      name: 'Final Delivery',
      percentage: 25,
      amount: Math.round(roundedTotal * 0.25),
    },
  ];
  
  return {
    base_fee: baseFee,
    adjustments,
    total_fee: roundedTotal,
    payment_schedule: paymentSchedule,
    breakdown: {
      project_type,
      square_footage: squareFootage,
      complexity_multiplier: complexityMultiplier,
    },
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json() as DesignFeeRequest;
    
    console.log('Calculating design fee for:', JSON.stringify(body));
    
    // Validate required fields
    if (!body.project_type) {
      throw new Error('project_type is required');
    }
    if (!body.room_dimensions || typeof body.room_dimensions.width !== 'number') {
      throw new Error('room_dimensions with width, height, and depth (in feet) is required');
    }
    if (!body.style_complexity) {
      throw new Error('style_complexity is required (simple, moderate, or luxury)');
    }
    
    // Set defaults for booleans
    const request: DesignFeeRequest = {
      project_type: body.project_type,
      room_dimensions: body.room_dimensions,
      style_complexity: body.style_complexity,
      includes_appliances: body.includes_appliances ?? false,
      includes_custom_furniture: body.includes_custom_furniture ?? false,
    };
    
    const result = calculateDesignFee(request);
    
    console.log('Fee calculation result:', JSON.stringify(result));
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error calculating design fee:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to calculate design fee';
    
    return new Response(JSON.stringify({ 
      error: errorMessage
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
