/**
 * Smart AI Model Router
 *
 * Routes AI requests to the most cost-effective model based on:
 * - Task complexity estimation
 * - User tier
 * - Model capabilities required (structured output, thinking, etc.)
 *
 * Prioritizes cheaper models when possible to minimize API costs.
 */

import { AIModelConfig, AIProvider, AIRoutingDecision, UserTier } from '../types';

// Available AI models with cost information
const AI_MODELS: Record<AIProvider, AIModelConfig> = {
  'gemini-flash': {
    provider: 'gemini-flash',
    model: 'gemini-2.5-flash',
    costPer1kTokens: 0,       // Free tier available
    maxTokens: 8192,
    supportsStructuredOutput: true,
    supportsThinking: false,
  },
  'gemini-pro': {
    provider: 'gemini-pro',
    model: 'gemini-2.5-pro',
    costPer1kTokens: 0.00125,
    maxTokens: 8192,
    supportsStructuredOutput: true,
    supportsThinking: true,
  },
  'openai': {
    provider: 'openai',
    model: 'gpt-4o-mini',
    costPer1kTokens: 0.00015,
    maxTokens: 4096,
    supportsStructuredOutput: true,
    supportsThinking: false,
  },
};

// Task complexity keywords and weights
const COMPLEXITY_INDICATORS = {
  high: {
    keywords: [
      'analyze', 'strategy', 'predict', 'complex', 'reasoning',
      'multi-step', 'deep', 'comprehensive', 'nuanced', 'evaluate',
      'compare', 'synthesize', 'legal theory', 'case law', 'precedent',
    ],
    weight: 0.15,
  },
  medium: {
    keywords: [
      'summarize', 'extract', 'classify', 'identify', 'review',
      'assess', 'outline', 'describe', 'explain', 'draft',
    ],
    weight: 0.08,
  },
  low: {
    keywords: [
      'format', 'convert', 'translate', 'list', 'count',
      'simple', 'basic', 'short', 'quick', 'brief',
    ],
    weight: -0.05,
  },
};

/**
 * Estimate the complexity of a task based on prompt analysis.
 * Returns a score from 0.0 (simple) to 1.0 (very complex).
 */
export function estimateComplexity(prompt: string): number {
  const lowerPrompt = prompt.toLowerCase();
  let score = 0.3; // Base complexity

  // Check keyword indicators
  for (const [, config] of Object.entries(COMPLEXITY_INDICATORS)) {
    for (const keyword of config.keywords) {
      if (lowerPrompt.includes(keyword)) {
        score += config.weight;
      }
    }
  }

  // Prompt length factor (longer prompts tend to be more complex)
  const wordCount = prompt.split(/\s+/).length;
  if (wordCount > 500) score += 0.15;
  else if (wordCount > 200) score += 0.08;
  else if (wordCount > 100) score += 0.03;

  // JSON/structured output requests are slightly more complex
  if (lowerPrompt.includes('json') || lowerPrompt.includes('structured')) {
    score += 0.05;
  }

  // Multiple questions/sections increase complexity
  const questionMarks = (prompt.match(/\?/g) || []).length;
  if (questionMarks > 3) score += 0.1;

  // Clamp to [0, 1]
  return Math.max(0, Math.min(1, score));
}

/**
 * Select the optimal AI model based on task requirements and user tier.
 */
export function routeAIRequest(
  prompt: string,
  options?: {
    userTier?: UserTier;
    requiresThinking?: boolean;
    requiresStructuredOutput?: boolean;
    forceProvider?: AIProvider;
    analysisType?: string;
  }
): AIRoutingDecision {
  const tier = options?.userTier || 'free';
  const complexity = estimateComplexity(prompt);

  // If a specific provider is forced, use it
  if (options?.forceProvider) {
    const model = AI_MODELS[options.forceProvider];
    return {
      model,
      reason: `Forced provider: ${options.forceProvider}`,
      estimatedCost: estimateCost(prompt, model),
      complexity,
    };
  }

  // If thinking is required, must use gemini-pro
  if (options?.requiresThinking) {
    const model = AI_MODELS['gemini-pro'];
    return {
      model,
      reason: 'Thinking capability required',
      estimatedCost: estimateCost(prompt, model),
      complexity,
    };
  }

  // Route based on complexity and tier
  let selectedModel: AIModelConfig;
  let reason: string;

  // Strategy analysis types always use pro for quality
  const proAnalysisTypes = ['strategy', 'case_law_analysis', 'settlement_analysis'];
  if (options?.analysisType && proAnalysisTypes.includes(options.analysisType)) {
    if (tier === 'free') {
      selectedModel = AI_MODELS['gemini-flash'];
      reason = 'Free tier: using flash for strategy analysis';
    } else {
      selectedModel = AI_MODELS['gemini-pro'];
      reason = 'Pro/Enterprise tier: using pro model for strategy analysis';
    }
  } else if (complexity < 0.35) {
    // Low complexity - always use flash (free)
    selectedModel = AI_MODELS['gemini-flash'];
    reason = `Low complexity (${complexity.toFixed(2)}): using cost-free flash model`;
  } else if (complexity < 0.6) {
    // Medium complexity - use flash for free users, pro for paid
    if (tier === 'free') {
      selectedModel = AI_MODELS['gemini-flash'];
      reason = `Medium complexity (${complexity.toFixed(2)}): free tier uses flash`;
    } else {
      selectedModel = AI_MODELS['gemini-flash'];
      reason = `Medium complexity (${complexity.toFixed(2)}): flash is sufficient`;
    }
  } else {
    // High complexity - upgrade model for paid users
    if (tier === 'enterprise') {
      selectedModel = AI_MODELS['gemini-pro'];
      reason = `High complexity (${complexity.toFixed(2)}): enterprise tier uses pro model`;
    } else if (tier === 'pro') {
      selectedModel = AI_MODELS['gemini-pro'];
      reason = `High complexity (${complexity.toFixed(2)}): pro tier uses pro model`;
    } else {
      selectedModel = AI_MODELS['gemini-flash'];
      reason = `High complexity (${complexity.toFixed(2)}): free tier limited to flash`;
    }
  }

  return {
    model: selectedModel,
    reason,
    estimatedCost: estimateCost(prompt, selectedModel),
    complexity,
  };
}

/**
 * Estimate the cost of processing a prompt with a given model.
 */
function estimateCost(prompt: string, model: AIModelConfig): number {
  // Rough token estimation: ~4 chars per token
  const inputTokens = Math.ceil(prompt.length / 4);
  const estimatedOutputTokens = Math.min(inputTokens * 0.5, model.maxTokens);
  const totalTokens = inputTokens + estimatedOutputTokens;

  return (totalTokens / 1000) * model.costPer1kTokens;
}

/**
 * Get the model string for use with API calls.
 */
export function getModelString(decision: AIRoutingDecision): string {
  return decision.model.model;
}

/**
 * Get all available models.
 */
export function getAvailableModels(): AIModelConfig[] {
  return Object.values(AI_MODELS);
}

/**
 * Estimate monthly cost for a usage pattern.
 */
export function estimateMonthlyCost(
  dailyRequests: number,
  averagePromptLength: number,
  tier: UserTier
): { estimatedCost: number; breakdown: Record<string, number> } {
  const monthlyRequests = dailyRequests * 30;
  const breakdown: Record<string, number> = {};

  // Simulate routing distribution
  let totalCost = 0;
  const testPrompt = 'a'.repeat(averagePromptLength);
  const routing = routeAIRequest(testPrompt, { userTier: tier });

  const costPerRequest = routing.estimatedCost;
  totalCost = costPerRequest * monthlyRequests;
  breakdown[routing.model.provider] = totalCost;

  return { estimatedCost: totalCost, breakdown };
}
