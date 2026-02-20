import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Link2, Unlink, Check, ArrowLeft } from "lucide-react";
import { useKyleConnectors, AVAILABLE_CONNECTORS, ConnectorType } from "@/hooks/useKyleConnectors";
import { useNavigate } from "react-router-dom";
import kyleAvatar from "@/assets/kyle-avatar.jpeg";

export default function KyleConnectors() {
  const navigate = useNavigate();
  const { 
    connectors, 
    loading, 
    addConnector, 
    removeConnector, 
    toggleConnector,
    getConnectorByType 
  } = useKyleConnectors();

  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<ConnectorType | null>(null);
  const [connectorUuid, setConnectorUuid] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConnect = async () => {
    if (!selectedType || !connectorUuid.trim()) return;
    
    setIsSubmitting(true);
    const success = await addConnector(selectedType, connectorUuid.trim(), displayName.trim() || undefined);
    setIsSubmitting(false);
    
    if (success) {
      setConnectDialogOpen(false);
      setConnectorUuid("");
      setDisplayName("");
      setSelectedType(null);
    }
  };

  const handleDisconnect = async (id: string) => {
    await removeConnector(id);
  };

  const openConnectDialog = (type: ConnectorType) => {
    setSelectedType(type);
    setConnectDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const selectedConfig = AVAILABLE_CONNECTORS.find(c => c.type === selectedType);

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        
        <div className="flex items-center gap-4">
          <img 
            src={kyleAvatar} 
            alt="Kyle" 
            className="w-16 h-16 rounded-full object-cover border-4 border-primary shadow-lg"
          />
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Connect Your Tools with Kyle
            </h1>
            <p className="text-muted-foreground mt-1">
              Kyle will use these connections to execute tasks on your behalf
            </p>
          </div>
        </div>
      </div>

      {/* Connected Count */}
      <div className="mb-6">
        <Badge variant="secondary" className="text-sm">
          {connectors.filter(c => c.is_active).length} of {AVAILABLE_CONNECTORS.length} tools connected
        </Badge>
      </div>

      {/* Connectors Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {AVAILABLE_CONNECTORS.map((config) => {
          const connector = getConnectorByType(config.type);
          const isConnected = !!connector;

          return (
            <Card 
              key={config.type}
              className={`transition-all ${
                isConnected 
                  ? 'border-primary/50 bg-primary/5' 
                  : 'hover:border-primary/30'
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{config.icon}</span>
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {config.name}
                        {isConnected && connector?.is_active && (
                          <Check className="w-4 h-4 text-primary" />
                        )}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {config.description}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isConnected ? (
                  <div className="space-y-3">
                    {connector?.display_name && (
                      <p className="text-sm text-muted-foreground">
                        {connector.display_name}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={connector?.is_active ?? false}
                          onCheckedChange={(checked) => 
                            connector && toggleConnector(connector.id, checked)
                          }
                        />
                        <span className="text-sm text-muted-foreground">
                          {connector?.is_active ? 'Active' : 'Paused'}
                        </span>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => connector && handleDisconnect(connector.id)}
                      >
                        <Unlink className="w-4 h-4 mr-1" />
                        Disconnect
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => openConnectDialog(config.type)}
                  >
                    <Link2 className="w-4 h-4 mr-2" />
                     Connect
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Connect Dialog */}
      <Dialog open={connectDialogOpen} onOpenChange={setConnectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{selectedConfig?.icon}</span>
              Connect {selectedConfig?.name}
            </DialogTitle>
            <DialogDescription>
              Enter the connection identifier so Kyle can access {selectedConfig?.name}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="connector-uuid">Connection ID *</Label>
              <Input
                id="connector-uuid"
                placeholder="E.g.: ab7e-450f-9cb9-b9467fb0adda"
                value={connectorUuid}
                onChange={(e) => setConnectorUuid(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                You get this identifier when authorizing the application
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="display-name">Custom name (optional)</Label>
              <Input
                id="display-name"
                placeholder={`My ${selectedConfig?.name}`}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setConnectDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConnect}
              disabled={!connectorUuid.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4 mr-2" />
                  Connect
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Info Footer */}
      <div className="mt-8 p-4 rounded-lg bg-muted/50 border border-border">
        <h3 className="font-medium text-foreground mb-2">🔒 Security</h3>
        <p className="text-sm text-muted-foreground">
          Your connections are private and only Kyle can use them to execute tasks on your behalf. 
          Other team members do not have access to your connected tools.
        </p>
      </div>
    </div>
  );
}
