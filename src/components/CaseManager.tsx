import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, FolderOpen, FileText } from 'lucide-react';

interface Case {
  id: string;
  title: string;
  case_type: string;
  industry: string;
  difficulty: string;
  description: string;
  status: string;
  created_at: string;
}

export const CaseManager = ({ onSelectCase }: { onSelectCase: (caseId: string, caseData: Case) => void }) => {
  const [cases, setCases] = useState<Case[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newCase, setNewCase] = useState({
    title: '',
    case_type: 'profitability',
    industry: '',
    difficulty: 'medium',
    description: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('cases')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Error loading cases',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setCases(data || []);
    }
  };

  const createCase = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to create cases',
        variant: 'destructive',
      });
      return;
    }

    const { data, error } = await supabase
      .from('cases')
      .insert({
        ...newCase,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: 'Error creating case',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Case created',
        description: 'Your case has been created successfully',
      });
      setCases([data, ...cases]);
      setIsCreating(false);
      setNewCase({
        title: '',
        case_type: 'profitability',
        industry: '',
        difficulty: 'medium',
        description: '',
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Cases</h2>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Case
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Case</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={newCase.title}
                  onChange={(e) => setNewCase({ ...newCase, title: e.target.value })}
                  placeholder="Enter case title"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Type</label>
                <Select value={newCase.case_type} onValueChange={(value) => setNewCase({ ...newCase, case_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="profitability">Profitability</SelectItem>
                    <SelectItem value="market-entry">Market Entry</SelectItem>
                    <SelectItem value="pricing">Pricing</SelectItem>
                    <SelectItem value="merger">Merger & Acquisition</SelectItem>
                    <SelectItem value="operations">Operations</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Industry</label>
                <Input
                  value={newCase.industry}
                  onChange={(e) => setNewCase({ ...newCase, industry: e.target.value })}
                  placeholder="e.g., Technology, Healthcare"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Difficulty</label>
                <Select value={newCase.difficulty} onValueChange={(value) => setNewCase({ ...newCase, difficulty: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={newCase.description}
                  onChange={(e) => setNewCase({ ...newCase, description: e.target.value })}
                  placeholder="Brief description of the case"
                  rows={3}
                />
              </div>
              <Button onClick={createCase} className="w-full">Create Case</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cases.map((caseItem) => (
          <Card
            key={caseItem.id}
            className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => onSelectCase(caseItem.id, caseItem)}
          >
            <div className="flex items-start gap-3">
              <FolderOpen className="w-8 h-8 text-primary mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{caseItem.title}</h3>
                <p className="text-sm text-muted-foreground">{caseItem.case_type}</p>
                {caseItem.industry && (
                  <p className="text-xs text-muted-foreground mt-1">{caseItem.industry}</p>
                )}
                {caseItem.description && (
                  <p className="text-sm mt-2 line-clamp-2">{caseItem.description}</p>
                )}
                <div className="flex gap-2 mt-3">
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                    {caseItem.difficulty}
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-secondary/10 text-secondary-foreground">
                    {caseItem.status}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {cases.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No cases yet. Create your first case to get started.</p>
        </div>
      )}
    </div>
  );
};