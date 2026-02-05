 import { useState } from "react";
 import { useKustrOffice } from "@/contexts/KustrOfficeContext";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Label } from "@/components/ui/label";
 import { Input } from "@/components/ui/input";
 import { Button } from "@/components/ui/button";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 import { Copy, Check, Code, Eye, Smartphone, Monitor } from "lucide-react";
 import { useToast } from "@/hooks/use-toast";
 
 const EmbedGenerator = () => {
   const { office } = useKustrOffice();
   const { toast } = useToast();
   const [copied, setCopied] = useState(false);
   const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
   
   // Configuration state
   const [config, setConfig] = useState({
     primaryColor: '#f59e0b',
     position: 'bottom-right',
     greeting: "Hi! I'm Kyle, your AI design assistant. Tell me about your dream space!"
   });
 
   const widgetUrl = `${window.location.origin}/kyle-widget.js`;
   
   const embedCode = `<!-- Kyle AI Chat Widget -->
 <script src="${widgetUrl}"></script>
 <kyle-widget
   office-id="${office?.id || 'YOUR_OFFICE_ID'}"
   primary-color="${config.primaryColor}"
   position="${config.position}"
   greeting="${config.greeting}"
 ></kyle-widget>`;
 
   const copyToClipboard = async () => {
     await navigator.clipboard.writeText(embedCode);
     setCopied(true);
     toast({
       title: "Copied!",
       description: "Embed code copied to clipboard",
     });
     setTimeout(() => setCopied(false), 2000);
   };
 
   return (
     <div className="min-h-screen bg-background p-6">
       <div className="max-w-7xl mx-auto space-y-6">
         {/* Header */}
         <div>
           <h1 className="text-3xl font-bold text-foreground">Kyle Widget Embed</h1>
           <p className="text-muted-foreground mt-1">
             Add Kyle to your website to capture leads 24/7
           </p>
         </div>
 
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           {/* Configuration Panel */}
           <div className="space-y-6">
             <Card>
               <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                   <Code className="h-5 w-5" />
                   Widget Configuration
                 </CardTitle>
                 <CardDescription>
                   Customize the appearance of your Kyle widget
                 </CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                 {/* Primary Color */}
                 <div className="space-y-2">
                   <Label htmlFor="primaryColor">Primary Color</Label>
                   <div className="flex gap-2">
                     <Input
                       id="primaryColor"
                       type="color"
                       value={config.primaryColor}
                       onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                       className="w-16 h-10 p-1 cursor-pointer"
                     />
                     <Input
                       value={config.primaryColor}
                       onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                       className="flex-1"
                       placeholder="#f59e0b"
                     />
                   </div>
                 </div>
 
                 {/* Position */}
                 <div className="space-y-2">
                   <Label htmlFor="position">Widget Position</Label>
                   <Select
                     value={config.position}
                     onValueChange={(value) => setConfig({ ...config, position: value })}
                   >
                     <SelectTrigger>
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="bottom-right">Bottom Right</SelectItem>
                       <SelectItem value="bottom-left">Bottom Left</SelectItem>
                       <SelectItem value="top-right">Top Right</SelectItem>
                       <SelectItem value="top-left">Top Left</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
 
                 {/* Greeting */}
                 <div className="space-y-2">
                   <Label htmlFor="greeting">Greeting Message</Label>
                   <Input
                     id="greeting"
                     value={config.greeting}
                     onChange={(e) => setConfig({ ...config, greeting: e.target.value })}
                     placeholder="Hi! I'm Kyle..."
                   />
                 </div>
 
                 {/* Preset Colors */}
                 <div className="space-y-2">
                   <Label>Quick Colors</Label>
                   <div className="flex flex-wrap gap-2">
                     {[
                       { color: '#f59e0b', name: 'Amber' },
                       { color: '#3b82f6', name: 'Blue' },
                       { color: '#10b981', name: 'Emerald' },
                       { color: '#8b5cf6', name: 'Violet' },
                       { color: '#ec4899', name: 'Pink' },
                       { color: '#ef4444', name: 'Red' },
                     ].map(({ color, name }) => (
                       <button
                         key={color}
                         onClick={() => setConfig({ ...config, primaryColor: color })}
                         className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                           config.primaryColor === color ? 'border-white ring-2 ring-offset-2 ring-offset-background' : 'border-transparent'
                         }`}
                         style={{ backgroundColor: color }}
                         title={name}
                       />
                     ))}
                   </div>
                 </div>
               </CardContent>
             </Card>
 
             {/* Embed Code */}
             <Card>
               <CardHeader>
                 <CardTitle>Embed Code</CardTitle>
                 <CardDescription>
                   Copy this code and paste it before the closing &lt;/body&gt; tag
                 </CardDescription>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="relative">
                   <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                     <code className="text-foreground">{embedCode}</code>
                   </pre>
                 </div>
                 <Button onClick={copyToClipboard} className="w-full">
                   {copied ? (
                     <>
                       <Check className="h-4 w-4 mr-2" />
                       Copied!
                     </>
                   ) : (
                     <>
                       <Copy className="h-4 w-4 mr-2" />
                       Copy Embed Code
                     </>
                   )}
                 </Button>
               </CardContent>
             </Card>
           </div>
 
           {/* Preview Panel */}
           <Card className="h-fit">
             <CardHeader>
               <div className="flex items-center justify-between">
                 <div>
                   <CardTitle className="flex items-center gap-2">
                     <Eye className="h-5 w-5" />
                     Live Preview
                   </CardTitle>
                   <CardDescription>
                     See how the widget looks on your site
                   </CardDescription>
                 </div>
                 <div className="flex gap-1">
                   <Button
                     variant={previewDevice === 'desktop' ? 'default' : 'ghost'}
                     size="sm"
                     onClick={() => setPreviewDevice('desktop')}
                   >
                     <Monitor className="h-4 w-4" />
                   </Button>
                   <Button
                     variant={previewDevice === 'mobile' ? 'default' : 'ghost'}
                     size="sm"
                     onClick={() => setPreviewDevice('mobile')}
                   >
                     <Smartphone className="h-4 w-4" />
                   </Button>
                 </div>
               </div>
             </CardHeader>
             <CardContent>
               <div
                 className={`relative bg-neutral-800 rounded-lg overflow-hidden transition-all duration-300 ${
                   previewDevice === 'mobile' ? 'w-[375px] mx-auto' : 'w-full'
                 }`}
                 style={{ height: previewDevice === 'mobile' ? '667px' : '500px' }}
               >
                 {/* Simulated website content */}
                 <div className="p-6 space-y-4">
                   <div className="h-8 bg-neutral-700 rounded w-48" />
                   <div className="h-4 bg-neutral-700/50 rounded w-full" />
                   <div className="h-4 bg-neutral-700/50 rounded w-3/4" />
                   <div className="h-4 bg-neutral-700/50 rounded w-5/6" />
                   <div className="h-32 bg-neutral-700/30 rounded mt-6" />
                   <div className="h-4 bg-neutral-700/50 rounded w-2/3" />
                   <div className="h-4 bg-neutral-700/50 rounded w-1/2" />
                 </div>
 
                 {/* Widget Preview */}
                 <WidgetPreview config={config} />
               </div>
             </CardContent>
           </Card>
         </div>
 
         {/* Instructions */}
         <Card>
           <CardHeader>
             <CardTitle>Installation Instructions</CardTitle>
           </CardHeader>
           <CardContent>
             <Tabs defaultValue="html">
               <TabsList>
                 <TabsTrigger value="html">HTML</TabsTrigger>
                 <TabsTrigger value="wordpress">WordPress</TabsTrigger>
                 <TabsTrigger value="shopify">Shopify</TabsTrigger>
               </TabsList>
               <TabsContent value="html" className="space-y-4">
                 <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                   <li>Copy the embed code above</li>
                   <li>Open your website's HTML file</li>
                   <li>Paste the code just before the closing <code className="bg-muted px-1 rounded">&lt;/body&gt;</code> tag</li>
                   <li>Save and refresh your page</li>
                 </ol>
               </TabsContent>
               <TabsContent value="wordpress" className="space-y-4">
                 <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                   <li>Go to Appearance → Theme File Editor</li>
                   <li>Select your theme's <code className="bg-muted px-1 rounded">footer.php</code> file</li>
                   <li>Paste the embed code before <code className="bg-muted px-1 rounded">&lt;/body&gt;</code></li>
                   <li>Or use a plugin like "Insert Headers and Footers"</li>
                 </ol>
               </TabsContent>
               <TabsContent value="shopify" className="space-y-4">
                 <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                   <li>Go to Online Store → Themes → Edit Code</li>
                   <li>Find <code className="bg-muted px-1 rounded">theme.liquid</code> in Layout</li>
                   <li>Paste the embed code before <code className="bg-muted px-1 rounded">&lt;/body&gt;</code></li>
                   <li>Save changes</li>
                 </ol>
               </TabsContent>
             </Tabs>
           </CardContent>
         </Card>
       </div>
     </div>
   );
 };
 
 // Widget Preview Component
 const WidgetPreview = ({ config }: { config: { primaryColor: string; position: string; greeting: string } }) => {
   const [isOpen, setIsOpen] = useState(false);
 
   const positionClasses: Record<string, string> = {
     'bottom-right': 'bottom-4 right-4',
     'bottom-left': 'bottom-4 left-4',
     'top-right': 'top-4 right-4',
     'top-left': 'top-4 left-4',
   };
 
   const chatPositionClasses: Record<string, string> = {
     'bottom-right': 'bottom-16 right-0',
     'bottom-left': 'bottom-16 left-0',
     'top-right': 'top-16 right-0',
     'top-left': 'top-16 left-0',
   };
 
   return (
     <div className={`absolute ${positionClasses[config.position]}`}>
       {/* Chat Window */}
       {isOpen && (
         <div
           className={`absolute ${chatPositionClasses[config.position]} w-72 bg-[#0a0a0a] rounded-lg border border-neutral-800 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-2`}
         >
           {/* Header */}
           <div
             className="p-3 flex items-center gap-2"
             style={{ background: `linear-gradient(135deg, ${config.primaryColor} 0%, ${config.primaryColor}cc 100%)` }}
           >
             <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm">
               🏠
             </div>
             <div>
               <p className="text-white font-semibold text-sm">Kyle</p>
               <p className="text-white/80 text-xs">AI Design Assistant</p>
             </div>
           </div>
 
           {/* Messages */}
           <div className="p-3 h-48 overflow-y-auto">
             <div className="bg-neutral-800 rounded-lg rounded-bl-sm p-2 text-xs text-neutral-200 max-w-[85%]">
               {config.greeting}
             </div>
           </div>
 
           {/* Input */}
           <div className="p-2 border-t border-neutral-800 bg-neutral-900 flex gap-2">
             <input
               type="text"
               placeholder="Type a message..."
               className="flex-1 bg-neutral-800 border border-neutral-700 rounded-full px-3 py-1.5 text-xs text-white placeholder:text-neutral-500"
               readOnly
             />
             <button
               className="w-8 h-8 rounded-full flex items-center justify-center"
               style={{ backgroundColor: config.primaryColor }}
             >
               <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                 <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
               </svg>
             </button>
           </div>
         </div>
       )}
 
       {/* Bubble */}
       <button
         onClick={() => setIsOpen(!isOpen)}
         className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105"
         style={{ background: `linear-gradient(135deg, ${config.primaryColor} 0%, ${config.primaryColor}cc 100%)` }}
       >
         {isOpen ? (
           <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
             <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
           </svg>
         ) : (
           <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
             <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
           </svg>
         )}
       </button>
     </div>
   );
 };
 
 export default EmbedGenerator;