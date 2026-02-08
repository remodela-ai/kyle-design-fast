import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KITCHEN_INSPIRATIONS } from "@/types/inspiration";
import { useState } from "react";
import { Eye, X } from "lucide-react";

export default function Inspiration() {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const selected = selectedIdx !== null ? KITCHEN_INSPIRATIONS[selectedIdx] : null;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Kitchen Inspiration</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Explore stunning kitchen designs to spark your imagination
        </p>
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {KITCHEN_INSPIRATIONS.map((kitchen, idx) => (
          <Card
            key={kitchen.id}
            className={`cursor-pointer overflow-hidden group transition-all duration-200 hover:shadow-lg ${
              selectedIdx === idx ? "ring-2 ring-primary" : "border-border/50"
            }`}
            onClick={() => setSelectedIdx(selectedIdx === idx ? null : idx)}
          >
            <CardContent className="p-0">
              <div className="relative overflow-hidden">
                <img
                  src={kitchen.imageUrl}
                  alt={kitchen.title}
                  className="w-full h-52 object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <Badge className="bg-primary/80 text-primary-foreground text-[10px] mb-2">
                    {kitchen.style}
                  </Badge>
                  <h3 className="text-white font-semibold text-sm">{kitchen.title}</h3>
                </div>
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
                    <Eye className="w-4 h-4 text-foreground" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detail Panel */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6" onClick={() => setSelectedIdx(null)}>
          <div
            className="bg-card rounded-2xl overflow-hidden max-w-4xl w-full max-h-[90vh] shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              <div className="relative">
                <img
                  src={selected.imageUrl}
                  alt={selected.title}
                  className="w-full h-[300px] lg:h-full object-cover"
                />
              </div>
              <div className="p-6 lg:p-8 flex flex-col justify-center relative">
                <button
                  onClick={() => setSelectedIdx(null)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <Badge className="bg-primary/10 text-primary text-xs w-fit mb-3">
                  {selected.style}
                </Badge>
                <h3 className="text-xl font-bold mb-3">{selected.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-5">
                  {selected.description}
                </p>
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Key Features
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selected.highlights.map((h, i) => (
                      <span
                        key={i}
                        className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-medium"
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
