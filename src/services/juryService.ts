import { GoogleGenAI, Type } from "@google/genai";
import { EnhancedJuror, JuryVerdict, JurorDemographics, PsychographicProfile, JuryDeliberation } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// First names for generating juror names
const FIRST_NAMES = ['James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa', 'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley', 'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle', 'Kenneth', 'Dorothy', 'Kevin', 'Carol', 'Brian', 'Amanda', 'George', 'Melissa', 'Timothy', 'Deborah'];

const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts'];

const OCCUPATIONS = ['Teacher', 'Nurse', 'Engineer', 'Accountant', 'Manager', 'Salesperson', 'Retired', 'Small Business Owner', 'Office Worker', 'Construction Worker', 'Healthcare Worker', 'IT Professional', 'Administrative Assistant', 'Driver', 'Retail Worker', 'Social Worker', 'Police Officer', 'Firefighter', 'Real Estate Agent', 'Consultant'];

const RACES = ['White', 'Black', 'Hispanic', 'Asian', 'Native American', 'Mixed'];

const EDUCATIONS = ['High School', 'Some College', 'Associates Degree', 'Bachelors Degree', 'Masters Degree', 'Doctorate', 'Trade School'];

const RELIGIONS = ['Christian - Protestant', 'Christian - Catholic', 'Christian - Non-denominational', 'Jewish', 'Muslim', 'Buddhist', 'Hindu', 'Atheist', 'Agnostic', 'No Religious Affiliation', 'Other'];

const POLITICAL_LEANS = ['Very Conservative', 'Conservative', 'Moderate Conservative', 'Moderate', 'Moderate Liberal', 'Liberal', 'Very Liberal'];

/**
 * Generate a random juror with realistic demographics
 */
export const generateJuror = (id: string): EnhancedJuror => {
  const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  const name = `${firstName} ${lastName}`;
  
  const age = Math.floor(Math.random() * 40) + 25; // 25-65
  const gender = Math.random() > 0.5 ? 'female' : 'male';
  const race = RACES[Math.floor(Math.random() * RACES.length)];
  const education = EDUCATIONS[Math.floor(Math.random() * EDUCATIONS.length)];
  const occupation = OCCUPATIONS[Math.floor(Math.random() * OCCUPATIONS.length)];
  const income = ['Under $30k', '$30k-$50k', '$50k-$75k', '$75k-$100k', '$100k-$150k', 'Over $150k'][Math.floor(Math.random() * 6)];
  const maritalStatus = ['Single', 'Married', 'Divorced', 'Widowed'][Math.floor(Math.random() * 4)];
  const hasChildren = Math.random() > 0.3;
  const religion = RELIGIONS[Math.floor(Math.random() * RELIGIONS.length)];
  const politicalLean = POLITICAL_LEANS[Math.floor(Math.random() * POLITICAL_LEANS.length)];
  const urbanRural = ['urban', 'suburban', 'rural'][Math.floor(Math.random() * 3)] as 'urban' | 'suburban' | 'rural';
  const priorJuryService = Math.random() > 0.7;
  const crimeVictim = Math.random() > 0.8;
  const lawEnforcementFamily = Math.random() > 0.85;

  const demographics: JurorDemographics = {
    age,
    gender: gender as 'male' | 'female' | 'non-binary',
    race,
    education,
    occupation,
    income,
    maritalStatus,
    hasChildren,
    religion,
    politicalLean,
    urbanRural,
    priorJuryService,
    crimeVictim,
    lawEnforcementFamily
  };

  const psychographics: PsychographicProfile = {
    authorityRespect: Math.floor(Math.random() * 100),
    justiceOrientation: ['retributive', 'restorative', 'mixed'][Math.floor(Math.random() * 3)] as 'retributive' | 'restorative' | 'mixed',
    skepticismLevel: Math.floor(Math.random() * 100),
    empathyLevel: Math.floor(Math.random() * 100),
    cognitiveStyle: ['analytical', 'intuitive', 'balanced'][Math.floor(Math.random() * 3)] as 'analytical' | 'intuitive' | 'balanced',
    decisionSpeed: ['quick', 'deliberate', 'thorough'][Math.floor(Math.random() * 3)] as 'quick' | 'deliberate' | 'thorough',
    opennessToExperience: Math.floor(Math.random() * 100),
    conscientiousness: Math.floor(Math.random() * 100),
    extraversion: Math.floor(Math.random() * 100),
    agreeableness: Math.floor(Math.random() * 100),
    neuroticism: Math.floor(Math.random() * 100)
  };

  // Generate biases based on demographics
  const biases: string[] = [];
  if (politicalLean.includes('Conservative')) biases.push('倾向于执法部门');
  if (politicalLean.includes('Liberal')) biases.push('倾向于被告权利');
  if (lawEnforcementFamily) biases.push('与执法部门有家庭关系');
  if (crimeVictim) biases.push('犯罪受害者经历');
  if (religion.includes('Christian')) biases.push('宗教道德价值观');
  if (age > 55) biases.push('代际保守倾向');
  if (age < 30) biases.push('代际改革倾向');

  return {
    id,
    name,
    age,
    occupation,
    education,
    background: generateBackground(demographics),
    biases,
    leaningScore: Math.floor(Math.random() * 200) - 100, // -100 to 100
    avatar: `https://api.dicebear.com/7.x/personas/svg?seed=${name}`,
    demographics,
    psychographics,
    initialLeaning: Math.floor(Math.random() * 200) - 100,
    currentLeaning: Math.floor(Math.random() * 200) - 100,
    reasoningNotes: []
  };
};

/**
 * Generate a background summary for a juror
 */
const generateBackground = (demographics: JurorDemographics): string => {
  const { age, gender, race, occupation, education, maritalStatus, hasChildren, urbanRural } = demographics;
  const childText = hasChildren ? `有孩子` : '无子女';
  return `${age}岁${gender === 'male' ? '男性' : '女性'}，${race}裔。${occupation}，${education}学历。${maritalStatus}，${childText}。居住在${urbanRural === 'urban' ? '城市' : urbanRural === 'suburban' ? '郊区' : '农村'}地区。`;
};

/**
 * Generate a full jury panel
 */
export const generateJuryPanel = (size: 6 | 12 = 12): EnhancedJuror[] => {
  return Array.from({ length: size }, (_, i) => generateJuror(`juror-${i + 1}`));
};

/**
 * Simulate jury deliberation using AI
 */
export const simulateDeliberation = async (
  jurors: EnhancedJuror[],
  caseSummary: string,
  evidenceSummary: string
): Promise<{
  deliberations: JuryDeliberation[];
  verdict: JuryVerdict;
}> => {
  try {
    const jurorProfiles = jurors.map(j => ({
      name: j.name,
      demographics: j.demographics,
      psychographics: j.psychographics,
      initialLeaning: j.initialLeaning,
      biases: j.biases
    }));

    const prompt = `You are simulating a jury deliberation for a criminal trial.
    
    Case Summary:
    ${caseSummary}
    
    Key Evidence:
    ${evidenceSummary}
    
    Jurors:
    ${JSON.stringify(jurorProfiles, null, 2)}
    
    Simulate a realistic deliberation where each juror:
    1. Expresses their initial opinion based on their background and biases
    2. Responds to other jurors' arguments
    3. May change their position based on persuasive arguments
    4. Votes on the verdict
    
    Return JSON with:
    - "deliberations": array of {jurorId, jurorName, statement, leaningAfter} - at least 3 rounds
    - "verdict": {verdict: "guilty"/"not guilty"/"hung", confidence, voteTally, reasoning, weaknesses[], strengths[]}
    
    Make the deliberation realistic - some jurors should be swayed, some stubborn.
    Consider each juror's demographics and psychographics in their reasoning.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            deliberations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  jurorId: { type: Type.STRING },
                  jurorName: { type: Type.STRING },
                  statement: { type: Type.STRING },
                  leaningAfter: { type: Type.NUMBER }
                }
              }
            },
            verdict: {
              type: Type.OBJECT,
              properties: {
                verdict: { type: Type.STRING, enum: ['guilty', 'not guilty', 'hung'] },
                confidence: { type: Type.NUMBER },
                voteTally: { type: Type.STRING },
                reasoning: { type: Type.STRING },
                weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                strengths: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            }
          }
        }
      }
    });

    return JSON.parse(response.text || '{}');

  } catch (error) {
    console.error('Deliberation simulation error:', error);
    return {
      deliberations: [],
      verdict: {
        verdict: 'hung',
        confidence: 0,
        voteTally: {
          guilty: 0,
          notGuilty: 0
        },
        reasoning: 'Unable to simulate deliberation due to error',
        weaknesses: [],
        strengths: []
      }
    };
  }
};