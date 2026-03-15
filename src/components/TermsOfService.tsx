import React from 'react';
import { Link } from 'react-router-dom';
import { Scale, ArrowLeft } from 'lucide-react';

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Navigation */}
      <nav className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2 text-gold-500">
              <Scale size={32} />
              <span className="text-2xl font-serif font-bold text-white">CaseBuddy</span>
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl sm:text-5xl font-bold text-white font-serif mb-4">Terms of Service</h1>
        <p className="text-slate-400 mb-8">Last Updated: December 4, 2025</p>

        <div className="prose prose-invert prose-slate max-w-none space-y-8">
          {/* Introduction */}
          <section className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">1. Agreement to Terms</h2>
            <p className="text-slate-300 leading-relaxed">
              Welcome to CaseBuddy. These Terms of Service ("Terms") constitute a legally binding agreement between
              you ("User," "you," or "your") and CaseBuddy, Inc. ("CaseBuddy," "we," "us," or "our") governing your
              access to and use of the CaseBuddy platform, including our website at <span className="text-gold-400">casebuddy.live</span>,
              our transcription service at <span className="text-gold-400">transcribe.casebuddy.live</span>, and all
              related services, features, content, and applications (collectively, the "Services").
            </p>
            <p className="text-slate-300 leading-relaxed mt-4">
              By accessing or using our Services, you agree to be bound by these Terms and our{' '}
              <Link to="/privacy-policy" className="text-gold-400 hover:text-gold-300 underline">Privacy Policy</Link>.
              If you do not agree to these Terms, you must not access or use the Services.
            </p>
          </section>

          {/* Eligibility */}
          <section className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">2. Eligibility and Account Registration</h2>

            <h3 className="text-xl font-semibold text-gold-400 mb-3">2.1 Professional Use Only</h3>
            <p className="text-slate-300 leading-relaxed">
              CaseBuddy is intended exclusively for use by:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4 mt-2">
              <li>Licensed attorneys in good standing with their state bar</li>
              <li>Law students at accredited institutions (for educational purposes)</li>
              <li>Legal professionals working under attorney supervision</li>
              <li>Law firms and legal organizations</li>
            </ul>

            <h3 className="text-xl font-semibold text-gold-400 mb-3 mt-6">2.2 Age Requirement</h3>
            <p className="text-slate-300 leading-relaxed">
              You must be at least 18 years old to use the Services. By using the Services, you represent and warrant
              that you meet this age requirement.
            </p>

            <h3 className="text-xl font-semibold text-gold-400 mb-3 mt-6">2.3 Account Accuracy</h3>
            <p className="text-slate-300 leading-relaxed">
              You agree to:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4 mt-2">
              <li>Provide accurate, current, and complete information during registration</li>
              <li>Maintain and update your account information to keep it accurate</li>
              <li>Maintain the security of your password and account credentials</li>
              <li>Notify us immediately of any unauthorized access or security breach</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>

            <h3 className="text-xl font-semibold text-gold-400 mb-3 mt-6">2.4 Account Suspension</h3>
            <p className="text-slate-300 leading-relaxed">
              We reserve the right to suspend or terminate accounts that violate these Terms, engage in fraudulent
              activity, or pose security risks.
            </p>
          </section>

          {/* Services Description */}
          <section className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">3. Description of Services</h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              CaseBuddy provides AI-powered legal trial preparation tools, including:
            </p>

            <h3 className="text-xl font-semibold text-gold-400 mb-3">3.1 Core Features</h3>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
              <li><strong>Trial Simulator:</strong> Live voice-based courtroom practice with AI-generated responses and real-time objections</li>
              <li><strong>Witness Lab:</strong> Text-based witness cross-examination simulation with personality-driven responses</li>
              <li><strong>Strategy & AI:</strong> AI-powered case strategy analysis, opponent profiling, and tactical predictions</li>
              <li><strong>Mock Jury:</strong> Simulated jury deliberations with diverse AI juror personalities</li>
              <li><strong>Document Analysis:</strong> AI extraction and analysis of legal documents and evidence</li>
              <li><strong>Transcription Service:</strong> Audio-to-text transcription via <span className="text-gold-400">transcribe.casebuddy.live</span></li>
              <li><strong>Performance Analytics:</strong> Tracking of objections, fallacies, rhetoric scores, and improvement metrics</li>
              <li><strong>Session Recording:</strong> Storage and playback of practice sessions with full transcripts</li>
            </ul>

            <h3 className="text-xl font-semibold text-gold-400 mb-3 mt-6">3.2 Service Modifications</h3>
            <p className="text-slate-300 leading-relaxed">
              We reserve the right to:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4 mt-2">
              <li>Modify, suspend, or discontinue any feature or service at any time</li>
              <li>Impose limits on usage, storage, or features</li>
              <li>Update software, algorithms, and AI models without prior notice</li>
              <li>Introduce new features, which may be subject to additional terms</li>
            </ul>
          </section>

          {/* Not Legal Advice */}
          <section className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">4. NOT Legal Advice - Professional Responsibility</h2>
            <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-4 mb-4">
              <p className="text-red-200 font-semibold text-lg">⚠️ CRITICAL DISCLAIMER</p>
            </div>

            <h3 className="text-xl font-semibold text-gold-400 mb-3">4.1 No Attorney-Client Relationship</h3>
            <p className="text-slate-300 leading-relaxed">
              <strong>CaseBuddy is a software tool for trial preparation and practice. It is NOT a law firm,
              and it does NOT provide legal advice.</strong> Using CaseBuddy does not create an attorney-client
              relationship between you and CaseBuddy, its employees, or its AI systems.
            </p>

            <h3 className="text-xl font-semibold text-gold-400 mb-3 mt-6">4.2 AI-Generated Content is Not Legal Advice</h3>
            <p className="text-slate-300 leading-relaxed">
              All content generated by CaseBuddy's AI systems, including:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4 mt-2">
              <li>Strategy recommendations and case analysis</li>
              <li>Witness responses and cross-examination suggestions</li>
              <li>Jury deliberation predictions and verdict forecasts</li>
              <li>Opponent profiling and tactical advice</li>
              <li>Document summaries and legal research</li>
            </ul>
            <p className="text-slate-300 leading-relaxed mt-4">
              is <strong>FOR PRACTICE AND SIMULATION PURPOSES ONLY</strong>. This content is not legal advice,
              should not be relied upon as such, and does not substitute for professional legal judgment.
            </p>

            <h3 className="text-xl font-semibold text-gold-400 mb-3 mt-6">4.3 Your Professional Responsibilities</h3>
            <p className="text-slate-300 leading-relaxed">
              As a licensed attorney, you are solely responsible for:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4 mt-2">
              <li>All legal advice and strategy decisions for your clients</li>
              <li>Compliance with ethical rules and professional conduct standards</li>
              <li>Verification of all AI-generated information before use in real cases</li>
              <li>Maintaining attorney-client privilege and confidentiality obligations</li>
              <li>Competent representation under applicable rules of professional conduct</li>
              <li>Supervision of technology use consistent with your jurisdiction's ethics rules</li>
            </ul>

            <h3 className="text-xl font-semibold text-gold-400 mb-3 mt-6">4.4 AI Limitations and Errors</h3>
            <p className="text-slate-300 leading-relaxed">
              You acknowledge that:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4 mt-2">
              <li>AI systems can make mistakes, produce inaccurate information, or "hallucinate" facts</li>
              <li>AI-generated legal analysis may be incomplete, outdated, or incorrect</li>
              <li>You must independently verify all information before relying on it</li>
              <li>CaseBuddy is not liable for errors, omissions, or consequences of AI-generated content</li>
            </ul>
          </section>

          {/* Acceptable Use */}
          <section className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">5. Acceptable Use Policy</h2>

            <h3 className="text-xl font-semibold text-gold-400 mb-3">5.1 Permitted Uses</h3>
            <p className="text-slate-300 leading-relaxed">
              You may use CaseBuddy for:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4 mt-2">
              <li>Trial preparation and practice for actual or hypothetical cases</li>
              <li>Legal education and skill development</li>
              <li>Case strategy analysis and planning</li>
              <li>Witness preparation and cross-examination practice</li>
              <li>Performance improvement and analytics review</li>
            </ul>

            <h3 className="text-xl font-semibold text-gold-400 mb-3 mt-6">5.2 Prohibited Uses</h3>
            <p className="text-slate-300 leading-relaxed">
              You may NOT:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4 mt-2">
              <li>Use the Services for any unlawful, fraudulent, or malicious purpose</li>
              <li>Attempt to reverse engineer, decompile, or extract the source code</li>
              <li>Scrape, crawl, or automatically extract data from the Services</li>
              <li>Share your account credentials or allow unauthorized access</li>
              <li>Upload malware, viruses, or malicious code</li>
              <li>Harass, abuse, or harm other users or our systems</li>
              <li>Interfere with the operation or security of the Services</li>
              <li>Violate any applicable laws, regulations, or third-party rights</li>
              <li>Use the Services to generate spam or unsolicited communications</li>
              <li>Resell or commercially exploit the Services without authorization</li>
              <li>Remove copyright notices, trademarks, or proprietary rights legends</li>
              <li>Use AI-generated content in court without independent verification</li>
            </ul>

            <h3 className="text-xl font-semibold text-gold-400 mb-3 mt-6">5.3 Consequences of Violation</h3>
            <p className="text-slate-300 leading-relaxed">
              Violation of this Acceptable Use Policy may result in:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4 mt-2">
              <li>Immediate termination of your account without refund</li>
              <li>Legal action for damages and injunctive relief</li>
              <li>Reporting to law enforcement or bar authorities if appropriate</li>
            </ul>
          </section>

          {/* Intellectual Property */}
          <section className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">6. Intellectual Property Rights</h2>

            <h3 className="text-xl font-semibold text-gold-400 mb-3">6.1 CaseBuddy's Ownership</h3>
            <p className="text-slate-300 leading-relaxed">
              CaseBuddy and its licensors own all rights, title, and interest in:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4 mt-2">
              <li>The CaseBuddy platform, software, and technology</li>
              <li>All trademarks, service marks, logos, and branding</li>
              <li>AI models, algorithms, and training data (excluding user-provided content)</li>
              <li>Documentation, tutorials, and instructional materials</li>
              <li>Aggregated and anonymized usage analytics</li>
            </ul>

            <h3 className="text-xl font-semibold text-gold-400 mb-3 mt-6">6.2 Your Content Ownership</h3>
            <p className="text-slate-300 leading-relaxed">
              You retain ownership of all content you upload, including:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4 mt-2">
              <li>Case information and legal documents</li>
              <li>Audio recordings and transcripts</li>
              <li>Personal notes and annotations</li>
            </ul>

            <h3 className="text-xl font-semibold text-gold-400 mb-3 mt-6">6.3 License Grant to CaseBuddy</h3>
            <p className="text-slate-300 leading-relaxed">
              By uploading content to CaseBuddy, you grant us a limited, non-exclusive, worldwide license to:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4 mt-2">
              <li>Store, process, and transmit your content to provide the Services</li>
              <li>Use your content to generate AI responses and analysis</li>
              <li>Create anonymized, aggregated analytics for service improvement</li>
            </ul>
            <p className="text-slate-300 leading-relaxed mt-4">
              <strong>We do NOT</strong> claim ownership of your content, and we will not use it for purposes beyond
              providing the Services, except as anonymized data for analytics or as required by law.
            </p>

            <h3 className="text-xl font-semibold text-gold-400 mb-3 mt-6">6.4 AI-Generated Content</h3>
            <p className="text-slate-300 leading-relaxed">
              AI-generated content (e.g., strategy analysis, witness responses) is provided to you for your use.
              However, you acknowledge that similar content may be generated for other users, and CaseBuddy does
              not guarantee uniqueness or exclusive rights to AI outputs.
            </p>
          </section>

          {/* Third-Party Services */}
          <section className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">7. Third-Party Services and AI Processing</h2>

            <h3 className="text-xl font-semibold text-gold-400 mb-3">7.1 Google Gemini API</h3>
            <p className="text-slate-300 leading-relaxed">
              CaseBuddy uses <strong>Google's Gemini AI API</strong> to power core features. By using CaseBuddy,
              you acknowledge and agree that:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4 mt-2">
              <li>Your content is transmitted to Google's servers for processing</li>
              <li>Google's privacy policies and terms of service apply to this processing</li>
              <li>CaseBuddy is not responsible for Google's data handling practices</li>
              <li>Service availability may be affected by Google's API uptime and policies</li>
            </ul>

            <h3 className="text-xl font-semibold text-gold-400 mb-3 mt-6">7.2 Other Third-Party Services</h3>
            <p className="text-slate-300 leading-relaxed">
              We may integrate with payment processors (Stripe, PayPal), cloud providers (AWS, Google Cloud),
              and analytics services. These third parties have their own terms and privacy policies.
            </p>

            <h3 className="text-xl font-semibold text-gold-400 mb-3 mt-6">7.3 No Endorsement</h3>
            <p className="text-slate-300 leading-relaxed">
              CaseBuddy's use of third-party services does not constitute endorsement. We are not responsible
              for their actions, policies, or service quality.
            </p>
          </section>

          {/* Payment Terms */}
          <section className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">8. Payment Terms and Subscriptions</h2>

            <h3 className="text-xl font-semibold text-gold-400 mb-3">8.1 Subscription Plans</h3>
            <p className="text-slate-300 leading-relaxed">
              CaseBuddy offers the following subscription tiers:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4 mt-2">
              <li><strong>Free:</strong> Limited features and usage (3 cases, 10 AI generations/month, 5 trial sessions/month)</li>
              <li><strong>Pro ($49/month):</strong> Unlimited usage with all features unlocked</li>
              <li><strong>Firm ($199/month/attorney):</strong> Multi-user collaboration and enterprise features</li>
            </ul>

            <h3 className="text-xl font-semibold text-gold-400 mb-3 mt-6">8.2 Billing and Renewal</h3>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
              <li>Subscriptions are billed monthly or annually in advance</li>
              <li>Subscriptions automatically renew unless cancelled before the renewal date</li>
              <li>You authorize us to charge your payment method on each renewal</li>
              <li>Prices are subject to change with 30 days' notice</li>
            </ul>

            <h3 className="text-xl font-semibold text-gold-400 mb-3 mt-6">8.3 Free Trials</h3>
            <p className="text-slate-300 leading-relaxed">
              We may offer free trials for paid plans. If you do not cancel before the trial ends, you will be
              charged for the subscription.
            </p>

            <h3 className="text-xl font-semibold text-gold-400 mb-3 mt-6">8.4 Cancellation and Refunds</h3>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
              <li>You may cancel your subscription at any time from your account settings</li>
              <li>Cancellation takes effect at the end of the current billing period</li>
              <li>No refunds or credits for partial months, except where required by law</li>
              <li>Free accounts have no cancellation fee</li>
            </ul>

            <h3 className="text-xl font-semibold text-gold-400 mb-3 mt-6">8.5 Payment Disputes</h3>
            <p className="text-slate-300 leading-relaxed">
              If you dispute a charge, contact us at <span className="text-gold-400">billing@casebuddy.live</span> within
              30 days. Chargebacks without prior contact may result in account suspension.
            </p>
          </section>

          {/* Privacy and Data */}
          <section className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">9. Privacy and Data Security</h2>
            <p className="text-slate-300 leading-relaxed">
              Your use of CaseBuddy is also governed by our{' '}
              <Link to="/privacy-policy" className="text-gold-400 hover:text-gold-300 underline">Privacy Policy</Link>,
              which describes how we collect, use, and protect your information.
            </p>
            <p className="text-slate-300 leading-relaxed mt-4">
              <strong>Security Notice:</strong> While we implement industry-standard security measures, no system is
              100% secure. You are responsible for safeguarding your account credentials and reporting suspected
              unauthorized access.
            </p>
            <p className="text-slate-300 leading-relaxed mt-4">
              <strong>Attorney Ethics:</strong> You are responsible for ensuring that your use of CaseBuddy complies
              with your jurisdiction's ethics rules regarding technology, confidentiality, and client consent.
            </p>
          </section>

          {/* Disclaimers */}
          <section className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">10. Disclaimers and Warranties</h2>

            <div className="bg-amber-900/30 border border-amber-700/50 rounded-lg p-4 mb-4">
              <p className="text-amber-200 font-semibold">PLEASE READ CAREFULLY</p>
            </div>

            <h3 className="text-xl font-semibold text-gold-400 mb-3">10.1 "AS IS" Provision</h3>
            <p className="text-slate-300 leading-relaxed">
              THE SERVICES ARE PROVIDED "AS IS," "AS AVAILABLE," AND "WITH ALL FAULTS." TO THE FULLEST EXTENT
              PERMITTED BY LAW, CASEBUDDY DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4 mt-2">
              <li>Warranties of merchantability, fitness for a particular purpose, and non-infringement</li>
              <li>Warranties regarding accuracy, reliability, or completeness of AI-generated content</li>
              <li>Warranties that the Services will be uninterrupted, secure, or error-free</li>
              <li>Warranties that defects will be corrected or that the Services are free from viruses</li>
            </ul>

            <h3 className="text-xl font-semibold text-gold-400 mb-3 mt-6">10.2 No Guarantee of Results</h3>
            <p className="text-slate-300 leading-relaxed">
              CASEBUDDY DOES NOT GUARANTEE THAT USING THE SERVICES WILL IMPROVE YOUR TRIAL PERFORMANCE, WIN CASES,
              OR ACHIEVE ANY PARTICULAR OUTCOME. ALL RESULTS DEPEND ON YOUR SKILL, PREPARATION, AND CASE FACTS.
            </p>

            <h3 className="text-xl font-semibold text-gold-400 mb-3 mt-6">10.3 Third-Party Content</h3>
            <p className="text-slate-300 leading-relaxed">
              We are not responsible for the accuracy, legality, or reliability of third-party content,
              including content generated by Google's Gemini AI.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">11. Limitation of Liability</h2>

            <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-4 mb-4">
              <p className="text-red-200 font-semibold">IMPORTANT LIABILITY LIMITS</p>
            </div>

            <h3 className="text-xl font-semibold text-gold-400 mb-3">11.1 Exclusion of Damages</h3>
            <p className="text-slate-300 leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, CASEBUDDY AND ITS AFFILIATES, OFFICERS, DIRECTORS, EMPLOYEES,
              AGENTS, AND LICENSORS SHALL NOT BE LIABLE FOR:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4 mt-2">
              <li>INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES</li>
              <li>LOSS OF PROFITS, REVENUE, DATA, OR BUSINESS OPPORTUNITIES</li>
              <li>LOSS OF CASES, LEGAL MALPRACTICE CLAIMS, OR BAR COMPLAINTS</li>
              <li>DAMAGES ARISING FROM RELIANCE ON AI-GENERATED CONTENT</li>
              <li>DAMAGES FROM UNAUTHORIZED ACCESS, DATA BREACHES, OR SYSTEM FAILURES</li>
              <li>DAMAGES FROM THIRD-PARTY SERVICES (INCLUDING GOOGLE GEMINI)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gold-400 mb-3 mt-6">11.2 Cap on Liability</h3>
            <p className="text-slate-300 leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, CASEBUDDY'S TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING
              FROM OR RELATING TO THE SERVICES SHALL NOT EXCEED THE GREATER OF:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4 mt-2">
              <li>$100 (ONE HUNDRED DOLLARS), OR</li>
              <li>THE AMOUNT YOU PAID TO CASEBUDDY IN THE 12 MONTHS BEFORE THE CLAIM AROSE</li>
            </ul>

            <h3 className="text-xl font-semibold text-gold-400 mb-3 mt-6">11.3 Basis of the Bargain</h3>
            <p className="text-slate-300 leading-relaxed">
              You acknowledge that these limitations of liability are fundamental elements of the agreement between
              you and CaseBuddy, and that CaseBuddy would not provide the Services without these limitations.
            </p>
          </section>

          {/* Indemnification */}
          <section className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">12. Indemnification</h2>
            <p className="text-slate-300 leading-relaxed">
              You agree to indemnify, defend, and hold harmless CaseBuddy and its affiliates, officers, directors,
              employees, agents, licensors, and service providers from and against any and all claims, liabilities,
              damages, losses, costs, expenses, and fees (including reasonable attorneys' fees) arising from:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4 mt-4">
              <li>Your use or misuse of the Services</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any law, regulation, or third-party rights</li>
              <li>Content you upload to the Services</li>
              <li>Legal malpractice claims arising from your reliance on AI-generated content</li>
              <li>Disputes with other users or third parties</li>
              <li>Unauthorized access to your account due to your negligence</li>
            </ul>
          </section>

          {/* Dispute Resolution */}
          <section className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">13. Dispute Resolution and Arbitration</h2>

            <h3 className="text-xl font-semibold text-gold-400 mb-3">13.1 Informal Resolution</h3>
            <p className="text-slate-300 leading-relaxed">
              Before filing any formal claim, you agree to contact us at <span className="text-gold-400">legal@casebuddy.live</span> and
              attempt to resolve the dispute informally for at least 30 days.
            </p>

            <h3 className="text-xl font-semibold text-gold-400 mb-3 mt-6">13.2 Binding Arbitration</h3>
            <p className="text-slate-300 leading-relaxed">
              If we cannot resolve a dispute informally, you agree that any claim, dispute, or controversy arising
              out of or relating to these Terms or the Services shall be resolved by binding arbitration administered
              by the American Arbitration Association (AAA) under its Commercial Arbitration Rules.
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4 mt-2">
              <li>The arbitration shall be conducted by a single arbitrator</li>
              <li>The arbitration shall take place in [Location to be specified]</li>
              <li>The arbitrator's decision shall be final and binding</li>
              <li>Each party shall bear its own costs and attorneys' fees</li>
            </ul>

            <h3 className="text-xl font-semibold text-gold-400 mb-3 mt-6">13.3 Class Action Waiver</h3>
            <p className="text-slate-300 leading-relaxed">
              YOU AGREE THAT DISPUTES SHALL BE RESOLVED ON AN INDIVIDUAL BASIS ONLY. YOU WAIVE ANY RIGHT TO PARTICIPATE
              IN A CLASS ACTION, CLASS ARBITRATION, OR ANY REPRESENTATIVE ACTION.
            </p>

            <h3 className="text-xl font-semibold text-gold-400 mb-3 mt-6">13.4 Exceptions</h3>
            <p className="text-slate-300 leading-relaxed">
              Either party may seek equitable relief (injunctions) in court for intellectual property infringement,
              confidentiality breaches, or violations of the Acceptable Use Policy.
            </p>

            <h3 className="text-xl font-semibold text-gold-400 mb-3 mt-6">13.5 Governing Law</h3>
            <p className="text-slate-300 leading-relaxed">
              These Terms shall be governed by the laws of [State to be specified], without regard to conflict of law principles.
            </p>
          </section>

          {/* Termination */}
          <section className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">14. Termination</h2>

            <h3 className="text-xl font-semibold text-gold-400 mb-3">14.1 Termination by You</h3>
            <p className="text-slate-300 leading-relaxed">
              You may terminate your account at any time by:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4 mt-2">
              <li>Cancelling your subscription through account settings</li>
              <li>Contacting support at <span className="text-gold-400">support@casebuddy.live</span></li>
            </ul>

            <h3 className="text-xl font-semibold text-gold-400 mb-3 mt-6">14.2 Termination by CaseBuddy</h3>
            <p className="text-slate-300 leading-relaxed">
              We may suspend or terminate your account immediately, without prior notice or liability, for:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4 mt-2">
              <li>Violation of these Terms or our Acceptable Use Policy</li>
              <li>Fraudulent, abusive, or illegal activity</li>
              <li>Non-payment of fees</li>
              <li>Extended inactivity (free accounts)</li>
              <li>Risk to security or integrity of the Services</li>
            </ul>

            <h3 className="text-xl font-semibold text-gold-400 mb-3 mt-6">14.3 Effect of Termination</h3>
            <p className="text-slate-300 leading-relaxed">
              Upon termination:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4 mt-2">
              <li>Your right to access the Services immediately ceases</li>
              <li>We may delete your account and data after 90 days (subject to legal retention requirements)</li>
              <li>You remain liable for all fees incurred before termination</li>
              <li>Provisions regarding disclaimers, liability, indemnification, and dispute resolution survive termination</li>
            </ul>
          </section>

          {/* General Provisions */}
          <section className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">15. General Provisions</h2>

            <h3 className="text-xl font-semibold text-gold-400 mb-3">15.1 Entire Agreement</h3>
            <p className="text-slate-300 leading-relaxed">
              These Terms, together with our Privacy Policy, constitute the entire agreement between you and CaseBuddy
              regarding the Services.
            </p>

            <h3 className="text-xl font-semibold text-gold-400 mb-3 mt-4">15.2 Modifications to Terms</h3>
            <p className="text-slate-300 leading-relaxed">
              We may modify these Terms at any time. Material changes will be communicated via email and/or prominent
              notice in the Services. Continued use after changes constitutes acceptance.
            </p>

            <h3 className="text-xl font-semibold text-gold-400 mb-3 mt-4">15.3 Severability</h3>
            <p className="text-slate-300 leading-relaxed">
              If any provision of these Terms is found unenforceable, the remaining provisions remain in full force.
            </p>

            <h3 className="text-xl font-semibold text-gold-400 mb-3 mt-4">15.4 Waiver</h3>
            <p className="text-slate-300 leading-relaxed">
              Failure to enforce any provision does not constitute a waiver of that provision or any other provision.
            </p>

            <h3 className="text-xl font-semibold text-gold-400 mb-3 mt-4">15.5 Assignment</h3>
            <p className="text-slate-300 leading-relaxed">
              You may not assign these Terms without our written consent. We may assign these Terms to any affiliate
              or successor.
            </p>

            <h3 className="text-xl font-semibold text-gold-400 mb-3 mt-4">15.6 Force Majeure</h3>
            <p className="text-slate-300 leading-relaxed">
              CaseBuddy is not liable for delays or failures due to causes beyond our reasonable control, including
              natural disasters, war, terrorism, labor disputes, or third-party service outages.
            </p>

            <h3 className="text-xl font-semibold text-gold-400 mb-3 mt-4">15.7 Export Compliance</h3>
            <p className="text-slate-300 leading-relaxed">
              You agree to comply with all applicable export and import laws and regulations.
            </p>

            <h3 className="text-xl font-semibold text-gold-400 mb-3 mt-4">15.8 U.S. Government Rights</h3>
            <p className="text-slate-300 leading-relaxed">
              If you are a U.S. government entity, the Services are "Commercial Items" as defined in FAR 2.101,
              provided with "Restricted Rights" under DFARS 252.227-7013 and FAR 52.227-19.
            </p>
          </section>

          {/* Contact Information */}
          <section className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">16. Contact Information</h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              For questions about these Terms, please contact us at:
            </p>
            <div className="bg-slate-900/50 rounded-lg p-4 space-y-2">
              <p className="text-slate-300"><strong>Legal Inquiries:</strong> <span className="text-gold-400">legal@casebuddy.live</span></p>
              <p className="text-slate-300"><strong>Support:</strong> <span className="text-gold-400">support@casebuddy.live</span></p>
              <p className="text-slate-300"><strong>Billing:</strong> <span className="text-gold-400">billing@casebuddy.live</span></p>
              <p className="text-slate-300"><strong>Phone:</strong> <span className="text-gold-400">1-800-CASEBUDDY</span></p>
              <p className="text-slate-300"><strong>Mail:</strong> CaseBuddy, Inc.<br />Attn: Legal Department<br />
              [Address to be provided]<br />United States</p>
            </div>
          </section>

          {/* Acknowledgment */}
          <section className="bg-gradient-to-r from-gold-900/20 via-slate-800/50 to-gold-900/20 border border-gold-700/30 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">17. Acknowledgment and Acceptance</h2>
            <p className="text-slate-300 leading-relaxed">
              BY CLICKING "I ACCEPT," CREATING AN ACCOUNT, OR USING THE SERVICES, YOU ACKNOWLEDGE THAT YOU HAVE
              READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THESE TERMS OF SERVICE AND OUR{' '}
              <Link to="/privacy-policy" className="text-gold-400 hover:text-gold-300 underline">PRIVACY POLICY</Link>.
            </p>
            <p className="text-slate-300 leading-relaxed mt-4">
              IF YOU DO NOT AGREE TO THESE TERMS, DO NOT USE THE SERVICES.
            </p>
          </section>
        </div>

        {/* Back to Top */}
        <div className="mt-12 text-center">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="inline-flex items-center gap-2 text-gold-400 hover:text-gold-300 transition-colors"
          >
            Back to Top
          </a>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-slate-500">
            © 2025 CaseBuddy, Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default TermsOfService;
