import { retryWithBackoff, withTimeout } from '../utils/errorHandler';

export interface CaseLawCitation {
  caseName: string;
  citation: string;
  court: string;
  date: string;
  summary: string;
  holding: string;
  favorableTo: 'plaintiff' | 'defendant' | 'neutral';
  stillGoodLaw: boolean;
  url: string;
}

export interface CitationValidityResult {
  isValid: boolean;
  subsequentHistory: string[];
  overruled: boolean;
  treatment: string;
}

export type Jurisdiction = 'federal' | 'texas' | 'louisiana' | 'mississippi';

const COURT_LISTENER_BASE_URL = 'https://www.courtlistener.com/api/rest/v4';

const JURISDICTION_COURT_CODES: Record<Jurisdiction, string> = {
  federal: 'scotus,ca1,ca2,ca3,ca4,ca5,ca6,ca7,ca8,ca9,ca10,ca11,cadc,cafc',
  texas: 'tex.,texapp,texbap,texcrimapp',
  louisiana: 'la.,laapp,laedct',
  mississippi: 'miss.,missctapp'
};

export const getCourtCodes = (jurisdiction?: Jurisdiction): string => {
  if (!jurisdiction) {
    return JURISDICTION_COURT_CODES.federal;
  }
  return JURISDICTION_COURT_CODES[jurisdiction] || JURISDICTION_COURT_CODES.federal;
};

const determineFavorability = (caseName: string, summary: string): 'plaintiff' | 'defendant' | 'neutral' => {
  const text = `${caseName} ${summary}`.toLowerCase();
  
  const plaintiffIndicators = ['plaintiff', 'petitioner', 'appellant', 'claimant', 'reversed', 'remanded'];
  const defendantIndicators = ['defendant', 'respondent', 'appellee', 'affirmed', 'dismissed'];
  
  let plaintiffScore = 0;
  let defendantScore = 0;
  
  plaintiffIndicators.forEach(term => {
    const matches = text.match(new RegExp(term, 'gi'));
    if (matches) plaintiffScore += matches.length;
  });
  
  defendantIndicators.forEach(term => {
    const matches = text.match(new RegExp(term, 'gi'));
    if (matches) defendantScore += matches.length;
  });
  
  if (plaintiffScore > defendantScore * 1.5) return 'plaintiff';
  if (defendantScore > plaintiffScore * 1.5) return 'defendant';
  return 'neutral';
};

export const formatCaseResult = (apiResult: Record<string, unknown>): CaseLawCitation => {
  const caseName = (apiResult.case_name as string) || (apiResult.caseName as string) || 'Unknown Case';
  const citation = (apiResult.citation as string) || 
    (apiResult.citations && Array.isArray(apiResult.citations) && apiResult.citations[0]?.cite) || 
    'No citation';
  const summary = (apiResult.summary as string) || '';
  
  return {
    caseName,
    citation,
    court: (apiResult.court as string) || (apiResult.court_name as string) || 'Unknown Court',
    date: (apiResult.date_filed as string) || (apiResult.dateFiled as string) || '',
    summary: summary.slice(0, 500),
    holding: (apiResult.holding as string) || '',
    favorableTo: determineFavorability(caseName, summary),
    stillGoodLaw: !apiResult.overruled && !apiResult.reversed,
    url: (apiResult.absolute_url as string) || `https://www.courtlistener.com${apiResult.resource_uri || ''}`
  };
};

export const searchCaseLaw = async (
  query: string,
  jurisdiction?: Jurisdiction,
  limit: number = 10
): Promise<CaseLawCitation[]> => {
  const courtCodes = getCourtCodes(jurisdiction);
  
  const params = new URLSearchParams({
    search: query,
    court: courtCodes,
    order_by: 'score desc',
    format: 'json'
  });
  
  const url = `${COURT_LISTENER_BASE_URL}/search/?${params.toString()}`;
  
  try {
    const response = await retryWithBackoff(async () => {
      return withTimeout(
        fetch(url, {
          headers: {
            'Accept': 'application/json'
          }
        }),
        30000
      );
    }, 2);
    
    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      throw new Error(`CourtListener API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.results || !Array.isArray(data.results)) {
      return [];
    }
    
    return data.results.slice(0, limit).map(formatCaseResult);
  } catch (error) {
    console.error('Case law search failed:', error);
    throw new Error(`Case law search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const checkCitationValidity = async (
  citation: string
): Promise<CitationValidityResult> => {
  const params = new URLSearchParams({
    citation: citation,
    format: 'json'
  });
  
  const url = `${COURT_LISTENER_BASE_URL}/citation-lookup/?${params.toString()}`;
  
  try {
    const response = await retryWithBackoff(async () => {
      return withTimeout(
        fetch(url, {
          headers: {
            'Accept': 'application/json'
          }
        }),
        20000
      );
    }, 2);
    
    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      throw new Error(`Citation lookup API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    const isValid = data.valid !== false && (data.results?.length > 0 || data.citation_found !== false);
    const subsequentHistory: string[] = [];
    let overruled = false;
    let treatment = 'valid';
    
    if (data.results && Array.isArray(data.results)) {
      for (const result of data.results) {
        if (result.subsequent_history) {
          subsequentHistory.push(result.subsequent_history);
        }
        if (result.overruled || result.reversed) {
          overruled = true;
          treatment = 'overruled';
        }
        if (result.distinguished && treatment === 'valid') {
          treatment = 'distinguished';
        }
      }
    }
    
    return {
      isValid,
      subsequentHistory,
      overruled,
      treatment
    };
  } catch (error) {
    console.error('Citation validity check failed:', error);
    return {
      isValid: false,
      subsequentHistory: [],
      overruled: false,
      treatment: 'unknown'
    };
  }
};

const CITATION_PATTERNS = [
  /\d+\s+[Uu]\.?[Ss]\.?\s+\d+/g,
  /\d+\s+[Ss]\.?\s?[Cc]\.?\s?t\.?\s?\d+/g,
  /\d+\s+[Ff]\.?\d*d\.?\s+\d+/g,
  /\d+\s+[Ff]\.?\s?[Ss]\.?\s?upp\.?\s?\d+/g,
  /\d+\s+[Ss]\.?[Ww]\.?\s?\d*d\.?\s+\d+/g,
  /\d+\s+[Nn]\.?[Ee]\.?\s?\d+d\.?\s+\d+/g,
  /\d+\s+[Ss]\.?[Ee]\.?\s?\d+d\.?\s+\d+/g,
  /\d+\s+[Nn]\.?[Ww]\.?\s?\d+d\.?\s+\d+/g,
  /\d+\s+[Pp]\.?\s?\d+d\.?\s+\d+/g,
  /[A-Z][a-z]+\.?\s+v\.?\s+[A-Z][a-z]+\.?,?\s+\d+\s+[A-Z]+\.?\s+\d+/g
];

export const extractCitations = (documentContent: string): string[] => {
  const citations: Set<string> = new Set();
  
  for (const pattern of CITATION_PATTERNS) {
    const matches = documentContent.match(pattern);
    if (matches) {
      matches.forEach(match => citations.add(match.trim()));
    }
  }
  
  return Array.from(citations);
};

export const generateTableOfAuthorities = async (
  documentContent: string
): Promise<CaseLawCitation[]> => {
  const citations = extractCitations(documentContent);
  
  if (citations.length === 0) {
    return [];
  }
  
  const uniqueCitations = [...new Set(citations)].slice(0, 20);
  
  const results: CaseLawCitation[] = [];
  
  for (const citation of uniqueCitations) {
    try {
      const searchResults = await searchCaseLaw(citation, undefined, 1);
      
      if (searchResults.length > 0) {
        const caseResult = searchResults[0];
        
        const validity = await checkCitationValidity(citation);
        caseResult.stillGoodLaw = !validity.overruled;
        
        results.push(caseResult);
      }
      
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.warn(`Failed to validate citation: ${citation}`, error);
    }
  }
  
  return results.sort((a, b) => a.caseName.localeCompare(b.caseName));
};
