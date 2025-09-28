import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { BookOpen, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';

interface EducationContent {
  id: string;
  title: string;
  content: string;
  category: string;
  priority: number;
  image_url?: string;
  created_at: string;
}

interface HealthEducationProps {
  userRole: 'villager' | 'community' | 'asha' | 'official';
}

const HealthEducation: React.FC<HealthEducationProps> = ({ userRole }) => {
  const { t } = useTranslation();
  const [educationContent, setEducationContent] = useState<EducationContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchEducationContent();
  }, [userRole]);

  const fetchEducationContent = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('education')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: t('messages.error'),
        description: 'Failed to fetch education content',
        variant: "destructive"
      });
    } else {
      setEducationContent(data || []);
    }
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
        return '💧';
      case 'hygiene':
        return '🧼';
      case 'health_awareness':
        return '🏥';
      case 'community_engagement':
        return '👥';
      case 'seasonal_health':
        return '🌧️';
      default:
        return '📚';
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
          <div className="space-y-4">
            {educationContent.map((content) => {
              const isExpanded = expandedCards.has(content.id);
              const shortContent = content.content.slice(0, 150);
              const needsExpansion = content.content.length > 150;

              return (
                <div
                  key={content.id}
                  className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-green-50 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getCategoryIcon(content.category)}</span>
                      <div>
                        <h4 className="font-semibold text-primary">{content.title}</h4>
                        <span className="text-xs text-muted-foreground bg-white/60 px-2 py-1 rounded-full">
                          {t(`education.categories.${content.category}`)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground leading-relaxed">
                    <p>
                      {isExpanded || !needsExpansion ? content.content : `${shortContent}...`}
                    </p>
                  </div>

                  {needsExpansion && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(content.id)}
                      className="mt-2 p-0 h-auto font-normal text-primary hover:text-primary/80"
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
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HealthEducation;