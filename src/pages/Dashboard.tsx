import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppSidebar } from '@/components/AppSidebar';
import { useDesignerProfile } from '@/hooks/useDesignerProfile';
import { useDesignerCollections } from '@/hooks/useDesignerCollections';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/ThemeToggle';
import { 
  Menu, 
  Plus, 
  FolderOpen, 
  Image, 
  Zap, 
  Clock,
  Eye,
  EyeOff,
  Globe,
  Users,
  Loader2,
  Sparkles,
} from 'lucide-react';
import type { VisibilityType } from '@/hooks/useDesignerCollections';

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, loading: profileLoading } = useDesignerProfile();
  const { 
    collections, 
    generations, 
    loading: collectionsLoading,
    createCollection,
  } = useDesignerCollections();
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [newCollection, setNewCollection] = useState({
    name: '',
    description: '',
    visibility: 'private' as VisibilityType,
  });

  const handleCreateCollection = async () => {
    if (!newCollection.name.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter a collection name',
        variant: 'destructive',
      });
      return;
    }

    const { error } = await createCollection(newCollection);
    
    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Collection created',
      description: `"${newCollection.name}" has been created.`,
    });
    
    setNewCollection({ name: '', description: '', visibility: 'private' });
    setIsCreatingCollection(false);
  };

  const getVisibilityIcon = (visibility: VisibilityType) => {
    switch (visibility) {
      case 'private': return <EyeOff className="h-3 w-3" />;
      case 'shared': return <Users className="h-3 w-3" />;
      case 'public': return <Globe className="h-3 w-3" />;
    }
  };

  const loading = profileLoading || collectionsLoading;

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />
      
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="flex items-center justify-between px-4 md:px-6 h-16">
            <div className="flex items-center gap-4">
              <Button variant="icon" size="icon" onClick={() => setMobileMenuOpen(true)} className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold">Dashboard</h1>
                {profile && (
                  <p className="text-sm text-muted-foreground">
                    Welcome back, {profile.display_name}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button onClick={() => navigate('/shazam')} className="hidden sm:flex">
                <Sparkles className="mr-2 h-4 w-4" />
                New Design
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-4 md:p-6 space-y-6">
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
                      <p className="text-2xl font-bold">{collections.length}</p>
                      <p className="text-xs text-muted-foreground">Collections</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Image className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{generations.length}</p>
                      <p className="text-xs text-muted-foreground">Designs</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">0</p>
                      <p className="text-xs text-muted-foreground">Sessions</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">--</p>
                      <p className="text-xs text-muted-foreground">Last Active</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Action */}
              <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
                <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-primary/10">
                      <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Ready to co-create?</h3>
                      <p className="text-sm text-muted-foreground">
                        Start a new design session with Kyle
                      </p>
                    </div>
                  </div>
                  <Button onClick={() => navigate('/shazam')} size="lg">
                    <Zap className="mr-2 h-4 w-4" />
                    Start Session
                  </Button>
                </CardContent>
              </Card>

              {/* Collections Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Your Collections</h2>
                  <Dialog open={isCreatingCollection} onOpenChange={setIsCreatingCollection}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        New Collection
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Collection</DialogTitle>
                        <DialogDescription>
                          Organize your designs into collections
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label htmlFor="collection-name">Name</Label>
                          <Input
                            id="collection-name"
                            placeholder="My Collection"
                            value={newCollection.name}
                            onChange={(e) => setNewCollection(prev => ({ ...prev, name: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="collection-description">Description</Label>
                          <Textarea
                            id="collection-description"
                            placeholder="What's this collection about?"
                            value={newCollection.description}
                            onChange={(e) => setNewCollection(prev => ({ ...prev, description: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="collection-visibility">Visibility</Label>
                          <Select
                            value={newCollection.visibility}
                            onValueChange={(value: VisibilityType) => 
                              setNewCollection(prev => ({ ...prev, visibility: value }))
                            }
                          >
                            <SelectTrigger id="collection-visibility">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="private">
                                <div className="flex items-center gap-2">
                                  <EyeOff className="h-4 w-4" />
                                  Private
                                </div>
                              </SelectItem>
                              <SelectItem value="shared">
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4" />
                                  Shared
                                </div>
                              </SelectItem>
                              <SelectItem value="public">
                                <div className="flex items-center gap-2">
                                  <Globe className="h-4 w-4" />
                                  Public
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button onClick={handleCreateCollection} className="w-full">
                          Create Collection
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {collections.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="p-8 text-center">
                      <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-medium mb-2">No collections yet</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Create your first collection to organize your designs
                      </p>
                      <Button variant="outline" onClick={() => setIsCreatingCollection(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Collection
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {collections.map(collection => (
                      <Card key={collection.id} className="hover:border-primary/50 transition-colors cursor-pointer">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-base">{collection.name}</CardTitle>
                            <Badge variant="outline" className="flex items-center gap-1">
                              {getVisibilityIcon(collection.visibility)}
                              {collection.visibility}
                            </Badge>
                          </div>
                          {collection.description && (
                            <CardDescription className="line-clamp-2">
                              {collection.description}
                            </CardDescription>
                          )}
                        </CardHeader>
                        <CardContent>
                          <div className="aspect-video rounded-lg bg-muted flex items-center justify-center">
                            {collection.cover_image_url ? (
                              <img 
                                src={collection.cover_image_url} 
                                alt={collection.name}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <FolderOpen className="h-8 w-8 text-muted-foreground" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            {generations.filter(g => g.collection_id === collection.id).length} designs
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Designs */}
              {generations.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">Recent Designs</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {generations.slice(0, 8).map(gen => (
                      <Card key={gen.id} className="overflow-hidden hover:border-primary/50 transition-colors cursor-pointer">
                        <div className="aspect-square bg-muted">
                          <img 
                            src={gen.image_url} 
                            alt={gen.prompt || 'Design'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {gen.prompt || 'Untitled'}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {getVisibilityIcon(gen.visibility)}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
