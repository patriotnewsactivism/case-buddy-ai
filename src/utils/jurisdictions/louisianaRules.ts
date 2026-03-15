import { JurisdictionRules } from './federalRules';

export const LOUISIANA_RULES: JurisdictionRules = {
  name: 'Louisiana Rules',
  shortName: 'Louisiana',
  evidenceRules: [
    {
      ruleNumber: 'La. C.E. Art. 101',
      title: 'Scope',
      summary: 'Louisiana Code of Evidence applies to all proceedings in courts of this state.',
      text: 'These rules govern proceedings in all courts of the state of Louisiana, to the extent and with the exceptions stated in Article 1101.'
    },
    {
      ruleNumber: 'La. C.E. Art. 102',
      title: 'Purpose',
      summary: 'Rules designed to ascertain truth and ensure fair determination of proceedings.',
      text: 'These rules shall be construed to secure fairness in administration, elimination of unjustifiable expense and delay, and promotion of growth and development of the law of evidence to the end that the truth may be ascertained and proceedings justly determined.'
    },
    {
      ruleNumber: 'La. C.E. Art. 401',
      title: 'Definition of Relevant Evidence',
      summary: 'Evidence is relevant if it has any tendency to make a fact more or less probable.',
      text: '"Relevant evidence" means evidence having any tendency to make the existence of any fact that is of consequence to the determination of the action more probable or less probable than it would be without the evidence.'
    },
    {
      ruleNumber: 'La. C.E. Art. 402',
      title: 'Relevant Evidence Generally Admissible; Inadmissible Relevant Evidence',
      summary: 'Relevant evidence is admissible unless excluded by law.',
      text: 'All relevant evidence is admissible, except as otherwise provided by the Constitution of the United States, the Constitution of Louisiana, legislation, or these rules. Evidence which is not relevant is not admissible.'
    },
    {
      ruleNumber: 'La. C.E. Art. 403',
      title: 'Exclusion of Relevant Evidence',
      summary: 'Relevant evidence may be excluded if probative value substantially outweighed by prejudice.',
      text: 'Although relevant, evidence may be excluded if its probative value is substantially outweighed by the danger of unfair prejudice, confusion of the issues, or misleading the jury, or by considerations of undue delay, or waste of time. No witness may be impeached by evidence of a criminal conviction for purposes of assessing credibility unless the court affirmatively determines that the probative value of such evidence outweighs the danger of unfair prejudice.'
    },
    {
      ruleNumber: 'La. C.E. Art. 404',
      title: 'Character Evidence Not Admissible to Prove Conduct; Exceptions',
      summary: 'Character evidence generally inadmissible to prove conduct; exceptions apply.',
      text: '(A) Character evidence generally. Evidence of a person\'s character or a trait of his character, is not admissible for the purpose of proving that he acted in conformity therewith on a particular occasion. (B) Other crimes, wrongs, or acts. Evidence of other crimes, wrongs, or acts is not admissible to prove the character of a person in order to show that he acted in conformity therewith. It may, however, be admissible for other purposes, such as proof of motive, opportunity, intent, preparation, plan, knowledge, identity, absence of mistake or accident, provided that upon request by the accused, the prosecution in a criminal case shall provide reasonable notice in advance of trial.'
    },
    {
      ruleNumber: 'La. C.E. Art. 407',
      title: 'Subsequent Remedial Measures',
      summary: 'Evidence of subsequent remedial measures not admissible to prove negligence or fault.',
      text: 'When, after an event, measures are taken which, if taken previously, would have made the event less likely to occur, evidence of the subsequent measures is not admissible to prove negligence or culpable conduct in connection with the event. This Article does not require the exclusion of evidence of subsequent measures when offered for another purpose, such as proving ownership, control, or feasibility of precautionary measures, if controverted, or impeachment.'
    },
    {
      ruleNumber: 'La. C.E. Art. 408',
      title: 'Compromise and Offers to Compromise',
      summary: 'Evidence of settlement negotiations not admissible to prove liability or invalidity of claim.',
      text: 'Evidence of (1) furnishing or offering or promising to furnish, or (2) accepting or offering or promising to accept, a valuable consideration in compromising or attempting to compromise a claim which was disputed as to validity or amount, is not admissible to prove liability for or invalidity of the claim or its amount. Evidence of conduct or statements made in compromise negotiations is likewise not admissible.'
    },
    {
      ruleNumber: 'La. C.E. Art. 601',
      title: 'General Rule of Competency; Disqualification of Witness',
      summary: 'Every person is competent to be a witness except as otherwise provided.',
      text: 'Every person of proper understanding is competent to be a witness, except as otherwise provided in this Code. A judge is not competent to testify in a case over which he is presiding. A juror is not competent to testify as a witness in a case in which he is sitting as a juror.'
    },
    {
      ruleNumber: 'La. C.E. Art. 602',
      title: 'Lack of Personal Knowledge',
      summary: 'Witness may not testify to a matter without personal knowledge.',
      text: 'A witness may not testify to a matter unless evidence is introduced sufficient to support a finding that he has personal knowledge of the matter. Evidence to prove personal knowledge may, but need not, consist of the testimony of the witness himself. This Article is subject to the provisions of Article 703, relating to opinion testimony by expert witnesses.'
    },
    {
      ruleNumber: 'La. C.E. Art. 603',
      title: 'Oath or Affirmation',
      summary: 'Witness must declare to testify truthfully by oath or affirmation.',
      text: 'Before testifying, every witness shall be required to declare that he will testify truthfully, by oath or affirmation administered in a form calculated to awaken his conscience and impress his mind with his duty to do so.'
    },
    {
      ruleNumber: 'La. C.E. Art. 604',
      title: 'Interpreters',
      summary: 'Interpreters must be qualified and give an oath to translate accurately.',
      text: 'An interpreter is subject to the provisions of this Code relating to qualification as an expert and the administration of an oath or affirmation that he will make a true translation.'
    },
    {
      ruleNumber: 'La. C.E. Art. 605',
      title: 'Competency of Judge as Witness',
      summary: 'Presiding judge may not testify as a witness in the trial.',
      text: 'The judge presiding at the trial may not testify in that trial as a witness. No objection need be made in order to preserve the point.'
    },
    {
      ruleNumber: 'La. C.E. Art. 606',
      title: 'Competency of Juror as Witness',
      summary: 'Juror may not testify concerning deliberations or mental processes.',
      text: '(A) At the trial. A member of the jury may not testify as a witness before that jury at the trial of the case in which he is sitting as a juror. (B) Inquiry into validity of verdict or indictment. Upon an inquiry into the validity of a verdict or indictment, a juror may not testify as to any matter or statement occurring during the course of the jury\'s deliberations or to the effect of anything upon his or any other juror\'s mind or emotions or concerning his mental processes in connection with the verdict.'
    },
    {
      ruleNumber: 'La. C.E. Art. 607',
      title: 'Who May Impeach',
      summary: 'Credibility of a witness may be attacked by any party.',
      text: 'The credibility of a witness may be attacked by any party, including the party calling him.'
    },
    {
      ruleNumber: 'La. C.E. Art. 608',
      title: 'Evidence of Character and Conduct of Witness',
      summary: 'Witness credibility may be attacked or supported by reputation or opinion evidence.',
      text: '(A) Reputation or opinion. The credibility of a witness may be attacked or supported by evidence in the form of reputation or opinion, subject to these limitations: (1) The evidence may refer only to character for truthfulness or untruthfulness. (2) Specific instances of the conduct of a witness, for the purpose of attacking or supporting his character for truthfulness, may not be proved by extrinsic evidence.'
    },
    {
      ruleNumber: 'La. C.E. Art. 609',
      title: 'Impeachment by Evidence of Conviction of Crime',
      summary: 'Criminal convictions may be used for impeachment with limitations.',
      text: '(A) General rule. For the purpose of attacking the character for truthfulness of a witness, evidence that he has been convicted of a crime shall be admitted, subject to Article 403, if the crime was punishable by death or imprisonment in excess of six months under the law under which he was convicted, and evidence that a witness has been convicted of a crime shall be admitted if it involved dishonesty or false statement, regardless of the punishment.'
    },
    {
      ruleNumber: 'La. C.E. Art. 610',
      title: 'Religious Beliefs or Opinions',
      summary: 'Evidence of religious beliefs not admissible to attack or support credibility.',
      text: 'Evidence of the beliefs or opinions of a witness on matters of religion is not admissible for the purpose of showing that by reason of their nature his credibility is impaired or enhanced.'
    },
    {
      ruleNumber: 'La. C.E. Art. 701',
      title: 'Opinion Testimony by Lay Witness',
      summary: 'Lay opinion must be rationally based on perception and helpful to trier of fact.',
      text: 'If the witness is not testifying as an expert, his testimony in the form of opinions or inferences is limited to those opinions or inferences which are (1) rationally based on the perception of the witness and (2) helpful to a clear understanding of his testimony or the determination of a fact in issue.'
    },
    {
      ruleNumber: 'La. C.E. Art. 702',
      title: 'Testimony by Experts',
      summary: 'Expert testimony requires qualified expert, reliable methodology, and proper application.',
      text: 'A witness who is qualified as an expert by knowledge, skill, experience, training, or education may testify in the form of an opinion or otherwise if: (1) the testimony is based upon sufficient facts or data; (2) the testimony is the product of reliable principles and methods; and (3) the witness has applied the principles and methods reliably to the facts of the case.'
    },
    {
      ruleNumber: 'La. C.E. Art. 703',
      title: 'Bases of Opinion Testimony by Experts',
      summary: 'Expert may rely on facts or data perceived by or made known to the expert.',
      text: 'The facts or data in the particular case upon which an expert bases an opinion or inference may be those perceived by or made known to him at or before the hearing. If of a type reasonably relied upon by experts in the particular field in forming opinions or inferences upon the subject, the facts or data need not be admissible in evidence.'
    },
    {
      ruleNumber: 'La. C.E. Art. 704',
      title: 'Opinion on Ultimate Issue',
      summary: 'Opinion on ultimate issue not objectionable except for mental state in criminal cases.',
      text: 'Testimony in the form of an opinion or inference otherwise admissible is not objectionable because it embraces an ultimate issue to be decided by the trier of fact. No expert witness shall be permitted to express an opinion as to whether the defendant did or did not have the mental state or condition constituting an element of the crime charged or of a defense thereto.'
    },
    {
      ruleNumber: 'La. C.E. Art. 705',
      title: 'Disclosure of Facts or Data Underlying Expert Opinion',
      summary: 'Expert may state opinion without prior disclosure of underlying facts.',
      text: 'An expert may testify in terms of opinion or inference and give his reasons therefor without prior disclosure of the underlying facts or data, unless the court requires otherwise. The expert may in any event be required to disclose the underlying facts or data on cross-examination.'
    },
    {
      ruleNumber: 'La. C.E. Art. 706',
      title: 'Court Appointed Experts',
      summary: 'Court may appoint expert witnesses on its own motion or upon request.',
      text: 'The court may on its own motion or on the motion of any party enter an order to show cause why expert witnesses should not be appointed, and may request the parties to submit nominations. The court may appoint any expert witnesses agreed upon by the parties, and may appoint expert witnesses of its own selection.'
    },
    {
      ruleNumber: 'La. C.E. Art. 801',
      title: 'Definitions',
      summary: 'Defines statement, declarant, hearsay, and statements that are not hearsay.',
      text: '(A) Statement. A "statement" is (1) an oral or written verbal expression or (2) nonverbal conduct of a person, if it is intended by him as a substitute for verbal expression. (B) Declarant. A "declarant" is a person who makes a statement. (C) Hearsay. "Hearsay" is a statement, other than one made by the declarant at the present trial or hearing, offered in evidence to prove the truth of the matter asserted. (D) Statements which are not hearsay. A statement is not hearsay if: (1) Prior statement by witness; (2) Admission by party-opponent.'
    },
    {
      ruleNumber: 'La. C.E. Art. 802',
      title: 'Hearsay Rule',
      summary: 'Hearsay is not admissible except as provided by law.',
      text: 'Hearsay is not admissible except as otherwise provided by the Constitution of Louisiana or legislation, or by these rules.'
    },
    {
      ruleNumber: 'La. C.E. Art. 803',
      title: 'Hearsay Exceptions; Availability of Declarant Immaterial',
      summary: 'Hearsay exceptions regardless of declarant availability.',
      text: 'The following are not excluded by the hearsay rule, even though the declarant is available as a witness: (1) Present sense impression; (2) Excited utterance; (3) Then existing mental, emotional, or physical condition; (4) Statements made for medical diagnosis or treatment; (5) Recorded recollection; (6) Records of regularly conducted activity; (7) Absence of entry in records kept in regular course; (8) Public records and reports; (9) Records of vital statistics; (10) Absence of public record or entry; (11) Records of religious organizations; (12) Marriage, baptismal, and similar certificates; (13) Family records; (14) Records of documents affecting an interest in property; (15) Statements in documents affecting an interest in property; (16) Statements in ancient documents; (17) Market reports and commercial publications; (18) Learned treatises; (19) Reputation concerning personal or family history; (20) Reputation concerning boundaries or general history; (21) Reputation as to character; (22) Judgment of previous conviction; (23) Other exceptions.'
    },
    {
      ruleNumber: 'La. C.E. Art. 804',
      title: 'Hearsay Exceptions; Declarant Unavailable',
      summary: 'Hearsay exceptions requiring declarant unavailability.',
      text: '(A) Definition of unavailability. "Unavailability as a witness" includes situations in which the declarant: (1) is exempted by ruling of the court on the ground of privilege from testifying concerning the subject matter of his statement; (2) persists in refusing to testify concerning the subject matter of his statement despite an order of the court to do so; (3) testifies to a lack of memory of the subject matter of his statement; (4) is dead or is unable to be present or to testify at the hearing because of death or then existing physical or mental illness or infirmity; (5) is absent from the hearing and the proponent of his statement has been unable to procure his attendance by process or other reasonable means. (B) Hearsay exceptions. The following are not excluded by the hearsay rule if the declarant is unavailable as a witness: (1) Former testimony; (2) Statement under belief of impending death; (3) Statement against interest; (4) Statement of personal or family history.'
    },
    {
      ruleNumber: 'La. C.E. Art. 901',
      title: 'Requirement of Authentication or Identification',
      summary: 'Authentication required as condition precedent to admissibility.',
      text: '(A) General provision. The requirement of authentication or identification as a condition precedent to admissibility is satisfied by evidence sufficient to support a finding that the matter in question is what its proponent claims. (B) Illustrations. By way of illustration only, and not by way of limitation, the following are examples of authentication or identification conforming with the requirements of this Article: (1) Testimony of witness with knowledge; (2) Non-expert testimony on handwriting; (3) Comparison by trier or expert witnesses; (4) Distinctive characteristics and the like; (5) Voice identification; (6) Telephone conversations; (7) Public records or reports; (8) Ancient documents or data compilations; (9) Process or system; (10) Methods provided by statute.'
    },
    {
      ruleNumber: 'La. C.E. Art. 902',
      title: 'Self-Authentication',
      summary: 'Extrinsic evidence of authenticity not required for certain documents.',
      text: 'Extrinsic evidence of authenticity as a condition precedent to admissibility is not required with respect to the following: (1) Domestic public documents under seal; (2) Domestic public documents not under seal; (3) Foreign public documents; (4) Certified copies of public records; (5) Official publications; (6) Newspapers and periodicals; (7) Trade inscriptions and the like; (8) Acknowledged documents; (9) Commercial paper and related documents; (10) Presumptions created by statute.'
    },
    {
      ruleNumber: 'La. C.E. Art. 903',
      title: 'Subscribing Witness\'s Testimony',
      summary: 'Testimony of subscribing witness not required unless required by law.',
      text: 'The testimony of a subscribing witness is not necessary to authenticate a writing unless required by the laws of the jurisdiction whose laws govern the validity of the writing.'
    },
    {
      ruleNumber: 'La. C.E. Art. 1001',
      title: 'Definitions',
      summary: 'Defines writing, recording, photograph, original, and duplicate.',
      text: 'For purposes of this Article the following definitions are applicable: (1) Writings and recordings. "Writings" and "recordings" consist of letters, words, or numbers, or their equivalent, set down by handwriting, typewriting, printing, photostating, photographing, magnetic impulse, mechanical or electronic recording, or other form of data compilation. (2) Photographs. "Photographs" include still photographs, x-ray films, video tapes, and motion pictures. (3) Original. An "original" of a writing or recording is the writing or recording itself or any counterpart intended to have the same effect. (4) Duplicate. A "duplicate" is a counterpart produced by the same impression as the original, or from the same matrix, or by means of photography, including enlargements and miniatures, or by mechanical or electronic re-recording, or by chemical reproduction, or by other equivalent techniques which accurately reproduce the original.'
    },
    {
      ruleNumber: 'La. C.E. Art. 1002',
      title: 'Requirement of Original',
      summary: 'Original required to prove contents of writing, recording, or photograph.',
      text: 'To prove the content of a writing, recording, or photograph, the original writing, recording, or photograph is required, except as otherwise provided in this Code or by statute.'
    },
    {
      ruleNumber: 'La. C.E. Art. 1003',
      title: 'Admissibility of Duplicates',
      summary: 'Duplicates admissible to the same extent as originals unless genuine question raised.',
      text: 'A duplicate is admissible to the same extent as an original unless (1) a genuine question is raised as to the authenticity of the original or (2) in the circumstances it would be unfair to admit the duplicate in lieu of the original.'
    },
    {
      ruleNumber: 'La. C.E. Art. 1101',
      title: 'Applicability of Rules',
      summary: 'Rules apply to all proceedings except as otherwise provided.',
      text: '(A) Proceedings to which applicable. Except as otherwise provided in Subarticle B, these rules apply to all proceedings in all courts of the state of Louisiana. (B) Proceedings to which not applicable. These rules do not apply in the following situations: (1) Preliminary proceedings to determine probable cause; (2) Sentencing; (3) Granting or revocation of probation; (4) Contempt proceedings in which the court is authorized by law to act summarily; (5) Proceedings before a commissioner of a court; (6) Certain administrative proceedings.'
    },
    {
      ruleNumber: 'La. C.E. Art. 1102',
      title: 'Amendments',
      summary: 'Rules may be amended by the Louisiana Supreme Court.',
      text: 'These rules may be amended by order of the Louisiana Supreme Court.'
    },
    {
      ruleNumber: 'La. C.E. Art. 1103',
      title: 'Title',
      summary: 'These rules may be cited as the Louisiana Code of Evidence.',
      text: 'These rules may be cited as the Louisiana Code of Evidence or by the abbreviation La. C.E.'
    }
  ],
  civilProcedureRules: [
    { ruleNumber: 'La. C.C.P. Art. 851', title: 'Petition; Contents', summary: 'Petition must contain concise statement of facts and specific relief demanded.', category: 'civil' },
    { ruleNumber: 'La. C.C.P. Art. 861', title: 'Petition; Additional Requirements', summary: 'Additional requirements for petitions in certain actions.', category: 'civil' },
    { ruleNumber: 'La. C.C.P. Art. 891', title: 'Answer; Contents', summary: 'Answer must contain denial or admission of allegations and affirmative defenses.', category: 'civil' },
    { ruleNumber: 'La. C.C.P. Art. 927', title: 'Peremptory Exception of No Cause of Action', summary: 'Exception testing legal sufficiency of petition.', category: 'civil' },
    { ruleNumber: 'La. C.C.P. Art. 966', title: 'Motion for Summary Judgment', summary: 'Governs summary judgment practice in Louisiana.', category: 'civil' },
    { ruleNumber: 'La. C.C.P. Art. 1311', title: 'General Provision', summary: 'Parties may obtain discovery regarding any matter not privileged and relevant.', category: 'civil' },
    { ruleNumber: 'La. C.C.P. Art. 1312', title: 'Scope of Discovery', summary: 'Discovery permitted of any unprivileged matter relevant to subject matter.', category: 'civil' },
    { ruleNumber: 'La. C.C.P. Art. 1313', title: 'Protective Orders', summary: 'Court may issue protective orders to limit discovery.', category: 'civil' },
    { ruleNumber: 'La. C.C.P. Art. 1314', title: 'Depositions Upon Oral Examination', summary: 'Governs oral depositions in civil cases.', category: 'civil' },
    { ruleNumber: 'La. C.C.P. Art. 1315', title: 'Depositions Upon Written Questions', summary: 'Governs written depositions in civil cases.', category: 'civil' },
    { ruleNumber: 'La. C.C.P. Art. 1316', title: 'Interrogatories to Parties', summary: 'Governs written interrogatories to parties.', category: 'civil' },
    { ruleNumber: 'La. C.C.P. Art. 1317', title: 'Production of Documents and Things', summary: 'Governs requests for production of documents and things.', category: 'civil' },
    { ruleNumber: 'La. C.C.P. Art. 1318', title: 'Physical and Mental Examinations', summary: 'Governs court-ordered physical and mental examinations.', category: 'civil' },
    { ruleNumber: 'La. C.C.P. Art. 1319', title: 'Requests for Admission', summary: 'Governs requests for admission of facts and documents.', category: 'civil' },
    { ruleNumber: 'La. C.C.P. Art. 1421', title: 'Jury Trial; Right To', summary: 'Right to jury trial in civil cases where amount in dispute exceeds $50,000.', category: 'civil' },
    { ruleNumber: 'La. C.C.P. Art. 1471', title: 'Sanctions', summary: 'Sanctions available for discovery violations.', category: 'civil' }
  ],
  criminalProcedureRules: [
    { ruleNumber: 'La. C.Cr.P. Art. 228', title: 'Arrest Without Warrant', summary: 'Governs warrantless arrests by peace officers.', category: 'criminal' },
    { ruleNumber: 'La. C.Cr.P. Art. 230', title: 'Summons Instead of Arrest Warrant', summary: 'When summons may be issued instead of arrest warrant.', category: 'criminal' },
    { ruleNumber: 'La. C.Cr.P. Art. 382', title: 'Time for Filing', summary: 'Time limitations for instituting prosecution.', category: 'criminal' },
    { ruleNumber: 'La. C.Cr.P. Art. 432', title: 'Grand Jury; Impaneling', summary: 'Governs grand jury selection and impaneling.', category: 'criminal' },
    { ruleNumber: 'La. C.Cr.P. Art. 444', title: 'Indictment; Form', summary: 'Requirements for valid indictment.', category: 'criminal' },
    { ruleNumber: 'La. C.Cr.P. Art. 531', title: 'Arraignment', summary: 'Governs arraignment proceedings.', category: 'criminal' },
    { ruleNumber: 'La. C.Cr.P. Art. 551', title: 'Pleas', summary: 'Types of pleas and plea procedures.', category: 'criminal' },
    { ruleNumber: 'La. C.Cr.P. Art. 716', title: 'Discovery and Inspection by Defendant', summary: 'Defendant\'s right to discovery in criminal cases.', category: 'criminal' },
    { ruleNumber: 'La. C.Cr.P. Art. 718', title: 'Discovery and Inspection by State', summary: 'State\'s right to discovery in criminal cases.', category: 'criminal' },
    { ruleNumber: 'La. C.Cr.P. Art. 721', title: 'Protective Order', summary: 'Protective orders in criminal discovery.', category: 'criminal' },
    { ruleNumber: 'La. C.Cr.P. Art. 779', title: 'Motion to Suppress Evidence', summary: 'Governs motions to suppress illegally obtained evidence.', category: 'criminal' },
    { ruleNumber: 'La. C.Cr.P. Art. 795', title: 'Jury Selection', summary: 'Governs jury selection and peremptory challenges.', category: 'criminal' },
    { ruleNumber: 'La. C.Cr.P. Art. 821', title: 'Judgment of Acquittal', summary: 'Motions for judgment of acquittal.', category: 'criminal' },
    { ruleNumber: 'La. C.Cr.P. Art. 851', title: 'Motion for New Trial', summary: 'Grounds and procedures for new trial motion.', category: 'criminal' }
  ],
  specialProvisions: {
    civilLawInfluence: 'Louisiana is the only state with a civil law tradition derived from French and Spanish law. The Louisiana Civil Code and Code of Civil Procedure differ significantly from common law jurisdictions.',
    authenticationRequirement: 'La. C.E. Art. 901 requires authentication as condition precedent to admissibility. Louisiana courts have specific requirements for authenticating electronic evidence and social media posts.',
    bestEvidenceRule: 'La. C.E. Art. 1002 requires original documents to prove contents. Louisiana courts apply the rule more strictly than federal courts in some contexts.',
    expertTestimony: 'Louisiana follows Daubert-like reliability analysis but with greater trial court discretion. See State v. Foret, 628 So.2d 1116 (La. 1993).',
    spoliation: 'Louisiana recognizes tort of spoliation. Parties have duty to preserve evidence when litigation is reasonably anticipated.',
    juryDemand: 'La. C.C.P. Art. 1731 requires written jury demand within 10 days of service of last pleading directed to such demand. Amount in controversy must exceed $50,000 for jury trial.',
    prescriptivePeriods: 'Louisiana uses "prescription" rather than "statute of limitations." Civil Code Articles 3492-3500 govern prescriptive periods. One-year prescriptive period for delictual obligations (torts).',
    comparativeFault: 'Louisiana follows pure comparative fault. La. C.C. Art. 2323 allows recovery reduced by plaintiff\'s percentage of fault, even if plaintiff is 99% at fault.',
    medicalMalpractice: 'Louisiana Medical Malpractice Act, La. R.S. 40:1299.41, et seq., caps damages at $500,000 plus future medical care. Requires medical review panel before suit.'
  }
};
