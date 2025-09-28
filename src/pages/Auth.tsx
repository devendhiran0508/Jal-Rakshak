import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Droplets, Heart, Users, Home } from 'lucide-react';
import LanguageToggle from '@/components/LanguageToggle';

const Auth: React.FC = () => {
  const { user, profile, signUp, signIn } = useAuth();
  const { t } = useTranslation();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    village: '',
    role: '' as UserRole
  });

  if (user && profile) {
    return <Navigate to={`/dashboard/${profile.role}`} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        if (!formData.name || !formData.village || !formData.role) {
          toast({
            title: t('auth.signupError'),
            description: t('auth.fillAllFields'),
            variant: "destructive"
          });
          setLoading(false);
          return;
        }

        const { error } = await signUp(
          formData.email,
          formData.password,
          formData.name,
          formData.village,
          formData.role
        );

        if (error) {
          toast({
            title: t('auth.signupError'),
            description: error.message,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Success",
            description: t('auth.signupSuccess')
          });
        }
      } else {
        const { error } = await signIn(formData.email, formData.password);

        if (error) {
          toast({
            title: t('auth.loginError'),
            description: error.message,
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'asha': return <Heart className="h-5 w-5" />;
      case 'official': return <Users className="h-5 w-5" />;
      case 'community': return <Users className="h-5 w-5" />;
      case 'villager': return <Home className="h-5 w-5" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Droplets className="h-12 w-12 text-primary mr-2" />
            <div>
              <CardTitle className="text-2xl font-bold text-primary">{t('appName')}</CardTitle>
              <CardDescription className="text-secondary">{t('appSubtitle')}</CardDescription>
            </div>
          </div>
          <div className="flex items-center justify-between mb-2">
            <CardDescription>
              {isSignUp ? t('auth.signupTitle') : t('auth.loginTitle')}
            </CardDescription>
            <LanguageToggle />
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.password')}</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            {isSignUp && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">{t('auth.fullName')}</Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="village">{t('auth.village')}</Label>
                  <Input
                    id="village"
                    type="text"
                    value={formData.village}
                    onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">{t('auth.role')}</Label>
                  <Select onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('auth.selectRole')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asha">
                        <div className="flex items-center">
                          {getRoleIcon('asha')}
                          <span className="ml-2">{t('roles.asha')}</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="official">
                        <div className="flex items-center">
                          {getRoleIcon('official')}
                          <span className="ml-2">{t('roles.official')}</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="community">
                        <div className="flex items-center">
                          {getRoleIcon('community')}
                          <span className="ml-2">{t('roles.community')}</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="villager">
                        <div className="flex items-center">
                          {getRoleIcon('villager')}
                          <span className="ml-2">{t('roles.villager')}</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('auth.loading') : (isSignUp ? t('auth.signup') : t('auth.login'))}
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm"
              >
                {isSignUp ? t('auth.alreadyHaveAccount') : t('auth.dontHaveAccount')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;