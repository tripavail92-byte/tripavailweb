# Google Maps Setup Instructions

## 1. Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable these APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API

4. Create an API key:
   - Go to Credentials
   - Click "Create Credentials" → "API Key"
   - Restrict the key to:
     - Application restrictions: HTTP referrers
     - Add your domain(s):
       - `http://localhost:3000/*`
       - `http://localhost:4000/*` (Next.js dev server)
       - Your production domain

5. API restrictions: Select Maps JavaScript API, Places API

## 2. Configure Environment Variables

Create `.env.local` in `web/` directory:

```env
# Google Maps API Key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

**Note:** The `NEXT_PUBLIC_` prefix makes it available to the browser (required for Google Maps).

## 3. Environment Setup Summary

| Variable | Required | Scope | Example |
|----------|----------|-------|---------|
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Yes | Browser | `AIzaSy...` |

## 4. Features Enabled

✅ **Location Autocomplete** - Address search with suggestions  
✅ **Interactive Maps** - View and select locations  
✅ **Reverse Geocoding** - Convert coordinates to addresses  
✅ **Marker Placement** - Click to set location on map  
✅ **Info Windows** - Display location details  

## 5. Component Usage

### LocationAutocomplete

```tsx
import { LocationAutocomplete } from '@/components/LocationAutocomplete';

<LocationAutocomplete
  value={address}
  onLocationSelect={(location) => {
    console.log('Selected:', location.lat, location.lng);
  }}
  placeholder="Search location..."
/>
```

### LocationMap

```tsx
import { LocationMap } from '@/components/LocationMap';

<LocationMap
  location={{ lat: 13.7563, lng: 100.5018 }}
  onLocationSelect={(location) => console.log(location)}
  isSelectable={true}
  zoom={12}
/>
```

## 6. Integration Points

### Operator Profile (`/operator/profile`)
- Search address with autocomplete
- View location on map
- Select coordinates via map click
- Persistent storage of base location and meeting points

### Tour Builder Step 4 (`/operator/tours`)
- Add multiple pickup locations
- Search addresses with autocomplete
- Optional coordinates for each location
- Map-based location selection

## 7. Features

| Feature | Status | Details |
|---------|--------|---------|
| Address Autocomplete | ✅ | Real-time suggestions with Places API |
| Map Display | ✅ | Interactive Google Map with markers |
| Click to Select | ✅ | Click map to set location |
| Coordinates | ✅ | Display and edit lat/lng |
| Info Windows | ✅ | Show location details in popup |
| Address Lookup | ✅ | Geocoding for address search |
| Reverse Geocoding | ✅ | Coordinates to address |

## 8. Troubleshooting

**Maps not showing?**
- Check API key is set in `.env.local`
- Verify API key has Maps JavaScript API enabled
- Check browser console for errors

**Autocomplete not working?**
- Ensure Places API is enabled
- Verify API key restrictions allow your domain
- Check that input is focused before typing

**Marker not appearing?**
- Verify latitude/longitude are valid
- Check zoom level (try zoom 12-15 for cities)
- Inspect browser console for errors

## 9. API Quota and Costs

Google Maps APIs have usage quotas:
- **Maps JavaScript API**: 25,000 loads/day free
- **Places API**: 150 requests/second free tier
- **Geocoding API**: 5,000 requests/day free

For production, set up billing alerts in Cloud Console.

## 10. Security Best Practices

✅ Use `NEXT_PUBLIC_` prefix (meant to be public)  
✅ Restrict API key to your domain(s)  
✅ Monitor usage in Cloud Console  
✅ Set up billing alerts  
✅ Use HTTP referrer restrictions  

---

**Last Updated:** Jan 4, 2026  
**Status:** Ready for Production
