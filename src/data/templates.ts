import { FrameworkTemplate } from '@/types';

export const FRAMEWORK_TEMPLATES: FrameworkTemplate[] = [
  {
    id: 'profitability-framework',
    name: 'Profitability Framework',
    description: 'Classic framework for analyzing profit decline or improvement opportunities',
    caseType: 'Profitability',
    structure: [
      '1. Revenue Analysis',
      '   - Price changes',
      '   - Volume/quantity sold',
      '   - Product mix shifts',
      '2. Cost Analysis',
      '   - Fixed costs',
      '   - Variable costs',
      '   - Cost structure changes',
      '3. External Factors',
      '   - Market conditions',
      '   - Competition',
      '   - Regulatory changes'
    ],
    tips: [
      'Always start by clarifying the specific profit metric',
      'Ask for historical data to identify trends',
      'Consider both internal and external factors',
      'Quantify impacts whenever possible'
    ]
  },
  {
    id: 'market-entry-framework',
    name: 'Market Entry Framework',
    description: 'Comprehensive approach for evaluating new market opportunities',
    caseType: 'Market Entry',
    structure: [
      '1. Market Attractiveness',
      '   - Market size and growth',
      '   - Profitability potential',
      '   - Barriers to entry',
      '2. Competitive Landscape',
      '   - Existing players',
      '   - Market share distribution',
      '   - Competitive advantages',
      '3. Company Capabilities',
      '   - Core competencies',
      '   - Resources required',
      '   - Strategic fit',
      '4. Entry Strategy',
      '   - Organic vs acquisition',
      '   - Partnerships',
      '   - Go-to-market approach'
    ],
    tips: [
      'Start with the "Should we enter?" question',
      'Then move to "How should we enter?"',
      'Consider regulatory and cultural factors',
      'Assess risks vs. expected returns'
    ]
  },
  {
    id: 'ma-framework',
    name: 'M&A Evaluation Framework',
    description: 'Framework for analyzing merger and acquisition opportunities',
    caseType: 'Mergers & Acquisitions',
    structure: [
      '1. Strategic Rationale',
      '   - Strategic fit',
      '   - Synergies potential',
      '   - Market position improvement',
      '2. Financial Analysis',
      '   - Valuation',
      '   - Deal structure',
      '   - ROI and payback period',
      '3. Integration Considerations',
      '   - Cultural fit',
      '   - Operational integration',
      '   - Risk mitigation',
      '4. Alternatives',
      '   - Organic growth',
      '   - Other targets',
      '   - Strategic partnerships'
    ],
    tips: [
      'Quantify expected synergies',
      'Consider integration challenges early',
      'Always evaluate alternatives',
      'Discuss timing and market conditions'
    ]
  },
  {
    id: 'civil-rights-framework',
    name: 'Section 1983 Framework',
    description: 'Legal framework for civil rights litigation under 42 U.S.C. § 1983',
    caseType: 'Civil Rights Litigation',
    structure: [
      '1. Constitutional Violation',
      '   - Identify specific right violated',
      '   - Establish clearly established law',
      '   - Prove actual deprivation',
      '2. Color of State Law',
      '   - State actor requirement',
      '   - Official capacity vs individual',
      '   - Joint action analysis',
      '3. Qualified Immunity',
      '   - Clearly established right',
      '   - Reasonable officer standard',
      '   - Overcome immunity defense',
      '4. Damages & Relief',
      '   - Compensatory damages',
      '   - Punitive damages',
      '   - Injunctive relief'
    ],
    tips: [
      'Start with clearly established constitutional right',
      'Address qualified immunity head-on',
      'Build factual record for each element',
      'Consider municipal liability under Monell'
    ]
  },
  {
    id: 'criminal-defense-framework',
    name: 'Criminal Defense Strategy',
    description: 'Systematic approach to criminal defense case preparation',
    caseType: 'Criminal Defense',
    structure: [
      '1. Preliminary Analysis',
      '   - Review charges and elements',
      '   - Analyze arrest/search legality',
      '   - Identify potential motions',
      '2. Evidence Review',
      '   - Prosecution evidence',
      '   - Brady material requests',
      '   - Witness statements',
      '3. Defense Theory',
      '   - Reasonable doubt strategy',
      '   - Affirmative defenses',
      '   - Mitigating factors',
      '4. Trial Strategy',
      '   - Voir dire approach',
      '   - Cross-examination plan',
      '   - Closing argument themes'
    ],
    tips: [
      'File suppression motions early if applicable',
      'Always request all Brady material',
      'Build multiple defense theories',
      'Focus on burden of proof in closing'
    ]
  },
  {
    id: 'deposition-framework',
    name: 'Deposition Questioning Framework',
    description: 'Structured approach to effective deposition questioning',
    caseType: 'Deposition Simulation',
    structure: [
      '1. Opening (Funnel Technique)',
      '   - Open-ended questions',
      '   - Establish timeline',
      '   - Get complete narrative',
      '2. Narrowing Phase',
      '   - Who, what, when, where',
      '   - Document foundation',
      '   - Lock in testimony',
      '3. Closing (Impeachment)',
      '   - Specific contradictions',
      '   - Leading questions',
      '   - Pin down details',
      '4. Document Handling',
      '   - Proper foundation',
      '   - Mark as exhibits',
      '   - Authenticate sources'
    ],
    tips: [
      'Listen more than you talk',
      'Never ask a question you don\'t know the answer to',
      'Use silence to encourage elaboration',
      'Save best questions for last'
    ]
  }
];

export const getTemplatesByType = (caseType: string): FrameworkTemplate[] => {
  return FRAMEWORK_TEMPLATES.filter(t => t.caseType === caseType);
};

export const getTemplateById = (id: string): FrameworkTemplate | undefined => {
  return FRAMEWORK_TEMPLATES.find(t => t.id === id);
};
