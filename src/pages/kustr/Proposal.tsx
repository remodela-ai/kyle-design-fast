import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Calculator, FileText, Eye, Send, Loader2, DollarSign, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLead, useLeads, LeadStatus } from "@/hooks/useLeads";
import { useKustrOffice } from "@/contexts/KustrOfficeContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { StatusBadge } from "@/components/kustr/StatusBadge";
import { cn } from "@/lib/utils";

interface FeeCalculation {
  base_fee: number;
  adjustments: { name: string; amount: number; description: string }[];
  total_fee: number;
  payment_schedule: { name: string; percentage: number; amount: number }[];
  breakdown: {
    project_type: string;
    square_footage: number;
    complexity_multiplier: number;
  };
}

interface ProposalData {
  project_type: string;
  width: number;
  height: number;
  depth: number;
  style_complexity: string;
  includes_appliances: boolean;
  includes_custom_furniture: boolean;
  scope_of_work: string;
  timeline: string;
  terms: string;
}

const PROJECT_TYPES = [
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'bathroom', label: 'Bathroom' },
  { value: 'bedroom', label: 'Bedroom' },
  { value: 'living_room', label: 'Living Room' },
  { value: 'dining_room', label: 'Dining Room' },
  { value: 'office', label: 'Home Office' },
];

const COMPLEXITY_OPTIONS = [
  { value: 'simple', label: 'Simple', description: 'Basic finishes and standard layouts' },
  { value: 'moderate', label: 'Moderate', description: 'Custom elements and quality materials' },
  { value: 'luxury', label: 'Luxury', description: 'Premium materials and bespoke design' },
];

const DEFAULT_SCOPE = `## Design Services Included

- Initial consultation and space assessment
- Concept development and mood boards
- Space planning and layout optimization
- Material and finish selections
- Furniture and fixture specifications
- Lighting design recommendations
- 3D renderings of final design concept
- Vendor coordination and procurement assistance
- Project management during implementation phase`;

const DEFAULT_TIMELINE = `## Project Timeline

**Phase 1: Discovery & Concept (Weeks 1-2)**
- Initial consultation and requirements gathering
- Site assessment and measurements
- Mood board and concept presentation

**Phase 2: Design Development (Weeks 3-4)**
- Detailed space planning
- Material and finish selections
- 3D renderings and revisions

**Phase 3: Documentation (Week 5)**
- Final specifications and drawings
- Vendor quotes and procurement list
- Implementation timeline

**Phase 4: Implementation Support (Ongoing)**
- Vendor coordination
- Site visits and quality control
- Final styling and photography`;

const DEFAULT_TERMS = `## Terms & Conditions

1. **Payment Terms**: 50% deposit upon agreement signing, 25% at design milestone, 25% upon final delivery.

2. **Revisions**: Two rounds of revisions are included. Additional revisions will be billed at $150/hour.

3. **Timeline**: Timelines are estimates and may vary based on vendor availability and scope changes.

4. **Procurement**: Product costs are separate from design fees and will be quoted individually.

5. **Cancellation**: Deposit is non-refundable. Work completed beyond deposit will be billed at standard rates.

6. **Intellectual Property**: All design concepts and drawings remain property of the studio until final payment.`;

export default function Proposal() {
  const navigate = useNavigate();
  const { leadId } = useParams<{ leadId: string }>();
  const { office } = useKustrOffice();
  const officeId = office?.id || null;
  const { data: lead, isLoading: isLeadLoading } = useLead(leadId || null);
  const { updateLeadStatus } = useLeads(officeId);
  const { toast } = useToast();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('edit');
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [feeCalculation, setFeeCalculation] = useState<FeeCalculation | null>(null);
  
  const [proposalData, setProposalData] = useState<ProposalData>({
    project_type: 'kitchen',
    width: 12,
    height: 9,
    depth: 12,
    style_complexity: 'moderate',
    includes_appliances: false,
    includes_custom_furniture: false,
    scope_of_work: DEFAULT_SCOPE,
    timeline: DEFAULT_TIMELINE,
    terms: DEFAULT_TERMS,
  });

  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/kustr/auth');
        return;
      }
      setIsAuthenticated(true);
    };
    checkAuth();
  }, [navigate]);

  // Pre-fill from lead data
  useEffect(() => {
    if (lead) {
      const dimensions = lead.room_dimensions as { width?: number; height?: number; depth?: number } | null;
      const insights = lead.extracted_insights as { style_complexity?: string } | null;
      
      setProposalData(prev => ({
        ...prev,
        project_type: lead.project_type || prev.project_type,
        width: dimensions?.width || prev.width,
        height: dimensions?.height || prev.height,
        depth: dimensions?.depth || prev.depth,
        style_complexity: insights?.style_complexity || 
          (lead.style_preferences?.includes('luxury') ? 'luxury' : 
           lead.style_preferences?.includes('modern') ? 'moderate' : prev.style_complexity),
        includes_appliances: (lead.appliance_brands?.length || 0) > 0,
        includes_custom_furniture: (lead.furniture_brands?.length || 0) > 0,
      }));
    }
  }, [lead]);

  // Calculate fee
  const calculateFee = useCallback(async () => {
    setIsCalculating(true);
    try {
      const { data, error } = await supabase.functions.invoke('calculate-design-fee', {
        body: {
          project_type: proposalData.project_type,
          room_dimensions: {
            width: proposalData.width,
            height: proposalData.height,
            depth: proposalData.depth,
          },
          style_complexity: proposalData.style_complexity,
          includes_appliances: proposalData.includes_appliances,
          includes_custom_furniture: proposalData.includes_custom_furniture,
        },
      });

      if (error) throw error;
      setFeeCalculation(data);
    } catch (error) {
      console.error('Fee calculation error:', error);
      toast({
        title: "Calculation Error",
        description: "Failed to calculate design fee. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  }, [proposalData, toast]);

  // Auto-calculate on data change
  useEffect(() => {
    const timer = setTimeout(() => {
      calculateFee();
    }, 500);
    return () => clearTimeout(timer);
  }, [calculateFee]);

  const handleSendProposal = async () => {
    if (!lead || !feeCalculation) return;
    
    setIsSending(true);
    try {
      // Update lead status to proposal_sent
      await updateLeadStatus.mutateAsync({
        leadId: lead.id,
        status: 'proposal_sent' as LeadStatus,
        currentStatus: lead.status,
        teamMemberId: lead.assigned_to,
      });

      toast({
        title: "Proposal Sent",
        description: "The proposal has been sent and lead status updated.",
      });
      
      navigate(`/kustr/leads/${lead.id}`);
    } catch (error) {
      console.error('Send proposal error:', error);
      toast({
        title: "Error",
        description: "Failed to send proposal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  if (!isAuthenticated || isLeadLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Lead not found</h2>
          <Button onClick={() => navigate('/kustr/leads')}>Back to Leads</Button>
        </div>
      </div>
    );
  }

  const canSendProposal = lead.status === 'contacted' && feeCalculation;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(`/kustr/leads/${lead.id}`)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold">Design Proposal</h1>
                <p className="text-sm text-muted-foreground">
                  For {lead.name || 'Unnamed Lead'} • {lead.project_type || 'Project'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={lead.status} />
              <Button
                onClick={handleSendProposal}
                disabled={!canSendProposal || isSending}
                className="gap-2"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Send Proposal
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="edit" className="gap-2">
              <FileText className="w-4 h-4" />
              Edit Proposal
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-2">
              <Eye className="w-4 h-4" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="edit">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Fee Calculator */}
              <div className="lg:col-span-1 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="w-5 h-5" />
                      Fee Calculator
                    </CardTitle>
                    <CardDescription>Adjust parameters to calculate the design fee</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Project Type</Label>
                      <Select
                        value={proposalData.project_type}
                        onValueChange={(value) => setProposalData(prev => ({ ...prev, project_type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PROJECT_TYPES.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-2">
                        <Label>Width (ft)</Label>
                        <Input
                          type="number"
                          value={proposalData.width}
                          onChange={(e) => setProposalData(prev => ({ ...prev, width: Number(e.target.value) }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Height (ft)</Label>
                        <Input
                          type="number"
                          value={proposalData.height}
                          onChange={(e) => setProposalData(prev => ({ ...prev, height: Number(e.target.value) }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Depth (ft)</Label>
                        <Input
                          type="number"
                          value={proposalData.depth}
                          onChange={(e) => setProposalData(prev => ({ ...prev, depth: Number(e.target.value) }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Style Complexity</Label>
                      <Select
                        value={proposalData.style_complexity}
                        onValueChange={(value) => setProposalData(prev => ({ ...prev, style_complexity: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {COMPLEXITY_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>
                              <div>
                                <span className="font-medium">{opt.label}</span>
                                <span className="text-muted-foreground ml-2 text-xs">{opt.description}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="appliances">Appliance Selection</Label>
                        <Switch
                          id="appliances"
                          checked={proposalData.includes_appliances}
                          onCheckedChange={(checked) => setProposalData(prev => ({ ...prev, includes_appliances: checked }))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="furniture">Custom Furniture</Label>
                        <Switch
                          id="furniture"
                          checked={proposalData.includes_custom_furniture}
                          onCheckedChange={(checked) => setProposalData(prev => ({ ...prev, includes_custom_furniture: checked }))}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Fee Summary */}
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <DollarSign className="w-5 h-5" />
                      Fee Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isCalculating ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : feeCalculation ? (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Base Fee</span>
                            <span>${feeCalculation.base_fee.toLocaleString()}</span>
                          </div>
                          {feeCalculation.adjustments.map((adj, i) => (
                            <div key={i} className="flex justify-between text-sm">
                              <span className="text-muted-foreground">{adj.name}</span>
                              <span>+${adj.amount.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                        <Separator />
                        <div className="flex justify-between font-semibold text-lg">
                          <span>Total Fee</span>
                          <span className="text-primary">${feeCalculation.total_fee.toLocaleString()}</span>
                        </div>
                        
                        <div className="pt-2">
                          <p className="text-xs text-muted-foreground mb-2">Payment Schedule</p>
                          <div className="space-y-1">
                            {feeCalculation.payment_schedule.map((payment, i) => (
                              <div key={i} className="flex justify-between text-sm">
                                <span>{payment.name} ({payment.percentage}%)</span>
                                <span>${payment.amount.toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Enter project details to calculate fee</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Proposal Content */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Scope of Work</CardTitle>
                    <CardDescription>Define what's included in the design services</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={proposalData.scope_of_work}
                      onChange={(e) => setProposalData(prev => ({ ...prev, scope_of_work: e.target.value }))}
                      className="min-h-[200px] font-mono text-sm"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Project Timeline</CardTitle>
                    <CardDescription>Outline the project phases and schedule</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={proposalData.timeline}
                      onChange={(e) => setProposalData(prev => ({ ...prev, timeline: e.target.value }))}
                      className="min-h-[250px] font-mono text-sm"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Terms & Conditions</CardTitle>
                    <CardDescription>Legal terms for the design agreement</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={proposalData.terms}
                      onChange={(e) => setProposalData(prev => ({ ...prev, terms: e.target.value }))}
                      className="min-h-[250px] font-mono text-sm"
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview">
            <div className="max-w-4xl mx-auto">
              <Card className="overflow-hidden">
                {/* Proposal Header */}
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-8 border-b">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-3xl font-bold mb-2">Design Proposal</h2>
                      <p className="text-muted-foreground">
                        Prepared for {lead.name || 'Client'}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date().toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <h3 className="text-xl font-semibold">{office?.name || 'Design Studio'}</h3>
                      <p className="text-sm text-muted-foreground">{office?.location}</p>
                    </div>
                  </div>
                </div>

                <CardContent className="p-8 space-y-8">
                  {/* Project Overview */}
                  <section>
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      Project Overview
                    </h3>
                    <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                      <div>
                        <p className="text-sm text-muted-foreground">Project Type</p>
                        <p className="font-medium capitalize">{proposalData.project_type.replace('_', ' ')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Room Size</p>
                        <p className="font-medium">{proposalData.width * proposalData.depth} sq ft</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Style Level</p>
                        <p className="font-medium capitalize">{proposalData.style_complexity}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Add-ons</p>
                        <p className="font-medium">
                          {[
                            proposalData.includes_appliances && 'Appliances',
                            proposalData.includes_custom_furniture && 'Custom Furniture',
                          ].filter(Boolean).join(', ') || 'None'}
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* Scope of Work */}
                  <section>
                    <h3 className="text-xl font-semibold mb-4">Scope of Work</h3>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <div className="whitespace-pre-wrap text-muted-foreground">
                        {proposalData.scope_of_work.replace(/^## /gm, '').replace(/^- /gm, '• ')}
                      </div>
                    </div>
                  </section>

                  {/* Investment */}
                  <section>
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-primary" />
                      Investment
                    </h3>
                    {feeCalculation && (
                      <div className="border rounded-lg overflow-hidden">
                        <div className="bg-muted/50 p-4">
                          <table className="w-full">
                            <tbody>
                              <tr>
                                <td className="py-2">Base Design Fee ({proposalData.project_type.replace('_', ' ')})</td>
                                <td className="text-right py-2">${feeCalculation.base_fee.toLocaleString()}</td>
                              </tr>
                              {feeCalculation.adjustments.map((adj, i) => (
                                <tr key={i} className="text-muted-foreground">
                                  <td className="py-2">{adj.name}</td>
                                  <td className="text-right py-2">+${adj.amount.toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="p-4 bg-primary/10">
                          <div className="flex justify-between items-center text-xl font-semibold">
                            <span>Total Investment</span>
                            <span className="text-primary">${feeCalculation.total_fee.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {feeCalculation && (
                      <div className="mt-4 grid grid-cols-3 gap-4">
                        {feeCalculation.payment_schedule.map((payment, i) => (
                          <div key={i} className="p-4 border rounded-lg text-center">
                            <CheckCircle className={cn(
                              "w-6 h-6 mx-auto mb-2",
                              i === 0 ? "text-primary" : "text-muted-foreground/30"
                            )} />
                            <p className="font-semibold">${payment.amount.toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground">{payment.name}</p>
                            <p className="text-xs text-muted-foreground">({payment.percentage}%)</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  {/* Timeline */}
                  <section>
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-primary" />
                      Project Timeline
                    </h3>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <div className="whitespace-pre-wrap text-muted-foreground">
                        {proposalData.timeline.replace(/^## /gm, '').replace(/^\*\*/gm, '').replace(/\*\*/gm, '')}
                      </div>
                    </div>
                  </section>

                  {/* Terms */}
                  <section>
                    <h3 className="text-xl font-semibold mb-4">Terms & Conditions</h3>
                    <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
                      <div className="whitespace-pre-wrap text-sm">
                        {proposalData.terms.replace(/^## /gm, '').replace(/^\d+\. \*\*/gm, '• ').replace(/\*\*/gm, '')}
                      </div>
                    </div>
                  </section>

                  {/* Signature Area */}
                  <section className="pt-8 border-t">
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <p className="text-sm text-muted-foreground mb-12">Client Signature</p>
                        <div className="border-b border-dashed" />
                        <p className="text-sm mt-2">{lead.name || 'Client Name'}</p>
                        <p className="text-xs text-muted-foreground">Date: _______________</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-12">Designer Signature</p>
                        <div className="border-b border-dashed" />
                        <p className="text-sm mt-2">{office?.name || 'Design Studio'}</p>
                        <p className="text-xs text-muted-foreground">Date: _______________</p>
                      </div>
                    </div>
                  </section>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
