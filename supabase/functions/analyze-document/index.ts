import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.84.0';
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { documentId, fileUrl, caseId } = await req.json();

    console.log('Analyzing document:', documentId);

    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') || '');

    // Download the file
    const fileResponse = await fetch(fileUrl);
    const fileBlob = await fileResponse.blob();
    const fileBuffer = await fileBlob.arrayBuffer();
    const base64Data = btoa(String.fromCharCode(...new Uint8Array(fileBuffer)));

    const mimeType = fileBlob.type || 'application/pdf';

    // Use Gemini to analyze the document
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `Analyze this legal document and extract:
1. Document type (motion, brief, deposition, evidence, contract, etc.)
2. Key parties involved
3. Important dates and deadlines
4. Key legal issues or claims
5. Critical facts and evidence
6. Relevant statutes or case law cited
7. A brief summary (2-3 sentences)

Format the response as JSON with these fields:
{
  "documentType": "string",
  "parties": ["array of party names"],
  "dates": [{"date": "YYYY-MM-DD", "description": "string"}],
  "legalIssues": ["array of key issues"],
  "keyFacts": ["array of important facts"],
  "citations": ["array of legal citations"],
  "summary": "string",
  "extractedText": "full text of document"
}`;

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      },
      prompt,
    ]);

    const responseText = result.response.text();
    console.log('Gemini response:', responseText);

    // Parse the JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    // Update the document with the analysis
    const { error: updateError } = await supabaseClient
      .from('documents')
      .update({
        analysis: analysis,
        extracted_text: analysis.extractedText || '',
        key_entities: {
          parties: analysis.parties || [],
          dates: analysis.dates || [],
          citations: analysis.citations || [],
        },
      })
      .eq('id', documentId);

    if (updateError) {
      console.error('Error updating document:', updateError);
      throw updateError;
    }

    // Create case insights from the analysis
    const insights = [];
    
    if (analysis.legalIssues?.length > 0) {
      insights.push({
        case_id: caseId,
        user_id: user.id,
        insight_type: 'legal_issues',
        content: `Key legal issues identified: ${analysis.legalIssues.join(', ')}`,
        metadata: { source: 'document_analysis', document_id: documentId },
      });
    }

    if (analysis.keyFacts?.length > 0) {
      insights.push({
        case_id: caseId,
        user_id: user.id,
        insight_type: 'key_facts',
        content: `Important facts: ${analysis.keyFacts.join('. ')}`,
        metadata: { source: 'document_analysis', document_id: documentId },
      });
    }

    if (insights.length > 0) {
      await supabaseClient.from('case_insights').insert(insights);
    }

    return new Response(
      JSON.stringify({ success: true, analysis }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error analyzing document:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});