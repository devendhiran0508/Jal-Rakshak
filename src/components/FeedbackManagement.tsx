import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { MessageSquare, Clock, CheckCircle, Eye, Reply } from 'lucide-react';

interface FeedbackItem {
  id: string;
  message: string;
  village: string;
  status: string;
  response?: string;
  created_at: string;
  updated_at: string;
  submitted_by: string;
  submitter_name?: string;
}

const FeedbackManagement: React.FC = () => {
  const { t } = useTranslation();
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [response, setResponse] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchAllFeedback();
    
    // Set up real-time subscription for new feedback
    const channel = supabase
      .channel('feedback-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'feedback'
        },
        () => {
          fetchAllFeedback();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAllFeedback = async () => {
    setLoading(true);
    
    // First fetch feedback
    const { data: feedbackData, error: feedbackError } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false });

    if (feedbackError) {
      toast({
        title: t('messages.error'),
        description: 'Failed to fetch feedback',
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    // Then fetch user names for each feedback
    const feedbackWithNames = await Promise.all(
      (feedbackData || []).map(async (item) => {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('name')
          .eq('user_id', item.submitted_by)
          .single();
        
        return {
          ...item,
          submitter_name: profileData?.name || 'Unknown User'
        };
      })
    );

    setFeedback(feedbackWithNames);
    setLoading(false);
  };

  const updateFeedbackStatus = async (feedbackId: string, newStatus: string) => {
    setUpdatingStatus(feedbackId);
    
    const { error } = await supabase
      .from('feedback')
      .update({ status: newStatus })
      .eq('id', feedbackId);

    if (error) {
      toast({
        title: t('messages.error'),
        description: 'Failed to update status',
        variant: "destructive"
      });
    } else {
      toast({
        title: t('messages.success'),
        description: 'Status updated successfully'
      });
      fetchAllFeedback();
    }
    
    setUpdatingStatus(null);
  };

  const submitResponse = async (feedbackId: string) => {
    if (!response.trim()) return;

    const { error } = await supabase
      .from('feedback')
      .update({ 
        response: response.trim(),
        status: 'resolved'
      })
      .eq('id', feedbackId);

    if (error) {
      toast({
        title: t('messages.error'),
        description: 'Failed to submit response',
        variant: "destructive"
      });
    } else {
      toast({
        title: t('messages.success'),
        description: 'Response submitted successfully'
      });
      setResponse('');
      setRespondingTo(null);
      fetchAllFeedback();
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
        return 'border-l-yellow-400 bg-yellow-50';
      case 'reviewed':
        return 'border-l-blue-400 bg-blue-50';
      case 'resolved':
        return 'border-l-green-400 bg-green-50';
      default:
        return 'border-l-gray-400 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            {t('feedback.allFeedback')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
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
          <MessageSquare className="h-5 w-5 mr-2" />
          {t('feedback.allFeedback')}
        </CardTitle>
        <CardDescription>
          Manage community feedback and complaints ({feedback.length} total)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {feedback.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No feedback received yet</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {feedback.map((item) => (
              <div
                key={item.id}
                className={`border-l-4 rounded-r-lg p-4 ${getStatusColor(item.status)}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(item.status)}
                    <div>
                      <p className="font-medium text-sm">
                        {item.submitter_name || 'Unknown User'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.village} • {new Date(item.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Select
                      value={item.status}
                      onValueChange={(value) => updateFeedbackStatus(item.id, value)}
                      disabled={updatingStatus === item.id}
                    >
                      <SelectTrigger className="w-28 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="reviewed">Reviewed</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3 bg-white/60 p-3 rounded">
                  {item.message}
                </p>
                
                {item.response ? (
                  <div className="border-t pt-3 mt-3 bg-white/80 p-3 rounded">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Official Response:
                    </p>
                    <p className="text-sm">{item.response}</p>
                  </div>
                ) : (
                  <div>
                    {respondingTo === item.id ? (
                      <div className="space-y-3 border-t pt-3 mt-3">
                        <Textarea
                          value={response}
                          onChange={(e) => setResponse(e.target.value)}
                          placeholder="Type your response..."
                          className="min-h-[80px]"
                        />
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => submitResponse(item.id)}
                            disabled={!response.trim()}
                          >
                            Submit Response
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setRespondingTo(null);
                              setResponse('');
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setRespondingTo(item.id)}
                        className="mt-2"
                      >
                        <Reply className="h-4 w-4 mr-1" />
                        Respond
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FeedbackManagement;