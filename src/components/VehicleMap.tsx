
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { VehicleLocation } from '../../shared/types';
import { MapPin } from 'lucide-react';

interface VehicleMapProps {
  vehicles: VehicleLocation[];
  height?: string;
}

const statusColors: Record<string, string> = {
  available: '#10b981',
  rented: '#3b82f6',
  maintenance: '#f59e0b',
  cleaning: '#8b5cf6',
};

const statusLabels: Record<string, string> = {
  available: '可预订',
  rented: '已租出',
  maintenance: '维护中',
  cleaning: '清洁中',
};

export default function VehicleMap({ vehicles, height = '400px' }: VehicleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [39.9042, 116.4074],
      zoom: 12,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !vehicles.length) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    vehicles.forEach((vehicle) => {
      const color = statusColors[vehicle.status] || '#6b7280';
      const label = statusLabels[vehicle.status] || vehicle.status;

      const customIcon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            width: 36px;
            height: 36px;
            background: ${color};
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid white;
          ">
            <span style="
              transform: rotate(45deg);
              color: white;
              font-size: 12px;
              font-weight: bold;
            ">🚗</span>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36],
      });

      const marker = L.marker([vehicle.lat, vehicle.lng], { icon: customIcon })
        .bindPopup(
          `<div class="p-2">
            <p class="font-bold text-sm">${vehicle.plate_number}</p>
            <p class="text-xs text-gray-600">${vehicle.brand} ${vehicle.model}</p>
            <p class="text-xs mt-1">
              <span style="color: ${color}; font-weight: 500;">● ${label}</span>
            </p>
          </div>`
        )
        .addTo(mapInstanceRef.current!);

      markersRef.current.push(marker);
    });

    if (vehicles.length > 0) {
      const bounds = L.latLngBounds(vehicles.map((v) => [v.lat, v.lng]));
      if (bounds.isValid()) {
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [vehicles]);

  return (
    <div className="relative">
      <div ref={mapRef} style={{ height, width: '100%', borderRadius: '12px' }} />

      <div className="absolute top-4 right-4 bg-white/95 backdrop-blur rounded-lg shadow-lg p-3 z-[1000]">
        <p className="text-xs font-medium text-gray-700 mb-2">车辆状态图例</p>
        <div className="space-y-1.5">
          {Object.entries(statusLabels).map(([status, label]) => (
            <div key={status} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: statusColors[status] }}
              ></div>
              <span className="text-xs text-gray-600">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
