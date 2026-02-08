export interface CatalogItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  brand: string;
  material?: string;
  color?: string;
  style?: string;
}

export interface CatalogCategory {
  id: string;
  label: string;
  icon: string;
  segmentLabel: string;
  items: CatalogItem[];
}

export const KITCHEN_CATEGORIES: CatalogCategory[] = [
  {
    id: "top_cabinet",
    label: "Upper Cabinets",
    icon: "LayoutGrid",
    segmentLabel: "upper cabinet",
    items: [
      { id: "tc-1", name: "Shaker White Upper Cabinet", description: "Classic shaker-style upper cabinet in crisp white finish. Soft-close hinges, adjustable shelves, solid maple frame.", price: 489, imageUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&h=200&fit=crop", brand: "KraftMaid", material: "Maple", color: "White", style: "Shaker" },
      { id: "tc-2", name: "Modern Flat Panel Espresso", description: "Sleek flat-panel upper cabinet in rich espresso tone. European-style concealed hinges, full overlay door.", price: 549, imageUrl: "https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=200&h=200&fit=crop", brand: "IKEA", material: "MDF", color: "Espresso", style: "Modern" },
      { id: "tc-3", name: "Rustic Oak Open Shelf", description: "Open-shelf upper cabinet in natural oak with visible grain. Floating shelf design, industrial brackets.", price: 329, imageUrl: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=200&h=200&fit=crop", brand: "Restoration Hardware", material: "Oak", color: "Natural", style: "Rustic" },
      { id: "tc-4", name: "Glass Front Navy Cabinet", description: "Elegant glass-front upper cabinet in navy blue. Tempered glass panels, brass hardware, interior lighting.", price: 679, imageUrl: "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=200&h=200&fit=crop", brand: "Thomasville", material: "Birch", color: "Navy", style: "Transitional" },
    ],
  },
  {
    id: "bottom_cabinet",
    label: "Base Cabinets",
    icon: "Square",
    segmentLabel: "lower cabinet",
    items: [
      { id: "bc-1", name: "Shaker White Base Cabinet", description: "Matching shaker-style base cabinet with full-extension drawers. Dovetail construction, soft-close slides.", price: 599, imageUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&h=200&fit=crop", brand: "KraftMaid", material: "Maple", color: "White", style: "Shaker" },
      { id: "bc-2", name: "Modern Handleless Charcoal", description: "Push-to-open handleless base cabinet in charcoal matte. Internal organizers, pull-out waste bin.", price: 729, imageUrl: "https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=200&h=200&fit=crop", brand: "Nobilia", material: "Laminate", color: "Charcoal", style: "Modern" },
      { id: "bc-3", name: "Farmhouse Sage Green Base", description: "Country farmhouse base cabinet in sage green. Beadboard panels, cup-pull hardware, adjustable shelves.", price: 519, imageUrl: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=200&h=200&fit=crop", brand: "Merillat", material: "Maple", color: "Sage Green", style: "Farmhouse" },
      { id: "bc-4", name: "Industrial Metal Base Unit", description: "Open metal-frame base cabinet with reclaimed wood shelves. Powder-coated steel, adjustable feet.", price: 449, imageUrl: "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=200&h=200&fit=crop", brand: "Restoration Hardware", material: "Steel/Wood", color: "Black/Natural", style: "Industrial" },
    ],
  },
  {
    id: "countertop",
    label: "Countertops",
    icon: "Minus",
    segmentLabel: "countertop",
    items: [
      { id: "ct-1", name: "Calacatta Quartz Countertop", description: "Luxurious Calacatta-inspired quartz with dramatic veining. Non-porous, stain-resistant, heat-tolerant surface.", price: 3200, imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=200&h=200&fit=crop", brand: "Caesarstone", material: "Quartz", color: "White/Gold Veins", style: "Luxury" },
      { id: "ct-2", name: "Black Granite Countertop", description: "Absolute black granite with polished finish. Natural stone durability, each slab uniquely patterned.", price: 2800, imageUrl: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=200&h=200&fit=crop", brand: "MSI", material: "Granite", color: "Black", style: "Classic" },
      { id: "ct-3", name: "Butcher Block Walnut", description: "Warm walnut butcher block countertop. Edge-grain construction, food-safe mineral oil finish.", price: 1800, imageUrl: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=200&h=200&fit=crop", brand: "John Boos", material: "Walnut", color: "Natural Walnut", style: "Rustic" },
      { id: "ct-4", name: "White Marble Countertop", description: "Timeless Carrara marble countertop with subtle grey veining. Honed finish for a matte, sophisticated look.", price: 4500, imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=200&h=200&fit=crop", brand: "Daltile", material: "Marble", color: "White/Grey", style: "Luxury" },
    ],
  },
  {
    id: "backsplash",
    label: "Backsplash",
    icon: "Grid3x3",
    segmentLabel: "backsplash",
    items: [
      { id: "bs-1", name: "Subway Tile White Gloss", description: "Classic 3x6 subway tile in glossy white. Timeless design, easy to clean, beveled edges.", price: 890, imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=200&h=200&fit=crop", brand: "Daltile", material: "Ceramic", color: "White", style: "Classic" },
      { id: "bs-2", name: "Herringbone Marble Mosaic", description: "Elegant herringbone pattern in Carrara marble. Natural stone mosaic, polished finish.", price: 1650, imageUrl: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=200&h=200&fit=crop", brand: "MSI", material: "Marble", color: "White/Grey", style: "Luxury" },
      { id: "bs-3", name: "Zellige Terracotta Tile", description: "Handmade Moroccan zellige tiles in warm terracotta. Each tile uniquely glazed, artisanal character.", price: 1200, imageUrl: "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=200&h=200&fit=crop", brand: "Cle Tile", material: "Zellige", color: "Terracotta", style: "Artisan" },
      { id: "bs-4", name: "Glass Mosaic Ocean Blue", description: "Shimmering glass mosaic tiles in ocean blue gradient. Reflective surface, modern aesthetic.", price: 980, imageUrl: "https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=200&h=200&fit=crop", brand: "Oceanside Glass", material: "Glass", color: "Ocean Blue", style: "Modern" },
    ],
  },
  {
    id: "hood",
    label: "Range Hood",
    icon: "Wind",
    segmentLabel: "range hood",
    items: [
      { id: "hd-1", name: "Stainless Steel Wall Mount Hood", description: "Professional-grade wall-mount range hood. 900 CFM, LED lighting, 4-speed fan, dishwasher-safe filters.", price: 1299, imageUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&h=200&fit=crop", brand: "Broan", material: "Stainless Steel", color: "Silver", style: "Professional" },
      { id: "hd-2", name: "Copper Canopy Hood", description: "Hand-hammered copper canopy hood. Artisan craftsmanship, patina finish, 600 CFM blower.", price: 2899, imageUrl: "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=200&h=200&fit=crop", brand: "Custom", material: "Copper", color: "Copper", style: "Rustic" },
      { id: "hd-3", name: "Minimalist Glass Hood", description: "Ultra-slim glass and steel range hood. Touch controls, perimeter extraction, quiet operation.", price: 1599, imageUrl: "https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=200&h=200&fit=crop", brand: "Elica", material: "Glass/Steel", color: "Black/Clear", style: "Modern" },
    ],
  },
  {
    id: "range",
    label: "Range / Stove",
    icon: "Flame",
    segmentLabel: "stove",
    items: [
      { id: "rg-1", name: "Frigidaire 30\" Electric Range", description: "Freestanding 30-inch electric smoothtop range in white. 5.3 cu. ft. oven capacity, self-clean.", price: 749, imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031994188/KyTbCvjySvyLPPcd.png", brand: "Frigidaire", material: "Stainless Steel/Ceramic", color: "White", style: "Classic" },
      { id: "rg-2", name: "LG 30\" Gas Range", description: "Freestanding 30-inch gas range with 5 sealed burners and 5.4 cu. ft. convection oven.", price: 1299, imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031994188/wGslBadLevnjceWp.png", brand: "LG", material: "Stainless Steel", color: "Stainless Steel", style: "Modern" },
      { id: "rg-3", name: "LG 30\" Double Oven Slide-In", description: "30-inch slide-in electric double oven range. ProBake Convection in both ovens.", price: 2499, imageUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310419663031994188/ZiWnomspdCAASsSy.png", brand: "LG", material: "Stainless Steel/Glass", color: "Stainless Steel", style: "Professional" },
    ],
  },
  {
    id: "sink",
    label: "Sink",
    icon: "Droplets",
    segmentLabel: "sink",
    items: [
      { id: "sk-1", name: "Farmhouse Apron Sink", description: "Single-bowl fireclay farmhouse sink. Reversible design, stain and scratch resistant, 33\" wide.", price: 1099, imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=200&h=200&fit=crop", brand: "Kohler", material: "Fireclay", color: "White", style: "Farmhouse" },
      { id: "sk-2", name: "Undermount Double Bowl SS", description: "Double-bowl undermount sink in 16-gauge stainless steel. Sound-dampening pads.", price: 699, imageUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&h=200&fit=crop", brand: "Kraus", material: "Stainless Steel", color: "Silver", style: "Modern" },
      { id: "sk-3", name: "Granite Composite Single Bowl", description: "Large single-bowl granite composite sink. Heat resistant, non-porous, ultra-quiet.", price: 849, imageUrl: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=200&h=200&fit=crop", brand: "Blanco", material: "Granite Composite", color: "Anthracite", style: "Contemporary" },
    ],
  },
  {
    id: "faucet",
    label: "Faucet",
    icon: "Droplet",
    segmentLabel: "faucet",
    items: [
      { id: "fc-1", name: "Pull-Down Kitchen Faucet", description: "Single-handle pull-down faucet with magnetic docking. Spot-resistant stainless finish.", price: 349, imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=200&h=200&fit=crop", brand: "Moen", material: "Stainless Steel", color: "Spot Resist SS", style: "Modern" },
      { id: "fc-2", name: "Bridge Faucet Brass", description: "Traditional bridge faucet in unlacquered brass. Cross handles, side sprayer, vintage charm.", price: 589, imageUrl: "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=200&h=200&fit=crop", brand: "Newport Brass", material: "Brass", color: "Unlacquered Brass", style: "Traditional" },
      { id: "fc-3", name: "Touchless Matte Black Faucet", description: "Motion-sensor activated faucet in matte black. Hands-free operation, temperature memory.", price: 479, imageUrl: "https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=200&h=200&fit=crop", brand: "Delta", material: "Steel", color: "Matte Black", style: "Contemporary" },
    ],
  },
  {
    id: "flooring",
    label: "Flooring",
    icon: "Layers",
    segmentLabel: "floor",
    items: [
      { id: "fl-1", name: "White Oak Hardwood", description: "Wide-plank white oak hardwood flooring. Wire-brushed texture, UV-cured matte finish.", price: 3500, imageUrl: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=200&h=200&fit=crop", brand: "Carlisle", material: "White Oak", color: "Natural", style: "Classic" },
      { id: "fl-2", name: "Porcelain Wood-Look Tile", description: "Large-format porcelain tile with realistic wood grain. Waterproof, scratch-resistant.", price: 2400, imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=200&h=200&fit=crop", brand: "Marazzi", material: "Porcelain", color: "Warm Walnut", style: "Transitional" },
      { id: "fl-3", name: "Encaustic Cement Tile", description: "Handmade encaustic cement tiles in geometric pattern. Mediterranean-inspired.", price: 4200, imageUrl: "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=200&h=200&fit=crop", brand: "Granada Tile", material: "Cement", color: "Black/White Pattern", style: "Artisan" },
    ],
  },
  {
    id: "lighting",
    label: "Pendant Lighting",
    icon: "Lightbulb",
    segmentLabel: "pendant light",
    items: [
      { id: "lt-1", name: "Industrial Pendant Trio", description: "Set of 3 industrial pendant lights with exposed Edison bulbs. Matte black metal shades.", price: 389, imageUrl: "https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=200&h=200&fit=crop", brand: "West Elm", material: "Metal", color: "Matte Black", style: "Industrial" },
      { id: "lt-2", name: "Glass Globe Pendant Set", description: "Set of 3 clear glass globe pendants. Brass fittings, hand-blown glass.", price: 549, imageUrl: "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=200&h=200&fit=crop", brand: "Schoolhouse", material: "Glass/Brass", color: "Clear/Brass", style: "Modern" },
    ],
  },
  {
    id: "refrigerator",
    label: "Refrigerator",
    icon: "Refrigerator",
    segmentLabel: "refrigerator",
    items: [
      { id: "rf-1", name: "French Door Refrigerator 36\"", description: "Counter-depth French door refrigerator. Internal water dispenser, FlexZone drawer.", price: 3299, imageUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&h=200&fit=crop", brand: "Samsung", material: "Stainless Steel", color: "Silver", style: "Modern" },
      { id: "rf-2", name: "Panel-Ready Built-In Fridge", description: "Fully integrated built-in refrigerator. Accepts custom cabinet panels, dual compressor.", price: 5999, imageUrl: "https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=200&h=200&fit=crop", brand: "Sub-Zero", material: "Custom Panel", color: "Panel Ready", style: "Luxury" },
    ],
  },
  {
    id: "walls",
    label: "Wall Color",
    icon: "PaintBucket",
    segmentLabel: "wall",
    items: [
      { id: "wl-1", name: "Simply White Paint", description: "Clean, bright white with warm undertones. Perfect for reflecting light in kitchens.", price: 280, imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=200&h=200&fit=crop", brand: "Benjamin Moore", material: "Paint", color: "Simply White OC-117", style: "Classic" },
      { id: "wl-2", name: "Hale Navy Paint", description: "Deep, sophisticated navy blue. Creates dramatic contrast with white cabinetry.", price: 280, imageUrl: "https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=200&h=200&fit=crop", brand: "Benjamin Moore", material: "Paint", color: "Hale Navy HC-154", style: "Bold" },
      { id: "wl-3", name: "Agreeable Gray Paint", description: "Warm greige that works with any style. Versatile neutral, eggshell finish.", price: 240, imageUrl: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=200&h=200&fit=crop", brand: "Sherwin-Williams", material: "Paint", color: "Agreeable Gray SW 7029", style: "Neutral" },
    ],
  },
];

export const SEGMENT_LABELS = KITCHEN_CATEGORIES.map(c => c.segmentLabel);

export function getCategoryById(id: string): CatalogCategory | undefined {
  return KITCHEN_CATEGORIES.find(c => c.id === id);
}

export function getCatalogItemById(categoryId: string, itemId: string): CatalogItem | undefined {
  const cat = getCategoryById(categoryId);
  return cat?.items.find(i => i.id === itemId);
}
