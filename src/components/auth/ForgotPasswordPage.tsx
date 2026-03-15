import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Loader2, ArrowLeft } from 'lucide-react';
import AuthLayout from './AuthLayout';
import { useAuth } from '../../contexts/AuthContext';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const { resetPassword, loading, error, clearError } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();
    
    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to send reset email');
    }
  };

  const displayError = localError || error;

  if (success) {
    return (
      <AuthLayout title="Check Your Email" subtitle="Password reset link sent">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
            <Mail className="text-green-400" size={32} />
          </div>
          <p className="text-slate-300">
            We've sent a password reset link to <span className="text-white font-medium">{email}</span>
          </p>
          <p className="text-slate-400 text-sm">
            Click the link in the email to reset your password. The link will expire in 24 hours.
          </p>
          <p className="text-slate-500 text-xs mt-4">
            Didn't receive the email? Check your spam folder or{' '}
            <button
              onClick={() => setSuccess(false)}
              className="text-gold-500 hover:text-gold-400 transition-colors"
            >
              try again
            </button>
          </p>
          <Link
            to="/auth/login"
            className="block w-full bg-gold-500 hover:bg-gold-600 text-slate-900 font-semibold py-2.5 rounded-lg transition-colors mt-6"
          >
            Back to Sign In
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Forgot Password" subtitle="Enter your email to reset your password">
      <form onSubmit={handleSubmit} className="space-y-5">
        {displayError && (
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-3 text-red-400 text-sm">
            {displayError}
          </div>
        )}
        
        <p className="text-slate-400 text-sm">
          Enter the email address associated with your account and we'll send you a link to reset your password.
        </p>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-all"
              placeholder="attorney@lawfirm.com"
              required
              disabled={loading}
            />
          </div>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gold-500 hover:bg-gold-600 disabled:bg-gold-500/50 disabled:cursor-not-allowed text-slate-900 font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Sending...
            </>
          ) : (
            'Send Reset Link'
          )}
        </button>
        
        <Link
          to="/auth/login"
          className="flex items-center justify-center gap-2 text-slate-400 hover:text-white transition-colors text-sm mt-4"
        >
          <ArrowLeft size={16} />
          Back to Sign In
        </Link>
      </form>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
