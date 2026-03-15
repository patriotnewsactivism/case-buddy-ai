import React from 'react';
import { Link } from 'react-router-dom';
import { Gavel } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-gold-500 hover:opacity-80 transition-opacity mb-6">
            <Gavel size={40} />
            <span className="text-3xl font-serif font-bold text-white">CaseBuddy</span>
          </Link>
        </div>
        
        <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-xl p-8">
          <h1 className="text-2xl font-bold text-white font-serif text-center mb-2">{title}</h1>
          {subtitle && (
            <p className="text-slate-400 text-center mb-6 text-sm">{subtitle}</p>
          )}
          {children}
        </div>
        
        <p className="text-center text-slate-500 text-xs mt-6">
          © 2025 CaseBuddy. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default AuthLayout;
