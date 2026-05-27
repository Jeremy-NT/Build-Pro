import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { KeyRound, CheckCircle2 } from 'lucide-react';

export const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success('Your account password has been successfully reset!');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.message || 'Failure writing new password credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex flex-col justify-center py-12 bg-slate-50 px-4">
      <div className="max-w-md w-full mx-auto p-8 bg-white border border-slate-100 rounded-2xl shadow-xl">
        <div className="flex items-center gap-2 bg-blue-50 text-blue-600 p-2.5 rounded-xl w-10 h-10 mb-6">
          <KeyRound className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2 font-sans">Set New Password</h2>
        <p className="text-slate-500 text-xs mb-6">Enter a new secure password code below to renew access credentials.</p>
        
        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">New Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-sans focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow shadow-blue-500/10 cursor-pointer text-center"
          >
            {loading ? 'Updating Credentials...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};
