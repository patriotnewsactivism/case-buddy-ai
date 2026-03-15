export interface EvidenceRule {
  ruleNumber: string;
  title: string;
  summary: string;
  text: string;
}

export interface ProcedureRule {
  ruleNumber: string;
  title: string;
  summary: string;
  category: 'civil' | 'criminal';
}

export interface JurisdictionRules {
  name: string;
  shortName: string;
  evidenceRules: EvidenceRule[];
  civilProcedureRules: ProcedureRule[];
  criminalProcedureRules: ProcedureRule[];
  specialProvisions?: Record<string, string>;
}

export const FEDERAL_RULES: JurisdictionRules = {
  name: 'Federal Rules',
  shortName: 'Federal',
  evidenceRules: [
    {
      ruleNumber: 'FRE 401',
      title: 'Test for Relevant Evidence',
      summary: 'Evidence is relevant if it has any tendency to make a fact more or less probable.',
      text: 'Evidence is relevant if: (a) it has any tendency to make a fact more or less probable than it would be without the evidence; and (b) the fact is of consequence in determining the action.'
    },
    {
      ruleNumber: 'FRE 402',
      title: 'General Admissibility of Relevant Evidence',
      summary: 'Relevant evidence is admissible unless excluded by Constitution, statute, or other rules.',
      text: 'Relevant evidence is admissible unless any of the following provides otherwise: the United States Constitution; a federal statute; these rules; or other rules prescribed by the Supreme Court. Irrelevant evidence is not admissible.'
    },
    {
      ruleNumber: 'FRE 403',
      title: 'Excluding Relevant Evidence for Prejudice, Confusion, Waste of Time, or Other Reasons',
      summary: 'Relevant evidence may be excluded if probative value is substantially outweighed by unfair prejudice.',
      text: 'The court may exclude relevant evidence if its probative value is substantially outweighed by a danger of one or more of the following: unfair prejudice, confusing the issues, misleading the jury, undue delay, wasting time, or needlessly presenting cumulative evidence.'
    },
    {
      ruleNumber: 'FRE 404',
      title: 'Character Evidence; Crimes or Other Acts',
      summary: 'Evidence of character or prior acts generally not admissible to prove conduct; exceptions exist.',
      text: '(a) Character Evidence. (1) Prohibited Uses. Evidence of a person\'s character or character trait is not admissible to prove that on a particular occasion the person acted in accordance with the character or trait. (2) Permitted Uses; Exceptions in a Criminal Case. (b) Crimes, Wrongs, or Other Acts. (1) Prohibited Uses. Evidence of any other crime, wrong, or act is not admissible to prove a person\'s character in order to show that on a particular occasion the person acted in accordance with the character. (2) Permitted Uses. This evidence may be admissible for another purpose, such as proving motive, opportunity, intent, preparation, plan, knowledge, identity, absence of mistake, or lack of accident.'
    },
    {
      ruleNumber: 'FRE 407',
      title: 'Subsequent Remedial Measures',
      summary: 'Evidence of measures taken after an injury not admissible to prove negligence or culpability.',
      text: 'When measures are taken that would have made an earlier injury or harm less likely to occur, evidence of the subsequent measures is not admissible to prove: negligence; culpable conduct; a defect in a product or its design; or a need for a warning or instruction. But the court may admit this evidence for another purpose, such as impeachment or—if disputed—proving ownership, control, or the feasibility of precautionary measures.'
    },
    {
      ruleNumber: 'FRE 408',
      title: 'Compromise Offers and Negotiations',
      summary: 'Evidence of settlement negotiations not admissible to prove liability or amount of claim.',
      text: 'Evidence of the following is not admissible—on behalf of any party—either to prove or disprove the validity or amount of a disputed claim or to impeach by a prior inconsistent statement or a contradiction: (1) furnishing, promising, or offering—or accepting, promising to accept, or offering to accept—a valuable consideration in compromising or attempting to compromise the claim; and (2) conduct or a statement made during compromise negotiations about the claim.'
    },
    {
      ruleNumber: 'FRE 601',
      title: 'Competence to Testify in General',
      summary: 'Every person is competent to testify unless otherwise provided by rule.',
      text: 'Every person is competent to be a witness unless these rules provide otherwise. But in a civil case, state law governs the witness\'s competency regarding a claim or defense for which state law supplies the rule of decision.'
    },
    {
      ruleNumber: 'FRE 602',
      title: 'Need for Personal Knowledge',
      summary: 'Witness may testify only to matters of which they have personal knowledge.',
      text: 'A witness may testify to a matter only if evidence is introduced sufficient to support a finding that the witness has personal knowledge of the matter. Evidence to prove personal knowledge may consist of the witness\'s own testimony. This rule does not apply to a witness\'s expert testimony under Rule 703.'
    },
    {
      ruleNumber: 'FRE 603',
      title: 'Witness\'s Competence to Testify in General',
      summary: 'Witness must declare they will testify truthfully by oath or affirmation.',
      text: 'Before testifying, a witness must give an oath or affirmation to testify truthfully. The oath or affirmation must be administered in a form designed to impress that duty on the witness\'s conscience.'
    },
    {
      ruleNumber: 'FRE 604',
      title: 'Interpreters',
      summary: 'Interpreters must be qualified and give an oath to translate accurately.',
      text: 'An interpreter must be qualified and must give an oath or affirmation to make a true translation.'
    },
    {
      ruleNumber: 'FRE 605',
      title: 'Judge\'s Competence as a Witness',
      summary: 'Presiding judge may not testify as a witness in the trial over which they preside.',
      text: 'The presiding judge may not testify as a witness at the trial. A party need not object to preserve the issue.'
    },
    {
      ruleNumber: 'FRE 606',
      title: 'Juror\'s Competence as a Witness',
      summary: 'Jurors generally may not testify about the deliberation process.',
      text: '(a) At the Trial. A juror may not testify as a witness before the other jurors at the trial. (b) During an Inquiry into the Validity of a Verdict or Indictment. (1) Prohibited Testimony or Evidence. A juror may not testify about any statement made or incident that occurred during the jury\'s deliberations; the effect of anything on that juror\'s or another juror\'s vote; or any juror\'s mental processes concerning the verdict or indictment.'
    },
    {
      ruleNumber: 'FRE 607',
      title: 'Who May Impeach a Witness',
      summary: 'Any party may attack a witness\'s credibility.',
      text: 'Any party, including the party that called the witness, may attack the witness\'s credibility.'
    },
    {
      ruleNumber: 'FRE 608',
      title: 'A Witness\'s Character for Truthfulness or Untruthfulness',
      summary: 'Witness credibility may be attacked or supported by reputation or opinion evidence.',
      text: '(a) Reputation or Opinion Evidence. A witness\'s credibility may be attacked or supported by reputation or opinion evidence. (b) Specific Instances of Conduct. Except for a criminal conviction under Rule 609, extrinsic evidence is not admissible to prove specific instances of a witness\'s conduct in order to attack or support the witness\'s character for truthfulness.'
    },
    {
      ruleNumber: 'FRE 609',
      title: 'Impeachment by Evidence of a Criminal Conviction',
      summary: 'Criminal convictions may be used to impeach witness credibility with limitations.',
      text: '(a) In General. The following rules apply to attacking a witness\'s character for truthfulness by evidence of a criminal conviction: (1) for a crime that, in the convicting jurisdiction, was punishable by death or by imprisonment for more than one year, the evidence must be admitted, subject to Rule 403, in a civil case or in a criminal case in which the witness is not a defendant; and (2) for any crime regardless of the punishment, the evidence must be admitted if the court can readily determine that establishing the elements of the crime required proving—or the witness\'s admitting—a dishonest act or false statement.'
    },
    {
      ruleNumber: 'FRE 610',
      title: 'Religious Beliefs or Opinions',
      summary: 'Evidence of religious beliefs not admissible to attack or support credibility.',
      text: 'Evidence of a witness\'s religious beliefs or opinions is not admissible to attack or support the witness\'s credibility.'
    },
    {
      ruleNumber: 'FRE 701',
      title: 'Opinion Testimony by Lay Witnesses',
      summary: 'Lay witness opinions must be rationally based on perception and helpful.',
      text: 'If a witness is not testifying as an expert, testimony in the form of an opinion is limited to one that is: (a) rationally based on the witness\'s perception; (b) helpful to clearly understanding the witness\'s testimony or to determining a fact in issue; and (c) not based on scientific, technical, or other specialized knowledge within the scope of Rule 702.'
    },
    {
      ruleNumber: 'FRE 702',
      title: 'Testimony by Expert Witnesses',
      summary: 'Qualified experts may testify if their specialized knowledge will help the trier of fact.',
      text: 'A witness who is qualified as an expert by knowledge, skill, experience, training, or education may testify in the form of an opinion or otherwise if: (a) the expert\'s scientific, technical, or other specialized knowledge will help the trier of fact to understand the evidence or to determine a fact in issue; (b) the testimony is based on sufficient facts or data; (c) the testimony is the product of reliable principles and methods; and (d) the expert has reliably applied the principles and methods to the facts of the case.'
    },
    {
      ruleNumber: 'FRE 703',
      title: 'Bases of an Expert\'s Opinion Testimony',
      summary: 'Experts may rely on facts or data made admissible or reasonably relied upon.',
      text: 'An expert may base an opinion on facts or data in the case that the expert has observed or has been made aware of. If experts in the particular field would reasonably rely on those kinds of facts or data in forming an opinion on the subject, they need not be admissible for the opinion to be admitted.'
    },
    {
      ruleNumber: 'FRE 704',
      title: 'Opinion on an Ultimate Issue',
      summary: 'Opinions on ultimate issues generally admissible except regarding mental state in criminal cases.',
      text: '(a) In General—Not Automatically Objectionable. An opinion is not objectionable just because it embraces an ultimate issue. (b) Exception—Mental State of Criminal Defendant. In a criminal case, an expert witness must not state an opinion about whether the defendant did or did not have a mental state or condition that constitutes an element of the crime charged or of a defense. Those matters are for the trier of fact alone.'
    },
    {
      ruleNumber: 'FRE 705',
      title: 'Disclosing the Facts or Data Underlying an Expert\'s Opinion',
      summary: 'Expert may state opinion without disclosing underlying facts unless required.',
      text: 'Unless the court orders otherwise, an expert may state an opinion—and give the reasons for it—without first testifying to the underlying facts or data. But the expert may be required to disclose those facts or data on cross-examination.'
    },
    {
      ruleNumber: 'FRE 706',
      title: 'Court-Appointed Expert Witnesses',
      summary: 'Court may appoint expert witnesses on its own or upon motion.',
      text: '(a) Appointment Process. On a party\'s motion or on its own, the court may order the parties to show cause why expert witnesses should not be appointed and may ask the parties to submit nominations. The court may appoint any expert that the parties agree on and any expert of its own selection.'
    },
    {
      ruleNumber: 'FRE 801',
      title: 'Definitions That Apply to This Article; Exclusions from Hearsay',
      summary: 'Defines statements, hearsay, and statements that are not hearsay.',
      text: '(a) Statement. "Statement" means a person\'s oral assertion, written assertion, or nonverbal conduct, if the conduct is intended as an assertion. (b) Declarant. "Declarant" means the person who made the statement. (c) Hearsay. "Hearsay" means a statement that: (1) the declarant does not make while testifying at the current trial, hearing, or deposition; and (2) a party offers in evidence to prove the truth of the matter asserted in the statement. (d) Statements That Are Not Hearsay. A statement that meets the following conditions is not hearsay: (1) A Declarant-Witness\'s Prior Statement; (2) An Opposing Party\'s Statement.'
    },
    {
      ruleNumber: 'FRE 802',
      title: 'The Rule Against Hearsay',
      summary: 'Hearsay is not admissible unless exceptions apply.',
      text: 'Hearsay is not admissible unless any of the following provides otherwise: a federal statute; these rules; or other rules prescribed by the Supreme Court.'
    },
    {
      ruleNumber: 'FRE 803',
      title: 'Exceptions to the Rule Against Hearsay—Regardless of Whether the Declarant Is Available',
      summary: 'Hearsay exceptions applicable regardless of declarant availability.',
      text: 'The following are not excluded by the rule against hearsay, regardless of whether the declarant is available as a witness: (1) Present Sense Impression; (2) Excited Utterance; (3) Then-Existing Mental, Emotional, or Physical Condition; (4) Statement Made for Medical Diagnosis or Treatment; (5) Recorded Recollection; (6) Records of a Regularly Conducted Activity; (7) Absence of a Record of a Regularly Conducted Activity; (8) Public Records; (9) Public Records of Vital Statistics; (10) Absence of a Public Record; (11) Records of Religious Organizations Concerning Personal or Family History; (12) Certificates of Marriage, Baptism, and Similar Ceremonies; (13) Family Records; (14) Records of Documents That Affect an Interest in Property; (15) Statements in Documents That Affect an Interest in Property; (16) Statements in Ancient Documents; (17) Market Reports and Similar Commercial Publications; (18) Statements in Learned Treatises, Periodicals, or Pamphlets; (19) Reputation Concerning Personal or Family History; (20) Reputation Concerning Boundaries or General History; (21) Reputation Concerning Character; (22) Judgment of a Previous Conviction; (23) Judgments Involving Personal, Family, or General History, or a Boundary.'
    },
    {
      ruleNumber: 'FRE 804',
      title: 'Exceptions to the Rule Against Hearsay—When the Declarant Is Unavailable as a Witness',
      summary: 'Hearsay exceptions requiring declarant unavailability.',
      text: '(a) Criteria for Being Unavailable. A declarant is unavailable as a witness if the declarant: (1) is exempted from testifying about the subject matter of the declarant\'s statement because the court rules that a privilege applies; (2) refuses to testify about the subject matter despite a court order to do so; (3) testifies to not remembering the subject matter; (4) cannot be present or testify at the trial or hearing because of death or a then-existing infirmity, physical illness, or mental illness; or (5) is absent from the trial or hearing, and the statement\'s proponent has not been able, by process or other reasonable means, to procure: (A) the declarant\'s attendance; or (B) the declarant\'s testimony. (b) The Exceptions. The following are not excluded by the rule against hearsay if the declarant is unavailable as a witness: (1) Former Testimony; (2) Statement Under the Belief of Imminent Death; (3) Statement Against Interest; (4) Statement of Personal or Family History; (6) Statement Offered Against a Party That Wrongfully Caused the Declarant\'s Unavailability.'
    },
    {
      ruleNumber: 'FRE 805',
      title: 'Hearsay Within Hearsay',
      summary: 'Double hearsay admissible if each part fits an exception.',
      text: 'Hearsay within hearsay is not excluded by the rule against hearsay if each part of the combined statements conforms with an exception to the rule.'
    },
    {
      ruleNumber: 'FRE 806',
      title: 'Attacking and Supporting the Declarant\'s Credibility',
      summary: 'Declarant credibility may be attacked or supported as if they had testified.',
      text: 'When a hearsay statement—or a statement described in Rule 801(d)(2)(C), (D), or (E)—has been admitted in evidence, the declarant\'s credibility may be attacked, and then supported, by any evidence that would be admissible for those purposes if the declarant had testified as a witness.'
    },
    {
      ruleNumber: 'FRE 807',
      title: 'Residual Exception',
      summary: 'Residual hearsay exception for statements with equivalent guarantees of trustworthiness.',
      text: 'A hearsay statement is not admissible under this exception unless the statement: (a) has equivalent circumstantial guarantees of trustworthiness; (b) is more probative on the point for which it is offered than any other evidence that the proponent can obtain through reasonable efforts; (c) is offered as evidence of a material fact; (d) is more probative on the point for which it is offered than any other evidence that the proponent can obtain through reasonable efforts; and (e) admission of the statement serves the purposes of these rules and the interests of justice.'
    },
    {
      ruleNumber: 'FRE 901',
      title: 'Authenticating or Identifying Evidence',
      summary: 'Evidence must be authenticated by evidence sufficient to support finding of genuineness.',
      text: '(a) In General. To satisfy the requirement of authenticating or identifying an item of evidence, the proponent must produce evidence sufficient to support a finding that the item is what the proponent claims it is. (b) Examples. The following are examples only—not a complete list—of evidence that satisfies the requirement: (1) Testimony of a Witness with Knowledge; (2) Nonexpert Opinion About Handwriting; (3) Comparison by an Expert Witness or the Trier of Fact; (4) Distinctive Characteristics and the Like; (5) Opinion About a Voice; (6) Evidence About a Telephone Conversation; (7) Public Records; (8) Ancient Documents or Data Compilations; (9) Evidence About a Process or System; (10) Methods Provided by a Statute or Rule.'
    },
    {
      ruleNumber: 'FRE 902',
      title: 'Evidence That Is Self-Authenticating',
      summary: 'Certain evidence authenticates itself and requires no extrinsic evidence.',
      text: 'The following items of evidence are self-authenticating; they require no extrinsic evidence of authenticity in order to be admitted: (1) Domestic Public Documents That Are Sealed and Signed; (2) Domestic Public Documents That Are Not Sealed but Are Signed and Certified; (3) Foreign Public Documents; (4) Certified Copies of Public Records; (5) Official Publications; (6) Newspapers and Periodicals; (7) Trade Inscriptions and the Like; (8) Acknowledged Documents; (9) Commercial Paper and Related Documents; (10) Presumptions Under a Federal Statute; (11) Certified Domestic Records of a Regularly Conducted Activity; (12) Certified Foreign Records of a Regularly Conducted Activity; (13) Certified Records Generated by an Electronic Process or System.'
    },
    {
      ruleNumber: 'FRE 903',
      title: 'Subscribing Witness\'s Testimony',
      summary: 'Testimony of subscribing witness not required for authenticated documents.',
      text: 'A subscribing witness\'s testimony is necessary to authenticate a writing only if required by the law of the jurisdiction that governs the writing\'s validity.'
    },
    {
      ruleNumber: 'FRE 1001',
      title: 'Definitions That Apply to This Article',
      summary: 'Defines writings, recordings, photographs, and originals/duplicates.',
      text: '(a) A "writing" consists of letters, words, numbers, or their equivalent set down in any form. (b) A "recording" consists of letters, words, numbers, or their equivalent recorded in any medium. (c) A "photograph" means a photographic image or its equivalent stored in any form. (d) An "original" of a writing or recording means the writing or recording itself or any counterpart intended to have the same effect. (e) A "duplicate" means a counterpart produced by a mechanical, photographic, chemical, electronic, or other equivalent process or technique.'
    },
    {
      ruleNumber: 'FRE 1002',
      title: 'Requirement of the Original',
      summary: 'Original required to prove content of writing, recording, or photograph.',
      text: 'An original writing, recording, or photograph is required in order to prove its content unless these rules or a federal statute provides otherwise.'
    },
    {
      ruleNumber: 'FRE 1003',
      title: 'Admissibility of Duplicates',
      summary: 'Duplicates admissible unless genuine question raised about original\'s authenticity.',
      text: 'A duplicate is admissible to the same extent as the original unless a genuine question is raised about the original\'s authenticity or the circumstances indicate it would be unfair to admit the duplicate.'
    },
    {
      ruleNumber: 'FRE 1004',
      title: 'Admissibility of Other Evidence of Content',
      summary: 'Other evidence of content admissible if original lost, destroyed, or not obtainable.',
      text: 'An original is not required and other evidence of its content is admissible if: (a) all the originals are lost or destroyed, and not by the proponent acting in bad faith; (b) an original cannot be obtained by any available judicial process; (c) the original is in a position that neither party can control, and its location cannot be determined; or (d) the writing, recording, or photograph is not closely related to a controlling issue.'
    },
    {
      ruleNumber: 'FRE 1005',
      title: 'Copies of Public Records to Prove Content',
      summary: 'Certified copies of public records admissible to prove content.',
      text: 'The proponent may use a copy to prove the content of an official record—or of a document that was recorded or filed in a public office as authorized by law—if these conditions are met: the copy is certified as correct in accordance with Rule 902(4) or is testified to be correct by a witness who has compared it with the original.'
    },
    {
      ruleNumber: 'FRE 1006',
      title: 'Summaries to Prove Content',
      summary: 'Summaries of voluminous writings admissible if originals made available.',
      text: 'The proponent may use a summary, chart, or calculation to prove the content of voluminous writings, recordings, or photographs that cannot be conveniently examined in court. The proponent must make the originals or duplicates available for examination or copying, or both, by other parties at a reasonable time and place.'
    },
    {
      ruleNumber: 'FRE 1007',
      title: 'Testimony or Statement of a Party to Prove Content',
      summary: 'Party admission may prove content of writing, recording, or photograph.',
      text: 'The proponent may prove the content of a writing, recording, or photograph by the testimony, deposition, or written statement of the party against whom the evidence is offered.'
    },
    {
      ruleNumber: 'FRE 1008',
      title: 'Functions of the Court and Jury',
      summary: 'Court decides preliminary questions of admissibility; jury decides others.',
      text: 'Ordinarily, the court determines whether the proponent has fulfilled the factual conditions for admitting other evidence of the content of a writing, recording, or photograph under Rule 1004 or 1005. In a jury trial, the jury determines—in accordance with Rule 104(b)—whether any asserted fact is true.'
    }
  ],
  civilProcedureRules: [
    { ruleNumber: 'FRCP 8', title: 'General Rules of Pleading', summary: 'Requires short and plain statement of the claim showing entitlement to relief.', category: 'civil' },
    { ruleNumber: 'FRCP 11', title: 'Signing Pleadings, Motions, and Other Papers', summary: 'Requires certifications by signature and imposes sanctions for violations.', category: 'civil' },
    { ruleNumber: 'FRCP 12', title: 'Defenses and Objections: When and How Presented', summary: 'Governs motions to dismiss and responsive pleadings.', category: 'civil' },
    { ruleNumber: 'FRCP 26', title: 'General Discovery Provisions', summary: 'Scope of discovery includes any nonprivileged matter relevant to any party\'s claim or defense.', category: 'civil' },
    { ruleNumber: 'FRCP 33', title: 'Interrogatories to Parties', summary: 'Limits interrogatories to 25 including discrete subparts unless otherwise stipulated or ordered.', category: 'civil' },
    { ruleNumber: 'FRCP 34', title: 'Production of Documents', summary: 'Governs requests for production of documents and electronically stored information.', category: 'civil' },
    { ruleNumber: 'FRCP 35', title: 'Physical and Mental Examinations', summary: 'Allows court-ordered physical or mental examinations in certain circumstances.', category: 'civil' },
    { ruleNumber: 'FRCP 36', title: 'Requests for Admission', summary: 'Governs requests for admission of facts and application of law to facts.', category: 'civil' },
    { ruleNumber: 'FRCP 37', title: 'Failure to Make Disclosures or Cooperate in Discovery', summary: 'Provides sanctions for discovery violations.', category: 'civil' },
    { ruleNumber: 'FRCP 56', title: 'Summary Judgment', summary: 'Allows judgment without trial when no genuine dispute of material fact exists.', category: 'civil' },
    { ruleNumber: 'FRCP 70', title: 'Judgment for Specific Acts; Vesting Title', summary: 'Governs enforcement of judgments requiring specific acts.', category: 'civil' }
  ],
  criminalProcedureRules: [
    { ruleNumber: 'FRCrP 5', title: 'Initial Appearance', summary: 'Requires prompt initial appearance before a judicial officer after arrest.', category: 'criminal' },
    { ruleNumber: 'FRCrP 6', title: 'The Grand Jury', summary: 'Governs grand jury proceedings, selection, and secrecy.', category: 'criminal' },
    { ruleNumber: 'FRCrP 11', title: 'Pleas', summary: 'Governs plea procedures and requirements for valid pleas.', category: 'criminal' },
    { ruleNumber: 'FRCrP 12', title: 'Pleadings and Pretrial Motions', summary: 'Governs pretrial motions and defenses that may be raised before trial.', category: 'criminal' },
    { ruleNumber: 'FRCrP 16', title: 'Discovery and Inspection', summary: 'Governs discovery in criminal cases, including government and defendant disclosures.', category: 'criminal' },
    { ruleNumber: 'FRCrP 17', title: 'Subpoena', summary: 'Governs issuance and service of subpoenas in criminal cases.', category: 'criminal' },
    { ruleNumber: 'FRCrP 26', title: 'Taking Testimony', summary: 'Requires testimony in open court unless otherwise provided.', category: 'criminal' },
    { ruleNumber: 'FRCrP 29', title: 'Motion for Judgment of Acquittal', summary: 'Allows motion for acquittal based on insufficiency of evidence.', category: 'criminal' },
    { ruleNumber: 'FRCrP 31', title: 'Jury Verdict', summary: 'Goverms jury verdicts and polling of the jury.', category: 'criminal' },
    { ruleNumber: 'FRCrP 32', title: 'Sentencing and Judgment', summary: 'Governs sentencing procedures and entry of judgment.', category: 'criminal' },
    { ruleNumber: 'FRCrP 41', title: 'Search and Seizure', summary: 'Governs issuance and execution of search and seizure warrants.', category: 'criminal' },
    { ruleNumber: 'FRCrP 46', title: 'Release from Custody; Release or Detention of a Defendant', summary: 'Governs bail and pretrial release conditions.', category: 'criminal' }
  ],
  specialProvisions: {
    daubertStandard: 'Expert testimony must be based on scientifically valid reasoning and methodology properly applied to the facts (Daubert v. Merrell Dow Pharmaceuticals, 509 U.S. 579 (1993)).',
    learnedTreatiseException: 'Established treatises, periodicals, or pamphlets on a subject may be used to impeach or support expert testimony.',
    bestEvidenceRule: 'Original documents required unless exceptions apply; duplicates generally admissible.',
    privilegeRecognition: 'Federal courts recognize common law privileges unless otherwise provided by Constitution, Act of Congress, or Federal Rules.'
  }
};
