export type JurisdictionConfig = {
  name: string;
  abbreviation: string;
  courtStructure: CourtLevel[];
  keyStatutes: StatuteReference[];
  notableVariations: string[];
};

export type CourtLevel = {
  level: string;
  courts: string[];
  description: string;
};

export type StatuteReference = {
  code: string;
  section: string;
  title: string;
  summary?: string;
};

export type RuleReference = {
  ruleNumber: string;
  title: string;
  text: string;
  summary?: string;
  keyPoints?: string[];
};

export type EvidenceRules = {
  relevance: RuleReference[];
  character: RuleReference[];
  settlement: RuleReference[];
  remedialMeasures: RuleReference[];
  witnessCompetency: RuleReference[];
  witnessImpeachment: RuleReference[];
  expertTestimony: RuleReference[];
  hearsay: RuleReference[];
  authentication: RuleReference[];
  bestEvidence: RuleReference[];
};

export type CivilProcedureRules = {
  scope: RuleReference[];
  commencement: RuleReference[];
  pleadings: RuleReference[];
  parties: RuleReference[];
  discovery: RuleReference[];
  trial: RuleReference[];
  judgment: RuleReference[];
  summaryJudgment: RuleReference[];
};

export type CriminalProcedureRules = {
  preliminaryProceedings: RuleReference[];
  discovery: RuleReference[];
  plea: RuleReference[];
  trial: RuleReference[];
  sentencing: RuleReference[];
};

export type RulesOfCourt = {
  localRules: RuleReference[];
  standingOrders: RuleReference[];
};
