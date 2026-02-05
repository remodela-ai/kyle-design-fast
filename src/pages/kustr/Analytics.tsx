 import { useState, useMemo } from "react";
 import { useKustrOffice } from "@/contexts/KustrOfficeContext";
 import { useLeads, type Lead, type LeadStatus } from "@/hooks/useLeads";
 import { useTeamMembers } from "@/hooks/useTeamMembers";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { Label } from "@/components/ui/label";
 import { Input } from "@/components/ui/input";
 import {
   ChartContainer,
   ChartTooltip,
   ChartTooltipContent,
   type ChartConfig
 } from "@/components/ui/chart";
 import {
   LineChart,
   Line,
   XAxis,
   YAxis,
   CartesianGrid,
   PieChart,
   Pie,
   Cell,
   BarChart,
   Bar,
   ResponsiveContainer,
   Legend
 } from "recharts";
 import {
   Users,
   TrendingUp,
   Clock,
   DollarSign,
   Download,
   Filter,
   BarChart3
 } from "lucide-react";
 import { format, subDays, startOfMonth, endOfMonth, isWithinInterval, differenceInDays, parseISO } from "date-fns";
 
 const Analytics = () => {
   const { office } = useKustrOffice();
   const { leads, isLoading } = useLeads(office?.id || null);
   const teamMembersQuery = useTeamMembers(office?.id || null);
   const teamMembers = teamMembersQuery.data || [];
 
   // Filters
   const [dateRange, setDateRange] = useState({
     start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
     end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
   });
   const [projectTypeFilter, setProjectTypeFilter] = useState<string>("all");
   const [designerFilter, setDesignerFilter] = useState<string>("all");
 
   // Filter leads
   const filteredLeads = useMemo(() => {
     return leads.filter(lead => {
       const leadDate = parseISO(lead.created_at);
       const inDateRange = isWithinInterval(leadDate, {
         start: parseISO(dateRange.start),
         end: parseISO(dateRange.end)
       });
       const matchesProjectType = projectTypeFilter === "all" || lead.project_type === projectTypeFilter;
       const matchesDesigner = designerFilter === "all" || lead.assigned_to === designerFilter;
       return inDateRange && matchesProjectType && matchesDesigner;
     });
   }, [leads, dateRange, projectTypeFilter, designerFilter]);
 
   // Metrics calculations
   const metrics = useMemo(() => {
     const totalLeads = filteredLeads.length;
     const convertedLeads = filteredLeads.filter(l => l.status === 'converted');
     const conversionRate = totalLeads > 0 ? (convertedLeads.length / totalLeads) * 100 : 0;
     
     // Average time to proposal (from created to proposal_sent)
     const leadsWithProposal = filteredLeads.filter(l => 
       l.status === 'proposal_sent' || l.status === 'converted'
     );
     const avgTimeToProposal = leadsWithProposal.length > 0
       ? leadsWithProposal.reduce((acc, lead) => {
           const created = parseISO(lead.created_at);
           const qualified = lead.qualified_at ? parseISO(lead.qualified_at) : created;
           return acc + differenceInDays(qualified, created);
         }, 0) / leadsWithProposal.length
       : 0;
 
     // Estimated revenue (using budget_max from converted leads)
     const estimatedRevenue = convertedLeads.reduce((acc, lead) => {
       return acc + (lead.budget_max || 0);
     }, 0);
 
     return {
       totalLeads,
       conversionRate: conversionRate.toFixed(1),
       avgTimeToProposal: Math.round(avgTimeToProposal),
       estimatedRevenue
     };
   }, [filteredLeads]);
 
   // Chart data
   const leadVolumeData = useMemo(() => {
     const grouped: Record<string, number> = {};
     filteredLeads.forEach(lead => {
       const date = format(parseISO(lead.created_at), 'MMM dd');
       grouped[date] = (grouped[date] || 0) + 1;
     });
     return Object.entries(grouped).map(([date, count]) => ({ date, leads: count }));
   }, [filteredLeads]);
 
   const statusData = useMemo(() => {
     const statusCounts: Record<LeadStatus, number> = {
       new: 0, qualified: 0, contacted: 0, proposal_sent: 0, converted: 0, lost: 0
     };
     filteredLeads.forEach(lead => {
       if (lead.status) statusCounts[lead.status]++;
     });
     return Object.entries(statusCounts)
       .filter(([_, count]) => count > 0)
       .map(([status, count]) => ({ name: status.replace('_', ' '), value: count, status }));
   }, [filteredLeads]);
 
   const projectTypeData = useMemo(() => {
     const typeCounts: Record<string, number> = {};
     filteredLeads.forEach(lead => {
       const type = lead.project_type || 'Unknown';
       typeCounts[type] = (typeCounts[type] || 0) + 1;
     });
     return Object.entries(typeCounts).map(([type, count]) => ({ type, count }));
   }, [filteredLeads]);
 
   const budgetRangeData = useMemo(() => {
     const ranges = [
       { range: '$0-25k', min: 0, max: 25000, count: 0 },
       { range: '$25-50k', min: 25000, max: 50000, count: 0 },
       { range: '$50-100k', min: 50000, max: 100000, count: 0 },
       { range: '$100-250k', min: 100000, max: 250000, count: 0 },
       { range: '$250k+', min: 250000, max: Infinity, count: 0 },
     ];
     filteredLeads.forEach(lead => {
       const budget = lead.budget_max || lead.budget_min || 0;
       const range = ranges.find(r => budget >= r.min && budget < r.max);
       if (range) range.count++;
     });
     return ranges;
   }, [filteredLeads]);
 
   // Get unique project types for filter
   const projectTypes = useMemo(() => {
     const types = new Set(leads.map(l => l.project_type).filter(Boolean));
     return Array.from(types) as string[];
   }, [leads]);
 
   // Export to CSV
   const exportToCSV = () => {
     const headers = ['Name', 'Email', 'Phone', 'Project Type', 'Status', 'Budget Min', 'Budget Max', 'Created At', 'Assigned To'];
     const rows = filteredLeads.map(lead => {
       const assignee = teamMembers.find(m => m.id === lead.assigned_to);
       return [
         lead.name || '',
         lead.email || '',
         lead.phone || '',
         lead.project_type || '',
         lead.status || '',
         lead.budget_min?.toString() || '',
         lead.budget_max?.toString() || '',
         format(parseISO(lead.created_at), 'yyyy-MM-dd'),
         assignee?.display_name || ''
       ];
     });
     
     const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
     const blob = new Blob([csv], { type: 'text/csv' });
     const url = URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = `leads-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
     a.click();
     URL.revokeObjectURL(url);
   };
 
   const chartConfig: ChartConfig = {
     leads: { label: "Leads", color: "hsl(var(--primary))" },
     count: { label: "Count", color: "hsl(var(--primary))" },
   };
 
   const statusColors: Record<string, string> = {
     new: 'hsl(var(--chart-1))',
     qualified: 'hsl(var(--chart-2))',
     contacted: 'hsl(var(--chart-3))',
     proposal_sent: 'hsl(var(--chart-4))',
     converted: 'hsl(var(--chart-5))',
     lost: 'hsl(var(--muted-foreground))',
   };
 
   if (isLoading) {
     return (
       <div className="min-h-screen bg-background flex items-center justify-center">
         <div className="animate-pulse text-muted-foreground">Loading analytics...</div>
       </div>
     );
   }
 
   return (
     <div className="min-h-screen bg-background p-6">
       <div className="max-w-7xl mx-auto space-y-6">
         {/* Header */}
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div>
             <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
               <BarChart3 className="h-8 w-8" />
               Analytics
             </h1>
             <p className="text-muted-foreground mt-1">
               Track your lead performance and conversions
             </p>
           </div>
           <Button onClick={exportToCSV} variant="outline">
             <Download className="h-4 w-4 mr-2" />
             Export CSV
           </Button>
         </div>
 
         {/* Filters */}
         <Card>
           <CardHeader className="pb-3">
             <CardTitle className="text-lg flex items-center gap-2">
               <Filter className="h-4 w-4" />
               Filters
             </CardTitle>
           </CardHeader>
           <CardContent>
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
               <div className="space-y-2">
                 <Label>Start Date</Label>
                 <Input
                   type="date"
                   value={dateRange.start}
                   onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                 />
               </div>
               <div className="space-y-2">
                 <Label>End Date</Label>
                 <Input
                   type="date"
                   value={dateRange.end}
                   onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                 />
               </div>
               <div className="space-y-2">
                 <Label>Project Type</Label>
                 <Select value={projectTypeFilter} onValueChange={setProjectTypeFilter}>
                   <SelectTrigger>
                     <SelectValue placeholder="All Types" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="all">All Types</SelectItem>
                     {projectTypes.map(type => (
                       <SelectItem key={type} value={type}>{type}</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
               <div className="space-y-2">
                 <Label>Assigned Designer</Label>
                 <Select value={designerFilter} onValueChange={setDesignerFilter}>
                   <SelectTrigger>
                     <SelectValue placeholder="All Designers" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="all">All Designers</SelectItem>
                     {teamMembers.map(member => (
                       <SelectItem key={member.id} value={member.id}>{member.display_name}</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
             </div>
           </CardContent>
         </Card>
 
         {/* Metrics Cards */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
           <Card>
             <CardHeader className="flex flex-row items-center justify-between pb-2">
               <CardTitle className="text-sm font-medium text-muted-foreground">
                 Total Leads
               </CardTitle>
               <Users className="h-4 w-4 text-muted-foreground" />
             </CardHeader>
             <CardContent>
               <div className="text-3xl font-bold">{metrics.totalLeads}</div>
               <p className="text-xs text-muted-foreground">In selected period</p>
             </CardContent>
           </Card>
 
           <Card>
             <CardHeader className="flex flex-row items-center justify-between pb-2">
               <CardTitle className="text-sm font-medium text-muted-foreground">
                 Conversion Rate
               </CardTitle>
               <TrendingUp className="h-4 w-4 text-muted-foreground" />
             </CardHeader>
             <CardContent>
               <div className="text-3xl font-bold">{metrics.conversionRate}%</div>
               <p className="text-xs text-muted-foreground">Leads → Clients</p>
             </CardContent>
           </Card>
 
           <Card>
             <CardHeader className="flex flex-row items-center justify-between pb-2">
               <CardTitle className="text-sm font-medium text-muted-foreground">
                 Avg. Time to Proposal
               </CardTitle>
               <Clock className="h-4 w-4 text-muted-foreground" />
             </CardHeader>
             <CardContent>
               <div className="text-3xl font-bold">{metrics.avgTimeToProposal} days</div>
               <p className="text-xs text-muted-foreground">From lead to proposal</p>
             </CardContent>
           </Card>
 
           <Card>
             <CardHeader className="flex flex-row items-center justify-between pb-2">
               <CardTitle className="text-sm font-medium text-muted-foreground">
                 Projected Revenue
               </CardTitle>
               <DollarSign className="h-4 w-4 text-muted-foreground" />
             </CardHeader>
             <CardContent>
               <div className="text-3xl font-bold">
                 ${metrics.estimatedRevenue.toLocaleString()}
               </div>
               <p className="text-xs text-muted-foreground">From converted leads</p>
             </CardContent>
           </Card>
         </div>
 
         {/* Charts Grid */}
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           {/* Lead Volume Over Time */}
           <Card>
             <CardHeader>
               <CardTitle>Lead Volume Over Time</CardTitle>
               <CardDescription>Daily lead captures</CardDescription>
             </CardHeader>
             <CardContent>
               <ChartContainer config={chartConfig} className="h-[300px]">
                 <LineChart data={leadVolumeData}>
                   <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                   <XAxis dataKey="date" className="text-xs" />
                   <YAxis className="text-xs" />
                   <ChartTooltip content={<ChartTooltipContent />} />
                   <Line
                     type="monotone"
                     dataKey="leads"
                     stroke="hsl(var(--primary))"
                     strokeWidth={2}
                     dot={{ fill: "hsl(var(--primary))" }}
                   />
                 </LineChart>
               </ChartContainer>
             </CardContent>
           </Card>
 
           {/* Status Distribution */}
           <Card>
             <CardHeader>
               <CardTitle>Status Distribution</CardTitle>
               <CardDescription>Current lead statuses</CardDescription>
             </CardHeader>
             <CardContent>
               <ChartContainer config={chartConfig} className="h-[300px]">
                 <PieChart>
                   <Pie
                     data={statusData}
                     cx="50%"
                     cy="50%"
                     labelLine={false}
                     label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                     outerRadius={100}
                     dataKey="value"
                   >
                     {statusData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={statusColors[entry.status] || 'hsl(var(--muted))'} />
                     ))}
                   </Pie>
                   <ChartTooltip content={<ChartTooltipContent />} />
                 </PieChart>
               </ChartContainer>
             </CardContent>
           </Card>
 
           {/* Project Type Breakdown */}
           <Card>
             <CardHeader>
               <CardTitle>Project Type Breakdown</CardTitle>
               <CardDescription>Leads by project category</CardDescription>
             </CardHeader>
             <CardContent>
               <ChartContainer config={chartConfig} className="h-[300px]">
                 <BarChart data={projectTypeData} layout="vertical">
                   <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                   <XAxis type="number" className="text-xs" />
                   <YAxis dataKey="type" type="category" className="text-xs" width={100} />
                   <ChartTooltip content={<ChartTooltipContent />} />
                   <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                 </BarChart>
               </ChartContainer>
             </CardContent>
           </Card>
 
           {/* Budget Range Distribution */}
           <Card>
             <CardHeader>
               <CardTitle>Budget Range Distribution</CardTitle>
               <CardDescription>Leads by budget tier</CardDescription>
             </CardHeader>
             <CardContent>
               <ChartContainer config={chartConfig} className="h-[300px]">
                 <BarChart data={budgetRangeData}>
                   <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                   <XAxis dataKey="range" className="text-xs" />
                   <YAxis className="text-xs" />
                   <ChartTooltip content={<ChartTooltipContent />} />
                   <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                 </BarChart>
               </ChartContainer>
             </CardContent>
           </Card>
         </div>
       </div>
     </div>
   );
 };
 
 export default Analytics;