import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, Loader2 } from 'lucide-react';

interface DocumentUploadProps {
  caseId: string;
}

export const DocumentUpload = ({ caseId }: DocumentUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to upload documents',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('case-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('case-documents')
        .getPublicUrl(fileName);

      // Create document record
      const { data: document, error: dbError } = await supabase
        .from('documents')
        .insert({
          case_id: caseId,
          user_id: user.id,
          filename: file.name,
          file_path: fileName,
          file_type: file.type,
          file_size: file.size,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      toast({
        title: 'Document uploaded',
        description: 'Starting AI analysis...',
      });

      // Trigger analysis
      setUploading(false);
      setAnalyzing(true);

      const { error: analysisError } = await supabase.functions.invoke('analyze-document', {
        body: {
          documentId: document.id,
          fileUrl: publicUrl,
          caseId: caseId,
        },
      });

      if (analysisError) throw analysisError;

      toast({
        title: 'Analysis complete',
        description: 'Document has been analyzed successfully',
      });

      setAnalyzing(false);
    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
      setUploading(false);
      setAnalyzing(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col items-center gap-4">
        <FileText className="w-12 h-12 text-muted-foreground" />
        <h3 className="text-lg font-semibold">Upload Documents</h3>
        <p className="text-sm text-muted-foreground text-center">
          Upload legal documents, evidence, or case files for AI analysis
        </p>
        
        <input
          type="file"
          id="file-upload"
          className="hidden"
          onChange={handleFileUpload}
          accept=".pdf,.doc,.docx,.txt"
          disabled={uploading || analyzing}
        />
        
        <Button
          onClick={() => document.getElementById('file-upload')?.click()}
          disabled={uploading || analyzing}
        >
          {uploading || analyzing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Upload className="w-4 h-4 mr-2" />
          )}
          {uploading ? 'Uploading...' : analyzing ? 'Analyzing...' : 'Choose File'}
        </Button>
      </div>
    </Card>
  );
};