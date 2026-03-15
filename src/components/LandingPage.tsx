import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Scale, Mic, Users, BrainCircuit, TrendingUp, CheckCircle, Zap, Award, Shield, Clock, DollarSign, Star, ArrowRight, Menu, X, FileAudio, Gavel } from 'lucide-react';

const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    {
      icon: Mic,
      title: 'Live Voice Trial Simulation',
      description: 'Practice with real-time AI responses and instant objections, just like in real court.'
    },
    {
      icon: Users,
      title: 'AI Jury Simulation',
      description: '12 diverse AI jurors who deliberate your case and predict verdicts with detailed reasoning.'
    },
    {
      icon: BrainCircuit,
      title: 'Real-Time Coaching',
      description: 'Get instant feedback on logical fallacies, rhetorical effectiveness, and argument strength.'
    },
    {
      icon: FileAudio,
      title: 'AI Transcription Service',
      description: 'Convert audio recordings to accurate text transcripts with speaker detection and timestamps.'
    },
    {
      icon: TrendingUp,
      title: 'Performance Analytics',
      description: 'Track your improvement with detailed metrics: objections, fallacies, rhetoric scores.'
    },
    {
      icon: Shield,
      title: 'Evidence Timeline',
      description: 'Organize chronological events and exhibits with visual timeline management.'
    }
  ];

  const pricingTiers = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      features: [
        '1 case maximum',
        '3 AI generations/month',
        '1 trial session/month',
        'Basic analytics',
        'Community support',
        'No export features'
      ],
      cta: 'Get Started Free',
      highlight: false
    },
    {
      name: 'Pro',
      price: '$129',
      period: '/month',
      features: [
        'Unlimited cases',
        'Unlimited AI generations',
        'Unlimited trial sessions',
        'Advanced analytics',
        'Session recording & history',
        'Mock jury simulation',
        'Priority support',
        'All features unlocked'
      ],
      cta: 'Start Pro Trial',
      highlight: true
    },
    {
      name: 'Firm',
      price: '$299',
      period: '/month/attorney',
      features: [
        'Everything in Pro',
        'Multi-user collaboration',
        'Shared case library',
        'Admin dashboard',
        'Custom branding',
        'API access',
        'Dedicated support',
        'Volume discounts'
      ],
      cta: 'Contact Sales',
      highlight: false
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Mitchell',
      role: 'Criminal Defense Attorney',
      firm: 'Mitchell & Associates',
      quote: 'CaseBuddy\'s AI jury simulation saved us $15,000 in jury consultant fees and helped us win a difficult case.',
      rating: 5
    },
    {
      name: 'David Chen',
      role: 'Senior Litigator',
      firm: 'Chen Law Group',
      quote: 'The live voice simulation is incredible. It\'s like having a sparring partner available 24/7. CaseBuddy is a game-changer.',
      rating: 5
    },
    {
      name: 'Maria Rodriguez',
      role: 'Trial Attorney',
      firm: 'Rodriguez Legal',
      quote: 'The transcription service and real-time fallacy detection have dramatically improved my case preparation.',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Navigation */}
      <nav className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2 text-gold-500">
              <Gavel size={32} />
              <span className="text-2xl font-serif font-bold text-white">CaseBuddy</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-slate-300 hover:text-white transition-colors">Features</a>
              <a href="#pricing" className="text-slate-300 hover:text-white transition-colors">Pricing</a>
              <a href="#testimonials" className="text-slate-300 hover:text-white transition-colors">Testimonials</a>
              <a href="https://transcribe.casebuddy.live" target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-white transition-colors">Transcriber</a>
              <Link
                to="/app"
                className="bg-gold-500 hover:bg-gold-600 text-slate-900 font-semibold px-6 py-2 rounded-lg transition-colors"
              >
                Launch App
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-slate-300 hover:text-white"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 space-y-4 border-t border-slate-800">
              <a href="#features" className="block text-slate-300 hover:text-white transition-colors">Features</a>
              <a href="#pricing" className="block text-slate-300 hover:text-white transition-colors">Pricing</a>
              <a href="#testimonials" className="block text-slate-300 hover:text-white transition-colors">Testimonials</a>
              <a href="https://transcribe.casebuddy.live" target="_blank" rel="noopener noreferrer" className="block text-slate-300 hover:text-white transition-colors">Transcriber</a>
              <Link
                to="/app"
                className="block bg-gold-500 hover:bg-gold-600 text-slate-900 font-semibold px-6 py-2 rounded-lg transition-colors text-center"
              >
                Launch App
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-r from-gold-500/5 via-transparent to-gold-500/5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold-900/20 border border-gold-700/30 rounded-full text-gold-400 text-sm font-medium mb-8">
              <Zap size={16} />
              <span>AI-Powered Legal Trial Preparation Platform</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white font-serif mb-6 leading-tight">
              Your AI-Powered{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-gold-600">
                Trial Preparation
              </span>{' '}
              Partner
            </h1>

            <p className="text-lg sm:text-xl text-slate-300 mb-10 leading-relaxed max-w-3xl mx-auto">
              Practice with live voice AI, simulate jury deliberations, transcribe audio recordings, and get real-time coaching.
              CaseBuddy is the most advanced trial preparation platform for winning attorneys.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/app"
                className="inline-flex items-center justify-center gap-2 bg-gold-500 hover:bg-gold-600 text-slate-900 font-bold px-8 py-4 rounded-lg transition-all transform hover:scale-105 shadow-lg shadow-gold-500/20"
              >
                Start Free Trial
                <ArrowRight size={20} />
              </Link>
              <a
                href="https://transcribe.casebuddy.live"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold px-8 py-4 rounded-lg transition-colors"
              >
                <FileAudio size={20} />
                Try Transcriber
              </a>
            </div>

            <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="text-green-500" size={18} />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="text-green-500" size={18} />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="text-green-500" size={18} />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-slate-900/50 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-gold-500 mb-2">10,000+</div>
              <div className="text-sm text-slate-400">Practice Sessions</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-gold-500 mb-2">95%</div>
              <div className="text-sm text-slate-400">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-gold-500 mb-2">500+</div>
              <div className="text-sm text-slate-400">Law Firms</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-gold-500 mb-2">24/7</div>
              <div className="text-sm text-slate-400">AI Availability</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white font-serif mb-4">
              Features No Competitor Has
            </h2>
            <p className="text-lg text-slate-400">
              Industry-first AI capabilities designed specifically for trial attorneys
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div
                key={i}
                className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-gold-500/50 transition-all hover:transform hover:scale-105"
              >
                <div className="w-12 h-12 bg-gold-900/30 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="text-gold-500" size={24} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 sm:py-32 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white font-serif mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-slate-400">
              Choose the plan that fits your practice
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingTiers.map((tier, i) => (
              <div
                key={i}
                className={`rounded-xl p-8 ${
                  tier.highlight
                    ? 'bg-gradient-to-b from-gold-900/30 to-slate-800 border-2 border-gold-500 transform scale-105'
                    : 'bg-slate-800/50 border border-slate-700'
                }`}
              >
                {tier.highlight && (
                  <div className="inline-block px-3 py-1 bg-gold-500 text-slate-900 text-xs font-bold rounded-full mb-4">
                    MOST POPULAR
                  </div>
                )}
                <h3 className="text-2xl font-bold text-white mb-2">{tier.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-white">{tier.price}</span>
                  <span className="text-slate-400">{tier.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-2 text-slate-300">
                      <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={18} />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/app"
                  className={`block w-full text-center py-3 rounded-lg font-semibold transition-colors ${
                    tier.highlight
                      ? 'bg-gold-500 hover:bg-gold-600 text-slate-900'
                      : 'bg-slate-700 hover:bg-slate-600 text-white'
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white font-serif mb-4">
              Trusted by Leading Attorneys
            </h2>
            <p className="text-lg text-slate-400">
              See what trial lawyers are saying about CaseBuddy
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, i) => (
              <div
                key={i}
                className="bg-slate-800/50 border border-slate-700 rounded-xl p-6"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, j) => (
                    <Star key={j} className="text-gold-500 fill-gold-500" size={16} />
                  ))}
                </div>
                <p className="text-slate-300 mb-6 italic">"{testimonial.quote}"</p>
                <div>
                  <div className="font-semibold text-white">{testimonial.name}</div>
                  <div className="text-sm text-slate-400">{testimonial.role}</div>
                  <div className="text-xs text-slate-500">{testimonial.firm}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-32 bg-gradient-to-r from-gold-900/20 via-slate-900/50 to-gold-900/20 border-y border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white font-serif mb-6">
            Ready to Transform Your Trial Preparation?
          </h2>
          <p className="text-lg sm:text-xl text-slate-300 mb-10">
            Join hundreds of attorneys using AI to win more cases.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/app"
              className="inline-flex items-center justify-center gap-2 bg-gold-500 hover:bg-gold-600 text-slate-900 font-bold px-8 py-4 rounded-lg transition-all transform hover:scale-105"
            >
              Start Free Trial
              <ArrowRight size={20} />
            </Link>
            <a
              href="#pricing"
              className="inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold px-8 py-4 rounded-lg transition-colors"
            >
              View Pricing
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2 text-gold-500">
              <Gavel size={28} />
              <span className="text-xl font-serif font-bold text-white">CaseBuddy</span>
            </div>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-8 text-sm text-slate-400">
              <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="/tos" className="hover:text-white transition-colors">Terms of Service</Link>
              <a href="https://transcribe.casebuddy.live" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Transcriber</a>
              <a href="mailto:support@casebuddy.live" className="hover:text-white transition-colors">Support</a>
            </div>
            <div className="text-sm text-slate-500">
              © 2025 CaseBuddy. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
