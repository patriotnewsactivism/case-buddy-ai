import { TrialPhase } from '../types';

export type Jurisdiction = 'federal' | 'texas' | 'louisiana' | 'mississippi';

export interface ObjectionRule {
  ground: string;
  shortForm: string;
  federalRule: string;
  texasRule?: string;
  louisianaRule?: string;
  mississippiRule?: string;
  description: string;
  explanation: string;
  examples: string[];
  exceptions: string[];
  curingInstructions: string;
  applicablePhases: TrialPhase[];
  severity: 'critical' | 'serious' | 'moderate';
  jurisdictionVariations: Partial<Record<Jurisdiction, string>>;
  commonResponses: string[];
}

export const OBJECTION_GROUNDS: ObjectionRule[] = [
  {
    ground: 'Hearsay',
    shortForm: 'Objection, hearsay.',
    federalRule: 'FRE 801-807',
    texasRule: 'Texas Rules of Evidence 801-807',
    louisianaRule: 'Louisiana Code of Evidence Art. 801-806',
    mississippiRule: 'Mississippi Rules of Evidence 801-807',
    description: 'An out-of-court statement offered to prove the truth of the matter asserted.',
    explanation: 'Hearsay is inadmissible unless it falls under an exception or exemption defined in the rules of evidence. The statement must be made by a declarant outside of the current trial or hearing, and offered for the truth of the matter asserted.',
    examples: [
      'Witness testifies: "John told me the defendant was at the scene."',
      'Offering a police report to prove the facts stated within it.',
      'Reading from a letter written by someone not testifying.',
      'Testifying about what a now-deceased victim said about the incident.',
      'Introducing a written statement from an unavailable witness.',
      'Offering a 911 call to prove the facts stated by the caller.',
      'Reading social media posts to prove their contents are true.'
    ],
    exceptions: [
      'Present Sense Impression (FRE 803(1)) - Statement describing or explaining an event made while or immediately after perceiving it.',
      'Excited Utterance (FRE 803(2)) - Statement relating to a startling event made while under stress.',
      'Then-Existing Mental, Emotional, or Physical Condition (FRE 803(3)) - Statement of declarant\'s then-existing state of mind.',
      'Statement Made for Medical Diagnosis or Treatment (FRE 803(4)) - Statements for purposes of medical diagnosis or treatment.',
      'Recorded Recollection (FRE 803(5)) - Record on matter witness once knew but now cannot recall.',
      'Records of a Regularly Conducted Activity (FRE 803(6)) - Business records kept in regular practice.',
      'Absence of a Record of a Regularly Conducted Activity (FRE 803(7)) - Evidence that a matter is not included in business records.',
      'Public Records (FRE 803(8)) - Records of public offices setting forth activities, matters observed, or factual findings.',
      'Public Records of Vital Statistics (FRE 803(9)) - Records of births, deaths, marriages, etc.',
      'Absence of a Public Record (FRE 803(10)) - Testimony that a search failed to disclose a public record.',
      'Records of Religious Organizations (FRE 803(11)) - Statements in records of religious organizations.',
      'Certificates of Marriage, Baptism, and Similar Ceremonies (FRE 803(12)) - Certificates of religious ceremonies.',
      'Family Records (FRE 803(13)) - Statements in family Bibles, jewelry engravings, etc.',
      'Records of Documents That Affect an Interest in Property (FRE 803(14)) - Records of documents affecting property.',
      'Statements in Documents That Affect an Interest in Property (FRE 803(15)) - Statements in property documents.',
      'Statements in Ancient Documents (FRE 803(16)) - Statements in documents at least 20 years old.',
      'Market Reports and Similar Commercial Publications (FRE 803(17)) - Published compilations of market quotations.',
      'Learned Treatises, Periodicals, or Pamphlets (FRE 803(18)) - Established treatises on specialized subjects.',
      'Reputation Concerning Personal or Family History (FRE 803(19)) - Reputation among family or community.',
      'Reputation Concerning Boundaries or General History (FRE 803(20)) - Reputation in community about boundaries.',
      'Reputation Concerning Character (FRE 803(21)) - Reputation of a person\'s character.',
      'Judgments of Previous Convictions (FRE 803(22)) - Evidence of prior felony convictions.',
      'Judgments Involving Personal, Family, or General History (FRE 803(23)) - Judgments about personal or family history.',
      'Former Testimony (FRE 804(a)) - Testimony from prior proceeding if declarant unavailable.',
      'Statement Under the Belief of Imminent Death (FRE 804(b)(2)) - Dying declarations in homicide cases.',
      'Statement Against Interest (FRE 804(b)(3)) - Statement so contrary to declarant\'s interest that reasonable person would not have made it.',
      'Statement Offered Against a Party That Conspired with the Declarant (FRE 804(b)(5)) - Statement by coconspirator.',
      'Statement of Personal or Family History (FRE 804(b)(4)) - Statement about personal or family history.',
      'Forfeiture by Wrongdoing (FRE 804(b)(6)) - Statement offered against party who wrongfully made declarant unavailable.',
      'Residual Exception (FRE 807) - Statements with equivalent guarantees of trustworthiness.',
      'Declarant-Witness\'s Prior Statement (FRE 801(d)(1)) - Prior statements by testifying witness.',
      'Opposing Party\'s Statement (FRE 801(d)(2)) - Statements by party-opponent not considered hearsay.',
      'Statements by Agent or Employee (FRE 801(d)(2)(D)) - Statements by party\'s agent within scope of relationship.'
    ],
    curingInstructions: 'Rephrase the question to seek non-hearsay information, establish an exception applies, or show the statement is not offered for its truth but for another purpose such as effect on listener or notice.',
    applicablePhases: ['direct-examination', 'cross-examination', 'defendant-testimony'],
    severity: 'critical',
    jurisdictionVariations: {
      louisiana: 'Louisiana follows similar hearsay rules but has codified them in the Louisiana Code of Evidence rather than adopting federal rules verbatim. Some differences exist in the treatment of prior inconsistent statements and coconspirator statements.'
    },
    commonResponses: [
      'Your Honor, this is offered not for the truth of the matter asserted, but to show the effect on the listener.',
      'Your Honor, this falls under the excited utterance exception.',
      'Your Honor, this is a party-opponent admission and not hearsay under FRE 801(d)(2).',
      'Your Honor, the declarant is present and subject to cross-examination about this prior statement.'
    ]
  },
  {
    ground: 'Leading Question',
    shortForm: 'Objection, leading.',
    federalRule: 'FRE 611(c)',
    texasRule: 'Texas Rules of Evidence 611(c)',
    louisianaRule: 'Louisiana Code of Evidence Art. 611(C)',
    mississippiRule: 'Mississippi Rules of Evidence 611(c)',
    description: 'A question that suggests the answer or puts words in the witness\'s mouth.',
    explanation: 'Leading questions are generally prohibited on direct examination but permitted on cross-examination. They may also be allowed for preliminary matters, hostile witnesses, or when necessary to develop testimony.',
    examples: [
      '"You saw the defendant at the scene, didn\'t you?"',
      '"The car was traveling at 60 miles per hour, correct?"',
      '"Isn\'t it true that you were fired from your job?"',
      '"You were afraid for your life, weren\'t you?"',
      '"The defendant threatened you before this incident, right?"'
    ],
    exceptions: [
      'Preliminary or background matters (e.g., establishing name, address, employment)',
      'Hostile witnesses, adverse parties, or witnesses identified with adverse party',
      'Cross-examination (leading questions are expected)',
      'Witness having difficulty communicating',
      'Refreshing recollection when witness is genuinely stuck',
      'Undue surprise causing witness to freeze'
    ],
    curingInstructions: 'Rephrase the question as an open-ended question (starting with who, what, when, where, why, or how) or establish that the witness is hostile or adverse.',
    applicablePhases: ['direct-examination'],
    severity: 'moderate',
    jurisdictionVariations: {
      texas: 'Texas courts follow federal practice closely but may be more lenient with foundational questions.'
    },
    commonResponses: [
      'I\'ll rephrase, Your Honor.',
      'Your Honor, this witness has been declared hostile.',
      'Your Honor, this is merely foundational.',
      'I\'m establishing preliminary matters, Your Honor.'
    ]
  },
  {
    ground: 'Calls for Speculation',
    shortForm: 'Objection, calls for speculation.',
    federalRule: 'FRE 602, 701',
    texasRule: 'Texas Rules of Evidence 602, 701',
    louisianaRule: 'Louisiana Code of Evidence Art. 602, 701',
    mississippiRule: 'Mississippi Rules of Evidence 602, 701',
    description: 'A question that asks the witness to guess or speculate about facts they do not personally know.',
    explanation: 'Witnesses may only testify to matters within their personal knowledge. Questions asking witnesses to speculate about what others thought, what might have happened, or hypothetical scenarios are improper.',
    examples: [
      '"What do you think the defendant was thinking at that moment?"',
      '"How fast do you think the other car was going based on the damage?"',
      '"What would have happened if the light had been green?"',
      '"Why do you think the company made that decision?"',
      '"What do you suppose motivated him to act that way?"'
    ],
    exceptions: [
      'Qualified expert witnesses offering opinions within their expertise',
      'Lay opinion testimony about things rationally based on perception (FRE 701)',
      'Questions asking witness to explain their own state of mind',
      'Hypothetical questions to expert witnesses with proper foundation'
    ],
    curingInstructions: 'Rephrase to ask only about facts within the witness\'s personal knowledge, or establish proper foundation for expert opinion testimony.',
    applicablePhases: ['direct-examination', 'cross-examination', 'defendant-testimony'],
    severity: 'serious',
    jurisdictionVariations: {},
    commonResponses: [
      'I\'ll ask what the witness observed, Your Honor.',
      'Your Honor, I\'m asking about the witness\'s own perception.',
      'I\'ll rephrase to focus on what the witness personally observed.'
    ]
  },
  {
    ground: 'Foundation',
    shortForm: 'Objection, lack of foundation.',
    federalRule: 'FRE 602, 901',
    texasRule: 'Texas Rules of Evidence 602, 901',
    louisianaRule: 'Louisiana Code of Evidence Art. 602, 901',
    mississippiRule: 'Mississippi Rules of Evidence 602, 901',
    description: 'The attorney has not established the necessary predicate facts before asking a question or introducing evidence.',
    explanation: 'Before a witness can testify to certain facts or before evidence can be admitted, the proponent must establish the foundational requirements such as personal knowledge, authenticity, or chain of custody.',
    examples: [
      'Asking about a document without establishing the witness\'s familiarity with it.',
      'Introducing a photograph without authenticating it.',
      'Questioning about an event without establishing the witness was present.',
      'Offering an email without establishing it was sent or received by the relevant party.',
      'Asking about company records without establishing custodial foundation.'
    ],
    exceptions: [
      'Self-authenticating documents under FRE 902',
      'Judicial notice of certain facts under FRE 201',
      'Stipulated facts',
      'Facts already established in the record'
    ],
    curingInstructions: 'Lay foundation by asking preliminary questions establishing personal knowledge, authenticity, chain of custody, or other required predicates before the substantive question.',
    applicablePhases: ['direct-examination', 'cross-examination', 'defendant-testimony', 'opening-statement'],
    severity: 'serious',
    jurisdictionVariations: {},
    commonResponses: [
      'I\'m laying foundation, Your Honor, if I may continue.',
      'Your Honor, I\'ll establish the foundation with preliminary questions.',
      'May I approach, Your Honor, to show the witness the document?'
    ]
  },
  {
    ground: 'Relevance',
    shortForm: 'Objection, irrelevant.',
    federalRule: 'FRE 401, 402',
    texasRule: 'Texas Rules of Evidence 401, 402',
    louisianaRule: 'Louisiana Code of Evidence Art. 401, 402',
    mississippiRule: 'Mississippi Rules of Evidence 401, 402',
    description: 'Evidence that does not make a fact more or less probable and is not consequential to the action.',
    explanation: 'Evidence must be relevant to be admissible. Relevant evidence makes a fact of consequence more or less probable than it would be without the evidence. Irrelevant evidence is not admissible.',
    examples: [
      'Questions about a witness\'s unrelated hobbies in a contract dispute.',
      'Evidence of a party\'s political affiliation in a personal injury case.',
      'Questions about a witness\'s marital status in a fraud case.',
      'Details about a victim\'s unrelated medical history.',
      'Testimony about events long after the incident in question.'
    ],
    exceptions: [
      'Evidence offered for background or context (within limits)',
      'Evidence relevant to credibility',
      'Evidence that becomes relevant based on other testimony'
    ],
    curingInstructions: 'Explain how the evidence relates to an issue in the case, or establish its connection to an element of a claim or defense.',
    applicablePhases: ['direct-examination', 'cross-examination', 'defendant-testimony', 'opening-statement', 'closing-argument'],
    severity: 'moderate',
    jurisdictionVariations: {},
    commonResponses: [
      'Your Honor, this goes to the witness\'s bias.',
      'Your Honor, this is relevant to the plaintiff\'s claimed damages.',
      'Your Honor, this bears directly on the issue of intent.',
      'This goes to credibility, Your Honor.'
    ]
  },
  {
    ground: 'Unfair Prejudice',
    shortForm: 'Objection, prejudicial under 403.',
    federalRule: 'FRE 403',
    texasRule: 'Texas Rules of Evidence 403',
    louisianaRule: 'Louisiana Code of Evidence Art. 403',
    mississippiRule: 'Mississippi Rules of Evidence 403',
    description: 'Relevant evidence whose probative value is substantially outweighed by danger of unfair prejudice, confusion, or waste of time.',
    explanation: 'Even relevant evidence may be excluded if its probative value is substantially outweighed by the danger of unfair prejudice, confusing the issues, misleading the jury, undue delay, waste of time, or needlessly presenting cumulative evidence.',
    examples: [
      'Gruesome photographs that add little to the case but inflame the jury.',
      'Evidence of prior bad acts that suggests bad character.',
      'Emotionally charged testimony with minimal evidentiary value.',
      'Cumulative evidence from numerous witnesses saying the same thing.',
      'Evidence presented in a misleading way.'
    ],
    exceptions: [
      'Evidence critical to an essential element of the case',
      'Evidence necessary to establish context',
      'Evidence the probative value of which is high despite prejudicial effect'
    ],
    curingInstructions: 'The offering party should explain the probative value, offer limiting instructions, or present the evidence in a less prejudicial form.',
    applicablePhases: ['direct-examination', 'cross-examination', 'defendant-testimony', 'opening-statement', 'closing-argument'],
    severity: 'serious',
    jurisdictionVariations: {},
    commonResponses: [
      'Your Honor, the probative value is high, and I can offer a limiting instruction.',
      'Your Honor, this evidence is essential to establishing intent.',
      'I can present this in a less inflammatory manner, Your Honor.',
      'Your Honor, we can stipulate to certain facts to minimize prejudice.'
    ]
  },
  {
    ground: 'Character Evidence',
    shortForm: 'Objection, improper character evidence under 404.',
    federalRule: 'FRE 404, 405',
    texasRule: 'Texas Rules of Evidence 404, 405',
    louisianaRule: 'Louisiana Code of Evidence Art. 404, 405',
    mississippiRule: 'Mississippi Rules of Evidence 404, 405',
    description: 'Evidence of a person\'s character or character trait used to prove action in conformity therewith on a particular occasion.',
    explanation: 'Character evidence is generally inadmissible to prove conduct in conformity. Exceptions exist for character of the accused, character of the alleged victim, and character of witnesses.',
    examples: [
      '"Isn\'t it true the defendant has been arrested before?"',
      '"The plaintiff has a reputation for being litigious."',
      '"The defendant is known in the community as a dishonest person."',
      '"Witness has a history of making false accusations."',
      '"The victim had a reputation for violence."'
    ],
    exceptions: [
      'Character of the accused offered by the accused (FRE 404(a)(1))',
      'Character of the alleged victim offered by the accused (FRE 404(a)(2))',
      'Character of the alleged victim of sexual assault (FRE 412 exceptions)',
      'Character for truthfulness of a witness (FRE 608, 609)',
      'Character evidence in civil cases where character is an essential element',
      'Habit evidence under FRE 406',
      'Evidence of other crimes, wrongs, or acts for non-propensity purposes (motive, opportunity, intent, preparation, plan, knowledge, identity, absence of mistake)'
    ],
    curingInstructions: 'Rephrase the question to avoid character evidence, or establish that an exception applies such as proving motive, opportunity, intent, or a common scheme.',
    applicablePhases: ['direct-examination', 'cross-examination', 'defendant-testimony'],
    severity: 'critical',
    jurisdictionVariations: {
      texas: 'Texas Rule 404 is substantively similar to federal rule.'
    },
    commonResponses: [
      'Your Honor, this goes to motive, not character.',
      'Your Honor, the defendant opened the door to this line of questioning.',
      'Your Honor, I\'m asking about a specific instance of conduct, not character.',
      'This is offered to show intent, Your Honor, under 404(b).'
    ]
  },
  {
    ground: 'Compound Question',
    shortForm: 'Objection, compound question.',
    federalRule: 'FRE 611(a)',
    texasRule: 'Texas Rules of Evidence 611(a)',
    louisianaRule: 'Louisiana Code of Evidence Art. 611(A)',
    mississippiRule: 'Mississippi Rules of Evidence 611(a)',
    description: 'A question that asks multiple things at once, making it unclear which part is being answered.',
    explanation: 'Questions should not contain multiple inquiries that could elicit different answers. Compound questions confuse the record and make it difficult to know which part the witness is addressing.',
    examples: [
      '"Did you see the defendant at the party, and did he appear intoxicated?"',
      '"Was the contract signed, and were all the terms agreed upon?"',
      '"Did you report the incident to your supervisor, and what did they say?"',
      '"Were you present at the meeting, and did you hear the decision?"',
      '"Did the plaintiff complain about the product, and was there a refund offered?"'
    ],
    exceptions: [
      'Questions where the component parts are logically connected and expected to be answered together',
      'Simplified compound questions on preliminary matters'
    ],
    curingInstructions: 'Break the compound question into separate, individual questions.',
    applicablePhases: ['direct-examination', 'cross-examination', 'defendant-testimony'],
    severity: 'moderate',
    jurisdictionVariations: {},
    commonResponses: [
      'I\'ll break that into separate questions, Your Honor.',
      'I\'ll rephrase, Your Honor.'
    ]
  },
  {
    ground: 'Asked and Answered',
    shortForm: 'Objection, asked and answered.',
    federalRule: 'FRE 403, 611(a)',
    texasRule: 'Texas Rules of Evidence 403, 611(a)',
    louisianaRule: 'Louisiana Code of Evidence Art. 403, 611(A)',
    mississippiRule: 'Mississippi Rules of Evidence 403, 611(a)',
    description: 'The same question has already been asked and answered during the examination.',
    explanation: 'Repetitive questioning wastes time, harasses the witness, and is unnecessary for developing the evidence. The court may intervene to prevent needless consumption of time.',
    examples: [
      'Repeatedly asking about the same event in slightly different ways.',
      'Returning to a topic the witness has already fully addressed.',
      'Asking the same question to multiple witnesses without new purpose.',
      'Restating the question after receiving a clear answer.'
    ],
    exceptions: [
      'Different context or angle of inquiry',
      'Attempting to impeach with prior inconsistent statement',
      'Clarifying a vague or incomplete answer',
      'Recross after redirect examination'
    ],
    curingInstructions: 'Move on to a different topic or explain why additional questioning on this point is necessary.',
    applicablePhases: ['direct-examination', 'cross-examination', 'defendant-testimony'],
    severity: 'moderate',
    jurisdictionVariations: {},
    commonResponses: [
      'Your Honor, this is a new angle on the issue.',
      'I\'m attempting to clarify the witness\'s previous testimony.',
      'Your Honor, this goes to impeachment.'
    ]
  },
  {
    ground: 'Argumentative',
    shortForm: 'Objection, argumentative.',
    federalRule: 'FRE 611(a)',
    texasRule: 'Texas Rules of Evidence 611(a)',
    louisianaRule: 'Louisiana Code of Evidence Art. 611(A)',
    mississippiRule: 'Mississippi Rules of Evidence 611(a)',
    description: 'A question that is really an argument or statement of counsel disguised as a question.',
    explanation: 'Questions should elicit information from the witness, not argue the case or challenge the witness to agree with counsel\'s characterization. Argumentative questions often contain loaded language or rhetorical devices.',
    examples: [
      '"How can you possibly claim you didn\'t know the defendant was dangerous?"',
      '"Are you seriously asking this court to believe your story?"',
      '"Wouldn\'t any reasonable person have called the police?"',
      '"Isn\'t it obvious that you were negligent?"',
      '"Do you expect the jury to believe that?"'
    ],
    exceptions: [
      'Cross-examination may be more probing',
      'Questions that appear argumentative but are actually testing credibility',
      'Questions that challenge inconsistent testimony'
    ],
    curingInstructions: 'Rephrase to ask about facts rather than opinions or characterizations, and avoid rhetorical flourishes.',
    applicablePhases: ['direct-examination', 'cross-examination', 'defendant-testimony'],
    severity: 'moderate',
    jurisdictionVariations: {},
    commonResponses: [
      'I\'ll rephrase, Your Honor.',
      'I\'m testing credibility, Your Honor.',
      'I\'ll ask directly, Your Honor.'
    ]
  },
  {
    ground: 'Badgering the Witness',
    shortForm: 'Objection, counsel is badgering the witness.',
    federalRule: 'FRE 611(a)',
    texasRule: 'Texas Rules of Evidence 611(a)',
    louisianaRule: 'Louisiana Code of Evidence Art. 611(A)',
    mississippiRule: 'Mississippi Rules of Evidence 611(a)',
    description: 'Harassing, intimidating, or unduly pressuring the witness during questioning.',
    explanation: 'Attorneys may not harass, embarrass, or intimidate witnesses. While vigorous cross-examination is permitted, crossing the line into badgering is improper and may require court intervention.',
    examples: [
      'Shouting at the witness or using aggressive tone.',
      'Repeatedly asking the same question to wear down the witness.',
      'Making demeaning comments about the witness\'s intelligence.',
      'Rapid-fire questions intended to confuse.',
      'Personal attacks on the witness\'s character.'
    ],
    exceptions: [
      'Vigorous but professional cross-examination',
      'Testing credibility through confrontational but appropriate questioning'
    ],
    curingInstructions: 'Adopt a more respectful tone, slow the pace of questioning, or move to a different topic.',
    applicablePhases: ['direct-examination', 'cross-examination', 'defendant-testimony'],
    severity: 'serious',
    jurisdictionVariations: {},
    commonResponses: [
      'I apologize, Your Honor. I\'ll proceed with appropriate questioning.',
      'I\'ll rephrase the question, Your Honor.'
    ]
  },
  {
    ground: 'Privilege',
    shortForm: 'Objection, privileged communication.',
    federalRule: 'FRE 501',
    texasRule: 'Texas Rules of Evidence 501-511',
    louisianaRule: 'Louisiana Code of Evidence Art. 501-518',
    mississippiRule: 'Mississippi Rules of Evidence 501-513',
    description: 'Question calls for information protected by attorney-client, doctor-patient, spousal, or other recognized privilege.',
    explanation: 'Privileged communications are protected from disclosure. Common privileges include attorney-client, doctor-patient, spousal privilege, priest-penitent, and psychotherapist-patient privilege.',
    examples: [
      'Asking about conversations with attorney about the case.',
      'Seeking details of medical treatment from physician.',
      'Questioning spouse about private conversations.',
      'Requesting communications with clergy member.',
      'Asking about therapy sessions.'
    ],
    exceptions: [
      'Waiver of privilege by the holder',
      'Crime-fraud exception for attorney-client privilege',
      'Patient-litigant exception when patient puts condition at issue',
      'Joint client exception',
      'In camera review to determine applicability'
    ],
    curingInstructions: 'Establish that privilege has been waived, an exception applies, or the communication is not covered by privilege. Otherwise, move to a different topic.',
    applicablePhases: ['direct-examination', 'cross-examination', 'defendant-testimony', 'voir-dire'],
    severity: 'critical',
    jurisdictionVariations: {
      texas: 'Texas has codified specific privileges in Rules 501-511, including special provisions for journalist privilege.',
      louisiana: 'Louisiana has detailed privilege rules in Code of Evidence Articles 501-518.'
    },
    commonResponses: [
      'Your Honor, the privilege has been waived.',
      'Your Honor, this falls under the crime-fraud exception.',
      'Your Honor, the patient has put their condition at issue.',
      'Your Honor, I\'m not seeking privileged communications, only facts the witness observed.'
    ]
  },
  {
    ground: 'Best Evidence Rule',
    shortForm: 'Objection, original document required under the best evidence rule.',
    federalRule: 'FRE 1001-1008',
    texasRule: 'Texas Rules of Evidence 1001-1008',
    louisianaRule: 'Louisiana Code of Evidence Art. 1001-1008',
    mississippiRule: 'Mississippi Rules of Evidence 1001-1008',
    description: 'When the content of a writing, recording, or photograph is in issue, the original is required.',
    explanation: 'The best evidence rule requires the original document when a party seeks to prove the content of that document. Secondary evidence is admissible only when the original is unavailable for a valid reason.',
    examples: [
      'Testifying about the contents of a contract without producing it.',
      'Describing an email without introducing the email.',
      'Summarizing a document\'s contents instead of offering the document.',
      'Quoting from a letter without producing the original.',
      'Describing contents of a photograph without producing it.'
    ],
    exceptions: [
      'Original lost or destroyed (not in bad faith)',
      'Original cannot be obtained by judicial process',
      'Original in possession of opponent who failed to produce it',
      'Collateral matters not closely related to controlling issue',
      'Public records certified or testified to be correct',
      'Summaries of voluminous records (FRE 1006)',
      'Duplicates are generally admissible (FRE 1003)'
    ],
    curingInstructions: 'Produce the original document, establish an exception applies, or explain why testimony about contents is appropriate under the circumstances.',
    applicablePhases: ['direct-examination', 'cross-examination', 'defendant-testimony'],
    severity: 'serious',
    jurisdictionVariations: {},
    commonResponses: [
      'Your Honor, the original has been lost despite diligent search.',
      'Your Honor, we offer a duplicate under FRE 1003.',
      'Your Honor, this is a collateral matter.',
      'Your Honor, I\'ll lay foundation for the summary under Rule 1006.'
    ]
  },
  {
    ground: 'Expert Testimony Foundation',
    shortForm: 'Objection, lack of foundation for expert testimony.',
    federalRule: 'FRE 702, Daubert standard',
    texasRule: 'Texas Rules of Evidence 702, Nenno standard',
    louisianaRule: 'Louisiana Code of Evidence Art. 702, Daubert standard',
    mississippiRule: 'Mississippi Rules of Evidence 702, Daubert standard',
    description: 'Failure to establish that witness is qualified as expert and testimony meets reliability requirements.',
    explanation: 'Expert testimony requires the witness to be qualified by knowledge, skill, experience, training, or education, and the testimony must be based on sufficient facts, reliable principles, and reliable application of principles to facts.',
    examples: [
      'Offering medical opinion without establishing doctor\'s qualifications.',
      'Engineering testimony without showing witness\'s expertise in relevant area.',
      'Financial analysis without establishing accountant\'s relevant experience.',
      'Forensic evidence without demonstrating scientific reliability.',
      'Proposed testimony not based on sufficient facts or data.'
    ],
    exceptions: [
      'Stipulation to expert qualifications',
      'Judicial notice of certain kinds of expertise',
      'Expert report previously accepted in related litigation'
    ],
    curingInstructions: 'Establish the witness\'s qualifications through voir dire, demonstrate the reliability of the methodology, and show the testimony is based on sufficient facts.',
    applicablePhases: ['direct-examination', 'cross-examination'],
    severity: 'critical',
    jurisdictionVariations: {
      texas: 'Texas uses the Nenno standard for expert testimony, which differs from Daubert in some respects.',
      louisiana: 'Louisiana follows the Daubert standard as adopted by the Louisiana Supreme Court.'
    },
    commonResponses: [
      'Your Honor, I\'d like to conduct voir dire on the witness\'s qualifications.',
      'Your Honor, the witness has extensive experience in this field.',
      'Your Honor, this methodology has been accepted in peer-reviewed publications.',
      'Your Honor, this technique has been accepted by courts for many years.'
    ]
  },
  {
    ground: 'Narrative',
    shortForm: 'Objection, narrative.',
    federalRule: 'FRE 611(a)',
    texasRule: 'Texas Rules of Evidence 611(a)',
    louisianaRule: 'Louisiana Code of Evidence Art. 611(A)',
    mississippiRule: 'Mississippi Rules of Evidence 611(a)',
    description: 'Allowing a witness to tell their story in an uncontrolled narrative rather than through specific questions.',
    explanation: 'Examination should be conducted through specific questions rather than allowing witnesses to give long, unstructured narratives. This allows opposing counsel to object to improper evidence before it is heard.',
    examples: [
      '"Tell us what happened." (without further questioning)',
      '"Just tell your story."',
      '"Explain everything from the beginning to the end."',
      '"Describe in your own words everything about the incident."'
    ],
    exceptions: [
      'Brief narrative permitted for efficiency on foundational matters',
      'Court\'s discretion to allow narrative for child or traumatized witnesses',
      'Redirect to clarify prior testimony'
    ],
    curingInstructions: 'Ask specific questions rather than inviting open-ended narratives.',
    applicablePhases: ['direct-examination', 'cross-examination'],
    severity: 'moderate',
    jurisdictionVariations: {},
    commonResponses: [
      'I\'ll ask specific questions, Your Honor.',
      'Your Honor, I\'ll conduct this examination through direct questioning.'
    ]
  },
  {
    ground: 'Assumes Facts Not in Evidence',
    shortForm: 'Objection, assumes facts not in evidence.',
    federalRule: 'FRE 611(a)',
    texasRule: 'Texas Rules of Evidence 611(a)',
    louisianaRule: 'Louisiana Code of Evidence Art. 611(A)',
    mississippiRule: 'Mississippi Rules of Evidence 611(a)',
    description: 'A question that includes facts that have not yet been admitted into evidence.',
    explanation: 'Questions should not assume the truth of facts not yet established in the case. Such questions can mislead the jury and suggest facts that may never be proven.',
    examples: [
      '"After the defendant assaulted the victim, what did you see?" (assault not proven)',
      '"When you arrived at the accident scene you caused..."',
      '"After the company defrauded its investors..."',
      '"When you fired the employee without cause..."',
      '"In the moments after the breach of contract..."'
    ],
    exceptions: [
      'Facts that have been admitted or stipulated',
      'Hypothetical questions to expert witnesses with proper foundation',
      'Facts established in prior testimony'
    ],
    curingInstructions: 'Remove the assumption from the question or first establish the assumed fact through evidence.',
    applicablePhases: ['direct-examination', 'cross-examination', 'defendant-testimony'],
    severity: 'serious',
    jurisdictionVariations: {},
    commonResponses: [
      'I\'ll rephrase without the assumption, Your Honor.',
      'Your Honor, that fact was established in prior testimony.',
      'Your Honor, that fact has been stipulated.'
    ]
  },
  {
    ground: 'Non-Responsive',
    shortForm: 'Objection, non-responsive.',
    federalRule: 'FRE 611(a)',
    texasRule: 'Texas Rules of Evidence 611(a)',
    louisianaRule: 'Louisiana Code of Evidence Art. 611(A)',
    mississippiRule: 'Mississippi Rules of Evidence 611(a)',
    description: 'The witness\'s answer does not address the question asked.',
    explanation: 'Witnesses should answer the questions asked. Non-responsive answers may contain improper evidence or waste time. The examining attorney may move to strike non-responsive portions.',
    examples: [
      'Q: "What time did you arrive?" A: "The defendant has always been a troublemaker."',
      'Q: "Did you see the contract?" A: "The whole company is corrupt."',
      'Q: "Where were you standing?" A: "This whole lawsuit is a waste of time."',
      'Q: "What did the email say?" A: "I never trusted that man."'
    ],
    exceptions: [
      'Answers that reasonably address the question even if indirectly',
      'Clarifying information that is responsive to the question'
    ],
    curingInstructions: 'Move to strike the non-responsive portion and ask the witness to answer only the question posed.',
    applicablePhases: ['direct-examination', 'cross-examination', 'defendant-testimony'],
    severity: 'moderate',
    jurisdictionVariations: {},
    commonResponses: [
      'Your Honor, I move to strike the non-responsive portion.',
      'Your Honor, please instruct the witness to answer the question asked.',
      'I\'ll rephrase the question, Your Honor.'
    ]
  },
  {
    ground: 'Improper Opening Statement',
    shortForm: 'Objection, improper opening statement.',
    federalRule: 'FRE 403, 611(a)',
    texasRule: 'Texas Rules of Evidence 403, 611(a)',
    louisianaRule: 'Louisiana Code of Evidence Art. 403, 611(A)',
    mississippiRule: 'Mississippi Rules of Evidence 403, 611(a)',
    description: 'Opening statement contains improper argument, evidence not to be offered, or prejudicial material.',
    explanation: 'Opening statements should be limited to a preview of the evidence to be presented. They should not contain argument, references to inadmissible evidence, or inflammatory rhetoric.',
    examples: [
      'Stating facts that cannot be proven through admissible evidence.',
      'Making legal arguments about how the jury should decide.',
      'Referring to evidence likely to be excluded.',
      'Making inflammatory characterizations of parties.',
      'Stating personal opinions about guilt or liability.',
      'Discussing settlement negotiations or offers.'
    ],
    exceptions: [
      'Reasonable preview of evidence counsel expects to present',
      'Brief reference to the legal issues to be decided'
    ],
    curingInstructions: 'Move to a statement of what evidence will show without argument or prejudicial characterizations.',
    applicablePhases: ['opening-statement'],
    severity: 'serious',
    jurisdictionVariations: {},
    commonResponses: [
      'I\'ll stick to a preview of the evidence, Your Honor.',
      'I\'ll rephrase, Your Honor.',
      'Your Honor, I expect this evidence will be admitted.',
      'I\'ll move on, Your Honor.'
    ]
  },
  {
    ground: 'Improper Closing Argument',
    shortForm: 'Objection, improper closing argument.',
    federalRule: 'FRE 403, 611(a)',
    texasRule: 'Texas Rules of Evidence 403, 611(a)',
    louisianaRule: 'Louisiana Code of Evidence Art. 403, 611(A)',
    mississippiRule: 'Mississippi Rules of Evidence 403, 611(a)',
    description: 'Closing argument contains improper content such as facts not in evidence, personal opinion, or prejudicial rhetoric.',
    explanation: 'Closing arguments may summarize evidence and argue reasonable inferences. They may not state facts not in evidence, express personal opinion, appeal to prejudice, or misstate the law.',
    examples: [
      'Stating facts never introduced at trial.',
      'Expressing personal belief in client\'s case.',
      'Appealing to jury\'s sympathy or prejudice.',
      'Misstating the applicable law.',
      'Commenting on defendant\'s failure to testify.',
      'Vouching for witness credibility.',
      'Asking jury to "send a message."'
    ],
    exceptions: [
      'Arguing reasonable inferences from evidence',
      'Responding to opposing counsel\'s arguments',
      'Commenting on witness credibility based on evidence'
    ],
    curingInstructions: 'Base argument on evidence in the record and reasonable inferences therefrom.',
    applicablePhases: ['closing-argument'],
    severity: 'serious',
    jurisdictionVariations: {},
    commonResponses: [
      'I\'ll stick to the evidence, Your Honor.',
      'Your Honor, this is a reasonable inference from the testimony.',
      'I\'ll rephrase, Your Honor.',
      'Your Honor, I\'m responding to opposing counsel\'s argument.'
    ]
  },
  {
    ground: 'Improper Voir Dire',
    shortForm: 'Objection, improper voir dire.',
    federalRule: 'FRE 611(a)',
    texasRule: 'Texas Rules of Evidence 611(a)',
    louisianaRule: 'Louisiana Code of Evidence Art. 611(A)',
    mississippiRule: 'Mississippi Rules of Evidence 611(a)',
    description: 'Improper questioning of potential jurors during jury selection.',
    explanation: 'Voir dire must be conducted properly to seat a fair and impartial jury. Improper voir dire includes attempting to indoctrinate jurors, asking legally improper questions, or attempting to commit jurors to a position.',
    examples: [
      'Attempting to commit jurors to a specific verdict.',
      '"If the plaintiff doesn\'t prove her case, would you have trouble finding for the defense?"',
      'Arguing the case during jury selection.',
      'Questions designed to indoctrinate rather than screen.',
      'Questions about specific facts not proper for voir dire.',
      'Attempting to discover how jurors would vote.'
    ],
    exceptions: [
      'Legitimate questions about bias or prejudice',
      'Questions about ability to follow the law',
      'Questions about relationships with parties or counsel'
    ],
    curingInstructions: 'Rephrase questions to focus on juror qualifications and potential biases without attempting to commit jurors to positions.',
    applicablePhases: ['voir-dire'],
    severity: 'serious',
    jurisdictionVariations: {},
    commonResponses: [
      'I\'ll rephrase the question, Your Honor.',
      'Your Honor, I\'m trying to discover potential bias.',
      'I\'m asking about the juror\'s ability to be fair, Your Honor.',
      'I\'ll move on, Your Honor.'
    ]
  },
  {
    ground: 'Improper Impeachment',
    shortForm: 'Objection, improper impeachment.',
    federalRule: 'FRE 607, 608, 609, 610, 613',
    texasRule: 'Texas Rules of Evidence 607, 608, 609, 610, 613',
    louisianaRule: 'Louisiana Code of Evidence Art. 607, 608, 609, 610, 613',
    mississippiRule: 'Mississippi Rules of Evidence 607, 608, 609, 610, 613',
    description: 'Attempting to impeach a witness using improper methods or evidence.',
    explanation: 'Impeachment must follow the rules of evidence. Improper impeachment includes using inadmissible convictions, bad acts evidence without proper foundation, religious beliefs, or prior statements not properly established.',
    examples: [
      'Using convictions older than 10 years under FRE 609.',
      'Impeaching with prior bad acts not resulting in conviction without proper foundation.',
      'Questioning about religious beliefs to attack credibility.',
      'Using extrinsic evidence on a collateral matter.',
      'Impeaching own witness without surprise or hostility.',
      'Referencing prior arrests without conviction.'
    ],
    exceptions: [
      'Proper impeachment with prior inconsistent statement',
      'Conviction meeting requirements of FRE 609',
      'Evidence of bias, interest, or motive',
      'Character for untruthfulness under FRE 608',
      'Contradiction on material facts'
    ],
    curingInstructions: 'Establish proper foundation for impeachment or use an admissible method such as prior inconsistent statements or properly admissible convictions.',
    applicablePhases: ['direct-examination', 'cross-examination', 'defendant-testimony'],
    severity: 'serious',
    jurisdictionVariations: {
      texas: 'Texas Rule 609 has some differences regarding the admissibility of certain convictions.'
    },
    commonResponses: [
      'Your Honor, I\'m impeaching with a prior inconsistent statement.',
      'Your Honor, this conviction is admissible under Rule 609.',
      'Your Honor, this goes to bias.',
      'Your Honor, I\'ve laid foundation for this line of questioning.'
    ]
  },
  {
    ground: 'Settlement Offer',
    shortForm: 'Objection, settlement offer under Rule 408.',
    federalRule: 'FRE 408',
    texasRule: 'Texas Rules of Evidence 408',
    louisianaRule: 'Louisiana Code of Evidence Art. 408',
    mississippiRule: 'Mississippi Rules of Evidence 408',
    description: 'Attempting to introduce evidence of settlement offers or negotiations to prove liability or amount of claim.',
    explanation: 'Evidence of settlement offers, negotiations, and related conduct is inadmissible to prove liability, invalidity, or amount of a disputed claim. This promotes settlement by protecting the confidentiality of negotiations.',
    examples: [
      '"The defendant offered to pay $50,000 to settle this case."',
      '"In mediation, the plaintiff demanded..."',
      '"The parties attempted to resolve this matter through settlement discussions..."',
      '"After this incident, the company offered to pay medical expenses..."',
      'Reading settlement correspondence to the jury.'
    ],
    exceptions: [
      'Offer to pay medical expenses not covered by 408 in federal courts (but check state law)',
      'Evidence offered for purpose other than proving liability (e.g., bias, obstruction)',
      'Criminal case (different rules may apply)',
      'Settlement agreement itself being enforced'
    ],
    curingInstructions: 'Remove any reference to settlement negotiations or offers from the evidence.',
    applicablePhases: ['direct-examination', 'cross-examination', 'defendant-testimony', 'opening-statement', 'closing-argument'],
    severity: 'critical',
    jurisdictionVariations: {},
    commonResponses: [
      'I\'ll withdraw the question, Your Honor.',
      'I\'ll move on, Your Honor.',
      'Your Honor, this is offered for a purpose other than proving liability.'
    ]
  },
  {
    ground: 'Subsequent Remedial Measures',
    shortForm: 'Objection, subsequent remedial measures under Rule 407.',
    federalRule: 'FRE 407',
    texasRule: 'Texas Rules of Evidence 407',
    louisianaRule: 'Louisiana Code of Evidence Art. 407',
    mississippiRule: 'Mississippi Rules of Evidence 407',
    description: 'Evidence of measures taken after an injury-causing event to prevent future harm.',
    explanation: 'Evidence of subsequent remedial measures is not admissible to prove negligence, culpable conduct, defect, or need for warning. This rule encourages post-accident safety improvements.',
    examples: [
      '"After the accident, the defendant installed a new safety guard."',
      '"The property owner repaired the stairs the day after plaintiff fell."',
      '"The company changed its policy following this incident."',
      '"The manufacturer issued a recall after the accident."',
      '"New warning labels were added after the injury."'
    ],
    exceptions: [
      'Impeachment through prior inconsistent statement',
      'Proving ownership or control if disputed',
      'Proving feasibility of precautionary measures if contested',
      'Product liability cases (varies by jurisdiction)'
    ],
    curingInstructions: 'Establish that the evidence is offered for an admissible purpose such as proving ownership, control, or feasibility.',
    applicablePhases: ['direct-examination', 'cross-examination', 'defendant-testimony'],
    severity: 'serious',
    jurisdictionVariations: {
      louisiana: 'Louisiana\'s rule differs slightly in products liability cases.'
    },
    commonResponses: [
      'Your Honor, this is offered to prove control, which the defendant has disputed.',
      'Your Honor, feasibility is at issue in this case.',
      'Your Honor, I\'m not offering this to prove negligence.'
    ]
  }
];

export interface HearsayException {
  name: string;
  ruleNumber: string;
  requirements: string[];
  applicableIn: Jurisdiction[];
}

export const HEARSAY_EXCEPTIONS: HearsayException[] = [
  {
    name: 'Present Sense Impression',
    ruleNumber: 'FRE 803(1)',
    requirements: ['Statement describing event', 'Made while perceiving event', 'Made immediately after event'],
    applicableIn: ['federal', 'texas', 'louisiana', 'mississippi']
  },
  {
    name: 'Excited Utterance',
    ruleNumber: 'FRE 803(2)',
    requirements: ['Startling event occurred', 'Statement relates to event', 'Made while under stress'],
    applicableIn: ['federal', 'texas', 'louisiana', 'mississippi']
  },
  {
    name: 'Then-Existing Mental, Emotional, or Physical Condition',
    ruleNumber: 'FRE 803(3)',
    requirements: ['Statement of then-existing state', 'Not memory or belief to prove fact'],
    applicableIn: ['federal', 'texas', 'louisiana', 'mississippi']
  },
  {
    name: 'Statement Made for Medical Diagnosis or Treatment',
    ruleNumber: 'FRE 803(4)',
    requirements: ['Made for diagnosis or treatment', 'Reasonably pertinent to treatment'],
    applicableIn: ['federal', 'texas', 'louisiana', 'mississippi']
  },
  {
    name: 'Recorded Recollection',
    ruleNumber: 'FRE 803(5)',
    requirements: ['Witness once had knowledge', 'Record made when fresh in memory', 'Record was accurate'],
    applicableIn: ['federal', 'texas', 'louisiana', 'mississippi']
  },
  {
    name: 'Records of a Regularly Conducted Activity',
    ruleNumber: 'FRE 803(6)',
    requirements: ['Regularly conducted activity', 'Made at or near time', 'Custodian testimony'],
    applicableIn: ['federal', 'texas', 'louisiana', 'mississippi']
  },
  {
    name: 'Former Testimony',
    ruleNumber: 'FRE 804(b)(1)',
    requirements: ['Declarant unavailable', 'Prior proceeding', 'Same party/opportunity to examine'],
    applicableIn: ['federal', 'texas', 'louisiana', 'mississippi']
  },
  {
    name: 'Statement Against Interest',
    ruleNumber: 'FRE 804(b)(3)',
    requirements: ['Declarant unavailable', 'Against pecuniary, proprietary, or penal interest'],
    applicableIn: ['federal', 'texas', 'louisiana', 'mississippi']
  },
  {
    name: 'Dying Declaration',
    ruleNumber: 'FRE 804(b)(2)',
    requirements: ['Declarant believed death imminent', 'Concerning cause of death', 'Homicide case'],
    applicableIn: ['federal', 'texas', 'louisiana', 'mississippi']
  },
  {
    name: 'Declaration Against Interest',
    ruleNumber: 'FRE 804(b)(3)',
    requirements: ['Declarant unavailable', 'Statement against interest', 'Circumstances indicate trustworthiness'],
    applicableIn: ['federal', 'texas', 'louisiana', 'mississippi']
  }
];

export const BEST_EVIDENCE_EXCEPTIONS: string[] = [
  'Original lost or destroyed (not in bad faith)',
  'Original cannot be obtained by judicial process',
  'Original in possession of opponent who failed to produce',
  'Collateral matter not closely related to controlling issue',
  'Public records certified under FRE 902',
  'Summaries of voluminous writings'
];

export const AUTHENTICATION_METHODS: Record<string, string[]> = {
  documents: [
    'Testimony of witness with knowledge',
    'Comparison by trier of fact',
    'Distinctive characteristics',
    'Public records',
    'Self-authentication under FRE 902'
  ],
  photographs: [
    'Testimony of photographer or witness present',
    'Recognition by person depicted',
    'Process or system producing reliable result'
  ],
  recordings: [
    'Testimony of recording operator',
    'Chain of custody testimony',
    'Voice identification',
    'Process authentication'
  ],
  digital_evidence: [
    'Testimony about system reliability',
    'Chain of custody documentation',
    'Hash value verification',
    'Metadata analysis'
  ],
  physical_evidence: [
    'Chain of custody testimony',
    'Testimony of discoverer',
    'Distinctive characteristics',
    'Expert identification'
  ]
};

export function getObjectionByGround(ground: string): ObjectionRule | undefined {
  return OBJECTION_GROUNDS.find(rule => rule.ground.toLowerCase() === ground.toLowerCase());
}

export function getObjectionsForPhase(phase: TrialPhase): ObjectionRule[] {
  return OBJECTION_GROUNDS.filter(rule => rule.applicablePhases.includes(phase));
}

export function getRuleForJurisdiction(objection: ObjectionRule, jurisdiction: Jurisdiction): string {
  switch (jurisdiction) {
    case 'texas':
      return objection.texasRule || objection.federalRule;
    case 'louisiana':
      return objection.louisianaRule || objection.federalRule;
    case 'mississippi':
      return objection.mississippiRule || objection.federalRule;
    default:
      return objection.federalRule;
  }
}

export function getJurisdictionVariation(objection: ObjectionRule, jurisdiction: Jurisdiction): string | undefined {
  return objection.jurisdictionVariations[jurisdiction];
}

export function getHearsayExceptions(jurisdiction: Jurisdiction): HearsayException[] {
  return HEARSAY_EXCEPTIONS.filter(e => e.applicableIn.includes(jurisdiction));
}

export function getAuthenticationMethods(evidenceType: string): string[] {
  return AUTHENTICATION_METHODS[evidenceType] || AUTHENTICATION_METHODS.documents;
}

export function generateObjectionPrompt(ground: string, jurisdiction: Jurisdiction, phase: TrialPhase): string {
  const rule = getObjectionByGround(ground);
  if (!rule) {
    return `Objection: ${ground} - No specific guidance available for this objection ground.`;
  }

  const ruleText = getRuleForJurisdiction(rule, jurisdiction);
  const variation = getJurisdictionVariation(rule, jurisdiction);
  const phaseApplicable = rule.applicablePhases.includes(phase);

  let prompt = `**${rule.ground}**\n\n`;
  prompt += `**Quick Form:** "${rule.shortForm}"\n\n`;
  prompt += `**Governing Rule:** ${ruleText}\n\n`;
  prompt += `**Description:** ${rule.description}\n\n`;
  prompt += `**Explanation:** ${rule.explanation}\n\n`;
  
  if (!phaseApplicable) {
    prompt += `⚠️ **Note:** This objection is typically not applicable during ${phase} phase.\n\n`;
  }
  
  if (variation) {
    prompt += `**Jurisdiction Note (${jurisdiction}):** ${variation}\n\n`;
  }
  
  if (rule.exceptions.length > 0) {
    prompt += `**Exceptions:**\n${rule.exceptions.slice(0, 5).map(e => `- ${e}`).join('\n')}\n\n`;
  }
  
  prompt += `**How to Cure:** ${rule.curingInstructions}\n\n`;
  prompt += `**Severity:** ${rule.severity}`;

  return prompt;
}
