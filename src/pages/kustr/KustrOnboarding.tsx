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
import { Loader2, Building2, User, CheckCircle, ArrowRight, ArrowLeft, MapPin, Globe, Mail } from 'lucide-react';

const timezones = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Phoenix', label: 'Arizona Time' },
  { value: 'America/Anchorage', label: 'Alaska Time' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Central Europe (CET)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
];

const KustrOnboarding = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { userRole, hasCompletedOnboarding, refetchProfile, loading: officeLoading } = useKustrOffice();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Office/Studio form state
  const [officeName, setOfficeName] = useState('');
  const [officeLocation, setOfficeLocation] = useState('');
  const [officeAddress, setOfficeAddress] = useState('');
  const [officePhone, setOfficePhone] = useState('');
  const [officeEmail, setOfficeEmail] = useState('');
  const [officeTimezone, setOfficeTimezone] = useState('America/New_York');

  // Profile form state
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
    if (step === 1) {
      if (!officeName.trim()) {
        toast({
          title: 'Studio Name Required',
          description: 'Please enter your design studio name.',
          variant: 'destructive',
        });
        return;
      }
      if (!officeLocation.trim()) {
        toast({
          title: 'Location Required',
          description: 'Please enter your studio location.',
          variant: 'destructive',
        });
        return;
      }
    }
    if (step === 2 && !displayName.trim()) {
      toast({
        title: 'Name Required',
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
    if (!user || !officeName.trim() || !officeLocation.trim() || !displayName.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please complete all required fields.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Create the office/studio
      const { data: officeData, error: officeError } = await supabase
        .from('offices')
        .insert({
          name: officeName.trim(),
          location: officeLocation.trim(),
          address: officeAddress.trim() || null,
          phone: officePhone.trim() || null,
          email: officeEmail.trim() || null,
          timezone: officeTimezone,
        })
        .select()
        .single();

      if (officeError) throw officeError;

      // Create user role (managing_partner for new registrations)
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role: 'managing_partner',
          office_id: officeData.id,
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
          office_id: officeData.id,
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
              office_id: officeData.id,
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
        title: 'Welcome!',
        description: 'Your design studio has been created successfully.',
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />

      <Card className="w-full max-w-lg border-border bg-card relative z-10">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-xl bg-primary flex items-center justify-center shadow-lg">
            {step === 1 && <Building2 className="h-8 w-8 text-primary-foreground" />}
            {step === 2 && <User className="h-8 w-8 text-primary-foreground" />}
            {step === 3 && <CheckCircle className="h-8 w-8 text-primary-foreground" />}
          </div>
          <CardTitle className="text-2xl text-card-foreground">
            {step === 1 && 'Create Your Studio'}
            {step === 2 && 'Your Profile'}
            {step === 3 && 'Confirm Setup'}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {step === 1 && 'Set up your design studio information'}
            {step === 2 && 'Tell us about yourself'}
            {step === 3 && 'Review and complete your setup'}
          </CardDescription>

          {/* Progress indicators */}
          <div className="flex justify-center gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 w-12 rounded-full transition-colors ${
                  s <= step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="officeName">Studio Name *</Label>
                <Input
                  id="officeName"
                  value={officeName}
                  onChange={(e) => setOfficeName(e.target.value)}
                  placeholder="My Design Studio"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="officeLocation">Location *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="officeLocation"
                    value={officeLocation}
                    onChange={(e) => setOfficeLocation(e.target.value)}
                    placeholder="New York, NY"
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="officeAddress">Address</Label>
                <Input
                  id="officeAddress"
                  value={officeAddress}
                  onChange={(e) => setOfficeAddress(e.target.value)}
                  placeholder="123 Design Street, Suite 100"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="officePhone">Phone</Label>
                  <Input
                    id="officePhone"
                    value={officePhone}
                    onChange={(e) => setOfficePhone(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="officeEmail">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="officeEmail"
                      value={officeEmail}
                      onChange={(e) => setOfficeEmail(e.target.value)}
                      placeholder="hello@studio.com"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="officeTimezone">Timezone</Label>
                <Select value={officeTimezone} onValueChange={setOfficeTimezone}>
                  <SelectTrigger>
                    <Globe className="mr-2 h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {timezones.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Full Name *</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="John Smith"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Job Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Managing Partner"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about your experience and expertise..."
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Studio Details
                </h4>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name</span>
                  <span className="text-foreground font-medium">{officeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Location</span>
                  <span className="text-foreground">{officeLocation}</span>
                </div>
                {officeEmail && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email</span>
                    <span className="text-foreground">{officeEmail}</span>
                  </div>
                )}
              </div>
              <div className="bg-muted rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-foreground flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Your Profile
                </h4>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name</span>
                  <span className="text-foreground font-medium">{displayName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Title</span>
                  <span className="text-foreground">{title || 'Managing Partner'}</span>
                </div>
                {phone && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone</span>
                    <span className="text-foreground">{phone}</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground text-center">
                As a Managing Partner, you'll have full access to manage your studio,
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
                className="flex-1"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            )}
            {step < 3 ? (
              <Button
                type="button"
                onClick={handleNextStep}
                className="flex-1"
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleComplete}
                disabled={loading}
                className="flex-1"
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
