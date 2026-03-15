
import { Case, CaseStatus, Witness, OpposingProfile, DocumentType } from './types';

// Real case data should be entered by the user.
export const MOCK_CASES: Case[] = [];

// These remain as templates for the simulation features
export const MOCK_WITNESSES: Witness[] = [
  {
    id: 'w1',
    name: 'John Smith',
    role: 'Eyewitness / Security Guard',
    personality: 'Nervous',
    credibilityScore: 85,
    avatarUrl: 'https://picsum.photos/id/1005/200/200'
  },
  {
    id: 'w2',
    name: 'Dr. Emily Chen',
    role: 'Expert Witness (Forensics)',
    personality: 'Cooperative',
    credibilityScore: 98,
    avatarUrl: 'https://picsum.photos/id/1011/200/200'
  },
  {
    id: 'w3',
    name: 'Marcus Reynolds',
    role: 'Former Employee (Hostile)',
    personality: 'Hostile',
    credibilityScore: 45,
    avatarUrl: 'https://picsum.photos/id/1025/200/200'
  }
];

export const MOCK_OPPONENT: OpposingProfile = {
  name: 'David Thorne',
  firm: 'Thorne & Partners',
  aggressiveness: 85,
  settlementTendency: 30,
  commonTactics: ['Buries evidence in volume', 'Aggressive procedural objections', 'Wait until last minute for filings']
};

// Comprehensive list of Mock Trial Types for practice
export const MOCK_CASE_TEMPLATES: { category: string, cases: Case[] }[] = [
  {
    category: "Criminal Defense",
    cases: [
      {
        id: 'temp_crim_1',
        title: 'State v. Miller (DUI Felony)',
        client: 'James Miller',
        status: CaseStatus.TRIAL,
        opposingCounsel: 'D.A. Sarah Jenkins',
        judge: 'Hon. R. Gellar',
        nextCourtDate: '2024-05-12',
        summary: 'Defending James Miller against Felony DUI charges causing bodily injury. Key issue: Accuracy of the field sobriety test and breathalyzer calibration. Defendant claims he was swerving to avoid a deer.',
        winProbability: 45,
        docketNumber: 'CR-2023-4412',
        courtLocation: 'Harris County Superior Court',
        jurisdiction: 'Texas',
        clientType: 'defendant',
        opposingParty: 'State of Texas',
        legalTheory: 'Challenging the reliability of the Intoxilyzer 8000 results and the lack of probable cause for the initial stop.',
        keyIssues: ['Breathalyzer calibration records', 'Bodycam footage of field sobriety test', 'Expert testimony on deer migration patterns in the area'],
        evidence: [
          {
            id: 'e1',
            caseId: 'temp_crim_1',
            title: 'Maintenance Log - Intoxilyzer 8000',
            type: DocumentType.EVIDENCE,
            source: 'file',
            summary: 'Records show the device missed its monthly calibration 2 months prior to the incident.',
            keyEntities: ['Officer Thompson', 'Lab Tech Davis'],
            risks: ['May be ruled admissible if technician testifies to general reliability'],
            addedAt: new Date().toISOString()
          }
        ]
      },
      {
        id: 'temp_crim_2',
        title: 'State v. Carter (Armed Robbery)',
        client: 'Leo Carter',
        status: CaseStatus.PRE_TRIAL,
        opposingCounsel: 'A.D.A. Michael Ross',
        judge: 'Hon. L. Wright',
        nextCourtDate: '2024-06-01',
        summary: 'Armed robbery of a convenience store. Identification relies solely on grainy CCTV footage and one shaken eyewitness. Defendant has an alibi witness who is his girlfriend.',
        winProbability: 60,
        docketNumber: '24-CF-0089',
        courtLocation: 'Cook County Criminal Court',
        jurisdiction: 'Illinois',
        clientType: 'defendant',
        opposingParty: 'People of the State of Illinois',
        legalTheory: 'Mistaken identity and alibi defense.',
        keyIssues: ['Reliability of eyewitness identification', 'CCTV quality and enhancement', 'Alibi corroboration'],
        evidence: [
          {
            id: 'e2',
            caseId: 'temp_crim_2',
            title: 'Store CCTV Footage',
            type: DocumentType.EVIDENCE,
            source: 'file',
            summary: 'Grainy 15fps video showing a figure in a dark hoodie. Height and build are similar to defendant, but face is obscured.',
            keyEntities: ['Convenience Store', 'Robbery Suspect'],
            risks: ['Jury may perceive build as unique enough for ID'],
            addedAt: new Date().toISOString()
          }
        ]
      }
    ]
  },
  {
    category: "Civil Litigation",
    cases: [
      {
        id: 'temp_civ_1',
        title: 'Johnson v. BigMart (Slip & Fall)',
        client: 'Brenda Johnson',
        status: CaseStatus.DISCOVERY,
        opposingCounsel: 'Corporate Counsel Lee',
        judge: 'Hon. P. Anderson',
        nextCourtDate: '2024-04-20',
        summary: 'Plaintiff slipped on a wet floor with no signage. Sustained spinal injury. Defense claims contributory negligence (plaintiff was texting).',
        winProbability: 70,
        docketNumber: 'CIV-2023-9902',
        courtLocation: 'Los Angeles County Superior Court',
        jurisdiction: 'California',
        clientType: 'plaintiff',
        opposingParty: 'BigMart Inc.',
        legalTheory: 'Premises liability based on failure to maintain safe environment and lack of required warning signs for a known hazard.',
        keyIssues: ['Notice (constructive vs. actual)', 'Contributory negligence', 'Severity of spinal injuries'],
        evidence: [
          {
            id: 'e3',
            caseId: 'temp_civ_1',
            title: 'Internal BigMart Spill Log',
            type: DocumentType.EVIDENCE,
            source: 'file',
            summary: 'Spill was reported by an employee 22 minutes before the fall occurred, but no action was taken.',
            keyEntities: ['Employee Smith', 'Manager Rodriguez'],
            risks: ['Defense claims employee was on authorized break'],
            addedAt: new Date().toISOString()
          }
        ]
      }
    ]
  }
];
