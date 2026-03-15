import { JurisdictionRules } from './federalRules';

export const TEXAS_RULES: JurisdictionRules = {
  name: 'Texas Rules',
  shortName: 'Texas',
  evidenceRules: [
    {
      ruleNumber: 'TRE 401',
      title: 'Definition of Relevant Evidence',
      summary: 'Evidence is relevant if it has any tendency to make a fact more or less probable.',
      text: '"Relevant evidence" means evidence having any tendency to make the existence of any fact that is of consequence to the determination of the action more probable or less probable than it would be without the evidence.'
    },
    {
      ruleNumber: 'TRE 402',
      title: 'Relevant Evidence Generally Admissible; Inadmissible Relevant Evidence',
      summary: 'Relevant evidence is admissible unless excluded by Constitution, statute, or other rules.',
      text: 'All relevant evidence is admissible, except as otherwise provided by statute, by these rules, or by other rules prescribed by the Supreme Court. Evidence which is not relevant is not admissible.'
    },
    {
      ruleNumber: 'TRE 403',
      title: 'Excluding Relevant Evidence',
      summary: 'Relevant evidence may be excluded if probative value is substantially outweighed by unfair prejudice.',
      text: 'Although relevant, evidence may be excluded if its probative value is substantially outweighed by the danger of unfair prejudice, confusion of the issues, or misleading the jury, or by considerations of undue delay, or needless presentation of cumulative evidence.'
    },
    {
      ruleNumber: 'TRE 404',
      title: 'Character Evidence Not Admissible to Prove Conduct; Exceptions',
      summary: 'Character evidence generally not admissible to prove conduct; exceptions for character in issue and prior acts.',
      text: '(a) Character evidence generally. Evidence of a person\'s character or character trait is not admissible to prove that on a particular occasion the person acted in accordance with the character or trait. (b) Other crimes, wrongs, or acts. Evidence of other crimes, wrongs, or acts is not admissible to prove the character of a person in order to show action in conformity therewith. It may, however, be admissible for other purposes, such as proof of motive, opportunity, intent, preparation, plan, knowledge, identity, or absence of mistake or accident.'
    },
    {
      ruleNumber: 'TRE 407',
      title: 'Subsequent Remedial Measures',
      summary: 'Evidence of subsequent remedial measures not admissible to prove negligence or culpability.',
      text: 'When, after an event, measures are taken which, if taken previously, would have made the event less likely to occur, evidence of the subsequent measures is not admissible to prove negligence or culpable conduct in connection with the event. This rule does not require the exclusion of evidence of subsequent measures when offered for another purpose, such as proving ownership, control, or feasibility of precautionary measures, if controverted, or impeachment.'
    },
    {
      ruleNumber: 'TRE 408',
      title: 'Compromise and Offers to Compromise',
      summary: 'Evidence of settlement negotiations not admissible to prove liability or invalidity of claim.',
      text: 'Evidence of (1) furnishing or offering or promising to furnish, or (2) accepting or offering or promising to accept, a valuable consideration in compromising or attempting to compromise a claim which was disputed as to validity or amount, is not admissible to prove liability for or invalidity of the claim or its amount. Evidence of conduct or statements made in compromise negotiations is likewise not admissible.'
    },
    {
      ruleNumber: 'TRE 601',
      title: 'General Rule of Competency',
      summary: 'Every person is competent to be a witness except as otherwise provided.',
      text: 'Every person is competent to be a witness except as otherwise provided in these rules. The following witnesses shall be incompetent to testify: (1) an intermediary or descendant of a deceased or incapacitated person when the witness is testifying regarding a statement or communication made by the deceased or incapacitated person, except in certain circumstances.'
    },
    {
      ruleNumber: 'TRE 602',
      title: 'Lack of Personal Knowledge',
      summary: 'Witness may not testify to a matter without personal knowledge.',
      text: 'A witness may not testify to a matter unless evidence is introduced sufficient to support a finding that the witness has personal knowledge of the matter. Evidence to prove personal knowledge may, but need not, consist of the witness\'s own testimony. This rule is subject to the provisions of Rule 703, relating to opinion testimony by expert witnesses.'
    },
    {
      ruleNumber: 'TRE 607',
      title: 'Who May Impeach',
      summary: 'The credibility of a witness may be attacked by any party.',
      text: 'The credibility of a witness may be attacked by any party, including the party calling the witness.'
    },
    {
      ruleNumber: 'TRE 608',
      title: 'Evidence of Character and Conduct of Witness',
      summary: 'Witness credibility may be attacked by evidence of truthful or untruthful character.',
      text: '(a) Opinion and reputation evidence of character. The credibility of a witness may be attacked or supported by evidence in the form of reputation or opinion. (b) Specific instances of conduct. Specific instances of the conduct of a witness, for the purpose of attacking or supporting the witness\'s character for truthfulness, may not be inquired into on cross-examination of the witness nor proved by extrinsic evidence.'
    },
    {
      ruleNumber: 'TRE 609',
      title: 'Impeachment by Evidence of Conviction of Crime',
      summary: 'Criminal convictions may be used for impeachment with limitations.',
      text: '(a) General rule. For the purpose of attacking the character for truthfulness of a witness, (1) evidence that a witness other than an accused has been convicted of a crime shall be admitted, subject to Rule 403, if the crime was punishable by death or imprisonment in excess of one year, and (2) evidence that any witness has been convicted of a crime shall be admitted if it involved dishonesty or false statement, regardless of the punishment.'
    },
    {
      ruleNumber: 'TRE 610',
      title: 'Religious Beliefs or Opinions',
      summary: 'Evidence of religious beliefs not admissible to attack or support credibility.',
      text: 'Evidence of the beliefs or opinions of a witness on matters of religion is not admissible for the purpose of showing that by reason of their nature the witness\'s credibility is impaired or enhanced.'
    },
    {
      ruleNumber: 'TRE 701',
      title: 'Opinion Testimony by Lay Witness',
      summary: 'Lay opinion testimony limited to rationally based perceptions helpful to the trier of fact.',
      text: 'If the witness is not testifying as an expert, the witness\'s testimony in the form of opinions or inferences is limited to those opinions or inferences which are (a) rationally based on the perception of the witness and (b) helpful to a clear understanding of the witness\'s testimony or the determination of a fact in issue.'
    },
    {
      ruleNumber: 'TRE 702',
      title: 'Testimony by Experts',
      summary: 'Expert testimony admissible if based on sufficient data and reliable principles.',
      text: 'A witness who is qualified as an expert by knowledge, skill, experience, training, or education may testify in the form of an opinion or otherwise if: (a) the testimony is based upon sufficient facts or data; (b) the testimony is the product of reliable principles and methods; and (c) the witness has applied the principles and methods reliably to the facts of the case.'
    },
    {
      ruleNumber: 'TRE 703',
      title: 'Bases of Opinion Testimony by Experts',
      summary: 'Expert may rely on facts or data made known at or before the hearing.',
      text: 'The facts or data in the particular case upon which an expert bases an opinion or inference may be those perceived by, or made known to, the expert at or before the hearing. If of a type reasonably relied upon by experts in the particular field in forming opinions or inferences upon the subject, the facts or data need not be admissible in evidence.'
    },
    {
      ruleNumber: 'TRE 801',
      title: 'Definitions',
      summary: 'Defines statement, declarant, hearsay, and statements that are not hearsay.',
      text: '(a) Statement. A "statement" is (1) an oral or written verbal expression or (2) nonverbal conduct of a person, if it is intended by the person as a substitute for verbal expression. (b) Declarant. A "declarant" is a person who makes a statement. (c) Hearsay. "Hearsay" is a statement, other than one made by the declarant while testifying at the trial or hearing, offered in evidence to prove the truth of the matter asserted. (d) A statement is not hearsay if: (1) Prior statement by witness; (2) Admission by party-opponent.'
    },
    {
      ruleNumber: 'TRE 802',
      title: 'Hearsay Rule',
      summary: 'Hearsay is not admissible except as provided by statute or rules.',
      text: 'Hearsay is not admissible except as provided by statute or by these rules or by other rules prescribed by the Supreme Court.'
    },
    {
      ruleNumber: 'TRE 803',
      title: 'Hearsay Exceptions; Availability of Declarant Immaterial',
      summary: 'Hearsay exceptions applicable regardless of declarant availability.',
      text: 'The following are not excluded by the hearsay rule, even though the declarant is available as a witness: (1) Present sense impression; (2) Excited utterance; (3) Then existing mental, emotional, or physical condition; (4) Statements made for medical diagnosis or treatment; (5) Recorded recollection; (6) Records of regularly conducted activity; (7) Absence of entry in records kept in regular course; (8) Public records and reports; (9) Records of vital statistics; (10) Absence of public record or entry; (11) Records of religious organizations; (12) Marriage, baptismal, and similar certificates; (13) Family records; (14) Records of documents affecting an interest in property; (15) Statements in documents affecting an interest in property; (16) Statements in ancient documents; (17) Market reports and commercial publications; (18) Learned treatises; (19) Reputation concerning personal or family history; (20) Reputation concerning boundaries or general history; (21) Reputation as to character; (22) Judgment of previous conviction; (23) Judgments as to personal, family, or general history, or boundaries.'
    },
    {
      ruleNumber: 'TRE 804',
      title: 'Hearsay Exceptions; Declarant Unavailable',
      summary: 'Hearsay exceptions requiring declarant unavailability.',
      text: '(a) Definition of unavailability. "Unavailability as a witness" includes situations in which the declarant: (1) is exempted by ruling of the court on the ground of privilege from testifying concerning the subject matter of the declarant\'s statement; or (2) persists in refusing to testify concerning the subject matter of the declarant\'s statement despite an order of the court to do so; or (3) testifies to a lack of memory of the subject matter of the declarant\'s statement; or (4) is dead or is unable to be present or to testify at the hearing because of death or then existing physical or mental illness or infirmity; or (5) is absent from the hearing and the proponent of a statement has been unable to procure the declarant\'s attendance by process or other reasonable means. (b) Hearsay exceptions. The following are not excluded by the hearsay rule if the declarant is unavailable as a witness: (1) Former testimony; (2) Statement under belief of impending death; (3) Statement against interest; (4) Statement of personal or family history.'
    },
    {
      ruleNumber: 'TRE 901',
      title: 'Requirement of Authentication or Identification',
      summary: 'Requirement of authentication or identification as a condition precedent to admissibility.',
      text: '(a) General provision. The requirement of authentication or identification as a condition precedent to admissibility is satisfied by evidence sufficient to support a finding that the matter in question is what its proponent claims. (b) Illustrations. By way of illustration only, and not by way of limitation, the following are examples of authentication or identification conforming with the requirements of this rule: (1) Testimony of witness with knowledge; (2) Non-expert testimony on handwriting; (3) Comparison by trier or expert witnesses; (4) Distinctive characteristics and the like; (5) Voice identification; (6) Telephone conversations; (7) Public records or reports; (8) Ancient documents or data compilations; (9) Process or system; (10) Methods provided by statute.'
    },
    {
      ruleNumber: 'TRE 902',
      title: 'Self-Authentication',
      summary: 'Extrinsic evidence of authenticity not required for certain documents.',
      text: 'Extrinsic evidence of authenticity as a condition precedent to admissibility is not required with respect to the following: (1) Domestic public documents under seal; (2) Domestic public documents not under seal; (3) Foreign public documents; (4) Certified copies of public records; (5) Official publications; (6) Newspapers and periodicals; (7) Trade inscriptions and the like; (8) Acknowledged documents; (9) Commercial paper and related documents; (10) Presumptions created by statute; (11) Certified domestic records of regularly conducted activity; (12) Certified foreign business records.'
    }
  ],
  civilProcedureRules: [
    { ruleNumber: 'TRCP 45', title: 'Signing of Pleadings', summary: 'Requires signatures on pleadings and provides for sanctions.', category: 'civil' },
    { ruleNumber: 'TRCP 47', title: 'Claim for Relief', summary: 'Requires specific relief sought and amount of unliquidated damages.', category: 'civil' },
    { ruleNumber: 'TRCP 63', title: 'Amended and Supplemental Pleadings', summary: 'Governs amendments to pleadings as a matter of right and by leave of court.', category: 'civil' },
    { ruleNumber: 'TRCP 91', title: 'Amended and Supplemental Pleadings', summary: 'Parties may amend pleadings in certain circumstances.', category: 'civil' },
    { ruleNumber: 'TRCP 166', title: 'Discovery; Pre-Trial Conference', summary: 'Texas discovery rules broader than federal; allows broad discovery of relevant matters.', category: 'civil' },
    { ruleNumber: 'TRCP 166a', title: 'Pre-Trial Conference', summary: 'Court may direct attorneys to appear for pre-trial conference.', category: 'civil' },
    { ruleNumber: 'TRCP 166b', title: 'Discovery Scope and Limits', summary: 'Parties may obtain discovery regarding any matter not privileged that is relevant.', category: 'civil' },
    { ruleNumber: 'TRCP 168', title: 'Requests for Admission', summary: 'Governs requests for admission of facts and application of law to facts.', category: 'civil' },
    { ruleNumber: 'TRCP 169', title: 'Expedited Actions', summary: 'Provides for expedited trial settings in certain cases.', category: 'civil' },
    { ruleNumber: 'TRCP 189', title: 'Summary Judgment', summary: 'Governs motions for summary judgment in Texas courts.', category: 'civil' },
    { ruleNumber: 'TRCP 190', title: 'Discovery Control Plans; Scheduling', summary: 'Requires discovery control plans and sets deadlines.', category: 'civil' },
    { ruleNumber: 'TRCP 191', title: 'Discovery Motions; Objections', summary: 'Governs discovery motions and objection procedures.', category: 'civil' },
    { ruleNumber: 'TRCP 192', title: 'Scope of Discovery', summary: 'Broad scope permits discovery of any unprivileged matter relevant to any party\'s claim or defense.', category: 'civil' },
    { ruleNumber: 'TRCP 193', title: 'Responses and Objections to Discovery', summary: 'Governs responses to discovery requests and verification requirements.', category: 'civil' },
    { ruleNumber: 'TRCP 196', title: 'Requests for Production and Inspection', summary: 'Governs requests for production and inspection of documents and things.', category: 'civil' },
    { ruleNumber: 'TRCP 197', title: 'Interrogatories to Parties', summary: 'Governs interrogatories with no presumptive numerical limit.', category: 'civil' },
    { ruleNumber: 'TRCP 199', title: 'Depositions Upon Oral Examination', summary: 'Governs oral depositions and examination procedures.', category: 'civil' },
    { ruleNumber: 'TRCP 215', title: 'Sanctions', summary: 'Provides broad sanctions for discovery abuse.', category: 'civil' }
  ],
  criminalProcedureRules: [
    { ruleNumber: 'TCCrP 15.17', title: 'Duties of Magistrate', summary: 'Duties of magistrate when accused brought before them.', category: 'criminal' },
    { ruleNumber: 'TCCrP 16.01', title: 'Discovery in Criminal Cases', summary: 'Governs discovery in criminal cases under the Michael Morton Act.', category: 'criminal' },
    { ruleNumber: 'TCCrP 16.02', title: 'Discovery Motions', summary: 'Provides for discovery motions in criminal cases.', category: 'criminal' },
    { ruleNumber: 'TCCrP 17.01', title: 'Summons and Subpoena', summary: 'Governs issuance of subpoenas in criminal cases.', category: 'criminal' },
    { ruleNumber: 'TCCrP 21.01', title: 'Indictment', summary: 'Requirements for valid indictment in felony cases.', category: 'criminal' },
    { ruleNumber: 'TCCrP 21.02', title: 'Requisites of Indictment', summary: 'Specifies what an indictment must contain.', category: 'criminal' },
    { ruleNumber: 'TCCrP 27.01', title: 'Pleas', summary: 'Governs types of pleas in criminal cases.', category: 'criminal' },
    { ruleNumber: 'TCCrP 27.02', title: 'Nolo Contendere', summary: 'Governs plea of nolo contendere.', category: 'criminal' },
    { ruleNumber: 'TCCrP 36.01', title: 'Motion for New Trial', summary: 'Governs motions for new trial in criminal cases.', category: 'criminal' },
    { ruleNumber: 'TCCrP 37.01', title: 'Motion in Arrest of Judgment', summary: 'Governs motions in arrest of judgment.', category: 'criminal' },
    { ruleNumber: 'TCCrP 38.22', title: 'Statements of Accused', summary: 'Governs admissibility of confessions and statements by accused.', category: 'criminal' },
    { ruleNumber: 'TCCrP 38.23', title: 'Evidence Obtained by Illegal Means', summary: 'Exclusionary rule for illegally obtained evidence.', category: 'criminal' },
    { ruleNumber: 'TCCrP 39.01', title: 'Witnesses', summary: 'Governs witness testimony and examination in criminal cases.', category: 'criminal' },
    { ruleNumber: 'TCCrP 42.01', title: 'Judgment', summary: 'Governs form and entry of judgment.', category: 'criminal' }
  ],
  specialProvisions: {
    eIDupontStandard: 'Texas follows E.I. du Pont de Nemours & Co. v. Robinson, 923 S.W.2d 549 (Tex. 1995), requiring: (1) qualified expert; (2) reliable methodology; (3) relevant and reliable reasoning; (4) reliable application to facts. Daubert factors are relevant but not controlling.',
    broaderDiscovery: 'Texas discovery rules are broader than federal rules. TRCP 192.3 allows discovery of any unprivileged matter that is relevant or reasonably calculated to lead to admissible evidence. No presumptive limit on interrogatories.',
    proportionalDiscovery: 'TRCP 192.4 requires courts to limit discovery if burden or expense outweighs likely benefit, considering needs of case, amount in controversy, resources of parties, importance of issues, and importance of discovery.',
    sanctioNScheme: 'TRCP 215 provides broad sanctions for discovery abuse, including striking pleadings, staying proceedings, prohibiting evidence, rendering default judgment, and monetary sanctions.',
    summaryJudgment: 'TRCP 166a(c) requires summary judgment motions to be filed and served at least 21 days before hearing. No reply required unless ordered by court. Evidence not specifically controverted is taken as true.',
    spoliationPresumption: 'Texas recognizes spoliation presumption when party destroys or fails to preserve evidence with intent to impair. Requires finding of intent before instruction given.',
    deadManStatute: 'Texas Rule of Evidence 601(b) incorporates Dead Man\'s Statute provisions for testimony about statements of deceased persons in certain circumstances.',
    medMalCaps: 'Tex. Civ. Prac. & Rem. Code §74.301 caps non-economic damages in medical malpractice cases at $250,000 per defendant, $500,000 total.'
  }
};
