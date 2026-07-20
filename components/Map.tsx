'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Kindergarten, Route } from '@/lib/types';

interface MapProps {
  pointA: [number, number] | null;
  pointB: [number, number] | null;
  kindergartens: Kindergarten[];
  selectedKindergarten: Kindergarten | null;
  route: Route | null;
  onKindergartenClick: (kg: Kindergarten) => void;
}

export default function Map({ 
  pointA, 
  pointB, 
  kindergartens, 
  selectedKindergarten, 
  route,
  onKindergartenClick 
}: MapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const routeLayerRef = useRef<L.Polyline | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current).setView([3.139, 101.6869], 12);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    const createIcon = (color: string) => {
      return L.divIcon({
        className: 'custom-div-icon',
        html: '<div style="background-color:' + color + ';width:24px;height:24px;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
    };

    if (pointA) {
      const markerA = L.marker(pointA, { icon: createIcon('#22c55e') })
        .addTo(mapRef.current)
        .bindPopup('Point A');
      markersRef.current.push(markerA);
    }

    if (pointB) {
      const markerB = L.marker(pointB, { icon: createIcon('#ef4444') })
        .addTo(mapRef.current)
        .bindPopup('Point B');
      markersRef.current.push(markerB);
    }

    kindergartens.forEach(kg => {
      const isSelected = selectedKindergarten?.id === kg.id;
      const marker = L.marker([kg.lat, kg.lon], { 
        icon: createIcon(isSelected ? '#3b82f6' : '#f59e0b') 
      })
        .addTo(mapRef.current!)
        .bindPopup(kg.name + '<br>' +
          (kg.distanceFromRoute < 0.1
            ? Math.round(kg.distanceFromRoute * 1000) + ' m from route'
            : kg.distanceFromRoute.toFixed(2) + ' km from route'))
        .on('click', () => onKindergartenClick(kg));
      markersRef.current.push(marker);
    });

    if (markersRef.current.length > 0) {
      const group = L.featureGroup(markersRef.current);
      mapRef.current.fitBounds(group.getBounds().pad(0.1));
    }
  }, [pointA, pointB, kindergartens, selectedKindergarten, onKindergartenClick]);

  useEffect(() => {
    if (!mapRef.current) return;

    if (routeLayerRef.current) {
      routeLayerRef.current.remove();
      routeLayerRef.current = null;
    }

    if (route) {
      routeLayerRef.current = L.polyline(route.coordinates, {
        color: '#3b82f6',
        weight: 4,
        opacity: 0.7
      }).addTo(mapRef.current);
    }
  }, [route]);

  return <div ref={mapContainerRef} className="w-full h-full" />;
}
