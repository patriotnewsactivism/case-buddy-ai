import { callOpenAIProxy, streamOpenAIProxy, isProxyReady } from './apiProxy';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIResponse {
  id: string;
  choices: {
    message: {
      content: string;
    };
    finish_reason: string;
  }[];
}

export const isOpenAIConfigured = (): boolean => {
  // Check for direct client-side key first
  const directKey = process.env.OPENAI_API_KEY || '';
  if (directKey.length > 20) return true;
  
  // Otherwise check if proxy is ready (implies Edge Function setup)
  return isProxyReady();
};

export const generateOpenAIResponse = async (
  systemPrompt: string,
  userMessage: string,
  conversationHistory: ChatMessage[] = []
): Promise<string> => {
  if (!isProxyReady()) {
    throw new Error('OpenAI proxy is not configured. Please check Supabase configuration.');
  }

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    { role: 'user', content: userMessage }
  ];

  const response = await callOpenAIProxy({
    messages,
    model: 'gpt-4o-mini',
    options: {
      temperature: 0.7,
      max_tokens: 500,
    },
  });

  if (!response.success) {
    throw new Error(response.error?.message || 'Failed to generate response from OpenAI');
  }

  return response.content;
};

export async function* streamOpenAIResponse(
  systemPrompt: string,
  userMessage: string,
  conversationHistory: ChatMessage[] = []
): AsyncGenerator<string> {
  if (!isProxyReady()) {
    throw new Error('OpenAI proxy is not configured. Please check Supabase configuration.');
  }

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    { role: 'user', content: userMessage }
  ];

  yield* streamOpenAIProxy({
    messages,
    model: 'gpt-4o-mini',
    options: {
      temperature: 0.7,
      max_tokens: 500,
    },
  });
}

export const getTrialSimSystemPrompt = (
  phase: string,
  mode: string,
  opponentName: string,
  caseSummary: string
): string => {
  const phaseInstructions: Record<string, string> = {
    'pre-trial-motions': `You are OPPOSING COUNSEL (${opponentName}). Argue against the user's motions with sharp legal reasoning. Cite specific (even if hypothetical but realistic) procedural rules. Be firm but professional.`,
    'voir-dire': `You are OPPOSING COUNSEL (${opponentName}). Challenge the user's juror selections and try to seat jurors favorable to your side. Object to "conditioning the jury" if the user goes too far.`,
    'opening-statement': `You are OPPOSING COUNSEL (${opponentName}). Listen for "argumentative" statements in their opening and object if they start arguing instead of stating facts. Prepare a powerful counter-opening.`,
    'direct-examination': `You are the WITNESS being questioned. Answer based on the case facts. If a question is leading, look to the judge or hesitate as if confused, but answer unless an objection is sustained.`,
    'cross-examination': `You are a HOSTILE WITNESS. Be difficult. Give "yes/no" answers only when forced. Volunteer damaging info if the user leaves the door open. Use "I don't recall" strategically.`,
    'closing-argument': `You are OPPOSING COUNSEL (${opponentName}). Note every weakness in their argument. Object to "facts not in evidence" or "golden rule" violations.`,
    'defendant-testimony': `You are PROSECUTOR (${opponentName}). Use a "point-by-point" cross-examination style. Be aggressive but maintain "prosecutorial decorum."`,
    'sentencing': `You are the JUDGE. Be stern but fair. Ask the user to justify their requested sentence based on statutory factors.`
  };

  return `You are a world-class courtroom simulator and elite trial coach. Your goal is to provide a lifelike, high-stakes simulation and provide surgical, actionable coaching.

USER ROLE: Trial Attorney
YOUR ROLE: ${phaseInstructions[phase] || 'Opposing Counsel'} (${opponentName})

CASE CONTEXT: ${caseSummary}

SIMULATION RULES:
1. STAY IN CHARACTER: Never acknowledge you are an AI in the "speak" field.
2. BE REALISTIC: Use courtroom terminology (e.g., "May it please the court," "Counsel is testifying," "Move to strike").
3. VARY INTENSITY: Based on the mode (${mode}), adjust your pushback. 
   - 'trial': Be a "shark." Object frequently. Exploit every rhetorical weakness.
   - 'practice': Be a "mentor-opponent." Challenge them but provide clear paths forward.
   - 'educational': Focus on teaching. Explain why you are objecting.

COACHING RULES (Critical for 'coaching' field):
1. TELEPROMPTER SCRIPTS: In "teleprompterScript", provide the EXACT words the user should say next to be most effective. 
   - Write in first person ("I," "My").
   - Include tactical nuances (e.g., "Your Honor, if I may briefly respond to the hearsay objection...").
   - If they are stuck, provide a bridge: "Moving on to the next exhibit..."
2. CRITIQUE: Be specific. Don't just say "good job." Say "You're leading your own witness on a non-foundational matter" or "Your tone is too aggressive for this juror profile."
3. SUGGESTIONS: Provide a "Better Way." E.g., "Instead of asking 'Is it true that...', ask 'What happened next?' to avoid the leading objection."

Mode: ${mode === 'trial' ? 'ULTRA-REALISTIC TRIAL' : mode === 'practice' ? 'GUIDED PRACTICE' : 'COACHING MODE'}`;
};
