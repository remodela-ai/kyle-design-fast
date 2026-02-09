import { useState } from "react";
import { cn } from "@/lib/utils";
import { ExternalLink, Download, ZoomIn } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Deliverable {
  stepNumber: number;
  stepName: string;
  visualOutcomeUrl?: string;
  output?: Record<string, unknown>;
}

interface DeliverablesThumbnailsProps {
  deliverables: Deliverable[];
  onDownloadAll?: () => void;
}

export function DeliverablesThumbnails({
  deliverables,
  onDownloadAll,
}: DeliverablesThumbnailsProps) {
  const [expanded, setExpanded] = useState<Deliverable | null>(null);

  const completedDeliverables = deliverables.filter((d) => d.visualOutcomeUrl);

  if (completedDeliverables.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">No deliverables ready yet</p>
        <p className="text-xs">Deliverables will appear as steps complete</p>
      </div>
    );
  }

  const handleDownload = async (url: string, name: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${name.replace(/\s+/g, "-").toLowerCase()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            Deliverables ({completedDeliverables.length})
          </h3>
          {onDownloadAll && completedDeliverables.length > 0 && (
            <Button variant="outline" size="sm" onClick={onDownloadAll}>
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Download All
            </Button>
          )}
        </div>

        <ScrollArea className="w-full">
          <div className="flex gap-3 pb-2">
            {completedDeliverables.map((d) => (
              <button
                key={d.stepNumber}
                onClick={() => setExpanded(d)}
                className={cn(
                  "relative flex-shrink-0 w-28 h-28 rounded-lg overflow-hidden",
                  "border-2 border-transparent hover:border-primary/50 transition-all",
                  "group focus:outline-none focus:ring-2 focus:ring-primary/50"
                )}
              >
                <img
                  src={d.visualOutcomeUrl}
                  alt={d.stepName}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    <p className="text-[10px] text-white font-medium line-clamp-2">
                      {d.stepName}
                    </p>
                  </div>
                  <div className="absolute top-2 right-2">
                    <ZoomIn className="h-4 w-4 text-white" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Expanded View Dialog */}
      <Dialog open={!!expanded} onOpenChange={() => setExpanded(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogTitle className="sr-only">
            {expanded?.stepName || "Deliverable Preview"}
          </DialogTitle>
          {expanded && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{expanded.stepName}</h2>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleDownload(expanded.visualOutcomeUrl!, expanded.stepName)
                    }
                  >
                    <Download className="h-4 w-4 mr-1.5" />
                    Download
                  </Button>
                  {expanded.visualOutcomeUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a
                        href={expanded.visualOutcomeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4 mr-1.5" />
                        Open
                      </a>
                    </Button>
                  )}
                </div>
              </div>
              <div className="relative rounded-lg overflow-hidden bg-muted">
                <img
                  src={expanded.visualOutcomeUrl}
                  alt={expanded.stepName}
                  className="w-full h-auto max-h-[70vh] object-contain"
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
