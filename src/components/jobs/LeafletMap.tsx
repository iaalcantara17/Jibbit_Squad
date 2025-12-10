import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface JobMarker {
  id: string;
  title: string;
  company: string;
  location: string;
  latitude: number;
  longitude: number;
  commute_distance?: number;
  commute_time?: number;
}

interface HomeLocation {
  latitude: number;
  longitude: number;
  address: string;
}

interface LeafletMapProps {
  center: [number, number];
  jobs: JobMarker[];
  homeLocation?: HomeLocation | null;
  onJobSelect: (job: JobMarker) => void;
}

export function LeafletMap({ center, jobs, homeLocation, onJobSelect }: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    mapInstanceRef.current = L.map(mapRef.current).setView(center, 10);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapInstanceRef.current);

    markersRef.current = L.layerGroup().addTo(mapInstanceRef.current);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update center when it changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(center, 10);
    }
  }, [center]);

  // Update markers when jobs or homeLocation change
  useEffect(() => {
    if (!markersRef.current) return;

    // Clear existing markers
    markersRef.current.clearLayers();

    // Add home marker
    if (homeLocation) {
      const homeIcon = L.divIcon({
        className: 'custom-marker',
        html: '<div style="background: #3b82f6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      L.marker([homeLocation.latitude, homeLocation.longitude], { icon: homeIcon })
        .bindPopup(`<strong>Home</strong><br/>${homeLocation.address}`)
        .addTo(markersRef.current);
    }

    // Add job markers
    jobs.forEach((job) => {
      const marker = L.marker([job.latitude, job.longitude])
        .bindPopup(`
          <div style="min-width: 180px;">
            <strong>${job.title}</strong><br/>
            <span style="color: #666;">${job.company}</span><br/>
            ${job.location}
            ${job.commute_distance ? `<br/><span style="color: #3b82f6;">${job.commute_distance} mi • ~${job.commute_time} min</span>` : ''}
          </div>
        `)
        .on('click', () => onJobSelect(job))
        .addTo(markersRef.current!);
    });
  }, [jobs, homeLocation, onJobSelect]);

  return (
    <div 
      ref={mapRef} 
      style={{ height: '100%', width: '100%' }}
    />
  );
}
