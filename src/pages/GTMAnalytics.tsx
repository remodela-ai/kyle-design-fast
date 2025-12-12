import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  MessageSquare, 
  Target, 
  ArrowLeft,
  CheckCircle2,
  Clock,
  Users
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";

interface DailySync {
  id: string;
  sync_date: string;
  oriel_notes: string | null;
  james_notes: string | null;
  synthesis: string | null;
  status: string;
  created_at: string;
}

interface SyncMessage {
  id: string;
  sync_id: string;
  phase: string;
  speaker: string;
  content: string;
  timestamp: string;
}

const GTMAnalytics = () => {
  const navigate = useNavigate();
  const [syncs, setSyncs] = useState<DailySync[]>([]);
  const [messages, setMessages] = useState<SyncMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    setLoading(true);
    
    const [syncsResult, messagesResult] = await Promise.all([
      supabase
        .from('daily_syncs')
        .select('*')
        .order('sync_date', { ascending: true }),
      supabase
        .from('sync_messages')
        .select('*')
        .order('timestamp', { ascending: true })
    ]);

    if (syncsResult.data) setSyncs(syncsResult.data);
    if (messagesResult.data) setMessages(messagesResult.data);
    
    setLoading(false);
  };

  // Calculate stats
  const totalSyncs = syncs.length;
  const completedSyncs = syncs.filter(s => s.status === 'complete').length;
  const completionRate = totalSyncs > 0 ? Math.round((completedSyncs / totalSyncs) * 100) : 0;
  
  const orielMessages = messages.filter(m => m.speaker === 'Oriel').length;
  const jamesMessages = messages.filter(m => m.speaker === 'James').length;
  const kyleMessages = messages.filter(m => m.speaker === 'Kyle').length;
  const totalMessages = messages.length;

  // Activity over time (syncs per week)
  const activityData = syncs.reduce((acc: any[], sync) => {
    const date = new Date(sync.sync_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const existing = acc.find(item => item.date === date);
    if (existing) {
      existing.syncs += 1;
    } else {
      acc.push({ date, syncs: 1 });
    }
    return acc;
  }, []).slice(-14); // Last 14 days

  // Messages per speaker
  const speakerData = [
    { name: 'Oriel', value: orielMessages, color: 'hsl(var(--primary))' },
    { name: 'James', value: jamesMessages, color: 'hsl(var(--secondary))' },
    { name: 'Kyle', value: kyleMessages, color: 'hsl(var(--muted))' }
  ];

  // Messages per sync
  const messagesPerSyncData = syncs.slice(-10).map(sync => {
    const syncMessages = messages.filter(m => m.sync_id === sync.id);
    return {
      date: new Date(sync.sync_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      oriel: syncMessages.filter(m => m.phase === 'oriel').length,
      james: syncMessages.filter(m => m.phase === 'james').length
    };
  });

  // Average words per synthesis
  const avgSynthesisWords = syncs
    .filter(s => s.synthesis)
    .reduce((sum, s) => sum + (s.synthesis?.split(' ').length || 0), 0) / (completedSyncs || 1);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="w-6 h-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Loading analytics...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-primary" />
              GTM Analytics
            </h1>
            <p className="text-muted-foreground mt-2">
              Track your daily sync trends and team engagement
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/daily-next-interiors')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Daily
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card/50 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{totalSyncs}</p>
                  <p className="text-sm text-muted-foreground">Total Syncs</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{completionRate}%</p>
                  <p className="text-sm text-muted-foreground">Completion Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{totalMessages}</p>
                  <p className="text-sm text-muted-foreground">Total Messages</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{Math.round(avgSynthesisWords)}</p>
                  <p className="text-sm text-muted-foreground">Avg Words/Synthesis</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Syncs Over Time */}
          <Card className="bg-card/50 border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Sync Activity Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activityData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="syncs" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  No sync data yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Speaker Distribution */}
          <Card className="bg-card/50 border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Messages by Speaker
              </CardTitle>
            </CardHeader>
            <CardContent>
              {totalMessages > 0 ? (
                <div className="flex items-center justify-center gap-8">
                  <ResponsiveContainer width="50%" height={200}>
                    <PieChart>
                      <Pie
                        data={speakerData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {speakerData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-3">
                    {speakerData.map((speaker) => (
                      <div key={speaker.name} className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: speaker.color }}
                        />
                        <span className="text-foreground font-medium">{speaker.name}</span>
                        <Badge variant="secondary">{speaker.value}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  No message data yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Messages per Sync */}
          <Card className="bg-card/50 border-primary/20 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Message Volume per Session (Last 10 Syncs)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {messagesPerSyncData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={messagesPerSyncData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="oriel" name="Oriel's Session" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="james" name="James's Session" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  No session data yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Syncs Table */}
        <Card className="bg-card/50 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Recent Syncs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-muted">
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Date</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Status</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Oriel Notes</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">James Notes</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Synthesis</th>
                  </tr>
                </thead>
                <tbody>
                  {syncs.slice().reverse().slice(0, 10).map((sync) => (
                    <tr key={sync.id} className="border-b border-muted/50 hover:bg-muted/20">
                      <td className="py-3 px-4 text-foreground">
                        {new Date(sync.sync_date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={sync.status === 'complete' ? 'default' : 'secondary'}>
                          {sync.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {sync.oriel_notes ? `${sync.oriel_notes.split(' ').length} words` : '-'}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {sync.james_notes ? `${sync.james_notes.split(' ').length} words` : '-'}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {sync.synthesis ? `${sync.synthesis.split(' ').length} words` : '-'}
                      </td>
                    </tr>
                  ))}
                  {syncs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        No syncs recorded yet. Complete your first daily sync to see data here.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GTMAnalytics;
