import React, { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet.heat';

interface IHeatmapPoint {
  latitude: number;
  longitude: number;
  weight: number;
}

interface OrderHeatmapProps {
  points: IHeatmapPoint[];
}

const HeatmapLayer = ({ points }: { points: IHeatmapPoint[] }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || points.length === 0) return;

    console.log("Heatmap points:", points);

    const heatPoints = points.map(p => [p.latitude, p.longitude, p.weight * 5] as L.HeatLatLngTuple);
    const heatLayer = (L as any).heatLayer(heatPoints, {
      radius: 40,
      blur: 20,
      max: 1.0,
      gradient: { 0.2: 'blue', 0.4: 'cyan', 0.6: 'lime', 0.8: 'yellow', 1.0: 'red' }
    });

    heatLayer.addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points]);

  return null;
};

export const OrderHeatmap: React.FC<OrderHeatmapProps> = ({ points }) => {
  const defaultCenter: [number, number] = [10.762622, 106.660172]; // Ho Chi Minh City
  const center = points.length > 0 ? [points[0].latitude, points[0].longitude] as [number, number] : defaultCenter;

  return (
    <div style={{ height: '400px', width: '100%', borderRadius: '0.75rem', overflow: 'hidden' }}>
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <HeatmapLayer points={points} />
      </MapContainer>
    </div>
  );
};
