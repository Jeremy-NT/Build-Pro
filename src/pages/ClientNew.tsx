import React, { useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { ArrowLeft, User, Phone, Mail, Save, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';

const clientFormSchema = z.object({
  full_name: z.string().min(2, { message: 'Full name is required' }),
  email: z.string().email({ message: 'Please enter a valid email address' }).or(z.literal('')),
  phone: z.string().optional(),
  client_type: z.enum(['buyer', 'renter', 'seller', 'investor']),
  status: z.enum(['lead', 'active', 'closed', 'inactive']),
  notes: z.string().optional(),
  source: z.string().optional(), // Select from inquiry, referral, social, website, direct, etc.
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

export const ClientNew: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  // Retrieve query params for pre-filling if coming from Inquiries
  const queryName = searchParams.get('name') || '';
  const queryEmail = searchParams.get('email') || '';
  const queryPhone = searchParams.get('phone') || '';
  const querySource = searchParams.get('source') || '';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      full_name: queryName,
      email: queryEmail,
      phone: queryPhone,
      client_type: 'buyer',
      status: 'lead',
      notes: '',
      source: querySource || 'inquiry',
    },
  });

  // Pre-fill fields if searchParams change
  useEffect(() => {
    if (queryName) setValue('full_name', queryName);
    if (queryEmail) setValue('email', queryEmail);
    if (queryPhone) setValue('phone', queryPhone);
    if (querySource) setValue('source', querySource);
  }, [queryName, queryEmail, queryPhone, querySource, setValue]);

  // Insert mutation
  const createMutation = useMutation({
    mutationFn: async (values: ClientFormValues) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) throw new Error('Unauthenticated account context');

      const { data, error } = await supabase.from('clients').insert({
        agent_id: userId,
        full_name: values.full_name,
        email: values.email || null,
        phone: values.phone || null,
        client_type: values.client_type,
        status: values.status,
        notes: values.notes || null,
        source: values.source || null,
      }).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success('Successfully added client profile to database.');
      queryClient.invalidateQueries({ queryKey: ['agentClients'] });
      // Go to client details page
      if (data && data.id) {
        navigate(`/dashboard/clients/${data.id}`);
      } else {
        navigate('/dashboard/clients');
      }
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error occurred while inserting CRM client record.');
    },
  });

  const onSubmit = (values: ClientFormValues) => {
    createMutation.mutate(values);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/dashboard/clients"
          className="p-2 border border-slate-200 bg-white rounded-xl text-slate-600 hover:text-slate-900 shadow-sm transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight font-sans">
            Add New CRM Client
          </h2>
          <p className="text-xs text-slate-550 mt-1 font-sans">
            Define basic preferences and source contexts to add this client to active CRM pipelines.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5 text-xs">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Full name */}
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-700 mb-1 uppercase tracking-wide">Full Name</label>
              <input
                type="text"
                placeholder="Arthur Pendragon"
                {...register('full_name')}
                className={`w-full font-sans px-3 py-2.5 border rounded-xl bg-slate-50/50 focus:outline-none focus:ring-2 focus:bg-white ${
                  errors.full_name ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-500'
                }`}
              />
              {errors.full_name && <p className="text-[10px] text-red-600 mt-1">{errors.full_name.message}</p>}
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-[10px] font-bold text-slate-700 mb-1 uppercase tracking-wide">Email Address (Optional)</label>
              <input
                type="text"
                placeholder="arthur@example.com"
                {...register('email')}
                className={`w-full font-sans px-3 py-2.5 border rounded-xl bg-slate-50/50 focus:outline-none focus:ring-2 focus:bg-white ${
                  errors.email ? 'border-red-300 focus:ring-red-550' : 'border-slate-200 focus:ring-blue-500'
                }`}
              />
              {errors.email && <p className="text-[10px] text-red-600 mt-1">{errors.email.message}</p>}
            </div>

            {/* Mobile Contact */}
            <div>
              <label className="block text-[10px] font-bold text-slate-700 mb-1 uppercase tracking-wide">Mobile / Phone Contact</label>
              <input
                type="text"
                placeholder="+233 24 000 0000"
                {...register('phone')}
                className="w-full font-sans px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            {/* Client type */}
            <div>
              <label className="block text-[10px] font-bold text-slate-700 mb-1 uppercase tracking-wide">Client Profile Category</label>
              <select
                {...register('client_type')}
                className="w-full font-sans px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="buyer">Buyer</option>
                <option value="renter">Renter</option>
                <option value="seller">Seller</option>
                <option value="investor">Investor</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-[10px] font-bold text-slate-700 mb-1 uppercase tracking-wide">CRM Pipeline Status</label>
              <select
                {...register('status')}
                className="w-full font-sans px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="lead">Lead</option>
                <option value="active">Active Relationship</option>
                <option value="closed">Closed Deal</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Lead Source */}
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-700 mb-1 uppercase tracking-wide">Lead Source Designation</label>
              <select
                {...register('source')}
                className="w-full font-sans px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="inquiry">Property Lead Inquiry</option>
                <option value="referral">Customer Referral</option>
                <option value="social">Social Media Platforms</option>
                <option value="website">Direct Website visit</option>
                <option value="direct">Direct Outreach / Email</option>
              </select>
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-700 mb-1 uppercase tracking-wide">Initial Preference Notes</label>
              <textarea
                rows={4}
                placeholder="Describe spatial bounds, preferred city suburbs, financial budgets, or family room count criteria discussed in introductory phases..."
                {...register('notes')}
                className="w-full font-sans px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

          </div>

        </div>

        {/* Action Controls */}
        <div className="flex justify-end gap-3 items-center">
          <Link
            to="/dashboard/clients"
            className="px-4 py-2.5 border border-slate-200 bg-white rounded-xl text-slate-700 text-xs font-bold hover:bg-slate-50 transition"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={createMutation.isPending}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-blue-500/15 cursor-pointer uppercase tracking-wider"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Publishing client...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Client</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
