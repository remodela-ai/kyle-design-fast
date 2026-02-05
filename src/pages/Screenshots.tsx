 import { useState, useEffect, useRef } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { Button } from '@/components/ui/button';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { useToast } from '@/hooks/use-toast';
 import { Loader2, Upload, Trash2, Download, Image, ArrowLeft } from 'lucide-react';
 import { useNavigate } from 'react-router-dom';
 import { useAuth } from '@/hooks/useAuth';
 
 interface Screenshot {
   name: string;
   url: string;
   created_at: string;
 }
 
 const BUCKET_NAME = 'doc-screenshots';
 
 const Screenshots = () => {
   const { toast } = useToast();
   const navigate = useNavigate();
   const { isAuthenticated } = useAuth();
   const fileInputRef = useRef<HTMLInputElement>(null);
   
   const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
   const [loading, setLoading] = useState(true);
   const [uploading, setUploading] = useState(false);
   const [selectedFile, setSelectedFile] = useState<File | null>(null);
 
   const fetchScreenshots = async () => {
     try {
       const { data, error } = await supabase.storage
         .from(BUCKET_NAME)
         .list('', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });
 
       if (error) throw error;
 
       const screenshotsWithUrls = (data || [])
         .filter(file => file.name !== '.emptyFolderPlaceholder')
         .map(file => ({
           name: file.name,
           url: supabase.storage.from(BUCKET_NAME).getPublicUrl(file.name).data.publicUrl,
           created_at: file.created_at || '',
         }));
 
       setScreenshots(screenshotsWithUrls);
     } catch (error) {
       console.error('Error fetching screenshots:', error);
       toast({
         title: 'Error',
         description: 'No se pudieron cargar los screenshots',
         variant: 'destructive',
       });
     } finally {
       setLoading(false);
     }
   };
 
   useEffect(() => {
     fetchScreenshots();
   }, []);
 
   const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (file) {
       setSelectedFile(file);
     }
   };
 
   const handleUpload = async () => {
     if (!selectedFile) return;
 
     if (!isAuthenticated) {
       toast({
         title: 'Error',
         description: 'Debes iniciar sesión para subir screenshots',
         variant: 'destructive',
       });
       return;
     }
 
     setUploading(true);
     try {
       const fileName = `${Date.now()}-${selectedFile.name.replace(/\s+/g, '-')}`;
       
       const { error } = await supabase.storage
         .from(BUCKET_NAME)
         .upload(fileName, selectedFile);
 
       if (error) throw error;
 
       toast({
         title: 'Éxito',
         description: 'Screenshot subido correctamente',
       });
 
       setSelectedFile(null);
       if (fileInputRef.current) {
         fileInputRef.current.value = '';
       }
       fetchScreenshots();
     } catch (error: any) {
       console.error('Error uploading:', error);
       toast({
         title: 'Error',
         description: error.message || 'No se pudo subir el screenshot',
         variant: 'destructive',
       });
     } finally {
       setUploading(false);
     }
   };
 
   const handleDelete = async (fileName: string) => {
     if (!isAuthenticated) {
       toast({
         title: 'Error',
         description: 'Debes iniciar sesión para eliminar screenshots',
         variant: 'destructive',
       });
       return;
     }
 
     try {
       const { error } = await supabase.storage
         .from(BUCKET_NAME)
         .remove([fileName]);
 
       if (error) throw error;
 
       toast({
         title: 'Éxito',
         description: 'Screenshot eliminado',
       });
       fetchScreenshots();
     } catch (error: any) {
       console.error('Error deleting:', error);
       toast({
         title: 'Error',
         description: error.message || 'No se pudo eliminar el screenshot',
         variant: 'destructive',
       });
     }
   };
 
   const copyUrl = (url: string) => {
     navigator.clipboard.writeText(url);
     toast({
       title: 'Copiado',
       description: 'URL copiada al portapapeles',
     });
   };
 
   return (
     <div className="min-h-screen bg-background">
       <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="flex items-center justify-between h-16">
             <div className="flex items-center gap-4">
               <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                 <ArrowLeft className="h-5 w-5" />
               </Button>
               <h1 className="text-xl font-semibold text-foreground">
                 Screenshots de Documentación
               </h1>
             </div>
           </div>
         </div>
       </header>
 
       <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
         {/* Upload Section */}
         {isAuthenticated && (
           <Card className="mb-8">
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <Upload className="h-5 w-5" />
                 Subir Screenshot
               </CardTitle>
             </CardHeader>
             <CardContent>
               <div className="flex flex-col sm:flex-row gap-4">
                 <div className="flex-1">
                   <Label htmlFor="screenshot" className="sr-only">
                     Seleccionar archivo
                   </Label>
                   <Input
                     ref={fileInputRef}
                     id="screenshot"
                     type="file"
                     accept="image/*"
                     onChange={handleFileSelect}
                     disabled={uploading}
                   />
                 </div>
                 <Button
                   onClick={handleUpload}
                   disabled={!selectedFile || uploading}
                 >
                   {uploading ? (
                     <>
                       <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                       Subiendo...
                     </>
                   ) : (
                     <>
                       <Upload className="h-4 w-4 mr-2" />
                       Subir
                     </>
                   )}
                 </Button>
               </div>
               {selectedFile && (
                 <p className="text-sm text-muted-foreground mt-2">
                   Archivo seleccionado: {selectedFile.name}
                 </p>
               )}
             </CardContent>
           </Card>
         )}
 
         {/* Screenshots Gallery */}
         <Card>
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <Image className="h-5 w-5" />
               Galería de Screenshots ({screenshots.length})
             </CardTitle>
           </CardHeader>
           <CardContent>
             {loading ? (
               <div className="flex items-center justify-center py-12">
                 <Loader2 className="h-8 w-8 animate-spin text-primary" />
               </div>
             ) : screenshots.length === 0 ? (
               <div className="text-center py-12 text-muted-foreground">
                 <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
                 <p>No hay screenshots todavía</p>
                 <p className="text-sm mt-1">Sube tu primer screenshot para comenzar</p>
               </div>
             ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {screenshots.map((screenshot) => (
                   <div
                     key={screenshot.name}
                     className="group relative border border-border rounded-lg overflow-hidden bg-card"
                   >
                     <div className="aspect-video relative">
                       <img
                         src={screenshot.url}
                         alt={screenshot.name}
                         className="w-full h-full object-cover"
                       />
                     </div>
                     <div className="p-3">
                       <p className="text-sm font-medium truncate" title={screenshot.name}>
                         {screenshot.name}
                       </p>
                       <div className="flex gap-2 mt-2">
                         <Button
                           variant="outline"
                           size="sm"
                           className="flex-1"
                           onClick={() => copyUrl(screenshot.url)}
                         >
                           <Download className="h-3 w-3 mr-1" />
                           Copiar URL
                         </Button>
                         {isAuthenticated && (
                           <Button
                             variant="destructive"
                             size="sm"
                             onClick={() => handleDelete(screenshot.name)}
                           >
                             <Trash2 className="h-3 w-3" />
                           </Button>
                         )}
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             )}
           </CardContent>
         </Card>
 
         {/* Instructions */}
         <Card className="mt-8">
           <CardHeader>
             <CardTitle>Instrucciones de Uso</CardTitle>
           </CardHeader>
           <CardContent className="prose prose-sm dark:prose-invert max-w-none">
             <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
               <li>Inicia sesión para poder subir y eliminar screenshots</li>
               <li>Sube screenshots de las secciones de la aplicación</li>
               <li>Copia la URL del screenshot usando el botón "Copiar URL"</li>
               <li>Usa la URL en el código de documentación reemplazando las imágenes actuales</li>
             </ol>
             <div className="mt-4 p-4 bg-muted rounded-lg">
               <p className="text-sm font-mono">
                 Ejemplo de uso en código:
               </p>
               <pre className="text-xs mt-2 overflow-x-auto">
                 {`<img src="URL_DEL_SCREENSHOT" alt="Dashboard" />`}
               </pre>
             </div>
           </CardContent>
         </Card>
       </main>
     </div>
   );
 };
 
 export default Screenshots;