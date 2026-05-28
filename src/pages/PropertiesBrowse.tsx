import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { PropertyCard, Property } from '../components/PropertyCard';
import { useAuth } from '../hooks/useAuth';
import { 
  Building2, MapPin, Grid, List, Search, SlidersHorizontal, X, 
  RefreshCw, Home, ChevronLeft, ChevronRight, Plus
} from 'lucide-react';

const ITEMS_PER_PAGE = 12;

export const PropertiesBrowse: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { profile } = useAuth();

  const isAgentOrAdmin = profile?.role === 'agent' || profile?.role === 'admin';

  // Local Filter States
  const [locationText, setLocationText] = useState(searchParams.get('location') || '');
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState<string[]>(
    searchParams.getAll('property_type')
  );
  const [selectedListingTypes, setSelectedListingTypes] = useState<string[]>(
    searchParams.getAll('listing_type')
  );
  const [minPrice, setMinPrice] = useState(searchParams.get('min_price') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') || ''); 
  const [minBedrooms, setMinBedrooms] = useState(searchParams.get('bedrooms_min') || '');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Synchronize state if URL params change externally (e.g., Hero Search interaction)
  useEffect(() => {
    setLocationText(searchParams.get('location') || '');
    setSelectedPropertyTypes(searchParams.getAll('property_type'));
    setSelectedListingTypes(searchParams.getAll('listing_type'));
    setMinPrice(searchParams.get('min_price') || '');
    setMaxPrice(searchParams.get('max_price') || '');
    setMinBedrooms(searchParams.get('bedrooms_min') || '');
    setPage(Number(searchParams.get('page')) || 1);
  }, [searchParams]);

  // Push current local state back up to URL parameters
  const applyFilters = useCallback((targetPage?: number) => {
    const params = new URLSearchParams();
    const currentPage = targetPage !== undefined ? targetPage : page;

    if (locationText.trim()) params.set('location', locationText.trim());
    selectedPropertyTypes.forEach(t => params.append('property_type', t));
    selectedListingTypes.forEach(t => params.append('listing_type', t));
    if (minPrice) params.set('min_price', minPrice);
    if (maxPrice) params.set('max_price', maxPrice);
    if (minBedrooms) params.set('bedrooms_min', minBedrooms);
    
    params.set('page', currentPage.toString());
    setSearchParams(params);
  }, [locationText, selectedPropertyTypes, selectedListingTypes, minPrice, maxPrice, minBedrooms, page, setSearchParams]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    applyFilters(newPage);
  };

  const resetFilters = () => {
    setLocationText('');
    setSelectedPropertyTypes([]);
    setSelectedListingTypes([]);
    setMinPrice('');
    setMaxPrice('');
    setMinBedrooms('');
    setPage(1);
    setSearchParams(new URLSearchParams());
  };

  // Immediate reactive push for structural checkbox updates
  useEffect(() => {
    applyFilters();
  }, [selectedPropertyTypes, selectedListingTypes, applyFilters]);

  // Primary Workspace Query Fetcher
  const { data, isLoading, isError, refetch } = useQuery<{
    properties: Property[];
    count: number;
  }>({
    queryKey: [
      'propertiesBrowse',
      searchParams.toString(), // Reactive directly to URL params layout
    ],
    queryFn: async () => {
      let query = supabase
        .from('properties')
        .select('*', { count: 'exact' })
        .neq('status', 'archived');

      const urlLoc = searchParams.get('location');
      const urlProps = searchParams.getAll('property_type');
      const urlListings = searchParams.getAll('listing_type');
      const urlMinP = searchParams.get('min_price');
      const urlMaxP = searchParams.get('max_price');
      const urlBeds = searchParams.get('bedrooms_min');
      const urlPage = Number(searchParams.get('page')) || 1;

      if (urlLoc?.trim()) {
        query = query.or(
          `location_area.ilike.%${urlLoc.trim()}%,location_city.ilike.%${urlLoc.trim()}%,title.ilike.%${urlLoc.trim()}%`
        );
      }

      if (urlProps.length > 0) query = query.in('property_type', urlProps);
      if (urlListings.length > 0) query = query.in('listing_type', urlListings);
      if (urlMinP) query = query.gte('price', Number(urlMinP));
      if (urlMaxP) query = query.lte('price', Number(urlMaxP));
      if (urlBeds) query = query.gte('bedrooms', Number(urlBeds));

      const from = (urlPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data: propertiesData, count, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      return {
        properties: (propertiesData || []) as Property[],
        count: count || 0,
      };
    },
  });

  const propertyList = data?.properties || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE) || 1;

  const handlePropertyTypeToggle = (type: string) => {
    setPage(1);
    setSelectedPropertyTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleListingTypeToggle = (type: string) => {
    setPage(1);
    setSelectedListingTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const formatGHS = (priceVal: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      maximumFractionDigits: 0,
    }).format(priceVal).replace('GHS', 'GH₵');
  };

  const activeFilterCount = [
    locationText.trim(),
    minPrice,
    maxPrice,
    minBedrooms,
  ].filter(Boolean).length + selectedPropertyTypes.length + selectedListingTypes.length;

  return (
    <div className="bg-[#f8fafc] min-h-screen py-12 px-4 sm:px-6 lg:px-8 font-sans antialiased">
      <div className="max-w-7xl mx-auto">

        {/* Portfolio Dynamic Header Section */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-6 border-b border-slate-200/60">
          <div>
            <h1 className="text-3xl font-serif font-normal text-slate-900 tracking-tight sm:text-4xl">
              Property Portfolio
            </h1>
            <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold mt-2">
              Showing <span className="text-slate-900 font-bold">{totalCount}</span> Available Ledger Dispatches
            </p>
          </div>

          <div className="flex items-center gap-4">
            {isAgentOrAdmin && (
              <Link
                to="/dashboard/properties/new"
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold uppercase tracking-widest rounded-xl transition duration-300 inline-flex items-center gap-2 shadow-xl shadow-slate-950/15"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> Add Property
              </Link>
            )}

            {/* Layout Toggle Pill */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  viewMode === 'grid' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Grid Portfolio View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  viewMode === 'list' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Detailed Ledger List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Global Workspace Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">

          {/* Luxury Filter Matrix Box Sidebar */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm sticky top-28">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-800">
                <SlidersHorizontal className="w-4 h-4 text-slate-900 stroke-[2.5]" />
                <span>Parameters</span>
              </div>
              <button
                onClick={resetFilters}
                className="text-[10px] text-slate-400 hover:text-red-500 font-bold uppercase tracking-wider transition-colors duration-200 flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                Reset
              </button>
            </div>

            <div className="space-y-6">
              {/* Filter Area: Location Input Box */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2.5">Geographic Index / Keyword</label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={locationText}
                    onChange={(e) => setLocationText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setPage(1);
                        applyFilters();
                        refetch();
                      }
                    }}
                    placeholder="City, neighborhood, or title..."
                    className="w-full text-xs pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-slate-950/5 focus:border-slate-950 transition-all duration-200 text-slate-800 font-medium placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Filter Area: Listing Dynamic Type */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2.5">Listing Status</label>
                <div className="space-y-2">
                  {[
                    { value: 'sale', label: 'For Sale Portfolio' },
                    { value: 'rent', label: 'Rental Registry' },
                  ].map(({ value, label }) => (
                    <label key={value} className="flex items-center gap-3 text-xs font-medium text-slate-600 cursor-pointer select-none group transition-colors hover:text-slate-900">
                      <input
                        type="checkbox"
                        checked={selectedListingTypes.includes(value)}
                        onChange={() => handleListingTypeToggle(value)}
                        className="w-4 h-4 rounded-md border-slate-300 text-slate-900 focus:ring-slate-900/10 cursor-pointer accent-slate-950"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Filter Area: Structural Property Type Configurator */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2.5">Architectural Layout</label>
                <div className="space-y-2">
                  {['apartment', 'house', 'land', 'commercial', 'studio'].map((t) => (
                    <label key={t} className="flex items-center gap-3 text-xs font-medium text-slate-600 cursor-pointer capitalize select-none group transition-colors hover:text-slate-900">
                      <input
                        type="checkbox"
                        checked={selectedPropertyTypes.includes(t)}
                        onChange={() => handlePropertyTypeToggle(t)}
                        className="w-4 h-4 rounded-md border-slate-300 text-slate-900 focus:ring-slate-900/10 cursor-pointer accent-slate-950"
                      />
                      <span>{t}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Filter Area: Valuation Limit Spread */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2.5">Valuation Range (GH₵)</label>
                <div className="grid grid-cols-2 gap-2.5">
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => { setPage(1); setMinPrice(e.target.value); }}
                    placeholder="Min Value"
                    className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-slate-950/5 focus:border-slate-950 transition-all font-medium"
                  />
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => { setPage(1); setMaxPrice(e.target.value); }}
                    placeholder="Max Value"
                    className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-slate-950/5 focus:border-slate-950 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Filter Area: Room Parameters */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2.5">Bedrooms (Minimum)</label>
                <input
                  type="number"
                  min="0"
                  value={minBedrooms}
                  onChange={(e) => { setPage(1); setMinBedrooms(e.target.value); }}
                  placeholder="Any Structural Count"
                  className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-slate-950/5 focus:border-slate-950 transition-all font-medium"
                />
              </div>

              {/* Action Trigger Button */}
              <button
                onClick={() => {
                  setPage(1);
                  applyFilters();
                  refetch();
                }}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-300 shadow-md shadow-slate-950/10 flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <RefreshCw className="w-3.5 h-3.5 stroke-[2.5]" />
                Re-Index Workspace
                {activeFilterCount > 0 && (
                  <span className="ml-1 bg-white text-slate-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Results Dynamic Container Block */}
          <div className="lg:col-span-3 space-y-6">

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-32 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <div className="w-7 h-7 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-slate-400 text-xs font-medium tracking-wide uppercase">Mapping Database Matrix...</p>
              </div>
            ) : isError ? (
              <div className="text-center py-24 bg-white border border-slate-200 rounded-2xl shadow-sm px-6">
                <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full mx-auto flex items-center justify-center mb-4 text-sm font-bold">
                  !
                </div>
                <h3 className="text-sm font-semibold text-slate-900">Data Synchronization Interrupted</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-2 leading-relaxed">
                  The network layer was unable to establish connection parameters to the property ledger. Check interface settings or reset operational filter tags.
                </p>
              </div>
            ) : propertyList.length === 0 ? (
              <div className="text-center py-28 bg-white border border-slate-200 rounded-2xl shadow-sm px-6">
                <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-5 stroke-[1.25]" />
                <h3 className="text-base font-serif text-slate-900">Zero Parameters Matched</h3>
                <p className="text-slate-500 text-xs mt-2 mb-8 max-w-xs mx-auto leading-relaxed">
                  Broaden variable limits or wipe existing structural tags to explore missing entries.
                </p>
                <button
                  onClick={resetFilters}
                  className="px-5 py-2.5 bg-slate-950 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all shadow-sm"
                >
                  Wipe Parameter Matrix
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in duration-300">
                {propertyList.map((prop) => (
                  <PropertyCard key={prop.id} property={prop} />
                ))}
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in duration-300">
                {propertyList.map((prop) => {
                  const imageSrc = prop.image_urls && prop.image_urls.length > 0 ? prop.image_urls[0] : null;
                  const isLandOrComm = prop.property_type === 'land' || prop.property_type === 'commercial';

                  return (
                    <div
                      key={prop.id}
                      className="group bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden hover:shadow-md hover:border-slate-300/80 transition-all duration-300 flex flex-col sm:flex-row gap-6 p-4 items-stretch"
                    >
                      {/* Left Block: Image Thumbnail frame */}
                      <div className="relative w-full sm:w-52 aspect-[4/3] sm:aspect-square rounded-xl overflow-hidden shrink-0 bg-slate-50 border border-slate-100 flex items-center justify-center">
                        {imageSrc ? (
                          <img
                            src={imageSrc}
                            alt={prop.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-1.5 p-4">
                            <Home className="w-6 h-6 stroke-[1.5]" />
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">No Media Attached</span>
                          </div>
                        )}
                        <span className="absolute top-3 left-3 bg-slate-900/95 backdrop-blur-sm border border-white/10 text-white text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md shadow-sm">
                          For {prop.listing_type}
                        </span>
                      </div>

                      {/* Right Block: Content Info Structure */}
                      <div className="flex-1 flex flex-col justify-between py-1.5 min-w-0">
                        <div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium mb-2">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{prop.location_area}, {prop.location_city}</span>
                          </div>

                          <h3 className="font-serif font-normal text-slate-900 text-lg group-hover:text-slate-700 transition-colors tracking-tight line-clamp-1">
                            {prop.title}
                          </h3>

                          <p className="text-slate-500 text-xs mt-2 line-clamp-2 pr-6 leading-relaxed font-normal">
                            {prop.description}
                          </p>
                        </div>

                        {/* Item Footer Row Matrix */}
                        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-4 mt-6">
                          <div className="flex items-center gap-4 text-slate-400 text-[11px] font-medium">
                            <span className="bg-slate-50 border border-slate-200/60 text-slate-700 px-2.5 py-0.5 rounded-md capitalize font-semibold text-[10px]">
                              {prop.property_type}
                            </span>
                            {!isLandOrComm && (
                              <div className="flex items-center gap-3 divide-x divide-slate-200">
                                <span>{prop.bedrooms ?? 0} Beds</span>
                                <span className="pl-3">{prop.bathrooms ?? 0} Baths</span>
                                <span className="pl-3">{prop.area_sqm ?? 0} m²</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="font-sans font-bold text-base text-slate-900 mr-2">
                              {prop.listing_type === 'sale' ? formatGHS(prop.price) : `${formatGHS(prop.price)}/mo`}
                            </span>
                            <Link
                              to={`/properties/${prop.id}`}
                              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition duration-200"
                            >
                              Details
                            </Link>
                            {isAgentOrAdmin && (
                              <Link
                                to={`/dashboard/properties/${prop.id}/edit`}
                                className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-[10px] font-bold uppercase tracking-widest transition duration-200"
                              >
                                Edit
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Grid Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-12 pt-6 border-t border-slate-200">
                <button
                  onClick={() => handlePageChange(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-[10px] font-bold uppercase tracking-widest text-slate-600 rounded-xl hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 transition duration-200 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                  Prev
                </button>

                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                  Page <span className="font-bold text-slate-900">{page}</span> of <span className="font-bold text-slate-900">{totalPages}</span>
                </span>

                <button
                  onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-[10px] font-bold uppercase tracking-widest text-slate-600 rounded-xl hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 transition duration-200 cursor-pointer"
                >
                  Next
                  <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};