import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Loader2, Eye, EyeOff, Check } from 'lucide-react';
import AuthLayout from './AuthLayout';
import { useAuth } from '../../contexts/AuthContext';

const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const { updatePassword, loading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const getPasswordStrength = (pwd: string): { score: number; label: string; color: string } => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    
    if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500' };
    if (score <= 2) return { score, label: 'Fair', color: 'bg-orange-500' };
    if (score <= 3) return { score, label: 'Good', color: 'bg-yellow-500' };
    if (score <= 4) return { score, label: 'Strong', color: 'bg-green-500' };
    return { score, label: 'Very Strong', color: 'bg-green-400' };
  };

  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();
    
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }
    
    try {
      await updatePassword(password);
      setSuccess(true);
      setTimeout(() => {
        navigate('/auth/login');
      }, 2000);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to reset password');
    }
  };

  const displayError = localError || error;

  if (success) {
    return (
      <AuthLayout title="Password Reset" subtitle="Your password has been updated">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
            <Check className="text-green-400" size={32} />
          </div>
          <p className="text-slate-300">
            Your password has been successfully reset.
          </p>
          <p className="text-slate-400 text-sm">
            Redirecting you to sign in...
          </p>
          <Link
            to="/auth/login"
            className="block w-full bg-gold-500 hover:bg-gold-600 text-slate-900 font-semibold py-2.5 rounded-lg transition-colors mt-6"
          >
            Sign In Now
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Reset Password" subtitle="Create a new password for your account">
      <form onSubmit={handleSubmit} className="space-y-5">
        {displayError && (
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-3 text-red-400 text-sm">
            {displayError}
          </div>
        )}
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1.5">
            New Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg pl-10 pr-10 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-all"
              placeholder="Create a strong password"
              required
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {password && (
            <div className="mt-2">
              <div className="flex gap-1 mb-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-all ${
                      i <= passwordStrength.score ? passwordStrength.color : 'bg-slate-700'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-slate-400">Password strength: {passwordStrength.label}</p>
            </div>
          )}
        </div>
        
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-1.5">
            Confirm New Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg pl-10 pr-10 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-all"
              placeholder="Confirm your new password"
              required
              disabled={loading}
            />
            {confirmPassword && password === confirmPassword && (
              <Check className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400" size={18} />
            )}
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
              Resetting...
            </>
          ) : (
            'Reset Password'
          )}
        </button>
        
        <Link
          to="/auth/login"
          className="block text-center text-slate-400 hover:text-white transition-colors text-sm mt-4"
        >
          Back to Sign In
        </Link>
      </form>
    </AuthLayout>
  );
};

export default ResetPasswordPage;
