import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDesignerProfile, DesignSpecialization, CreateProfileData } from '@/hooks/useDesignerProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, ArrowRight, Check } from 'lucide-react';
import kLogoImage from '@/assets/k-logo.png';

const SPECIALIZATIONS: { value: DesignSpecialization; label: string }[] = [
  { value: 'residential', label: 'Residential' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'hospitality', label: 'Hospitality' },
  { value: 'retail', label: 'Retail' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'office', label: 'Office' },
  { value: 'sustainable', label: 'Sustainable' },
  { value: 'luxury', label: 'Luxury' },
  { value: 'minimalist', label: 'Minimalist' },
  { value: 'traditional', label: 'Traditional' },
];

const DesignerOnboarding = () => {
  const navigate = useNavigate();
  const { createProfile } = useDesignerProfile();
  const { toast } = useToast();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateProfileData>({
    display_name: '',
    company_name: '',
    bio: '',
    website_url: '',
    portfolio_url: '',
    contact_email: '',
    specializations: [],
  });

  const handleSpecializationToggle = (spec: DesignSpecialization) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations?.includes(spec)
        ? prev.specializations.filter(s => s !== spec)
        : [...(prev.specializations || []), spec],
    }));
  };

  const handleSubmit = async () => {
    if (!formData.display_name.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter your display name',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const { error } = await createProfile(formData);
    setLoading(false);

    if (error) {
      toast({
        title: 'Error creating profile',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Welcome to Kyle!',
      description: 'Your designer profile has been created.',
    });
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[var(--gradient-glow)] pointer-events-none opacity-50" />
      
      <Card className="w-full max-w-lg relative z-10 border-primary/20">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-white border-2 border-primary flex items-center justify-center shadow-lg">
            <img src={kLogoImage} alt="Kyle" className="h-8 object-contain" />
          </div>
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Welcome to Kyle
          </CardTitle>
          <CardDescription>
            Let's set up your designer profile
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-2">
                <Label htmlFor="display_name">Display Name *</Label>
                <Input
                  id="display_name"
                  placeholder="Your name or studio name"
                  value={formData.display_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name</Label>
                <Input
                  id="company_name"
                  placeholder="Your design studio or firm"
                  value={formData.company_name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contact_email">Contact Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.contact_email || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                />
              </div>
              
              <Button 
                className="w-full" 
                onClick={() => setStep(2)}
                disabled={!formData.display_name.trim()}
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
          
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about your design philosophy and experience..."
                  value={formData.bio || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="website_url">Website</Label>
                <Input
                  id="website_url"
                  type="url"
                  placeholder="https://yourwebsite.com"
                  value={formData.website_url || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, website_url: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="portfolio_url">Portfolio</Label>
                <Input
                  id="portfolio_url"
                  type="url"
                  placeholder="https://behance.net/yourportfolio"
                  value={formData.portfolio_url || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, portfolio_url: e.target.value }))}
                />
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button onClick={() => setStep(3)} className="flex-1">
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          
          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-2">
                <Label>Design Specializations</Label>
                <p className="text-sm text-muted-foreground">
                  Select areas you specialize in (optional)
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  {SPECIALIZATIONS.map(spec => (
                    <Badge
                      key={spec.value}
                      variant={formData.specializations?.includes(spec.value) ? 'default' : 'outline'}
                      className="cursor-pointer transition-all hover:scale-105"
                      onClick={() => handleSpecializationToggle(spec.value)}
                    >
                      {formData.specializations?.includes(spec.value) && (
                        <Check className="h-3 w-3 mr-1" />
                      )}
                      {spec.label}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleSubmit} disabled={loading} className="flex-1">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Start Creating
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
          
          {/* Progress indicator */}
          <div className="flex justify-center gap-2 pt-4">
            {[1, 2, 3].map(s => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all ${
                  s === step ? 'w-8 bg-primary' : 'w-2 bg-muted'
                }`}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DesignerOnboarding;
