import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useKustrOffice } from '@/contexts/KustrOfficeContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Building2, User, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';

const KustrOnboarding = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { offices, userRole, hasCompletedOnboarding, refetchProfile, loading: officeLoading } = useKustrOffice();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form state
  const [selectedOfficeId, setSelectedOfficeId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [title, setTitle] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/kustr/auth');
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Redirect if already onboarded
  useEffect(() => {
    if (!officeLoading && userRole && hasCompletedOnboarding) {
      navigate('/kustr/dashboard');
    }
  }, [officeLoading, userRole, hasCompletedOnboarding, navigate]);

  // Pre-fill name from email
  useEffect(() => {
    if (user?.email && !displayName) {
      const namePart = user.email.split('@')[0];
      const formattedName = namePart
        .replace(/[._]/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      setDisplayName(formattedName);
    }
  }, [user?.email, displayName]);

  const handleNextStep = () => {
    if (step === 1 && !selectedOfficeId) {
      toast({
        title: 'Please select an office',
        description: 'You must select an office to continue.',
        variant: 'destructive',
      });
      return;
    }
    if (step === 2 && !displayName.trim()) {
      toast({
        title: 'Please enter your name',
        description: 'Your display name is required.',
        variant: 'destructive',
      });
      return;
    }
    setStep(step + 1);
  };

  const handlePreviousStep = () => {
    setStep(step - 1);
  };

  const handleComplete = async () => {
    if (!user || !selectedOfficeId || !displayName.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please complete all required fields.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Create user role (managing_partner for new registrations)
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role: 'managing_partner',
          office_id: selectedOfficeId,
        });

      if (roleError) {
        // If role already exists, just continue
        if (!roleError.message.includes('duplicate')) {
          throw roleError;
        }
      }

      // Create team member profile
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          user_id: user.id,
          office_id: selectedOfficeId,
          display_name: displayName.trim(),
          title: title.trim() || 'Managing Partner',
          phone: phone.trim() || null,
          bio: bio.trim() || null,
          is_active: true,
          onboarding_completed: true,
        });

      if (memberError) {
        // If profile already exists, update it
        if (memberError.message.includes('duplicate')) {
          const { error: updateError } = await supabase
            .from('team_members')
            .update({
              display_name: displayName.trim(),
              title: title.trim() || 'Managing Partner',
              phone: phone.trim() || null,
              bio: bio.trim() || null,
              onboarding_completed: true,
            })
            .eq('user_id', user.id);

          if (updateError) throw updateError;
        } else {
          throw memberError;
        }
      }

      await refetchProfile();

      toast({
        title: 'Welcome to Kustr Design!',
        description: 'Your account has been set up successfully.',
      });

      navigate('/kustr/dashboard');
    } catch (error: any) {
      console.error('Onboarding error:', error);
      toast({
        title: 'Setup Error',
        description: error.message || 'Failed to complete setup. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || officeLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  const selectedOffice = offices.find(o => o.id === selectedOfficeId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMDIwMjAiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />

      <Card className="w-full max-w-lg border-slate-700 bg-slate-800/90 backdrop-blur-sm relative z-10">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
            {step === 1 && <Building2 className="h-8 w-8 text-white" />}
            {step === 2 && <User className="h-8 w-8 text-white" />}
            {step === 3 && <CheckCircle className="h-8 w-8 text-white" />}
          </div>
          <CardTitle className="text-2xl text-white">
            {step === 1 && 'Select Your Office'}
            {step === 2 && 'Your Profile'}
            {step === 3 && 'Confirm Setup'}
          </CardTitle>
          <CardDescription className="text-slate-400">
            {step === 1 && 'Choose the office you will be managing'}
            {step === 2 && 'Tell us about yourself'}
            {step === 3 && 'Review and complete your setup'}
          </CardDescription>

          {/* Progress indicators */}
          <div className="flex justify-center gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 w-12 rounded-full transition-colors ${
                  s <= step ? 'bg-amber-500' : 'bg-slate-600'
                }`}
              />
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <Label className="text-slate-200">Office Location</Label>
              <Select value={selectedOfficeId} onValueChange={setSelectedOfficeId}>
                <SelectTrigger className="bg-slate-900/50 border-slate-600 text-white">
                  <SelectValue placeholder="Select your office" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  {offices.map((office) => (
                    <SelectItem 
                      key={office.id} 
                      value={office.id}
                      className="text-white hover:bg-slate-700"
                    >
                      {office.name} - {office.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-slate-200">Full Name *</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="John Smith"
                  className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title" className="text-slate-200">Job Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Managing Partner"
                  className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-slate-200">Phone</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio" className="text-slate-200">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about your experience and expertise..."
                  rows={3}
                  className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 resize-none"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-slate-900/50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Office</span>
                  <span className="text-white font-medium">{selectedOffice?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Location</span>
                  <span className="text-white">{selectedOffice?.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Name</span>
                  <span className="text-white font-medium">{displayName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Title</span>
                  <span className="text-white">{title || 'Managing Partner'}</span>
                </div>
                {phone && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Phone</span>
                    <span className="text-white">{phone}</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-slate-400 text-center">
                As a Managing Partner, you'll have full access to manage your office,
                team members, clients, projects, and marketing.
              </p>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-3">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={handlePreviousStep}
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            )}
            {step < 3 ? (
              <Button
                type="button"
                onClick={handleNextStep}
                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleComplete}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Complete Setup
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default KustrOnboarding;
