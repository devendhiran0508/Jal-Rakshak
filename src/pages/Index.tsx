import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Droplets, Heart, Users, Home, Shield, ArrowRight } from 'lucide-react';

const Index = () => {
  const { user, profile } = useAuth();

  // If user is logged in, redirect to their dashboard
  if (user && profile) {
    return <Navigate to={`/dashboard/${profile.role}`} replace />;
  }

  const roles = [
    {
      key: 'asha',
      title: 'ASHA Worker',
      description: 'Submit health reports and monitor community health',
      icon: <Heart className="h-12 w-12 text-primary" />,
      color: 'from-red-100 to-pink-100'
    },
    {
      key: 'official',
      title: 'Health Official',
      description: 'Monitor reports, analyze data, and send alerts',
      icon: <Shield className="h-12 w-12 text-secondary" />,
      color: 'from-blue-100 to-indigo-100'
    },
    {
      key: 'community',
      title: 'Community Member',
      description: 'Access health education and receive alerts',
      icon: <Users className="h-12 w-12 text-accent" />,
      color: 'from-green-100 to-emerald-100'
    },
    {
      key: 'villager',
      title: 'Villager',
      description: 'Monitor water quality and receive health alerts',
      icon: <Home className="h-12 w-12 text-orange-500" />,
      color: 'from-yellow-100 to-orange-100'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-8">
            <Droplets className="h-16 w-16 text-primary mr-4" />
            <div>
              <h1 className="text-5xl font-bold text-primary mb-2">Jal Rakshak</h1>
              <p className="text-xl text-secondary font-semibold">Water & Health Guardian</p>
            </div>
          </div>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            A comprehensive platform for monitoring water quality and community health. 
            Empowering ASHA workers, health officials, and communities to work together 
            for better health outcomes.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg">
              <Link to="/auth">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {roles.map((role) => (
            <Card key={role.key} className={`bg-gradient-to-br ${role.color} border-0 shadow-lg hover:shadow-xl transition-shadow`}>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  {role.icon}
                </div>
                <CardTitle className="text-xl">{role.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-gray-700">
                  {role.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Key Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="text-center">
            <CardHeader>
              <Heart className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>Health Monitoring</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Real-time health report submission and monitoring system for community health workers
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Droplets className="h-12 w-12 text-secondary mx-auto mb-4" />
              <CardTitle>Water Quality</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Live sensor data monitoring pH levels and turbidity for safe drinking water
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Shield className="h-12 w-12 text-accent mx-auto mb-4" />
              <CardTitle>Alert System</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Instant alerts and health education content delivery to communities
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
