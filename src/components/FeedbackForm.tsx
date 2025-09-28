import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { MessageSquare, Send, Clock, CheckCircle, Eye } from 'lucide-react';
import { z } from 'zod';

interface Feedback {
  id: string;
  message: string;
  village: string;
  status: string;
  response?: string;
  created_at: string;
  updated_at: string;
}

const feedbackSchema = z.object({
  message: z.string()
    .trim()
    .min(10, 'Message must be at least 10 characters')
    .max(1000, 'Message must be less than 1000 characters')
});

const FeedbackForm: React.FC = () => {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback[]>([]);

  useEffect(() => {
    if (profile?.user_id) {
      fetchUserFeedback();
    }
  }, [profile?.user_id]);

  const fetchUserFeedback = async () => {
    if (!profile?.user_id) return;

    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .eq('submitted_by', profile.user_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching feedback:', error);
    } else {
      setFeedback(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.user_id || !profile?.village) return;

    try {
      // Validate input
      const validatedData = feedbackSchema.parse({ message });
      
      setLoading(true);

      const { error } = await supabase
        .from('feedback')
        .insert([
          {
            message: validatedData.message,
            village: profile.village,
            submitted_by: profile.user_id
          }
        ]);

      if (error) {
        toast({
          title: t('messages.error'),
          description: t('feedback.error'),
          variant: "destructive"
        });
      } else {
        toast({
          title: t('messages.success'),
          description: t('feedback.success')
        });
        setMessage('');
        fetchUserFeedback();
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: t('messages.error'),
          description: error.errors[0].message,
          variant: "destructive"
        });
      } else {
        toast({
          title: t('messages.error'),
          description: t('feedback.error'),
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'reviewed':
        return <Eye className="h-4 w-4 text-blue-500" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'reviewed':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'resolved':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            {t('feedback.title')}
          </CardTitle>
          <CardDescription>
            {t('feedback.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="feedback-message">{t('feedback.form.message')}</Label>
              <Textarea
                id="feedback-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t('feedback.form.messagePlaceholder')}
                required
                className="min-h-[100px] resize-none"
                maxLength={1000}
              />
              <div className="text-xs text-muted-foreground text-right">
                {message.length}/1000
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={loading || message.trim().length < 10} 
              className="w-full"
            >
              <Send className="h-4 w-4 mr-2" />
              {loading ? t('feedback.form.submitting') : t('feedback.form.submit')}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Previous Feedback */}
      {feedback.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('feedback.yourFeedback')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {feedback.map((item) => (
                <div
                  key={item.id}
                  className={`border rounded-lg p-4 ${getStatusColor(item.status)}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(item.status)}
                      <span className="text-sm font-medium">
                        {t(`feedback.status.${item.status}`)}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">{item.message}</p>
                  
                  {item.response && (
                    <div className="border-t pt-3 mt-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        {t('feedback.response')}:
                      </p>
                      <p className="text-sm">{item.response}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {feedback.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">{t('feedback.noFeedback')}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FeedbackForm;