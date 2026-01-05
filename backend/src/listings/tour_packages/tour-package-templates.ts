export type TourPackageTemplate = {
  /** Stable slug used as tripType */
  id: string;
  /** Human-friendly name */
  name: string;
};

export const TOUR_PACKAGE_TEMPLATES: readonly TourPackageTemplate[] = [
  { id: 'adventure', name: 'Adventure' },
  { id: 'cultural-experience', name: 'Cultural Experience' },
  { id: 'eco-nature', name: 'Eco-Nature' },
  { id: 'festival-events', name: 'Festival & Events' },
  { id: 'food-wine', name: 'Food & Wine' },
  { id: 'golf-getaway', name: 'Golf Getaway' },
  { id: 'hiking-trekking', name: 'Hiking & Trekking' },
  { id: 'historical-tour', name: 'Historical Tour' },
  { id: 'island-beach', name: 'Island & Beach' },
  { id: 'mountain-retreat', name: 'Mountain Retreat' },
  { id: 'photography-tour', name: 'Photography Tour' },
  { id: 'spiritual-wellness', name: 'Spiritual & Wellness' },
  { id: 'wildlife-safari', name: 'Wildlife Safari' },
  { id: 'winter-sports', name: 'Winter Sports' },
] as const;

export const TOUR_PACKAGE_TEMPLATE_IDS = TOUR_PACKAGE_TEMPLATES.map((t) => t.id);
