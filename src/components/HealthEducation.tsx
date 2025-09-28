import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { BookOpen, ChevronDown, ChevronUp, Lightbulb, Droplets, HandHeart, Heart, Shield } from 'lucide-react';

interface EducationContent {
  id: string;
  title: string;
  content: string;
  category: string;
  priority: number;
  image_url?: string;
  created_at: string;
  language: string;
  target_role: string;
}

interface HealthEducationProps {
  userRole: 'villager' | 'community' | 'asha' | 'official';
}

const HealthEducation: React.FC<HealthEducationProps> = ({ userRole }) => {
  const { t, i18n } = useTranslation();
  const [educationContent, setEducationContent] = useState<EducationContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchEducationContent();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('education-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'education'
        },
        () => {
          fetchEducationContent();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userRole, i18n.language]);

  const fetchEducationContent = async () => {
    setLoading(true);
    const currentLang = i18n.language;
    
    // Fetch content for current language
    const { data: langData, error: langError } = await supabase
      .from('education')
      .select('*')
      .eq('is_active', true)
      .eq('language', currentLang)
      .in('target_role', [userRole, 'community'])
      .order('priority', { ascending: true })
      .order('created_at', { ascending: false });

    let content = langData || [];

    // If no content in current language or error, fallback to English
    if (!content.length || langError) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('education')
        .select('*')
        .eq('is_active', true)
        .eq('language', 'en')
        .in('target_role', [userRole, 'community'])
        .order('priority', { ascending: true })
        .order('created_at', { ascending: false });

      if (fallbackError) {
        toast({
          title: t('messages.error'),
          description: 'Failed to fetch education content',
          variant: "destructive"
        });
      } else {
        content = fallbackData || [];
        if (currentLang !== 'en' && content.length > 0) {
          toast({
            title: t('education.fallbackNotice'),
            description: t('education.fallbackDescription')
          });
        }
      }
    }

    setEducationContent(content);
    setLoading(false);
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCards(newExpanded);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'water_safety':
        return <Droplets className="h-6 w-6 text-blue-500" />;
      case 'hygiene':
        return <HandHeart className="h-6 w-6 text-green-500" />;
      case 'health_awareness':
        return <Heart className="h-6 w-6 text-red-500" />;
      case 'community_engagement':
        return <Shield className="h-6 w-6 text-purple-500" />;
      case 'seasonal_health':
        return <BookOpen className="h-6 w-6 text-orange-500" />;
      default:
        return <BookOpen className="h-6 w-6 text-primary" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="h-5 w-5 mr-2" />
            {t('education.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BookOpen className="h-5 w-5 mr-2" />
          {t('education.title')}
        </CardTitle>
        <CardDescription>
          {t('education.subtitle')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {educationContent.length === 0 ? (
          <div className="text-center py-8">
            <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{t('education.noContent')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {educationContent.map((content) => {
              const isExpanded = expandedCards.has(content.id);
              const shortContent = content.content.slice(0, 120);
              const needsExpansion = content.content.length > 120;

              return (
                <div
                  key={content.id}
                  className="group border rounded-lg overflow-hidden bg-gradient-to-br from-background to-muted/20 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer"
                >
                  <div className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      {getCategoryIcon(content.category)}
                      <div className="flex-1">
                        <span className="inline-block text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full mb-2">
                          {t(`education.categories.${content.category}`, content.category)}
                        </span>
                        <h4 className="font-bold text-foreground group-hover:text-primary transition-colors">
                          {content.title}
                        </h4>
                      </div>
                    </div>
                    
                    <div className="text-sm text-muted-foreground leading-relaxed">
                      <p className="mb-3">
                        {isExpanded || !needsExpansion ? content.content : `${shortContent}...`}
                      </p>
                    </div>

                    {needsExpansion && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpanded(content.id)}
                        className="mt-2 p-0 h-auto font-normal text-primary hover:text-primary/80 group-hover:bg-primary/10"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="h-4 w-4 mr-1" />
                            {t('education.readLess')}
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4 mr-1" />
                            {t('education.readMore')}
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HealthEducation;