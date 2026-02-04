import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, User, Mail, Phone, Calendar, MapPin, Palette, Wrench, DollarSign, MessageSquare, Send, ExternalLink, UserPlus, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLead, useLeadMessages, useLeadStatusHistory, LeadStatus } from "@/hooks/useLeads";
import { useLeads } from "@/hooks/useLeads";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useKustrOffice } from "@/contexts/KustrOfficeContext";
import { supabase } from "@/integrations/supabase/client";
import { StatusWorkflow } from "@/components/kustr/StatusWorkflow";
import { StatusTimeline } from "@/components/kustr/StatusTimeline";
import { StatusBadge } from "@/components/kustr/StatusBadge";


export default function LeadDetail() {
  const navigate = useNavigate();
  const { leadId } = useParams<{ leadId: string }>();
  const { office } = useKustrOffice();
  const officeId = office?.id || null;
  const { data: lead, isLoading } = useLead(leadId || null);
  const { messages, sendMessage } = useLeadMessages(leadId || null);
  const { data: statusHistory = [] } = useLeadStatusHistory(leadId || null);
  const { updateLeadStatus, assignLead } = useLeads(officeId);
  const { data: teamMembers = [] } = useTeamMembers(officeId);
  const [currentTeamMemberId, setCurrentTeamMemberId] = useState<string | null>(null);
  
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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

  if (!isAuthenticated || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
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

  const handleStatusChange = (newStatus: LeadStatus) => {
    updateLeadStatus.mutate({ 
      leadId: lead.id, 
      status: newStatus, 
      currentStatus: lead.status,
      teamMemberId: lead.assigned_to 
    });
  };

  const handleAssignmentChange = (memberId: string) => {
    const teamMemberId = memberId === 'unassigned' ? null : memberId;
    assignLead.mutate({ leadId: lead.id, teamMemberId });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    setIsSending(true);
    try {
      await sendMessage.mutateAsync({ content: newMessage, sender: 'designer' });
      setNewMessage('');
    } finally {
      setIsSending(false);
    }
  };

  const formatBudget = (min: number | null, max: number | null) => {
    if (!min && !max) return 'Not specified';
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    if (min) return `From $${min.toLocaleString()}`;
    return `Up to $${max?.toLocaleString()}`;
  };

  const insights = lead.extracted_insights as Record<string, unknown> || {};
  const assignedMember = teamMembers.find(m => m.id === lead.assigned_to);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/kustr/leads')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div>
                  <h1 className="text-xl font-semibold text-foreground">
                    {lead.name || 'Unknown Visitor'}
                  </h1>
                  <p className="text-sm text-muted-foreground">Lead Details</p>
                </div>
                {assignedMember && (
                  <div className="flex items-center gap-2 ml-4 px-3 py-1.5 bg-primary/10 rounded-full">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={assignedMember.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {assignedMember.display_name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-primary">
                      {assignedMember.display_name}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Select 
                value={lead.assigned_to || 'unassigned'} 
                onValueChange={handleAssignmentChange}
              >
                <SelectTrigger className="w-[180px]">
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    <SelectValue placeholder="Assign to..." />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-5 h-5">
                          <AvatarImage src={member.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {member.display_name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {member.display_name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={lead.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="proposal_sent">Proposal Sent</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  {lead.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <a href={`mailto:${lead.email}`} className="text-primary hover:underline">
                        {lead.email}
                      </a>
                    </div>
                  )}
                  {lead.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <a href={`tel:${lead.phone}`} className="text-primary hover:underline">
                        {lead.phone}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>{new Date(lead.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Project Requirements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Project Requirements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {lead.project_type && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Project Type</h4>
                    <Badge variant="secondary" className="text-base">{lead.project_type}</Badge>
                  </div>
                )}
                
                {lead.style_preferences && lead.style_preferences.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Style Preferences</h4>
                    <div className="flex flex-wrap gap-2">
                      {lead.style_preferences.map((style, i) => (
                        <Badge key={i} variant="outline">
                          <Palette className="w-3 h-3 mr-1" />
                          {style}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Budget Range</h4>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-500" />
                    <span className="font-medium">{formatBudget(lead.budget_min, lead.budget_max)}</span>
                    {lead.budget_flexibility && (
                      <Badge variant="outline" className="ml-2">{lead.budget_flexibility}</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Brand Preferences */}
            {(lead.appliance_brands?.length > 0 || lead.plumbing_brands?.length > 0 || lead.furniture_brands?.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="w-5 h-5" />
                    Brand Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {lead.appliance_brands?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Appliance Brands</h4>
                      <div className="flex flex-wrap gap-2">
                        {lead.appliance_brands.map((brand, i) => (
                          <Badge key={i} variant="secondary">{brand}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {lead.plumbing_brands?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Plumbing Brands</h4>
                      <div className="flex flex-wrap gap-2">
                        {lead.plumbing_brands.map((brand, i) => (
                          <Badge key={i} variant="secondary">{brand}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {lead.furniture_brands?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Furniture Brands</h4>
                      <div className="flex flex-wrap gap-2">
                        {lead.furniture_brands.map((brand, i) => (
                          <Badge key={i} variant="secondary">{brand}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Conversation Transcript */}
            {lead.conversation_transcript && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Conversation with Kyle
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/50 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm font-mono">
                      {lead.conversation_transcript}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Assignment Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Assignment
                </CardTitle>
              </CardHeader>
              <CardContent>
                {assignedMember ? (
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={assignedMember.avatar_url || undefined} />
                      <AvatarFallback>
                        {assignedMember.display_name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{assignedMember.display_name}</p>
                      {assignedMember.title && (
                        <p className="text-sm text-muted-foreground">{assignedMember.title}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">Not assigned to anyone yet</p>
                )}
              </CardContent>
            </Card>

            {/* Status Workflow Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Status Workflow
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-4">
                  <StatusBadge status={lead.status} size="lg" />
                </div>
                <StatusWorkflow 
                  currentStatus={lead.status}
                  onStatusChange={handleStatusChange}
                  isUpdating={updateLeadStatus.isPending}
                />
                {lead.qualified_at && (
                  <p className="text-sm text-muted-foreground mt-4">
                    Qualified on {new Date(lead.qualified_at).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Status Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Status History</CardTitle>
              </CardHeader>
              <CardContent>
                <StatusTimeline history={statusHistory} createdAt={lead.created_at} />
              </CardContent>
            </Card>

            {/* AI Insights */}
            {insights.summary && (
              <Card>
                <CardHeader>
                  <CardTitle>AI Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{insights.summary as string}</p>
                </CardContent>
              </Card>
            )}

            {/* Generated Assets */}
            {(lead.preliminary_design_url || lead.moodboard_url) && (
              <Card>
                <CardHeader>
                  <CardTitle>Generated Assets</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {lead.preliminary_design_url && (
                    <Button variant="outline" className="w-full justify-start gap-2" asChild>
                      <a href={lead.preliminary_design_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                        View Preliminary Design
                      </a>
                    </Button>
                  )}
                  {lead.moodboard_url && (
                    <Button variant="outline" className="w-full justify-start gap-2" asChild>
                      <a href={lead.moodboard_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                        View Moodboard
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Quick Messages */}
            <Card>
              <CardHeader>
                <CardTitle>Send Message</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder="Type a message to the client..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={3}
                />
                <Button 
                  className="w-full gap-2" 
                  onClick={handleSendMessage}
                  disabled={isSending || !newMessage.trim()}
                >
                  <Send className="w-4 h-4" />
                  {isSending ? 'Sending...' : 'Send Message'}
                </Button>
              </CardContent>
            </Card>

            {/* Message History */}
            {messages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Message History</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 max-h-64 overflow-y-auto">
                  {messages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={`p-3 rounded-lg text-sm ${
                        msg.sender === 'designer' 
                          ? 'bg-primary/10 ml-4' 
                          : msg.sender === 'kyle'
                          ? 'bg-blue-500/10 mr-4'
                          : 'bg-muted mr-4'
                      }`}
                    >
                      <p className="font-medium text-xs text-muted-foreground mb-1 capitalize">
                        {msg.sender}
                      </p>
                      <p>{msg.content}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
