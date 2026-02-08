import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { useProject, useGenerateProposal } from "@/hooks/useKitchenApi";
import {
  ArrowLeft, FileText, Loader2, Palette, Printer,
  Check, Calendar, CreditCard, Phone, Mail, MapPin,
} from "lucide-react";

export default function Proposal() {
  const params = useParams<{ id: string }>();
  const projectId = parseInt(params.id || "0");
  const navigate = useNavigate();
  const proposalRef = useRef<HTMLDivElement>(null);

  const { data: projectData } = useProject(projectId);
  const generateProposalMut = useGenerateProposal();
  const [proposalData, setProposalData] = useState<any>(null);

  const handleGenerate = async () => {
    try {
      const result = await generateProposalMut.mutateAsync(projectId);
      setProposalData(result);
      toast.success("Proposal generated!");
    } catch (err: any) {
      toast.error("Failed to generate proposal: " + err.message);
    }
  };

  const handlePrint = () => { window.print(); };

  const items = proposalData?.items || projectData?.items || [];
  const totalPrice = items.reduce((sum: number, item: any) => sum + parseFloat(String(item.price)), 0);
  const isGenerating = generateProposalMut.isPending;

  return (
    <div className="min-h-screen bg-background">
      <header className="h-14 border-b border-border bg-card/80 backdrop-blur-sm flex items-center px-4 gap-3 print:hidden">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/studio/${projectId}`)} className="gap-1.5">
          <ArrowLeft className="w-4 h-4" />Back to Studio
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          <span className="font-medium text-sm">Proposal</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {!proposalData && (
            <Button size="sm" onClick={handleGenerate} disabled={isGenerating} className="gap-1.5">
              {isGenerating ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Generating...</> : <><FileText className="w-3.5 h-3.5" />Generate Proposal</>}
            </Button>
          )}
          {proposalData && (
            <Button size="sm" variant="outline" onClick={handlePrint} className="gap-1.5"><Printer className="w-3.5 h-3.5" />Print</Button>
          )}
        </div>
      </header>

      {isGenerating && (
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-1">Crafting Your Proposal...</h3>
            <p className="text-sm text-muted-foreground">Our AI is writing a beautiful description of your new kitchen</p>
          </div>
        </div>
      )}

      {!proposalData && !isGenerating && (
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-6">
              <FileText className="w-7 h-7 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Generate Your Proposal</h3>
            <p className="text-sm text-muted-foreground mb-6">Create a professional kitchen redesign proposal with AI-generated storytelling, itemized pricing, and payment terms.</p>
            {items.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm font-medium">{items.length} items selected · Total: ${totalPrice.toLocaleString()}</p>
                <Button size="lg" onClick={handleGenerate} className="gap-2 bg-red-600 hover:bg-red-700"><FileText className="w-4 h-4" />Generate Proposal</Button>
              </div>
            ) : (
              <p className="text-sm text-destructive">Please select items from the catalog first.</p>
            )}
          </div>
        </div>
      )}

      {proposalData && !isGenerating && (
        <div className="max-w-4xl mx-auto py-8 px-4 print:py-0 print:px-0" ref={proposalRef}>
          <Card className="shadow-lg border-border/50 print:shadow-none print:border-none">
            <CardContent className="p-8 lg:p-12">
              {/* Company Header - Next Kuster Design Branding */}
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-red-600 flex items-center justify-center">
                    <Palette className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold tracking-tight">Next Kuster Design</h1>
                    <p className="text-xs text-muted-foreground">Professional Kitchen Design Services</p>
                  </div>
                </div>
                <div className="text-right text-xs text-muted-foreground space-y-0.5">
                  <p className="flex items-center justify-end gap-1"><Phone className="w-3 h-3" /> (555) 123-4567</p>
                  <p className="flex items-center justify-end gap-1"><Mail className="w-3 h-3" /> hello@nextkusterdesign.com</p>
                  <p className="flex items-center justify-end gap-1"><MapPin className="w-3 h-3" /> Miami, FL</p>
                </div>
              </div>

              <div className="mb-8">
                <Badge variant="secondary" className="mb-3">Kitchen Redesign Proposal</Badge>
                <h2 className="text-2xl font-bold mb-1">{proposalData.title}</h2>
                <p className="text-sm text-muted-foreground">Prepared on {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
              </div>

              {(proposalData.originalImageUrl || proposalData.redesignImageUrl) && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4">Design Visualization</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {proposalData.originalImageUrl && (
                      <div><p className="text-xs font-medium text-muted-foreground mb-2">Current Kitchen</p><img src={proposalData.originalImageUrl} alt="Current" className="w-full rounded-lg border border-border" /></div>
                    )}
                    {proposalData.redesignImageUrl && (
                      <div><p className="text-xs font-medium text-primary mb-2">Proposed Redesign</p><img src={proposalData.redesignImageUrl} alt="Proposed" className="w-full rounded-lg border border-primary/20" /></div>
                    )}
                  </div>
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-3">Design Narrative</h3>
                <div className="prose prose-sm max-w-none text-foreground/80 leading-relaxed bg-muted/30 rounded-lg p-5 border border-border/50">
                  <p>{proposalData.description}</p>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Itemized Selection & Pricing</h3>
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-muted/50"><th className="text-left p-3 font-semibold">Category</th><th className="text-left p-3 font-semibold">Product</th><th className="text-right p-3 font-semibold">Price</th></tr></thead>
                    <tbody>
                      {proposalData.items.map((item: any, i: number) => (
                        <tr key={item.id || i} className={i % 2 === 0 ? "bg-card" : "bg-muted/20"}>
                          <td className="p-3 text-muted-foreground capitalize">{item.category?.replace(/_/g, " ")}</td>
                          <td className="p-3"><p className="font-medium">{item.productName}</p>{item.productDescription && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.productDescription}</p>}</td>
                          <td className="p-3 text-right font-medium">${parseFloat(String(item.price)).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot><tr className="border-t-2 border-border bg-primary/5"><td colSpan={2} className="p-3 font-bold text-base">Total Investment</td><td className="p-3 text-right font-bold text-base text-primary">${proposalData.totalPrice?.toLocaleString()}</td></tr></tfoot>
                  </table>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Payment Terms & Conditions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-border/50"><CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2"><CreditCard className="w-4 h-4 text-primary" /><h4 className="font-semibold text-sm">Payment Schedule</h4></div>
                    <ul className="text-xs text-muted-foreground space-y-1.5">
                      <li className="flex justify-between"><span>Upon approval</span><span className="font-medium text-foreground">30%</span></li>
                      <li className="flex justify-between"><span>Materials ordered</span><span className="font-medium text-foreground">40%</span></li>
                      <li className="flex justify-between"><span>Installation complete</span><span className="font-medium text-foreground">30%</span></li>
                    </ul>
                  </CardContent></Card>
                  <Card className="border-border/50"><CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2"><Calendar className="w-4 h-4 text-primary" /><h4 className="font-semibold text-sm">Timeline & Terms</h4></div>
                    <ul className="text-xs text-muted-foreground space-y-1.5">
                      <li className="flex justify-between"><span>Estimated timeline</span><span className="font-medium text-foreground">4-6 weeks</span></li>
                      <li className="flex justify-between"><span>Proposal valid for</span><span className="font-medium text-foreground">30 days</span></li>
                      <li className="flex justify-between"><span>Warranty</span><span className="font-medium text-foreground">2 years</span></li>
                    </ul>
                  </CardContent></Card>
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <div className="grid grid-cols-2 gap-8">
                  <div><p className="text-xs text-muted-foreground mb-6">Client Signature</p><div className="border-b border-foreground/30 mb-1 h-8" /><p className="text-xs text-muted-foreground">Date: _______________</p></div>
                  <div><p className="text-xs text-muted-foreground mb-6">Next Kuster Design</p><div className="border-b border-foreground/30 mb-1 h-8" /><p className="text-xs text-muted-foreground">Date: _______________</p></div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-border text-center">
                <p className="text-xs text-muted-foreground">This proposal was generated by Next Kuster Design. All prices are estimates and subject to final measurement and site conditions.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
