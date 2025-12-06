import { Button } from "@/components/ui/button";
import {
  Compass,
  Zap,
  HomeIcon,
  Lightbulb,
  Eye,
  ImageIcon,
  RefreshCw,
  Layers,
} from "lucide-react";

const features = [
  { icon: Compass, label: "AI Design", sublabel: "Journey" },
  { icon: Zap, label: "Blink", sublabel: "Design" },
  { icon: HomeIcon, label: "AI Room", sublabel: "Re-Imaginer" },
  { icon: Lightbulb, label: "AI", sublabel: "Inspiration" },
  { icon: Eye, label: "AI Real", sublabel: "Items Visualizer" },
  { icon: ImageIcon, label: "AI Image", sublabel: "Editor" },
  { icon: RefreshCw, label: "AI", sublabel: "Refunctionalize Space" },
  { icon: Layers, label: "AI", sublabel: "Staging" },
];

export function FeatureGrid() {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
        {features.map((feature) => (
          <Button
            key={feature.label + feature.sublabel}
            variant="feature"
            className="group"
          >
            <div className="w-12 h-12 rounded-full border border-primary/30 flex items-center justify-center group-hover:border-primary group-hover:bg-primary/10 transition-all duration-300">
              <feature.icon className="h-5 w-5 text-primary" />
            </div>
            <div className="text-center">
              <span className="text-xs font-medium text-foreground block">
                {feature.label}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {feature.sublabel}
              </span>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
}
