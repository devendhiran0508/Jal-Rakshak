import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Droplets, Heart, Users, Home } from 'lucide-react';

const Auth: React.FC = () => {
  const { user, profile, signUp, signIn } = useAuth();
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
            title: "Error",
            description: "Please fill in all fields",
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
            title: "Signup Error",
            description: error.message,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Success",
            description: "Account created successfully! Please check your email to verify your account."
          });
        }
      } else {
        const { error } = await signIn(formData.email, formData.password);

        if (error) {
          toast({
            title: "Login Error",
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
              <CardTitle className="text-2xl font-bold text-primary">Jal Rakshak</CardTitle>
              <CardDescription className="text-secondary">Water & Health Guardian</CardDescription>
            </div>
          </div>
          <CardDescription>
            {isSignUp ? 'Create your account' : 'Sign in to your account'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
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
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="village">Village</Label>
                  <Input
                    id="village"
                    type="text"
                    value={formData.village}
                    onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asha">
                        <div className="flex items-center">
                          {getRoleIcon('asha')}
                          <span className="ml-2">ASHA Worker</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="official">
                        <div className="flex items-center">
                          {getRoleIcon('official')}
                          <span className="ml-2">Health Official</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="community">
                        <div className="flex items-center">
                          {getRoleIcon('community')}
                          <span className="ml-2">Community Member</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="villager">
                        <div className="flex items-center">
                          {getRoleIcon('villager')}
                          <span className="ml-2">Villager</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm"
              >
                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;