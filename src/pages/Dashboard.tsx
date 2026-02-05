import { useNavigate } from 'react-router-dom';
import { useDesignerProfile } from '@/hooks/useDesignerProfile';
import { useDesignerSessions } from '@/hooks/useDesignerSessions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  FolderOpen, 
  Image, 
  Zap, 
  Clock,
  Loader2,
  CheckCircle,
  Play,
  Trash2,
} from 'lucide-react';
 
 interface ExtendedSession {
   id: string;
   session_id: string;
   designer_id: string | null;
   design_image_url: string | null;
   conversation_summary: string | null;
   project_name?: string | null;
   status?: string;
   pipeline_completed?: boolean;
   management_completed?: boolean;
   iteration_count?: number;
   created_at: string;
   updated_at: string;
 }
 
const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, loading: profileLoading } = useDesignerProfile();
  const { sessions, loading: sessionsLoading, deleteSession } = useDesignerSessions();

  const loading = profileLoading || sessionsLoading;
  const extendedSessions = sessions as ExtendedSession[];

  // Count stats
  const completedPipelines = extendedSessions.filter(s => s.pipeline_completed).length;
  const activeProjects = extendedSessions.filter(s => s.status === 'active' || !s.status).length;

  const handleDeleteProject = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation(); // Prevent card click navigation
    
    if (!confirm('¿Eliminar este proyecto? Esta acción no se puede deshacer.')) {
      return;
    }

    const { success, error } = await deleteSession(sessionId);
    
    if (success) {
      toast({
        title: "Proyecto eliminado",
        description: "El proyecto ha sido eliminado correctamente.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "No se pudo eliminar el proyecto.",
      });
    }
  };
 
   return (
     <div className="flex-1 flex flex-col overflow-y-auto p-4 md:p-6">
       {/* Page Header */}
       <div className="mb-6">
         <h1 className="text-2xl font-semibold">Dashboard</h1>
         {profile && (
           <p className="text-sm text-muted-foreground">
             Welcome back, {profile.display_name}
           </p>
         )}
       </div>
 
       {/* Content */}
       <div className="space-y-6">
         {loading ? (
           <div className="flex items-center justify-center py-20">
             <Loader2 className="h-8 w-8 animate-spin text-primary" />
           </div>
         ) : (
           <>
             {/* Quick Stats */}
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <Card>
                 <CardContent className="p-4 flex items-center gap-3">
                   <div className="p-2 rounded-lg bg-primary/10">
                     <FolderOpen className="h-5 w-5 text-primary" />
                   </div>
                   <div>
                     <p className="text-2xl font-bold">{extendedSessions.length}</p>
                     <p className="text-xs text-muted-foreground">Total Projects</p>
                   </div>
                 </CardContent>
               </Card>
               
               <Card>
                 <CardContent className="p-4 flex items-center gap-3">
                   <div className="p-2 rounded-lg bg-primary/10">
                     <Play className="h-5 w-5 text-primary" />
                   </div>
                   <div>
                     <p className="text-2xl font-bold">{activeProjects}</p>
                     <p className="text-xs text-muted-foreground">Active</p>
                   </div>
                 </CardContent>
               </Card>
               
               <Card>
                 <CardContent className="p-4 flex items-center gap-3">
                   <div className="p-2 rounded-lg bg-primary/10">
                     <CheckCircle className="h-5 w-5 text-primary" />
                   </div>
                   <div>
                     <p className="text-2xl font-bold">{completedPipelines}</p>
                     <p className="text-xs text-muted-foreground">Pipeline Done</p>
                   </div>
                 </CardContent>
               </Card>
               
               <Card>
                 <CardContent className="p-4 flex items-center gap-3">
                   <div className="p-2 rounded-lg bg-primary/10">
                     <Image className="h-5 w-5 text-primary" />
                   </div>
                   <div>
                     <p className="text-2xl font-bold">
                       {extendedSessions.reduce((sum, s) => sum + (s.iteration_count || 0), 0)}
                     </p>
                     <p className="text-xs text-muted-foreground">Iterations</p>
                   </div>
                 </CardContent>
               </Card>
             </div>
 
             {/* Design Projects Section */}
             <div className="space-y-4">
               <div className="flex items-center justify-between">
                 <h2 className="text-lg font-semibold">Smart Project Folders</h2>
                 <Button
                   onClick={() => navigate('/shazam')}
                   size="sm"
                   className="gap-2"
                 >
                   <Plus className="h-4 w-4" />
                   New Project
                 </Button>
               </div>
 
               {extendedSessions.length === 0 ? (
                 <Card className="border-dashed">
                   <CardContent className="p-8 text-center">
                     <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                     <h3 className="font-medium mb-2">No projects yet</h3>
                     <p className="text-sm text-muted-foreground mb-4">
                       Start a conversation with Kyle to create your first design
                     </p>
                     <Button
                       variant="outline"
                       onClick={() => navigate('/shazam')}
                       className="gap-2"
                     >
                       <Plus className="h-4 w-4" />
                       Start with Kyle
                     </Button>
                   </CardContent>
                 </Card>
               ) : (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                   {extendedSessions.map(session => (
                     <Card 
                       key={session.id} 
                       className="overflow-hidden hover:border-primary/50 transition-colors cursor-pointer group"
                       onClick={() => navigate(`/project/${session.session_id}`)}
                     >
                       <div className="aspect-video bg-muted relative">
                         {session.design_image_url ? (
                           <img 
                             src={session.design_image_url} 
                             alt="Design project"
                             className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                           />
                         ) : (
                           <div className="w-full h-full flex items-center justify-center">
                             <Zap className="h-8 w-8 text-muted-foreground" />
                           </div>
                         )}
                        {/* Delete button */}
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 left-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => handleDeleteProject(e, session.session_id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        {/* Status badges */}
                        <div className="absolute top-2 right-2 flex gap-1">
                          {session.pipeline_completed && (
                            <Badge variant="secondary" className="text-xs bg-background/80 backdrop-blur-sm">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Pipeline
                            </Badge>
                          )}
                          {session.iteration_count && session.iteration_count > 0 && (
                            <Badge variant="outline" className="text-xs bg-background/80 backdrop-blur-sm">
                              {session.iteration_count} versions
                            </Badge>
                          )}
                        </div>
                      </div>
                      <CardHeader className="p-3">
                        <CardTitle className="text-sm line-clamp-1">
                          {session.project_name || 
                            (session.conversation_summary 
                              ? session.conversation_summary.substring(0, 50) + (session.conversation_summary.length > 50 ? '...' : '')
                              : `Project ${session.session_id.substring(0, 8)}`)}
                        </CardTitle>
                        <CardDescription className="text-xs flex items-center gap-2 justify-between">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(session.updated_at || session.created_at).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </CardDescription>
                      </CardHeader>
                    </Card>
                   ))}
                 </div>
               )}
             </div>
           </>
         )}
       </div>
     </div>
   );
 };
 
 export default Dashboard;