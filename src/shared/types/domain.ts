export type UserRole = 'agent' | 'admin' | 'client';

export type PropertyType = 'apartment' | 'house' | 'land' | 'commercial' | 'studio';
export type ListingType = 'sale' | 'rent';
export type PropertyStatus = 'available' | 'rented' | 'sold' | 'archived';

export type ClientType = 'buyer' | 'renter' | 'seller' | 'investor';
export type ClientStatus = 'lead' | 'active' | 'closed' | 'inactive';

export type InquiryStatus = 'new' | 'read' | 'responded' | 'closed';
export type ReminderStatus = 'pending' | 'completed' | 'dismissed';

export type InteractionType = 'call' | 'email' | 'meeting' | 'site_visit' | 'whatsapp' | 'note';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Property {
  id: string;
  title: string;
  description: string;
  property_type: PropertyType;
  listing_type: ListingType;
  price: number;
  bedrooms?: number;
  bathrooms?: number;
  area_sqm?: number;
  location_city: string;
  location_area: string;
  location_address?: string;
  status: PropertyStatus | string;
  image_urls?: string[];
  amenities?: string[];
  created_at: string;
  agent_id?: string;
  agent_email?: string;
}

export interface Client {
  id: string;
  agent_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  client_type: ClientType | null;
  status: ClientStatus;
  notes: string | null;
  source: string | null;
  created_at: string;
}
