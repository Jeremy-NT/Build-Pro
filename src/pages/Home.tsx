import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { PropertyCard, Property } from '../components/PropertyCard';
import { 
  Search, 
  Building2, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  Calendar, 
  ChevronDown, 
  TrendingUp, 
  HelpCircle,
  Star,
  Quote
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const Home: React.FC = () => {
  const { session, profile, loading } = useAuth(); // ← loading added
  const [location, setLocation] = useState('');
  const [propertyType, setPropertyType] = useState('all');
  const [listingType, setListingType] = useState('all');
  const [maxPrice, setMaxPrice] = useState('');

  const [activeSimTab, setActiveSimTab] = useState<'agent' | 'client'>('agent');
  const [simulatedInquiryStatus, setSimulatedInquiryStatus] = useState<'new' | 'read' | 'responded'>('new');
  
  const [faqOpen, setFaqOpen] = useState<Record<number, boolean>>({
    0: true,
  });

  const toggleFaq = (index: number) => {
    setFaqOpen(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (location) params.append('location', location);
    if (propertyType !== 'all') params.append('type', propertyType);
    if (listingType !== 'all') params.append('listing_type', listingType);
    if (maxPrice) params.append('max_price', maxPrice);
    window.location.href = `/properties?${params.toString()}`;
  };

  const { data: properties, isLoading } = useQuery<Property[]>({
    queryKey: ['featured-properties'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('status', 'available')
        .limit(3);
      if (error) throw error;
      return data || [];
    },
  });

  const simulatorFeatures = {
    agent: [
      { title: 'Inquiry Inbox', desc: 'Instantly receive inquiries in your dashboard styled with real-time status badges.' },
      { title: 'Dynamic Conversion', desc: 'Convert warm inquiries directly into client records with 1-click pre-fills.' },
      { title: 'Reminders & Logs', desc: 'Set smart notifications with overdue red alerts and timeline logs.' }
    ],
    client: [
      { title: 'Secure Client Portal', desc: 'Authentication-backed page keeping inquiries and replies strictly aligned.' },
      { title: 'Inquiry Tracking', desc: 'Track your pending inquiry responses with real-time progress status.' },
      { title: 'Agent Live Responses', desc: 'Instantly view conversations with assigned brokers dynamically.' }
    ]
  };

  return (
    <div className="bg-slate-50 min-h-screen font-sans">
      
      {/* 1. Hero Presentational Area */}
      <div className="relative overflow-hidden bg-slate-900 text-white pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#3b82f6_1.5px,transparent_1.5px)] [background-size:24px_24px]"></div>
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500 rounded-full filter blur-[120px] opacity-20"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500 rounded-full filter blur-[120px] opacity-15"></div>
        
        <div className="max-w-6xl mx-auto text-center relative z-10 mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 text-[11px] font-semibold bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20 font-mono tracking-wider uppercase mb-6">
            <Sparkles className="w-3.5 h-3.5 animate-pulse text-blue-400" />
            <span>Hybrid CRM & Property Matchmaker</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-none text-white">
            Streamline Property Leads. <br />
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Close Deals Faster.</span>
          </h1>
          
          <p className="mt-6 text-sm sm:text-base md:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Unify high-intent public house hunting with high-velocity agent workspace tools. 
            Publish luxury listings, register active CRM profiles, and track client inquiries securely.
          </p>

          <div className="mt-8 flex flex-wrap gap-4 justify-center items-center">
            {/* <Link
              to="/properties"
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition border border-slate-700 uppercase tracking-widest"
            >
              Explore Listings
            </Link> */}

            {/* 
              Guard auth-dependent CTA buttons behind loading.
              - loading: show neutral placeholder buttons
              - loaded + no session: show Sign In + Create Account
              - loaded + session: show Go to Console
            */}
            {loading ? (
              // Neutral skeleton placeholders — same size as real buttons to prevent layout shift
              <>
                <div className="px-6 py-3 w-24 h-9 bg-slate-700/50 rounded-xl animate-pulse" />
                <div className="px-6 py-3 w-32 h-9 bg-slate-700/30 rounded-xl animate-pulse" />
              </>
            ) : !session ? (
              <>
                <Link
                  to="/login"
                  id="hero-login-btn"
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl transition shadow-lg shadow-blue-500/20 uppercase tracking-widest inline-flex items-center gap-1.5"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  id="hero-register-btn"
                  className="px-6 py-3 bg-slate-900 border border-slate-700 text-slate-200 hover:bg-slate-800 text-xs font-bold rounded-xl transition uppercase tracking-widest"
                >
                 Get Started
                </Link>
              </>
            ) : (
              <Link
                to={profile?.role === 'client' ? '/portal' : '/dashboard'}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-blue-500/25 uppercase tracking-widest inline-flex items-center gap-1.5"
              >
                <span>Go to Console</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>

        {/* Hero Compact Search Overlay */}
        {/*<div className="max-w-4xl mx-auto relative z-20 bg-white rounded-2xl md:rounded-full shadow-2xl p-4 md:py-3.5 md:px-6 border border-slate-100 text-slate-800">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
            <div className="relative">
              <label className="block md:hidden text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider ml-1">Location / Area</label>
              <div className="absolute left-3 top-2.5 text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, Area or City Center"
                className="w-full text-xs font-sans pl-9 pr-3 py-2.5 focus:outline-none border-b md:border-b-0 md:border-r border-slate-200 placeholder-slate-400"
              />
            </div>

            <div>
              <label className="block md:hidden text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Property Type</label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="w-full text-xs font-sans bg-transparent py-2.5 px-2 focus:outline-none border-b md:border-b-0 md:border-r border-slate-200 font-semibold text-slate-700 cursor-pointer"
              >
                <option value="all">Any Property Type</option>
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="land">Land</option>
                <option value="commercial">Commercial</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block md:hidden text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Plan</label>
                <select
                  value={listingType}
                  onChange={(e) => setListingType(e.target.value)}
                  className="w-full text-xs font-sans bg-transparent py-2.5 focus:outline-none border-b md:border-b-0 md:border-r border-slate-200 font-semibold text-slate-700 cursor-pointer"
                >
                  <option value="all">Rent / Sale</option>
                  <option value="sale">For Sale</option>
                  <option value="rent">For Rent</option>
                </select>
              </div>
              <div>
                <label className="block md:hidden text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Max Price</label>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="Max GH₵"
                  className="w-full text-xs font-sans py-2.5 focus:outline-none placeholder-slate-400 bg-transparent text-slate-800"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl md:rounded-full py-3 px-6 text-xs font-extrabold transition flex items-center justify-center gap-1.5 shadow shadow-blue-500/25 cursor-pointer uppercase tracking-wider"
              >
                <Search className="w-3.5 h-3.5" />
                Find Properties
              </button>
            </div>
          </form>
        </div>*/}
      </div>

      {/* 2. Platform Value Quick Stats Bar */}
      <div className="relative -mt-8 z-30 max-w-5xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 sm:px-10 grid grid-cols-2 lg:grid-cols-4 gap-6 text-center divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
          <div className="pt-4 lg:pt-0">
            <span className="block text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-sans">150+</span>
            <span className="text-[10px] sm:text-xs text-slate-400 font-mono tracking-widest uppercase font-semibold">Listed Properties</span>
          </div>
          <div className="pt-4 lg:pt-0">
            <span className="block text-2xl sm:text-3xl font-black text-blue-600 tracking-tight font-sans">99.8%</span>
            <span className="text-[10px] sm:text-xs text-slate-400 font-mono tracking-widest uppercase font-semibold">CRM Delivery Rate</span>
          </div>
          <div className="pt-4 lg:pt-0">
            <span className="block text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-sans">GH₵4.5M+</span>
            <span className="text-[10px] sm:text-xs text-slate-400 font-mono tracking-widest uppercase font-semibold">Total Volume</span>
          </div>
          <div className="pt-4 lg:pt-0">
            <span className="block text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight font-sans">Under 1h</span>
            <span className="text-[10px] sm:text-xs text-slate-400 font-mono tracking-widest uppercase font-semibold">Response Window</span>
          </div>
        </div>
      </div>

      {/* 3. Dynamic Journeys & Interactive Workflow Sandbox */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <span className="text-[10px] font-extrabold text-blue-600 font-mono uppercase tracking-widest mb-2.5 inline-block">
            Choose Your Interface
          </span>
          <h2 className="text-2xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-none">
            Interactive Experience Simulator
          </h2>
          <p className="text-xs md:text-sm text-slate-500 max-w-lg mx-auto mt-3">
            BuildProConnect is a dual-sided engine. Toggle below to simulate how agents and clients engage back and forth.
          </p>
        </div>

        <div className="flex justify-center mb-10 max-w-md mx-auto bg-slate-200/60 p-1 rounded-xl">
          <button
            onClick={() => setActiveSimTab('agent')}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
              activeSimTab === 'agent' 
                ? 'bg-slate-900 text-white shadow-md' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Agent Workspace & CRM
          </button>
          <button
            onClick={() => setActiveSimTab('client')}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
              activeSimTab === 'client' 
                ? 'bg-slate-900 text-white shadow-md' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Client Portal Hub
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white rounded-3xl p-6 sm:p-10 border border-slate-100 shadow-sm">
          
          <div className="lg:col-span-5 space-y-6">
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {activeSimTab === 'agent' 
                ? 'Empowering Brokers with Data Integrity' 
                : 'Pristine transparency for buyers & renters'}
            </h3>
            
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              {activeSimTab === 'agent'
                ? 'Ditch messy sticky notes. Maintain an audit-ready timeline of all client interactions. Track property-attached inquiries, manage client conversion status, and receive alerts if alerts run overdue.'
                : 'A dedicated, personalized, password-secured repository for prospective buyers. Clients can monitor pending questions, view previous replies, and communicate on properties without inbox clutter.'}
            </p>

            <div className="space-y-3 pt-2">
              {simulatorFeatures[activeSimTab].map((f, i) => (
                <div key={i} className="flex gap-2.5 items-start">
                  <div className="mt-0.5 whitespace-nowrap bg-blue-50 text-blue-600 p-1 rounded-md">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{f.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <Link
                to={activeSimTab === 'agent' ? '/register' : '/login'}
                className="inline-flex items-center gap-1.5 text-xs font-bold bg-slate-900 text-white px-4 py-2.5 rounded-xl hover:bg-slate-800 transition text-semibold"
              >
                <span>{activeSimTab === 'agent' ? 'Unlock Agent Dashboard' : 'Access Member Portal'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-7 bg-slate-50 border border-slate-100 rounded-2xl p-4 sm:p-6 shadow-inner relative overflow-hidden self-stretch flex flex-col justify-between min-h-[360px]">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-green-400"></span>
                <span className="text-[10px] text-slate-400 font-mono ml-1.5 uppercase font-semibold">
                  {activeSimTab === 'agent' ? 'Agent Console Simulation // Live State' : 'Secure Portal Simulation // Client-View'}
                </span>
              </div>
              <span className="text-[10px] bg-slate-200/85 px-2 py-0.5 rounded text-slate-650 font-mono font-bold">200 OK</span>
            </div>

            <main className="py-4 my-auto space-y-4">
              {activeSimTab === 'agent' ? (
                <div className="space-y-3">
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/85 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <h5 className="text-[11px] font-bold text-slate-800">Inquiry: Airport Area Villa</h5>
                      <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded tracking-wide ${
                        simulatedInquiryStatus === 'new' ? 'bg-red-600 text-white animate-pulse' :
                        simulatedInquiryStatus === 'read' ? 'bg-slate-100 text-slate-800 border-slate-300' :
                        'bg-green-650 text-white'
                      }`}>
                        {simulatedInquiryStatus}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono">From: pokentifafa@gmail.com</p>
                    <p className="text-xs text-slate-755 italic">"Is there structural space for a secondary kitchen annex?"</p>
                    
                    <div className="pt-2 flex flex-wrap gap-2 border-t border-slate-100 mt-2">
                      <button 
                        onClick={() => setSimulatedInquiryStatus('read')}
                        type="button"
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-semibold"
                      >
                        Click: Mark as Read
                      </button>
                      <button 
                        onClick={() => setSimulatedInquiryStatus('responded')}
                        type="button"
                        className="px-2 py-1 bg-green-50 hover:bg-green-100 text-green-700 rounded text-[10px] font-semibold"
                      >
                        Click: Reply & Finish
                      </button>
                    </div>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/85 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-800 font-mono">MANAGE CLIENT LINK</span>
                      <span className="text-[9px] font-bold bg-amber-100 text-amber-805 px-1.5 py-0.5 rounded">Lead</span>
                    </div>
                    <div className="mt-2 text-xs flex justify-between items-center text-slate-600 font-sans">
                      <span>Kwame Arthur (Inquiry converted)</span>
                      <button type="button" className="bg-blue-600 text-white px-2 py-1 rounded text-[10px] font-bold hover:bg-blue-750">Pre-fill Form</button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-slate-900 text-white p-4 rounded-xl space-y-2 shadow-md">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-mono">YOUR INQUIRIES</span>
                      <span className="text-[9px] bg-blue-500/25 border border-blue-500/35 text-blue-400 px-2 py-0.5 rounded font-bold uppercase">Active</span>
                    </div>
                    <h5 className="text-xs font-bold font-sans">Waterfront Townhouse, East Legon</h5>
                    <p className="text-[11px] text-slate-300">Message sent: "What are the common utilities service rates?"</p>
                    <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700 text-[10.5px] text-slate-200 space-y-1">
                      <p className="font-bold text-blue-400 font-mono">Agent Reply:</p>
                      <p className="italic">"Hi! Standard rates are GH₵450/month which includes strict water and power backup systems maintenance."</p>
                    </div>
                  </div>
                </div>
              )}
            </main>

            <div className="bg-slate-200/50 p-2 text-center rounded text-[10px] text-slate-500 font-medium">
              💡 Interactive simulator. Click the buttons inside the mockup window to experience live reactive CRM states.
            </div>
          </div>
        </div>
      </div>

      {/* 4. Live Featured Properties Catalog */}
      {/*<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-10">
          <div>
            <div className="flex items-center gap-1.5 text-blue-605 text-xs font-bold font-mono uppercase tracking-wider mb-2">
              <span>Verified Catalog</span>
            </div>
            <h2 className="text-2xl md:text-3.5xl font-black text-slate-900 tracking-tight font-sans">
              Featured Active Properties
            </h2>
            <p className="text-slate-500 text-xs mt-1 md:text-sm max-w-lg">
              Meticulously cataloged estates, townhouses and apartments synced directly inside client and agent directories.
            </p>
          </div>
          <Link
            to="/properties"
            className="mt-4 sm:mt-0 text-xs font-bold text-blue-600 inline-flex items-center gap-1 hover:text-blue-700 group transition shrink-0 uppercase tracking-widest"
          >
            Explore All Listings
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm animate-pulse h-[340px]" />
            ))}
          </div>
        ) : properties && properties.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 p-8 max-w-lg mx-auto">
            <Building2 className="w-12 h-12 text-slate-350 mx-auto mb-4" />
            <h3 className="text-base font-bold text-slate-900">No properties uploaded yet</h3>
            <p className="text-xs text-slate-500 mt-1 mb-6 leading-relaxed">
              Real estate properties registered inside Supabase tables will appear on this interactive section dynamically.
            </p>
            {/* Guard the role-based CTA inside empty state too */}
   {/*         {!loading && (profile?.role === 'agent' || profile?.role === 'admin') ? (
              <Link
                to="/dashboard"
                className="inline-flex py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl"
              >
                Go Add Property &rarr;
              </Link>
            ) : (
              <span className="text-slate-400 font-mono text-xs">Waiting for database records...</span>
            )}
          </div>
        )}
      </div> */}

      {/* 5. Sleek Visual CRM Bento Features Highlight */}
      <div className="border-t border-slate-100 bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="px-3 py-1 text-[10px] font-bold bg-slate-100 text-slate-700 rounded-full border border-slate-200 font-mono uppercase">
              Engine Mechanics
            </span>
            <h2 className="text-2xl md:text-3.5xl font-black text-slate-900 font-sans tracking-tight leading-none mt-3">
              Designed for Absolute Precision
            </h2>
            <p className="text-slate-550 text-xs sm:text-sm max-w-md mx-auto mt-2 leading-relaxed font-sans">
              BuildProConnect provides full-cycle synchronization. Our tools guard transactions and timelines perfectly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-150 relative overflow-hidden group hover:border-blue-200 transition">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5 border border-blue-100">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-900 font-sans mb-2">Live Agent Reporting</h3>
              <p className="text-slate-500 text-xs font-sans leading-relaxed">
                Analyze property breakdowns, check interactive inquiries-per-week bar layouts, and see pipeline stages compiled automatically.
              </p>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-150 relative overflow-hidden group hover:border-blue-200 transition">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5 border border-emerald-100">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-905 font-sans mb-2">Synchronized Overdue Alerts</h3>
              <p className="text-slate-500 text-xs font-sans leading-relaxed">
                Stay aligned on promises. Outstanding customer follow-up alerts are instantly marked in red during pending countdown stages.
              </p>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-150 relative overflow-hidden group hover:border-blue-200 transition">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center mb-5 border border-indigo-100">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-900 font-sans mb-2">Pre-Filled Conversions</h3>
              <p className="text-slate-500 text-xs font-sans leading-relaxed">
                Instantly turn digital interactions and inbound queries into active customer CRM directory logs with auto-populated profile structures.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Pristine Testimonials Grid */}
      <div className="bg-slate-900 text-white py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40"></div>
        
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <span className="text-[10px] text-blue-400 font-mono uppercase tracking-widest font-extrabold">Broker Reviews</span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-2 font-sans">Endorsed by Top Performing Agencies</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-700/60 shadow-lg relative">
              <Quote className="absolute top-4 right-4 w-10 h-10 text-slate-700 opacity-20" />
              <div className="flex gap-1 text-amber-500 mb-3">
                {[1,2,3,4,5].map(n => <Star key={n} className="w-3.5 h-3.5 fill-current" />)}
              </div>
              <p className="text-xs sm:text-sm text-slate-300 italic leading-relaxed mb-6 font-sans">
                "The 1-click Convert to Client automation changed our team speed from hours to seconds. Our customers love tracking updates directly via their dedicated client portal."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs font-mono">
                  EA
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Ebenezer Akuffo</h4>
                  <p className="text-[10px] text-slate-500">Managing Lead, Ablode Estate Group</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-700/60 shadow-lg relative">
              <Quote className="absolute top-4 right-4 w-10 h-10 text-slate-700 opacity-20" />
              <div className="flex gap-1 text-amber-500 mb-3">
                {[1,2,3,4,5].map(n => <Star key={n} className="w-3.5 h-3.5 fill-current" />)}
              </div>
              <p className="text-xs sm:text-sm text-slate-300 italic leading-relaxed mb-6 font-sans">
                "The UI is exceptionally organized. Having properties synced inside Supabase RLS policies guarantees our confidential enterprise data remains isolated."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-xs font-mono">
                  SK
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Sena Kpogli</h4>
                  <p className="text-[10px] text-slate-500">Senior Broker, Vested Capital Properties</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 7. Collapsible FAQ Accordion */}
      <div className="max-w-4xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <div className="inline-flex bg-slate-100 p-1.5 rounded-full mb-3">
            <HelpCircle className="w-4 h-4 text-slate-700" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-sans tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-2">
            Have questions about BuildProConnect features? Find our system architecture and utility details below.
          </p>
        </div>

        <div className="space-y-3">
          {[
            {
              q: "How does the Client Portal connect with Property inquiries?",
              a: "When a public prospect submits an inquiry, an email profile is recorded inside our database. Users can register/login with that email, gain access to the Client Portal, and easily watch agent status alterations in absolute real time."
            },
            {
              q: "Can Agents or Admins configure individual property locations?",
              a: "Yes! Utilizing our advanced agent dashboards, registered brokers can create properties, upload photo paths, write customized markdown descriptions, toggle city area structures, and catalog structural specifications."
            },
            {
              q: "How does the dynamic CRM 'Overdue' alert trigger?",
              a: "When agents log task reminders with explicit deadline timestamps, our React system compares dates. If a pending reminder has a calendar date older than the current local time, it highlights the reminder table rows in bright status red."
            },
            {
              q: "Is data transmission guarded by Row-Level Security (RLS)?",
              a: "Absolutely. BuildProConnect queries secure Postgres databases via Supabase API clients with strict multi-role checks. Agents can solely inspect clients assigned to them, while public properties remain globally read-only."
            }
          ].map((faq, index) => {
            const isOpen = !!faqOpen[index];
            return (
              <div key={index} className="bg-white border border-slate-200/85 rounded-xl overflow-hidden transition">
                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  className="w-full text-left py-4 px-5 flex items-center justify-between gap-3 text-xs sm:text-sm font-bold text-slate-900 hover:bg-slate-50/50 cursor-pointer"
                >
                  <span className="font-sans">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isOpen && (
                  <div className="px-5 pb-4 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/35 font-sans">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 8. Conversion CTAs Footer Card */}
      <div className="max-w-5xl mx-auto px-4 pb-24">
        <div className="bg-slate-900 rounded-3xl p-8 sm:p-12 text-center text-white relative overflow-hidden border border-slate-800 shadow-xl">
          <div className="absolute inset-0 bg-[radial-gradient(#1e3a8a_1px,transparent_1px)] [background-size:16px_16px] opacity-15"></div>
          <div className="relative z-10 space-y-6">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-sans">Ready to Align Your Real Estate Business?</h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
              Equip your brand, manage active leads efficiently, and deliver a clean digital transaction journey for properties with ease. Setup takes less than 5 minutes.
            </p>
            <div className="pt-2 flex flex-wrap gap-4 justify-center">
              <Link
                to="/register"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-750 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition"
              >
                Register Free Account
              </Link>
            
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};