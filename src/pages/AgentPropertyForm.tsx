import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { 
  Building2, ArrowLeft, Upload, X, Check, Save, 
  Trash, Loader2, AlertCircle, FileImage, Sparkles 
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Definition of form validation schema with Zod
const propertyFormSchema = z.object({
  title: z.string().min(5, { message: 'Title must represent at least 5 characters' }),
  description: z.string().min(15, { message: 'Description must outline at least 15 characters' }),
  property_type: z.enum(['apartment', 'house', 'land', 'commercial', 'studio']),
  listing_type: z.enum(['sale', 'rent']),
  price: z.coerce.number().min(1, { message: 'Price must be a positive estimation' }),
  bedrooms: z.coerce.number().optional().default(0),
  bathrooms: z.coerce.number().optional().default(0),
  area_sqm: z.coerce.number().min(1, { message: 'Physical area boundary is required' }),
  location_city: z.string().min(2, { message: 'Location city is required' }),
  location_area: z.string().min(2, { message: 'Location area is required' }),
  location_address: z.string().optional(),
  status: z.enum(['available', 'rented', 'sold', 'archived']).default('available'),
});

type PropertyFormValues = {
  title: string;
  description: string;
  property_type: 'apartment' | 'house' | 'land' | 'commercial' | 'studio';
  listing_type: 'sale' | 'rent';
  price: number;
  bedrooms: number;
  bathrooms: number;
  area_sqm: number;
  location_city: string;
  location_area: string;
  location_address?: string;
  status: 'available' | 'rented' | 'sold' | 'archived';
};

interface AgentPropertyFormProps {
  isEdit?: boolean;
}

const COMMON_AMENITIES = [
  'Air Conditioning', 'Swimming Pool', 'Security Guard', 'Generator/Solar Backup',
  'Private Parking', 'Balcony', 'Gated Community', 'High-Speed Fiber Wifi',
  'Water Reservoir (Polytank)', 'Equipped Kitchen'
];

export const AgentPropertyForm: React.FC<AgentPropertyFormProps> = ({ isEdit = false }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { session, profile } = useAuth();
  const queryClient = useQueryClient();

  // Selected state for active amenities array
  const [amenities, setAmenities] = useState<string[]>([]);
  const [customAmenityText, setCustomAmenityText] = useState('');

  // Image arrays: stores string URLs that are currently selected for this listing
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<boolean>(false);

  // Form management configuration
  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<PropertyFormValues>({
    resolver: zodResolver(propertyFormSchema) as any,
    defaultValues: {
      title: '',
      description: '',
      property_type: 'apartment',
      listing_type: 'rent',
      price: 0,
      bedrooms: 0,
      bathrooms: 0,
      area_sqm: 0,
      location_city: 'Accra',
      location_area: '',
      location_address: '',
      status: 'available',
    }
  });

  // Watch property type to conditionally disable bed/bath inputs if land or commercial
  const watchedPropertyType = watch('property_type');
  const isLandOrComm = watchedPropertyType === 'land' || watchedPropertyType === 'commercial';

  // React Query: Fetch the existing property row if editing
  const { data: existingProperty, isLoading: isFetchingRow } = useQuery({
    queryKey: ['agentPropertyEdit', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: isEdit && !!id,
  });

  // Prefill form values once existing property loaded
  useEffect(() => {
    if (isEdit && existingProperty) {
      reset({
        title: existingProperty.title,
        description: existingProperty.description || '',
        property_type: existingProperty.property_type,
        listing_type: existingProperty.listing_type,
        price: existingProperty.price,
        bedrooms: existingProperty.bedrooms || 0,
        bathrooms: existingProperty.bathrooms || 0,
        area_sqm: existingProperty.area_sqm || 0,
        location_city: existingProperty.location_city,
        location_area: existingProperty.location_area,
        location_address: existingProperty.location_address || '',
        status: existingProperty.status,
      });

      setAmenities(existingProperty.amenities || []);
      setImageUrls(existingProperty.image_urls || []);
    }
  }, [isEdit, existingProperty, reset]);

  // Client side validation & upload helper for property-images
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const agentId = session?.user?.id;
    if (!agentId) {
      toast.error('Session expired, please reauthenticate.');
      return;
    }

    // Remaining upload capacity
    const currentCount = imageUrls.length;
    if (currentCount >= 5) {
      toast.error('Limit reached: A listing can hold up to 5 images maximum.');
      return;
    }

    const filesToUpload = (Array.from(files) as File[]).slice(0, 5 - currentCount);
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    setUploadingFiles(true);
    let uploadedCount = 0;

    try {
      for (const file of filesToUpload) {
        // Core validation checks (MIME type + file size client-side)
        if (!allowedTypes.includes(file.type)) {
          toast.error(`Invalid document type: [${file.name}]. Only JPEG, PNG or WEBP images are supported.`);
          continue;
        }

        if (file.size > maxSize) {
          toast.error(`Doc exceeds size limit: [${file.name}] is larger than 5MB.`);
          continue;
        }

        // Generate clean upload directory coordinates
        const propertyUuid = id || (self.crypto.randomUUID ? self.crypto.randomUUID() : Math.random().toString(36).substring(2, 11));
        const filenameUuid = self.crypto.randomUUID ? self.crypto.randomUUID() : Math.random().toString(36).substring(2, 7);
        const fileExtension = file.name.split('.').pop() || 'jpg';
        const storagePath = `property-images/${agentId}/${propertyUuid}/${filenameUuid}.${fileExtension}`;

        const { data, error: uploadError } = await supabase.storage
          .from('property-images')
          .upload(storagePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          throw uploadError;
        }

        // Get public URL coordinates of uploaded physical resource
        const { data: publicUrlData } = supabase.storage
          .from('property-images')
          .getPublicUrl(storagePath);

        if (publicUrlData && publicUrlData.publicUrl) {
          setImageUrls((prev) => [...prev, publicUrlData.publicUrl]);
          uploadedCount++;
        }
      }

      if (uploadedCount > 0) {
        toast.success(`Successfully uploaded ${uploadedCount} listing image(s).`);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error occurred while saving image files.');
    } finally {
      setUploadingFiles(false);
      // Clear input so we can select same file again if removed
      e.target.value = '';
    }
  };

  const removeImageIdx = (indexToRemove: number) => {
    setImageUrls((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    toast.success('Image reference unlinked from listing.');
  };

  // Amenities tags toggle
  const toggleAmenity = (amenityName: string) => {
    if (amenities.includes(amenityName)) {
      setAmenities(amenities.filter((a) => a !== amenityName));
    } else {
      setAmenities([...amenities, amenityName]);
    }
  };

  const addCustomAmenity = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanText = customAmenityText.trim();
    if (!cleanText) return;

    if (amenities.includes(cleanText)) {
      toast.error('Amenity has already been registered.');
      return;
    }

    setAmenities([...amenities, cleanText]);
    setCustomAmenityText('');
  };

  // Submit operations mutation
  const formMutation = useMutation({
    mutationFn: async (values: PropertyFormValues) => {
      const agentId = session?.user?.id;
      if (!agentId) throw new Error('Unauthenticated workspace account context');

      const payload = {
        title: values.title,
        description: values.description,
        property_type: values.property_type,
        listing_type: values.listing_type,
        price: values.price,
        bedrooms: isLandOrComm ? 0 : values.bedrooms,
        bathrooms: isLandOrComm ? 0 : values.bathrooms,
        area_sqm: values.area_sqm,
        location_city: values.location_city,
        location_area: values.location_area,
        location_address: values.location_address || null,
        status: values.status,
        amenities: amenities,
        image_urls: imageUrls,
      };

      if (isEdit && id) {
        // Update row
        const { error } = await supabase
          .from('properties')
          .update(payload)
          .eq('id', id);

        if (error) throw error;
      } else {
        // Insert row
        const { error } = await supabase
          .from('properties')
          .insert({
            ...payload,
            agent_id: agentId,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(
        isEdit 
          ? 'Real estate property parameters saved successfully.' 
          : 'New listing published under your BuildProConnect catalogs!'
      );
      queryClient.invalidateQueries({ queryKey: ['agentProperties'] });
      queryClient.invalidateQueries({ queryKey: ['propertyDetail', id] });
      navigate('/dashboard/properties');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Database transaction error occurred.');
    }
  });

  const onSubmit = (values: PropertyFormValues) => {
    formMutation.mutate(values);
  };

  if (isEdit && isFetchingRow) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-100 rounded-2xl">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="mt-3 text-slate-500 text-xs">Fetching existing property parameters...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header Panel */}
      <div className="flex items-center gap-3">
        <Link
          to="/dashboard/properties"
          className="p-2 border border-slate-250 bg-white rounded-xl text-slate-600 hover:text-slate-900 shadow-sm transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight font-sans">
            {isEdit ? 'Modify Property Parameters' : 'Publish Property Listing'}
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-sans">
            {isEdit ? 'Apply updates instantly to sync public directory values.' : 'Enter accurate listing details to post to catalogs.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">
        
        {/* Core parameters card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
          <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider font-mono">1. Basic Parameters</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-700 mb-1 uppercase tracking-wide">Listing Title</label>
              <input
                type="text"
                placeholder="Spacious Penthouse with panoramic glass skylights"
                {...register('title')}
                className={`w-full text-xs font-sans px-3 py-2.5 border rounded-xl focus:outline-none focus:ring-2 bg-slate-50/50 ${
                  errors.title ? 'border-red-300 focus:ring-red-550' : 'border-slate-200 focus:ring-blue-500'
                }`}
              />
              {errors.title && <p className="text-[10px] text-red-600 mt-1">{errors.title.message}</p>}
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-700 mb-1 uppercase tracking-wide">Property description</label>
              <textarea
                rows={5}
                placeholder="Give high prospective buyers premium details surrounding spatial borders, ventilation, material coatings, and building infrastructure codes..."
                {...register('description')}
                className={`w-full text-xs font-sans px-3 py-2.5 border rounded-xl focus:outline-none focus:ring-2 bg-slate-50/50 ${
                  errors.description ? 'border-red-300 focus:ring-red-550' : 'border-slate-200 focus:ring-blue-500'
                }`}
              />
              {errors.description && <p className="text-[10px] text-red-600 mt-1">{errors.description.message}</p>}
            </div>

            {/* Property Type select */}
            <div>
              <label className="block text-[10px] font-bold text-slate-700 mb-1 uppercase tracking-wide">Property Category</label>
              <select
                {...register('property_type')}
                className="w-full text-xs font-sans px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 font-semibold focus:outline-none"
              >
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="studio">Studio</option>
                <option value="commercial">Commercial</option>
                <option value="land">Land</option>
              </select>
            </div>

            {/* Listing Type Select */}
            <div>
              <label className="block text-[10px] font-bold text-slate-700 mb-1 uppercase tracking-wide">Deal category</label>
              <select
                {...register('listing_type')}
                className="w-full text-xs font-sans px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 font-semibold focus:outline-none"
              >
                <option value="rent">To Rent</option>
                <option value="sale">For Sale</option>
              </select>
            </div>

            {/* Price Input */}
            <div>
              <label className="block text-[10px] font-bold text-slate-700 mb-1 uppercase tracking-wide">Pricing Valuation (GH₵)</label>
              <input
                type="number"
                placeholder="e.g. 450000"
                {...register('price')}
                className={`w-full text-xs font-sans px-3 py-2.5 border rounded-xl focus:outline-none focus:ring-2 bg-slate-50/50 ${
                  errors.price ? 'border-red-300 focus:ring-red-550' : 'border-slate-200 focus:ring-blue-505'
                }`}
              />
              {errors.price && <p className="text-[10px] text-red-600 mt-1">{errors.price.message}</p>}
            </div>

            {/* Physical Size boundary */}
            <div>
              <label className="block text-[10px] font-bold text-slate-700 mb-1 uppercase tracking-wide">Physical Ground Size Area (m²)</label>
              <input
                type="number"
                placeholder="e.g. 185"
                {...register('area_sqm')}
                className={`w-full text-xs font-sans px-3 py-2.5 border rounded-xl focus:outline-none focus:ring-2 bg-slate-50/50 ${
                  errors.area_sqm ? 'border-red-300 focus:ring-red-550' : 'border-slate-200 focus:ring-blue-505'
                }`}
              />
              {errors.area_sqm && <p className="text-[10px] text-red-600 mt-1">{errors.area_sqm.message}</p>}
            </div>

            {/* Conditionally render Bed / Bath badges if NOT commercial / land type */}
            {!isLandOrComm && (
              <>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1 uppercase tracking-wide">Bedrooms count</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 3"
                    {...register('bedrooms')}
                    className="w-full text-xs font-sans px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none bg-slate-50/50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1 uppercase tracking-wide">Bathrooms count</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 2"
                    {...register('bathrooms')}
                    className="w-full text-xs font-sans px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none bg-slate-50/50"
                  />
                </div>
              </>
            )}

            {/* Display status */}
            <div>
              <label className="block text-[10px] font-bold text-slate-700 mb-1 uppercase tracking-wide">Listing status</label>
              <select
                {...register('status')}
                className="w-full text-xs font-sans px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="available">Available</option>
                <option value="sold">Sold</option>
                <option value="rented">Rented</option>
                <option value="archived">Archived</option>
              </select>
            </div>

          </div>
        </div>

        {/* Location area card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
          <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider font-mono">2. Location Coordinates</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* City */}
            <div>
              <label className="block text-[10px] font-bold text-slate-700 mb-1 uppercase tracking-wide">Location City</label>
              <input
                type="text"
                placeholder="e.g. Accra, Kumasi"
                {...register('location_city')}
                className={`w-full text-xs font-sans px-3 py-2.5 border rounded-xl focus:outline-none focus:ring-2 bg-slate-50/50 ${
                  errors.location_city ? 'border-red-300 focus:ring-red-550' : 'border-slate-200 focus:ring-blue-500'
                }`}
              />
              {errors.location_city && <p className="text-[10px] text-red-600 mt-1">{errors.location_city.message}</p>}
            </div>

            {/* Area */}
            <div>
              <label className="block text-[10px] font-bold text-slate-700 mb-1 uppercase tracking-wide">Neighborhood / Area</label>
              <input
                type="text"
                placeholder="e.g. East Legon, Cantonments"
                {...register('location_area')}
                className={`w-full text-xs font-sans px-3 py-2.5 border rounded-xl focus:outline-none focus:ring-2 bg-slate-50/50 ${
                  errors.location_area ? 'border-red-300 focus:ring-red-550' : 'border-slate-200 focus:ring-blue-550'
                }`}
              />
              {errors.location_area && <p className="text-[10px] text-red-600 mt-1">{errors.location_area.message}</p>}
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-700 mb-1 uppercase tracking-wide">Physical Street Address (Optional)</label>
              <input
                type="text"
                placeholder="e.g. 15 Spintex Road, block B-2"
                {...register('location_address')}
                className="w-full text-xs font-sans px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Media parameters card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider font-mono">3. Media Attachments</h3>
            <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 font-bold font-mono rounded">
              {imageUrls.length} of 5 uploaded
            </span>
          </div>

          {/* Upload panel trigger */}
          {imageUrls.length < 5 && (
            <div className="relative border-2 border-dashed border-slate-200 p-6 rounded-2xl bg-slate-50/40 hover:bg-slate-50 hover:border-blue-500 transition cursor-pointer flex flex-col items-center text-center">
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageUpload}
                disabled={uploadingFiles}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <Upload className="w-8 h-8 text-slate-400 mb-2" />
              <p className="text-xs font-bold text-slate-700">Choose images to upload</p>
              <p className="text-[10px] text-slate-500 mt-1">Acceptable files: JPEG, PNG or WEBP up to 5MB maximum.</p>
            </div>
          )}

          {uploadingFiles && (
            <div className="flex items-center gap-2 justify-center py-2 text-slate-600 text-xs font-semibold">
              <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
              <span>Uploading files to Supabase cloud storage buckets...</span>
            </div>
          )}

          {/* Thumbnails grid */}
          {imageUrls.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
              {imageUrls.map((url, index) => (
                <div key={index} className="relative aspect-square bg-slate-100 rounded-xl border border-slate-200 overflow-hidden group">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImageIdx(index)}
                    className="absolute top-1.5 right-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 shadow shadow-md transition cursor-pointer opacity-0 group-hover:opacity-100"
                    title="Remove Image"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <span className="absolute bottom-1 right-1 bg-slate-900/85 text-[8px] text-white font-mono px-1.5 py-0.5 rounded">
                    idx {index + 1}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Amenities catalog card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5 animate-slide">
          <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider font-mono">4. Amenities & Assets Checklist</h3>
          
          {/* Preset buttons */}
          <div className="flex flex-wrap gap-2">
            {COMMON_AMENITIES.map((name) => {
              const selected = amenities.includes(name);
              return (
                <button
                  type="button"
                  key={name}
                  onClick={() => toggleAmenity(name)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium cursor-pointer border transition flex items-center gap-1.5 ${
                    selected 
                      ? 'bg-blue-600 border-blue-600 text-white shadow shadow-blue-500/10' 
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {selected && <Check className="w-3.5 h-3.5" />}
                  {name}
                </button>
              );
            })}
          </div>

          {/* Custom tag append */}
          <div className="border-t border-slate-100 pt-4 mt-4 flex items-center gap-2 max-w-sm">
            <input
              type="text"
              placeholder="e.g. Solar Energy, Swimming Pool"
              value={customAmenityText}
              onChange={(e) => setCustomAmenityText(e.target.value)}
              className="w-full text-xs font-sans px-3 py-1.5 border border-slate-200 bg-slate-50 rounded-xl focus:bg-white focus:outline-none"
            />
            <button
              type="button"
              onClick={addCustomAmenity}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold shrink-0 hover:bg-blue-600 transition"
            >
              Add Custom
            </button>
          </div>
        </div>

        {/* Action controls button */}
        <div className="flex gap-3 justify-end items-center pt-2">
          <Link
            to="/dashboard/properties"
            className="px-4 py-2.5 border border-slate-250 bg-white rounded-xl text-slate-700 text-xs font-bold hover:bg-slate-50 transition"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={formMutation.isPending}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-blue-500/15 cursor-pointer uppercase tracking-wider"
          >
            {formMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving details...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isEdit ? 'Save Changes' : 'Create Listing'}</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};
