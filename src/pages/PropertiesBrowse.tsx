import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { PropertyCard, Property } from '../components/PropertyCard';
import { useAuth } from '../hooks/useAuth';
import { 
  Building2, MapPin, Grid, List, Search, Filter, 
  ChevronLeft, ChevronRight, SlidersHorizontal, X, RefreshCw, Home
} from 'lucide-react';

const ITEMS_PER_PAGE = 12;

export const PropertiesBrowse: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { profile } = useAuth();

  const isAgentOrAdmin = profile?.role === 'agent' || profile?.role === 'admin';

  // Local filter states initialization
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

  // Keep state in sync if URL params change externally (e.g., from a home page search hero)
  useEffect(() => {
    const loc = searchParams.get('location') || '';
    const pType = searchParams.getAll('property_type');
    const lType = searchParams.getAll('listing_type');
    const singularPropType = searchParams.get('property_type');
    const singularListType = searchParams.get('listing_type');
    const heroMaxPrice = searchParams.get('max_price');

    if (loc) setLocationText(loc);
    if (pType.length > 0) setSelectedPropertyTypes(pType);
    else if (singularPropType) setSelectedPropertyTypes([singularPropType]);

    if (lType.length > 0) setSelectedListingTypes(lType);
    else if (singularListType) setSelectedListingTypes([singularListType]);

    if (heroMaxPrice) setMaxPrice(heroMaxPrice);

    setPage(Number(searchParams.get('page')) || 1);
  }, [searchParams]);

  // Pushes current local filters back up to the URL bar
  const applyFilters = useCallback(() => {
    const params = new URLSearchParams();
    if (locationText.trim()) params.set('location', locationText.trim());
    selectedPropertyTypes.forEach(t => params.append('property_type', t));
    selectedListingTypes.forEach(t => params.append('listing_type', t));
    if (minPrice) params.set('min_price', minPrice);
    if (maxPrice) params.set('max_price', maxPrice);
    if (minBedrooms) params.set('bedrooms_min', minBedrooms);
    params.set('page', page.toString());
    setSearchParams(params);
  }, [locationText, selectedPropertyTypes, selectedListingTypes, minPrice, maxPrice, minBedrooms, page, setSearchParams]);

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

  // Instant updates for clicking checkboxes or changing pages
  useEffect(() => {
    applyFilters();
  }, [selectedPropertyTypes, selectedListingTypes, page, applyFilters]);

  // Main data fetcher
  const { data, isLoading, isError, refetch } = useQuery<{
    properties: Property[];
    count: number;
  }>({
    queryKey: [
      'propertiesBrowse',
      locationText,
      selectedPropertyTypes,
      selectedListingTypes,
      minPrice,
      maxPrice,
      minBedrooms,
      page,
    ],
    queryFn: async () => {
      let query = supabase
        .from('properties')
        .select('*', { count: 'exact' })
        .neq('status', 'archived');

      if (locationText.trim()) {
        query = query.or(
          `location_area.ilike.%${locationText.trim()}%,location_city.ilike.%${locationText.trim()}%,title.ilike.%${locationText.trim()}%`
        );
      }

      if (selectedPropertyTypes.length > 0) {
        query = query.in('property_type', selectedPropertyTypes);
      }

      if (selectedListingTypes.length > 0) {
        query = query.in('listing_type', selectedListingTypes);
      }

      if (minPrice) query = query.gte('price', Number(minPrice));
      if (maxPrice) query = query.lte('price', Number(maxPrice));
      if (minBedrooms) query = query.gte('bedrooms', Number(minBedrooms));

      const from = (page - 1) * ITEMS_PER_PAGE;
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
    <div className="bg-slate-50 min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* Header Section */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight sm:text-3xl">
              Browse Properties
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Found <span className="font-semibold text-slate-850">{totalCount}</span> properties matching your criteria.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isAgentOrAdmin && (
              <Link
                to="/dashboard/properties/new"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition inline-flex items-center gap-1.5 shadow-sm shadow-blue-500/20"
              >
                + Add Property
              </Link>
            )}

            {/* Layout Toggle */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 self-start md:self-auto">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'grid' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'
                }`}
                title="Grid view"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'list' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'
                }`}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* Filters Sidebar */}
          <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm self-start">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-2 font-semibold text-slate-800 text-sm">
                <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                <span>Filters</span>
              </div>
              <button
                onClick={resetFilters}
                className="text-xs text-slate-400 hover:text-red-500 font-medium transition flex items-center gap-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                Clear all
              </button>
            </div>

            <div className="space-y-6">
              {/* Keyword/Location */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Location or Keyword</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
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
                    className="w-full text-sm pl-9 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>
              </div>

              {/* Listing Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Listing Type</label>
                <div className="space-y-2">
                  {[
                    { value: 'sale', label: 'For Sale' },
                    { value: 'rent', label: 'For Rent' },
                  ].map(({ value, label }) => (
                    <label key={value} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={selectedListingTypes.includes(value)}
                        onChange={() => handleListingTypeToggle(value)}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Property Types */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Property Type</label>
                <div className="space-y-2">
                  {['apartment', 'house', 'land', 'commercial', 'studio'].map((t) => (
                    <label key={t} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer capitalize select-none">
                      <input
                        type="checkbox"
                        checked={selectedPropertyTypes.includes(t)}
                        onChange={() => handlePropertyTypeToggle(t)}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20"
                      />
                      <span>{t}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Limits */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Price Range (GH₵)</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => { setPage(1); setMinPrice(e.target.value); }}
                    placeholder="Min"
                    className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => { setPage(1); setMaxPrice(e.target.value); }}
                    placeholder="Max"
                    className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Minimum Bedrooms */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Bedrooms (Min)</label>
                <input
                  type="number"
                  min="0"
                  value={minBedrooms}
                  onChange={(e) => { setPage(1); setMinBedrooms(e.target.value); }}
                  placeholder="Any"
                  className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Submission Button */}
              <button
                onClick={() => {
                  setPage(1);
                  applyFilters();
                  refetch();
                }}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Apply Filters
                {activeFilterCount > 0 && (
                  <span className="ml-1 bg-white text-blue-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Results Area */}
          <div className="lg:col-span-3 space-y-6">

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-24 bg-white border border-slate-200/60 rounded-2xl shadow-sm">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-slate-500 text-sm">Loading properties...</p>
              </div>
            ) : isError ? (
              <div className="text-center py-20 bg-white border border-slate-200/60 rounded-2xl shadow-sm px-4">
                <div className="w-10 h-10 bg-red-50 text-red-600 rounded-full mx-auto flex items-center justify-center mb-4 text-lg font-bold">
                  !
                </div>
                <h3 className="text-sm font-semibold text-slate-900">Something went wrong</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  We had trouble loading the listings. Please check your connection or try resetting your filters.
                </p>
              </div>
            ) : propertyList.length === 0 ? (
              <div className="text-center py-24 bg-white border border-slate-200/60 rounded-2xl shadow-sm px-4">
                <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-base font-semibold text-slate-900">No matching properties found</h3>
                <p className="text-slate-500 text-sm mt-1 mb-6 max-w-xs mx-auto">
                  Try broadening your search criteria or removing some filters to see more listings.
                </p>
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 bg-slate-950 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition"
                >
                  Clear Filters
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {propertyList.map((prop) => (
                  <PropertyCard key={prop.id} property={prop} />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {propertyList.map((prop) => {
                  const imageSrc = prop.image_urls && prop.image_urls.length > 0 ? prop.image_urls[0] : null;
                  const isLandOrComm = prop.property_type === 'land' || prop.property_type === 'commercial';

                  return (
                    <div
                      key={prop.id}
                      className="group bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden hover:shadow-md transition flex flex-col sm:flex-row gap-5 p-4 items-stretch"
                    >
                      {/* Image Thumbnail */}
                      <div className="relative w-full sm:w-48 aspect-[4/3] sm:aspect-square rounded-xl overflow-hidden shrink-0 bg-slate-100 flex items-center justify-center">
                        {imageSrc ? (
                          <img
                            src={imageSrc}
                            alt={prop.title}
                            className="w-full h-full object-cover group-hover:scale-102 transition duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400 gap-1 p-4">
                            <Home className="w-6 h-6 text-slate-300" />
                            <span className="text-[10px] text-slate-400 font-medium">No Image</span>
                          </div>
                        )}
                        <span className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wide">
                          For {prop.listing_type}
                        </span>
                      </div>

                      {/* Info Body */}
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div>
                          <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{prop.location_area}, {prop.location_city}</span>
                          </div>

                          <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition tracking-tight">
                            {prop.title}
                          </h3>

                          <p className="text-slate-500 text-xs mt-1.5 line-clamp-2 pr-4 leading-relaxed">
                            {prop.description}
                          </p>
                        </div>

                        {/* Specs Footer */}
                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 mt-4">
                          <div className="flex items-center gap-4 text-slate-500 text-xs">
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded capitalize font-medium">
                              {prop.property_type}
                            </span>
                            {!isLandOrComm && (
                              <>
                                <span>{prop.bedrooms ?? 0} Beds</span>
                                <span>{prop.bathrooms ?? 0} Baths</span>
                                <span>{prop.area_sqm ?? 0} m²</span>
                              </>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900 mr-2">
                              {prop.listing_type === 'sale' ? formatGHS(prop.price) : `${formatGHS(prop.price)} / mo`}
                            </span>
                            <Link
                              to={`/properties/${prop.id}`}
                              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition"
                            >
                              Details
                            </Link>
                            {isAgentOrAdmin && (
                              <Link
                                  to={`/dashboard/properties/${prop.id}/edit`}
                                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition"
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-200">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 px-3 py-1.5 border border-slate-250 text-xs font-semibold text-slate-700 rounded-xl hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Prev
                </button>

                <span className="text-xs text-slate-500">
                  Page <span className="font-semibold text-slate-900">{page}</span> of <span className="font-semibold text-slate-900">{totalPages}</span>
                </span>

                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 border border-slate-250 text-xs font-semibold text-slate-700 rounded-xl hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};