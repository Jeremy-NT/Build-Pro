import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { 
  Building2, MapPin, BedDouble, Bath, Maximize, 
  Mail, MessageSquare, Send, CheckCircle2, ArrowLeft,
  ChevronLeft, ChevronRight, Phone, User, Home as HomeIcon
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { formatPriceCompact } from '../shared/utils/format';

const inquirySchema = z.object({
  senderName: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  senderEmail: z.string().email({ message: 'Please enter a valid email address' }),
  senderPhone: z.string().optional(),
  message: z.string().min(10, { message: 'Message must detail at least 10 characters' }),
});

type InquiryFormValues = z.infer<typeof inquirySchema>;

export const PropertyDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { session, profile: authProfile } = useAuth();
  
  // Image Carousel active index state
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  // Form setup
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<InquiryFormValues>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      senderName: '',
      senderEmail: '',
      senderPhone: '',
      message: 'I would like to request more information about this property and schedule a convenient viewing.',
    },
  });

  // Prepopulate form if logged in
  useEffect(() => {
    if (session && authProfile) {
      setValue('senderName', authProfile.full_name || '');
      // Try profile email, or fallback to user email
      setValue('senderEmail', session.user.email || '');
      setValue('senderPhone', authProfile.phone || '');
    }
  }, [session, authProfile, setValue]);

  // Fetch Property & Joined Agent profile details using React Query
  const { data: queryData, isLoading, isError } = useQuery({
    queryKey: ['propertyDetail', id],
    queryFn: async () => {
      if (!id) throw new Error('No property ID provided');

      // Fetch property itself
      const { data: propertyData, error: propertyError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();

      if (propertyError) throw propertyError;
      if (!propertyData) throw new Error('Property not found');

      // Fetch agent profile separately to guarantee zero relations/naming mismatches
      const { data: agentData, error: agentError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', propertyData.agent_id)
        .single();

      if (agentError) {
        console.warn('Agent profile query fallback or warning:', agentError.message);
      }

      return {
        property: propertyData,
        agent: agentData || {
          full_name: 'BuildProConnect Broker',
          phone: '+233 24 123 4567',
          avatar_url: null,
          role: 'agent'
        },
      };
    },
    enabled: !!id,
  });

  // Inquiry submission mutation
  const inquiryMutation = useMutation({
    mutationFn: async (values: InquiryFormValues) => {
      if (!queryData?.property) throw new Error('No property loaded');

      const { error } = await supabase.from('inquiries').insert({
        property_id: queryData.property.id,
        sender_name: values.senderName,
        sender_email: values.senderEmail,
        sender_phone: values.senderPhone || null,
        message: values.message,
        client_profile_id: session?.user?.id || null,
        status: 'new',
      });

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('Inquiry submitted successfully! An agent will respond shortly.');
      reset({
        senderName: authProfile?.full_name || '',
        senderEmail: session?.user?.email || '',
        senderPhone: authProfile?.phone || '',
        message: 'I would like to request more information about this property and schedule a convenient viewing.',
      });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : 'Error transmitting inquiry records.');
    }
  });

  const onSubmit = (values: InquiryFormValues) => {
    inquiryMutation.mutate(values);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 bg-slate-50 min-h-[90vh]">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-550 text-xs font-sans">Connecting property parameters...</p>
      </div>
    );
  }

  if (isError || !queryData || !queryData.property) {
    return (
      <div className="text-center py-24 min-h-[90vh] bg-slate-50">
        <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-900">Listing details unavailable</h3>
        <p className="text-slate-500 text-xs mt-1">This property listing might have been removed or archived.</p>
        <Link to="/properties" className="mt-6 inline-block bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-xl">
          Return to directory
        </Link>
      </div>
    );
  }

  const { property, agent } = queryData;
  const imageList = property.image_urls || [];
  const hasImages = imageList.length > 0;

  // Price formatting helper
  const formattedPrice = formatPriceCompact(property.price);

  // Slider buttons helper
  const nextImage = () => {
    if (!hasImages) return;
    setActiveImageIdx((prev) => (prev + 1) % imageList.length);
  };

  const prevImage = () => {
    if (!hasImages) return;
    setActiveImageIdx((prev) => (prev - 1 + imageList.length) % imageList.length);
  };

  const isLandOrComm = property.property_type === 'land' || property.property_type === 'commercial';

  return (
    <div className="bg-slate-50 min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <Link
          to="/properties"
          className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 text-xs font-extrabold mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Directory
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Info Columns (left 2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Image Slider Component */}
            <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm relative">
              <div className="h-[320px] md:h-[420px] bg-slate-200 relative group">
                {hasImages ? (
                  <>
                    <img
                      src={imageList[activeImageIdx]}
                      alt={`${property.title} - view`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition duration-300"
                    />

                    {/* Left/Right Controls */}
                    {imageList.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900/70 border border-slate-800 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900/70 border border-slate-800 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>

                        {/* Slider indicator */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-950/80 backdrop-blur px-2.5 py-1 text-[10px] text-white font-mono rounded-full font-bold">
                          {activeImageIdx + 1} of {imageList.length}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  /* SVG Fallback Placeholder when empty */
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 gap-2">
                    <HomeIcon className="w-16 h-16 text-slate-300" />
                    <span className="font-mono text-xs text-slate-400">Placeholder - No media provided</span>
                  </div>
                )}

                {/* Listing Status Tag */}
                <span className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur-md text-white px-3 py-1 text-[10px] font-mono font-bold tracking-wider rounded-md uppercase">
                  {property.property_type}
                </span>

                <span className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 text-xs font-bold rounded-lg shadow">
                  {property.listing_type === 'sale' ? 'FOR SALE' : 'FOR RENT'}
                </span>
              </div>

              {/* Slider thumbnails (if multiple images exist) */}
              {hasImages && imageList.length > 1 && (
                <div className="flex gap-2 p-4 overflow-x-auto border-t border-slate-100 bg-slate-50/50">
                  {imageList.map((url: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => setActiveImageIdx(index)}
                      className={`w-16 h-12 rounded-lg overflow-hidden border-2 shrink-0 transition ${
                        activeImageIdx === index ? 'border-blue-600 scale-95' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt="thumbnail" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Property Details Header & Body */}
              <div className="p-6 md:p-8">
                <h1 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight font-sans">
                  {property.title}
                </h1>

                <div className="flex items-center gap-1 text-slate-400 text-xs md:text-sm mt-3 font-sans">
                  <MapPin className="w-4 h-4 text-slate-550 shrink-0" />
                  <span className="truncate">
                    {property.location_address ? `${property.location_address}, ` : ''}
                    {property.location_area}, {property.location_city}
                  </span>
                </div>

                {/* Beds, Baths, Size Specifications Indicators */}
                {!isLandOrComm && (
                  <div className="border-t border-b border-slate-100 py-5 my-6 grid grid-cols-3 gap-4 text-center">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <BedDouble className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                      <span className="block font-mono text-sm md:text-base font-extrabold text-slate-900">
                        {property.bedrooms ?? 0}
                      </span>
                      <span className="text-slate-500 font-sans text-[10px] uppercase font-bold tracking-wider">Bedrooms</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <Bath className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                      <span className="block font-mono text-sm md:text-base font-extrabold text-slate-900">
                        {property.bathrooms ?? 0}
                      </span>
                      <span className="text-slate-500 font-sans text-[10px] uppercase font-bold tracking-wider">Bathrooms</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <Maximize className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                      <span className="block font-mono text-sm md:text-base font-extrabold text-slate-900">
                        {property.area_sqm ?? 0}
                      </span>
                      <span className="text-slate-500 font-sans text-[10px] uppercase font-bold tracking-wider">Sq Metres</span>
                    </div>
                  </div>
                )}

                <div className="mt-6">
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider font-mono mb-2.5">Listing Description</h3>
                  <p className="text-slate-600 text-xs md:text-sm leading-relaxed font-sans whitespace-pre-wrap whitespace-normal">
                    {property.description || 'No descriptive information has been outlined by the agent broker yet.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Interactive Amenities Specifications List */}
            {property.amenities && property.amenities.length > 0 && (
              <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider font-mono mb-4">Interactive Amenities</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {property.amenities.map((amenity: string, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Panel: Listing Pricing, Real Agent info & Contact Inquiry Form */}
          <div className="space-y-6">
            
            {/* Visual Pricing Banner */}
            <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg border border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400 font-mono tracking-wider">Listing Valuation</span>
              <h2 className="text-2xl md:text-3xl font-black mt-1">
                {property.listing_type === 'sale' ? formattedPrice : `${formattedPrice}/mo`}
              </h2>
              <span className="block text-[9px] text-slate-500 font-sans mt-3">
                * Prices are listed excluding any statutory tax transfers or broker commission structures.
              </span>
            </div>

            {/* Real Agent Contact Details Panel */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider font-mono mb-4">Assigned Agent Information</h3>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-blue-600 border border-blue-400 font-mono font-bold text-white flex items-center justify-center uppercase shrink-0">
                  {agent?.full_name?.charAt(0) || <User className="w-5 h-5" />}
                </div>
                <div className="text-left font-sans">
                  <p className="text-xs font-black text-slate-900 leading-tight">{agent?.full_name || 'System Representative'}</p>
                  <p className="text-[10px] text-blue-500 uppercase tracking-widest font-bold font-mono mt-0.5 capitalize">{agent?.role || 'Agent'}</p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 mt-4 space-y-2 text-slate-650 text-xs font-semibold">
                {agent?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>{agent.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="truncate">{agent?.email || property.agent_email || 'contact@buildproconnect.com'}</span>
                </div>
              </div>
            </div>

            {/* Inquiry Form */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-sm font-black text-slate-900 font-sans">Submit Listing Inquiry</h3>
              <p className="text-slate-500 text-[11px] font-sans mt-1 mb-4 leading-normal">
                Interested in viewing this layout? Send an inquiry directly. Queries will compile inside CRM records.
              </p>

              <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase tracking-wide">Your Name</label>
                  <input
                    type="text"
                    placeholder="Jane Doe"
                    {...register('senderName')}
                    className={`block w-full px-3 py-2 border rounded-xl font-sans text-xs focus:outline-none focus:ring-2 ${
                      errors.senderName ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-500'
                    }`}
                  />
                  {errors.senderName && <p className="text-[10px] text-red-600 mt-1">{errors.senderName.message}</p>}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase tracking-wide">Your Email</label>
                  <input
                    type="email"
                    placeholder="jane@example.com"
                    {...register('senderEmail')}
                    className={`block w-full px-3 py-2 border rounded-xl font-sans text-xs focus:outline-none focus:ring-2 ${
                      errors.senderEmail ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-500'
                    }`}
                  />
                  {errors.senderEmail && <p className="text-[10px] text-red-600 mt-1">{errors.senderEmail.message}</p>}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase tracking-wide">Mobile Phone (Optional)</label>
                  <input
                    type="text"
                    placeholder="+233 24 123 4567"
                    {...register('senderPhone')}
                    className="block w-full px-3 py-2 border border-slate-200 rounded-xl font-sans text-xs focus:outline-none focus:ring-2 focus:ring-blue-550"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase tracking-wide">Query Message</label>
                  <textarea
                    rows={4}
                    {...register('message')}
                    className={`block w-full px-3 py-2 border rounded-xl font-sans text-xs focus:outline-none focus:ring-2 ${
                      errors.message ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-500'
                    }`}
                  ></textarea>
                  {errors.message && <p className="text-[10px] text-red-600 mt-1">{errors.message.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={inquiryMutation.isPending}
                  className="w-full flex justify-center items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow shadow-blue-500/10"
                >
                  {inquiryMutation.isPending ? 'Transmitting...' : 'Send Inquiry Message'}
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
