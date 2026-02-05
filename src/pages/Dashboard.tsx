 import { useNavigate } from 'react-router-dom';
 import { useDesignerProfile } from '@/hooks/useDesignerProfile';
 import { useDesignerSessions } from '@/hooks/useDesignerSessions';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { 
   Plus, 
   FolderOpen, 
   Image, 
   Zap, 
   Clock,
   Loader2,
 } from 'lucide-react';
 
 const Dashboard = () => {
   const navigate = useNavigate();
   const { profile, loading: profileLoading } = useDesignerProfile();
   const { sessions, loading: sessionsLoading } = useDesignerSessions();
 
   const loading = profileLoading || sessionsLoading;
 
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
                     <Zap className="h-5 w-5 text-primary" />
                   </div>
                   <div>
                     <p className="text-2xl font-bold">{sessions.length}</p>
                     <p className="text-xs text-muted-foreground">Projects</p>
                   </div>
                 </CardContent>
               </Card>
               
               <Card>
                 <CardContent className="p-4 flex items-center gap-3">
                   <div className="p-2 rounded-lg bg-primary/10">
                     <Image className="h-5 w-5 text-primary" />
                   </div>
                   <div>
                     <p className="text-2xl font-bold">{sessions.filter(s => s.design_image_url).length}</p>
                     <p className="text-xs text-muted-foreground">Designs</p>
                   </div>
                 </CardContent>
               </Card>
               
               <Card>
                 <CardContent className="p-4 flex items-center gap-3">
                   <div className="p-2 rounded-lg bg-primary/10">
                     <FolderOpen className="h-5 w-5 text-primary" />
                   </div>
                   <div>
                     <p className="text-2xl font-bold">{sessions.filter(s => s.conversation_summary).length}</p>
                     <p className="text-xs text-muted-foreground">With Summary</p>
                   </div>
                 </CardContent>
               </Card>
               
               <Card>
                 <CardContent className="p-4 flex items-center gap-3">
                   <div className="p-2 rounded-lg bg-primary/10">
                     <Clock className="h-5 w-5 text-primary" />
                   </div>
                   <div>
                     <p className="text-2xl font-bold">
                       {sessions.length > 0 
                         ? new Date(sessions[0].created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                         : '--'}
                     </p>
                     <p className="text-xs text-muted-foreground">Last Active</p>
                   </div>
                 </CardContent>
               </Card>
             </div>
 
             {/* Design Projects Section */}
             <div className="space-y-4">
               <div className="flex items-center justify-between">
                 <h2 className="text-lg font-semibold">Design Projects</h2>
                 <button
                   onClick={() => navigate('/shazam')}
                   className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                 >
                   <Plus className="h-4 w-4" />
                   New Project
                 </button>
               </div>
 
               {sessions.length === 0 ? (
                 <Card className="border-dashed">
                   <CardContent className="p-8 text-center">
                     <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                     <h3 className="font-medium mb-2">No projects yet</h3>
                     <p className="text-sm text-muted-foreground mb-4">
                       Start a conversation with Kyle to create your first design
                     </p>
                     <button
                       onClick={() => navigate('/shazam')}
                       className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
                     >
                       <Plus className="h-4 w-4" />
                       Start with Kyle
                     </button>
                   </CardContent>
                 </Card>
               ) : (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                   {sessions.map(session => (
                     <Card 
                       key={session.id} 
                       className="overflow-hidden hover:border-primary/50 transition-colors cursor-pointer group"
                       onClick={() => navigate(`/shazam?session=${session.session_id}`)}
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
                       </div>
                       <CardHeader className="p-3">
                         <CardTitle className="text-sm line-clamp-1">
                           {session.conversation_summary 
                             ? session.conversation_summary.substring(0, 50) + (session.conversation_summary.length > 50 ? '...' : '')
                             : `Project ${session.session_id.substring(0, 8)}`}
                         </CardTitle>
                         <CardDescription className="text-xs">
                           {new Date(session.created_at).toLocaleDateString('en-US', { 
                             month: 'short', 
                             day: 'numeric',
                             hour: '2-digit',
                             minute: '2-digit'
                           })}
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