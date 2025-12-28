export type HotelPackageTemplate = {
  /** Stable slug used as templateId */
  id: string;
  /** Human-friendly name */
  name: string;
};

export const HOTEL_PACKAGE_TEMPLATES: readonly HotelPackageTemplate[] = [
  { id: 'weekend-getaway', name: 'Weekend Getaway' },
  { id: 'honeymoon', name: 'Honeymoon' },
  { id: 'family-vacation', name: 'Family Vacation' },
  { id: 'corporate-retreat', name: 'Corporate Retreat' },
  { id: 'ski-snow-holiday', name: 'Ski/Snow Holiday' },
  { id: 'golf-getaway', name: 'Golf Getaway' },
  { id: 'staycation', name: 'Staycation' },
  { id: 'wellness-spa', name: 'Wellness & Spa' },
  { id: 'cultural-experience', name: 'Cultural Experience' },
  { id: 'food-wine', name: 'Food & Wine' },
  { id: 'anniversary', name: 'Anniversary' },
  { id: 'eco-nature', name: 'Eco-Nature' },
  { id: 'festival-events', name: 'Festival & Events' },
  { id: 'adventure', name: 'Adventure' },
] as const;

export const HOTEL_PACKAGE_TEMPLATE_IDS = HOTEL_PACKAGE_TEMPLATES.map((t) => t.id);
