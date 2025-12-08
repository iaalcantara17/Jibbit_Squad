import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// UC-116: Location and Geo-coding Services using OpenStreetMap Nominatim
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { locations, homeLocation } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check rate limit
    const { data: rateLimit } = await supabase
      .from('api_rate_limits')
      .select('*')
      .eq('api_name', 'openstreetmap')
      .single();

    if (rateLimit && rateLimit.current_usage >= rateLimit.daily_limit) {
      return new Response(
        JSON.stringify({ error: 'Geocoding API rate limit exceeded. Please try again tomorrow.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = [];

    for (const location of locations || []) {
      if (!location) continue;

      // Check cache first
      const { data: cached } = await supabase
        .from('geocoded_locations')
        .select('*')
        .eq('location_string', location)
        .single();

      if (cached) {
        results.push({
          location: location,
          coordinates: {
            lat: parseFloat(cached.latitude),
            lng: parseFloat(cached.longitude)
          },
          formatted_address: cached.formatted_address,
          city: cached.city,
          state: cached.state,
          country: cached.country,
          source: 'cache'
        });
        continue;
      }

      // Rate limit: 1 request per second for Nominatim
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Geocode using OpenStreetMap Nominatim
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'ATS-Candidates-App/1.0'
          }
        }
      );

      if (!response.ok) {
        console.error('Nominatim error:', await response.text());
        continue;
      }

      const data = await response.json();

      if (data.length > 0) {
        const result = data[0];
        const geocoded = {
          location_string: location,
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          formatted_address: result.display_name,
          city: result.address?.city || result.address?.town || result.address?.village,
          state: result.address?.state,
          country: result.address?.country
        };

        // Cache the result
        await supabase.from('geocoded_locations').insert(geocoded);

        results.push({
          location: location,
          coordinates: {
            lat: geocoded.latitude,
            lng: geocoded.longitude
          },
          formatted_address: geocoded.formatted_address,
          city: geocoded.city,
          state: geocoded.state,
          country: geocoded.country,
          source: 'nominatim'
        });

        // Update rate limit
        if (rateLimit) {
          await supabase
            .from('api_rate_limits')
            .update({ current_usage: rateLimit.current_usage + 1 })
            .eq('api_name', 'openstreetmap');
        }
      }
    }

    // Calculate distances if home location provided
    const enrichedResults = results.map(result => {
      if (homeLocation && homeLocation.lat && homeLocation.lng && result.coordinates) {
        const distance = calculateDistance(
          homeLocation.lat,
          homeLocation.lng,
          result.coordinates.lat,
          result.coordinates.lng
        );
        return {
          ...result,
          distance_miles: Math.round(distance * 10) / 10,
          commute_time_minutes: estimateCommuteTime(distance)
        };
      }
      return result;
    });

    return new Response(
      JSON.stringify({ results: enrichedResults }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in geocode-location:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Haversine formula for distance calculation
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Estimate commute time based on distance
function estimateCommuteTime(distanceMiles: number): number {
  // Assume average speed of 30 mph for urban/suburban areas
  // Add 10 minutes for parking/walking
  return Math.round((distanceMiles / 30) * 60) + 10;
}