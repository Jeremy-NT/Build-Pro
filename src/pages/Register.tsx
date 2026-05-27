import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { Building2, User, KeyRound, ArrowRight } from 'lucide-react';

const registerSchema = z.object({
  fullName: z.string().min(2, { message: 'Full name must be at least 2 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  role: z.enum(['agent', 'client'], { message: 'Please select a role' }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      role: 'client',
    }
  });

  const selectedRole = watch('role');

  const onSubmit = async (values: RegisterFormValues) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: {
            full_name: values.fullName,
            role: values.role,
          },
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Registration successful! Setting up profile...');
      
      // Let AuthContext handle auth state change and role loading
      if (values.role === 'agent') {
        navigate('/dashboard');
      } else {
        navigate('/portal');
      }
    } catch (err: any) {
      toast.error(err.message || 'An unexpected error occurred during signup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="flex items-center gap-2 bg-blue-600 text-white p-3 rounded-xl shadow-lg shadow-blue-500/20">
            <Building2 className="w-8 h-8" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-slate-900 font-sans">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Or{' '}
          <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-500">
            sign in to your existing account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl border border-slate-100 rounded-2xl sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-slate-700">
                Full Name
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="h-5 h-5" />
                </div>
                <input
                  id="fullName"
                  type="text"
                  placeholder="Quartson"
                  {...register('fullName')}
                  className={`block w-full pl-10 pr-3 py-2 border rounded-xl font-sans text-sm focus:outline-none focus:ring-2 ${
                    errors.fullName
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                />
              </div>
              {errors.fullName && (
                <p className="mt-1.5 text-xs text-red-600">{errors.fullName.message}</p>
              )}
            </div>

            {/* Email Address */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Email Address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <span className="text-sm font-medium">@</span>
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  {...register('email')}
                  className={`block w-full pl-10 pr-3 py-2 border rounded-xl font-sans text-sm focus:outline-none focus:ring-2 ${
                    errors.email
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="h-5 h-5" />
                </div>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register('password')}
                  className={`block w-full pl-10 pr-3 py-2 border rounded-xl font-sans text-sm focus:outline-none focus:ring-2 ${
                    errors.password
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                />
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Role selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                I want to register as an:
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className={`relative flex flex-col p-4 border rounded-2xl cursor-pointer transition focus-within:ring-2 focus-within:ring-blue-500 ${
                  selectedRole === 'client' 
                    ? 'border-blue-600 bg-blue-50/20 ring-2 ring-blue-500/10' 
                    : 'border-slate-200 hover:bg-slate-50'
                }`}>
                  <input
                    type="radio"
                    value="client"
                    {...register('role')}
                    className="sr-only"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900 block">Portal Client</span>
                    <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      selectedRole === 'client' ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
                    }`}>
                      {selectedRole === 'client' && <span className="w-1.5 h-1.5 bg-white rounded-full"></span>}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1.5 leading-snug">Browse properties and monitor inquiries</span>
                </label>
                <label className={`relative flex flex-col p-4 border rounded-2xl cursor-pointer transition focus-within:ring-2 focus-within:ring-blue-500 ${
                  selectedRole === 'agent' 
                    ? 'border-blue-600 bg-blue-50/20 ring-2 ring-blue-500/10' 
                    : 'border-slate-200 hover:bg-slate-50'
                }`}>
                  <input
                    type="radio"
                    value="agent"
                    {...register('role')}
                    className="sr-only"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900 block">Real Estate Agent</span>
                    <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                      selectedRole === 'agent' ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
                    }`}>
                      {selectedRole === 'agent' && <span className="w-1.5 h-1.5 bg-white rounded-full"></span>}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1.5 leading-snug">Manage listings, inquiries, and CRM leads</span>
                </label>
              </div>
              {errors.role && (
                <p className="mt-1.5 text-xs text-red-600">{errors.role.message}</p>
              )}
            </div>

            {/* Submit */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 px-4 py-2.5 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition cursor-pointer"
              >
                {loading ? 'Creating account...' : 'Create Account'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
