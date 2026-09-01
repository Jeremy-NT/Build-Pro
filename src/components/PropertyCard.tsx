import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, BedDouble, Bath, Maximize, Home } from 'lucide-react';
import { formatPriceCompact } from '../shared/utils/format';
import type { Property } from '../shared/types/domain';

interface PropertyCardProps {
  property: Property;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ property }) => {
  const {
    id,
    title,
    location_area,
    location_city,
    price,
    bedrooms,
    bathrooms,
    area_sqm,
    listing_type,
    property_type,
    status,
    image_urls,
  } = property;

  const formattedPrice = formatPriceCompact(price);

  // Hide bed/bath badges for land / commercial
  const isLandOrCommercial = property_type === 'land' || property_type === 'commercial';

  // Badge styles
  const listingTypeBg = listing_type === 'sale' 
    ? 'bg-emerald-550 border-emerald-600 text-emerald-800 bg-emerald-50' 
    : 'bg-blue-50 border-blue-100 text-blue-700';

  const getStatusBadgeStyle = (statusVal: string) => {
    switch (statusVal) {
      case 'available':
        return 'bg-green-50 border-green-100 text-green-750';
      case 'sold':
        return 'bg-slate-100 border-slate-200 text-slate-550';
      case 'rented':
        return 'bg-amber-50 border-amber-100 text-amber-700';
      case 'archived':
        return 'bg-red-50 border-red-100 text-red-600';
      default:
        return 'bg-slate-100 border-slate-200 text-slate-650';
    }
  };

  const hasImages = image_urls && image_urls.length > 0;
  const imageSrc = hasImages ? image_urls[0] : null;

  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-slate-100 hover:shadow-xl transition flex flex-col h-full self-stretch">
      {/* Image container with 4:3 Aspect Ratio */}
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-200">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 gap-2">
            <Home className="w-12 h-12 text-slate-300" />
            <span className="font-mono text-[9px] text-slate-400 uppercase tracking-widest font-semibold">No Image Provided</span>
          </div>
        )}
        
        {/* Badges container */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md border ${listingTypeBg}`}>
            {listing_type === 'sale' ? 'Sale' : 'Rent'}
          </span>
          <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md border ${getStatusBadgeStyle(status)}`}>
            {status}
          </span>
        </div>

        {/* Price Tag */}
        <div className="absolute bottom-3 right-3 bg-slate-900/90 backdrop-blur-md text-white font-sans text-xs font-bold px-2.5 py-1 rounded-lg">
          {listing_type === 'sale' ? formattedPrice : `${formattedPrice}/mo`}
        </div>
      </div>

      {/* Info Body */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-1 text-slate-400 font-sans text-xs mb-1.5">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-450" />
            <span className="truncate">
              {location_area}, {location_city}
            </span>
          </div>

          <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition tracking-tight text-sm mb-2 font-sans line-clamp-1">
            {title}
          </h3>
        </div>

        {/* Beds/Baths Specifications (Hide for land and commercial) */}
        <div className="pt-2">
          {!isLandOrCommercial && (
            <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-slate-650 font-mono text-[10px] mb-3">
              <span className="flex items-center gap-1">
                <BedDouble className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{bedrooms ?? 0} Bed</span>
              </span>
              <span className="flex items-center gap-1">
                <Bath className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{bathrooms ?? 0} Bath</span>
              </span>
              <span className="flex items-center gap-1">
                <Maximize className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{area_sqm ?? 0} m²</span>
              </span>
            </div>
          )}
          
          <Link
            to={`/properties/${id}`}
            className="block text-center w-full bg-slate-50 hover:bg-blue-600 hover:text-white text-slate-700 py-2 rounded-xl text-xs font-semibold tracking-wide transition cursor-pointer"
          >
            Check Details
          </Link>
        </div>
      </div>
    </div>
  );
};
