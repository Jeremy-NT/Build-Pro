import type { ClientStatus, ClientType, ListingType, PropertyStatus, PropertyType, UserRole } from '../types/domain';

export const USER_ROLES: UserRole[] = ['agent', 'admin', 'client'];

export const PROPERTY_TYPES: PropertyType[] = ['apartment', 'house', 'land', 'commercial', 'studio'];
export const LISTING_TYPES: ListingType[] = ['sale', 'rent'];
export const PROPERTY_STATUSES: PropertyStatus[] = ['available', 'rented', 'sold', 'archived'];

export const CLIENT_TYPES: ClientType[] = ['buyer', 'renter', 'seller', 'investor'];
export const CLIENT_STATUSES: ClientStatus[] = ['lead', 'active', 'closed', 'inactive'];
