import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DocumentUpload } from './DocumentUpload';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, FileText, Lightbulb, History } from 'lucide-react';

interface Document {
  id: string;
  filename: string;
  created_at: string;
  analysis: any;
  extracted_text: string;
}

interface Insight {
  id: string;
  insight_type: string;
  content: string;
  created_at: string;
}

interface Session {
  id: string;
  session_type: string;
  duration: number;
  created_at: string;
}

interface CaseViewProps {
  caseId: string;
  caseData: any;
  onBack: () => void;
  onStartSession: (caseContext: any) => void;
}

export const CaseView = ({ caseId, caseData, onBack, onStartSession }: CaseViewProps) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadCaseData();
    
    // Subscribe to document changes
    const docSubscription = supabase
      .channel('documents')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documents', filter: `case_id=eq.${caseId}` }, () => {
        loadCaseData();
      })
      .subscribe();

    return () => {
      docSubscription.unsubscribe();
    };
  }, [caseId]);

  const loadCaseData = async () => {
    const [docsResult, insightsResult, sessionsResult] = await Promise.all([
      supabase.from('documents').select('*').eq('case_id', caseId).order('created_at', { ascending: false }),
      supabase.from('case_insights').select('*').eq('case_id', caseId).order('created_at', { ascending: false }),
      supabase.from('sessions').select('*').eq('case_id', caseId).order('created_at', { ascending: false }),
    ]);

    if (docsResult.data) setDocuments(docsResult.data);
    if (insightsResult.data) setInsights(insightsResult.data);
    if (sessionsResult.data) setSessions(sessionsResult.data);
  };

  const buildCaseContext = () => {
    const context = {
      caseTitle: caseData.title,
      caseType: caseData.case_type,
      industry: caseData.industry,
      description: caseData.description,
      documents: documents.map(d => ({
        filename: d.filename,
        summary: d.analysis?.summary || 'No summary available',
        keyFacts: d.analysis?.keyFacts || [],
      })),
      insights: insights.map(i => i.content),
      totalSessions: sessions.length,
    };
    return context;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{caseData.title}</h1>
          <p className="text-muted-foreground">{caseData.case_type} • {caseData.industry}</p>
        </div>
        <Button onClick={() => onStartSession(buildCaseContext())}>
          Start Practice Session
        </Button>
      </div>

      {caseData.description && (
        <Card className="p-4">
          <p>{caseData.description}</p>
        </Card>
      )}

      <Tabs defaultValue="documents">
        <TabsList>
          <TabsTrigger value="documents">
            <FileText className="w-4 h-4 mr-2" />
            Documents ({documents.length})
          </TabsTrigger>
          <TabsTrigger value="insights">
            <Lightbulb className="w-4 h-4 mr-2" />
            Insights ({insights.length})
          </TabsTrigger>
          <TabsTrigger value="sessions">
            <History className="w-4 h-4 mr-2" />
            Sessions ({sessions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-4">
          <DocumentUpload caseId={caseId} />
          
          {documents.map((doc) => (
            <Card key={doc.id} className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold">{doc.filename}</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(doc.created_at).toLocaleDateString()}
                  </p>
                  {doc.analysis?.summary && (
                    <p className="text-sm mt-2">{doc.analysis.summary}</p>
                  )}
                  {doc.analysis?.documentType && (
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary mt-2 inline-block">
                      {doc.analysis.documentType}
                    </span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          {insights.map((insight) => (
            <Card key={insight.id} className="p-4">
              <div className="flex gap-3">
                <Lightbulb className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium capitalize">{insight.insight_type.replace('_', ' ')}</p>
                  <p className="text-sm mt-1">{insight.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(insight.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Card>
          ))}
          {insights.length === 0 && (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No insights yet. Upload documents to generate insights.</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          {sessions.map((session) => (
            <Card key={session.id} className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold capitalize">{session.session_type.replace('-', ' ')}</p>
                  <p className="text-sm text-muted-foreground">
                    Duration: {Math.floor(session.duration / 60)}m {session.duration % 60}s
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(session.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Card>
          ))}
          {sessions.length === 0 && (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No practice sessions yet. Start your first session above.</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};