import React from 'react';
import { Link } from 'react-router-dom';
import { Scale, ArrowLeft } from 'lucide-react';

const PrivacyPolicy = () => {
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
        <h1 className="text-4xl sm:text-5xl font-bold text-white font-serif mb-4">Privacy Policy</h1>
        <p className="text-slate-400 mb-8">Last Updated: December 4, 2025</p>

        <div className="prose prose-invert prose-slate max-w-none space-y-8">
          {/* Introduction */}
          <section className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
            <p className="text-slate-300 leading-relaxed">
              Welcome to CaseBuddy (referred to as "we," "us," or "our"). CaseBuddy operates the website
              at <span className="text-gold-400">casebuddy.live</span> and the transcription service at{' '}
              <span className="text-gold-400">transcribe.casebuddy.live</span> (collectively, the "Services").
              We are committed to protecting your privacy and ensuring the security of your personal and legal information.
            </p>
            <p className="text-slate-300 leading-relaxed mt-4">
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you
              use our AI-powered legal trial preparation platform, including our witness simulation, trial practice,
              strategy analysis, and transcription services.
            </p>
          </section>

          {/* Information We Collect */}
          <section className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">2. Information We Collect</h2>

            <h3 className="text-xl font-semibold text-gold-400 mb-3">2.1 Information You Provide Directly</h3>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
              <li><strong>Account Information:</strong> Name, email address, law firm name, bar number, professional credentials</li>
              <li><strong>Case Data:</strong> Case descriptions, legal documents, evidence, witness information, trial strategies</li>
              <li><strong>Audio Recordings:</strong> Voice recordings during trial simulations and practice sessions</li>
              <li><strong>Payment Information:</strong> Billing details, credit card information (processed by third-party payment processors)</li>
              <li><strong>Communications:</strong> Messages, support tickets, feedback, and correspondence with us</li>
            </ul>

            <h3 className="text-xl font-semibold text-gold-400 mb-3 mt-6">2.2 Automatically Collected Information</h3>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
              <li><strong>Usage Data:</strong> Features accessed, session duration, interaction patterns, performance metrics</li>
              <li><strong>Device Information:</strong> Browser type, operating system, device identifiers, IP address</li>
              <li><strong>Cookies and Tracking:</strong> Session cookies, preference cookies, analytics cookies</li>
              <li><strong>API Logs:</strong> Timestamps, request types, response codes, error logs</li>
            </ul>

            <h3 className="text-xl font-semibold text-gold-400 mb-3 mt-6">2.3 Transcription Service Data</h3>
            <p className="text-slate-300 leading-relaxed">
              Our transcription service at <span className="text-gold-400">transcribe.casebuddy.live</span> collects:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
              <li>Audio files uploaded for transcription</li>
              <li>Transcribed text output and metadata</li>
              <li>User preferences for transcription formatting and accuracy</li>
              <li>Timestamps and processing logs</li>
            </ul>
          </section>

          {/* How We Use Your Information */}
          <section className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
              <li><strong>Service Delivery:</strong> Provide AI-powered trial preparation, witness simulation, strategy analysis, and transcription services</li>
              <li><strong>AI Processing:</strong> Process your legal content using Google's Gemini AI API to generate responses, analysis, and coaching</li>
              <li><strong>Personalization:</strong> Customize your experience based on your cases, preferences, and practice areas</li>
              <li><strong>Analytics:</strong> Track performance metrics, objection rates, rhetorical effectiveness, and improvement over time</li>
              <li><strong>Communication:</strong> Send service updates, security alerts, feature announcements, and support responses</li>
              <li><strong>Billing:</strong> Process payments, manage subscriptions, and generate invoices</li>
              <li><strong>Security:</strong> Detect fraud, prevent abuse, enforce our Terms of Service, and protect user accounts</li>
              <li><strong>Legal Compliance:</strong> Comply with applicable laws, regulations, and legal processes</li>
              <li><strong>Product Improvement:</strong> Analyze usage patterns to improve features, fix bugs, and develop new capabilities</li>
            </ul>
          </section>

          {/* Third-Party AI Processing */}
          <section className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">4. Third-Party AI Processing (Google Gemini)</h2>
            <p className="text-slate-300 leading-relaxed">
              CaseBuddy uses <strong>Google's Gemini API</strong> to power our AI features, including:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4 mt-4">
              <li>Witness response generation and personality simulation</li>
              <li>Legal strategy analysis and opponent profiling</li>
              <li>Real-time coaching and fallacy detection</li>
              <li>Document analysis and case summarization</li>
              <li>Live voice trial simulation and transcription</li>
            </ul>
            <p className="text-slate-300 leading-relaxed mt-4">
              <strong>Important:</strong> When you use our Services, your legal content (including case data, audio recordings,
              and documents) is transmitted to Google's servers for processing. Google's use of this data is governed by
              their own privacy policies and terms of service. We recommend reviewing:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4 mt-2">
              <li>Google's Privacy Policy: <span className="text-gold-400">https://policies.google.com/privacy</span></li>
              <li>Google Cloud AI Terms: <span className="text-gold-400">https://cloud.google.com/terms</span></li>
            </ul>
            <p className="text-slate-300 leading-relaxed mt-4">
              <strong>Data Retention by Google:</strong> According to Google's policies, data sent to the Gemini API
              for processing is not used to train Google's models and is deleted after processing, except as required
              by law or for security purposes.
            </p>
          </section>

          {/* Attorney-Client Privilege */}
          <section className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">5. Attorney-Client Privilege and Confidentiality</h2>
            <div className="bg-amber-900/30 border border-amber-700/50 rounded-lg p-4 mb-4">
              <p className="text-amber-200 font-semibold">⚠️ IMPORTANT LEGAL NOTICE</p>
            </div>
            <p className="text-slate-300 leading-relaxed">
              <strong>CaseBuddy is a technology tool, not a law firm.</strong> We do not provide legal advice,
              and we are not your attorney. Using our Services does <strong>NOT</strong> create an attorney-client
              relationship between you and CaseBuddy.
            </p>
            <p className="text-slate-300 leading-relaxed mt-4">
              <strong>Privilege Considerations:</strong> Information you enter into CaseBuddy may contain privileged
              or confidential attorney-client communications. While we implement security measures to protect your data,
              you are responsible for determining whether using third-party AI services (including Google's Gemini API)
              is consistent with your ethical obligations and your clients' expectations of confidentiality.
            </p>
            <p className="text-slate-300 leading-relaxed mt-4">
              We recommend:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
              <li>Consulting your jurisdiction's ethics rules regarding technology and confidentiality</li>
              <li>Obtaining informed consent from clients before using AI tools with their case information</li>
              <li>Avoiding entry of highly sensitive information unless absolutely necessary</li>
              <li>Using anonymized or hypothetical case scenarios when possible for practice sessions</li>
            </ul>
          </section>

          {/* Data Sharing and Disclosure */}
          <section className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">6. Data Sharing and Disclosure</h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              We do not sell your personal information. We may share your information in the following circumstances:
            </p>

            <h3 className="text-xl font-semibold text-gold-400 mb-3">6.1 Service Providers</h3>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
              <li><strong>Google (Gemini AI):</strong> AI processing and analysis</li>
              <li><strong>Payment Processors:</strong> Stripe, PayPal for billing and payments</li>
              <li><strong>Cloud Hosting:</strong> AWS, Google Cloud, or similar providers for data storage</li>
              <li><strong>Analytics:</strong> Usage tracking and performance monitoring</li>
              <li><strong>Email Services:</strong> Transactional and marketing email delivery</li>
            </ul>

            <h3 className="text-xl font-semibold text-gold-400 mb-3 mt-6">6.2 Legal Requirements</h3>
            <p className="text-slate-300 leading-relaxed">
              We may disclose your information if required by law, court order, subpoena, or government regulation,
              or to protect our rights, safety, or property.
            </p>

            <h3 className="text-xl font-semibold text-gold-400 mb-3 mt-6">6.3 Business Transfers</h3>
            <p className="text-slate-300 leading-relaxed">
              In the event of a merger, acquisition, or sale of assets, your information may be transferred to
              the acquiring entity.
            </p>

            <h3 className="text-xl font-semibold text-gold-400 mb-3 mt-6">6.4 Firm Subscriptions</h3>
            <p className="text-slate-300 leading-relaxed">
              If you use CaseBuddy through a law firm subscription, your firm administrator may have access to
              your usage data and case information.
            </p>
          </section>

          {/* Data Security */}
          <section className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">7. Data Security</h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              We implement industry-standard security measures to protect your information:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
              <li><strong>Encryption:</strong> TLS/SSL encryption for data in transit, AES-256 encryption for data at rest</li>
              <li><strong>Access Controls:</strong> Role-based permissions, multi-factor authentication, secure authentication tokens</li>
              <li><strong>Infrastructure Security:</strong> Firewalls, intrusion detection, regular security audits</li>
              <li><strong>Secure Development:</strong> Code reviews, vulnerability scanning, penetration testing</li>
              <li><strong>Backup and Recovery:</strong> Regular encrypted backups with secure recovery procedures</li>
            </ul>
            <p className="text-slate-300 leading-relaxed mt-4">
              <strong>No Guarantee:</strong> While we strive to protect your data, no system is 100% secure.
              You use the Services at your own risk.
            </p>
          </section>

          {/* Data Retention */}
          <section className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">8. Data Retention</h2>
            <p className="text-slate-300 leading-relaxed">
              We retain your information for as long as necessary to provide the Services and comply with legal obligations:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4 mt-4">
              <li><strong>Account Data:</strong> Retained while your account is active and for 90 days after deletion</li>
              <li><strong>Case Data:</strong> Retained according to your subscription plan and deletion requests</li>
              <li><strong>Audio Recordings:</strong> Retained for the duration specified in your account settings (default: 1 year)</li>
              <li><strong>Transcriptions:</strong> Retained until you delete them or close your account</li>
              <li><strong>Billing Records:</strong> Retained for 7 years for tax and accounting purposes</li>
              <li><strong>Logs and Analytics:</strong> Retained for 2 years for security and service improvement</li>
            </ul>
          </section>

          {/* Your Rights and Choices */}
          <section className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">9. Your Rights and Choices</h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              Depending on your jurisdiction, you may have the following rights:
            </p>

            <h3 className="text-xl font-semibold text-gold-400 mb-3">9.1 Access and Portability</h3>
            <p className="text-slate-300 leading-relaxed">
              Request a copy of your personal data in a machine-readable format.
            </p>

            <h3 className="text-xl font-semibold text-gold-400 mb-3 mt-4">9.2 Correction</h3>
            <p className="text-slate-300 leading-relaxed">
              Update or correct inaccurate information through your account settings.
            </p>

            <h3 className="text-xl font-semibold text-gold-400 mb-3 mt-4">9.3 Deletion</h3>
            <p className="text-slate-300 leading-relaxed">
              Request deletion of your account and associated data (subject to legal retention requirements).
            </p>

            <h3 className="text-xl font-semibold text-gold-400 mb-3 mt-4">9.4 Opt-Out</h3>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
              <li>Marketing emails: Unsubscribe link in each email</li>
              <li>Analytics cookies: Browser settings or opt-out tools</li>
              <li>Data processing: Contact us to restrict certain processing activities</li>
            </ul>

            <h3 className="text-xl font-semibold text-gold-400 mb-3 mt-4">9.5 Objection and Restriction</h3>
            <p className="text-slate-300 leading-relaxed">
              Object to certain processing activities or request restrictions on how we use your data.
            </p>

            <p className="text-slate-300 leading-relaxed mt-6">
              <strong>To exercise your rights, contact us at:</strong> <span className="text-gold-400">privacy@casebuddy.live</span>
            </p>
          </section>

          {/* Children's Privacy */}
          <section className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">10. Children's Privacy</h2>
            <p className="text-slate-300 leading-relaxed">
              CaseBuddy is intended for use by licensed attorneys and legal professionals. Our Services are not
              directed at children under 18, and we do not knowingly collect information from individuals under 18.
              If we become aware of such collection, we will delete the information immediately.
            </p>
          </section>

          {/* International Users */}
          <section className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">11. International Users and Data Transfers</h2>
            <p className="text-slate-300 leading-relaxed">
              CaseBuddy is based in the United States. If you access our Services from outside the U.S., your information
              will be transferred to, stored, and processed in the United States and other countries where our service
              providers operate. These countries may have data protection laws that differ from your jurisdiction.
            </p>
            <p className="text-slate-300 leading-relaxed mt-4">
              <strong>European Users:</strong> For users in the European Economic Area (EEA), UK, or Switzerland, we rely
              on Standard Contractual Clauses or other appropriate safeguards for international data transfers.
            </p>
          </section>

          {/* California Privacy Rights */}
          <section className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">12. California Privacy Rights (CCPA/CPRA)</h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA):
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
              <li><strong>Right to Know:</strong> Request disclosure of personal information collected, used, and shared</li>
              <li><strong>Right to Delete:</strong> Request deletion of your personal information (with exceptions)</li>
              <li><strong>Right to Opt-Out:</strong> Opt out of the "sale" or "sharing" of personal information (we do not sell data)</li>
              <li><strong>Right to Non-Discrimination:</strong> Not receive discriminatory treatment for exercising your rights</li>
              <li><strong>Right to Correct:</strong> Request correction of inaccurate personal information</li>
              <li><strong>Right to Limit Use of Sensitive Information:</strong> Request limits on use of sensitive personal information</li>
            </ul>
            <p className="text-slate-300 leading-relaxed mt-4">
              To submit a request, contact us at: <span className="text-gold-400">privacy@casebuddy.live</span> or call{' '}
              <span className="text-gold-400">1-800-CASEBUDDY</span>
            </p>
          </section>

          {/* Changes to Privacy Policy */}
          <section className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">13. Changes to This Privacy Policy</h2>
            <p className="text-slate-300 leading-relaxed">
              We may update this Privacy Policy from time to time. Material changes will be communicated via:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4 mt-4">
              <li>Email notification to your registered email address</li>
              <li>Prominent notice on our website and in the application</li>
              <li>Updated "Last Updated" date at the top of this policy</li>
            </ul>
            <p className="text-slate-300 leading-relaxed mt-4">
              Your continued use of the Services after changes become effective constitutes acceptance of the updated policy.
            </p>
          </section>

          {/* Contact Information */}
          <section className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">14. Contact Us</h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, contact us at:
            </p>
            <div className="bg-slate-900/50 rounded-lg p-4 space-y-2">
              <p className="text-slate-300"><strong>Email:</strong> <span className="text-gold-400">privacy@casebuddy.live</span></p>
              <p className="text-slate-300"><strong>Support:</strong> <span className="text-gold-400">support@casebuddy.live</span></p>
              <p className="text-slate-300"><strong>Phone:</strong> <span className="text-gold-400">1-800-CASEBUDDY</span></p>
              <p className="text-slate-300"><strong>Mail:</strong> CaseBuddy, Inc.<br />Attn: Privacy Officer<br />
              [Address to be provided]<br />United States</p>
            </div>
          </section>

          {/* Acknowledgment */}
          <section className="bg-gradient-to-r from-gold-900/20 via-slate-800/50 to-gold-900/20 border border-gold-700/30 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">15. Acknowledgment</h2>
            <p className="text-slate-300 leading-relaxed">
              By using CaseBuddy and our Services (including <span className="text-gold-400">casebuddy.live</span> and{' '}
              <span className="text-gold-400">transcribe.casebuddy.live</span>), you acknowledge that you have read,
              understood, and agree to this Privacy Policy and our{' '}
              <Link to="/tos" className="text-gold-400 hover:text-gold-300 underline">Terms of Service</Link>.
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

export default PrivacyPolicy;
