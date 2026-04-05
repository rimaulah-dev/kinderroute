'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { geocodeAddress } from '@/lib/geocoding';
import { searchKindergartensAlongRoute } from '@/lib/kindergartens';
import { getRoute } from '@/lib/routing';
import { Kindergarten, Route } from '@/lib/types';
import Sidebar from '@/components/Sidebar';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';
import AddressInput from '@/components/AddressInput';

const Map = dynamic(() => import('@/components/Map'), { ssr: false });

export default function Home() {
  const [pointA, setPointA] = useState('Chow Kit, Kuala Lumpur');
  const [pointB, setPointB] = useState('KLCC, Kuala Lumpur');
  const [pointACoords, setPointACoords] = useState<[number, number] | null>(null);
  const [pointBCoords, setPointBCoords] = useState<[number, number] | null>(null);
  const [allKindergartens, setAllKindergartens] = useState<Kindergarten[]>([]);
  const [filteredKindergartens, setFilteredKindergartens] = useState<Kindergarten[]>([]);
  const [selectedKindergarten, setSelectedKindergarten] = useState<Kindergarten | null>(null);
  const [route, setRoute] = useState<Route | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [maxDistanceMetres, setMaxDistanceMetres] = useState(1500);
  const [hasSearched, setHasSearched] = useState(false);
  const [routeSummary, setRouteSummary] = useState<{ distance: number; duration: number } | null>(null);
  const [searchStage, setSearchStage] = useState<'idle' | 'geocoding' | 'routing' | 'finding'>('idle');
  const [searchNotice, setSearchNotice] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const sliderDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const searchCacheRef = useRef<Map<string, {
    pointA: [number, number];
    pointB: [number, number];
    route: Route;
    all: Kindergarten[];
    filtered: Kindergarten[];
    routeSummary: { distance: number; duration: number };
  }>>(new Map());

  const stageLabel: Record<'idle' | 'geocoding' | 'routing' | 'finding', string> = {
    idle: '',
    geocoding: 'Finding addresses...',
    routing: 'Calculating route...',
    finding: 'Finding kindergartens...',
  };

  const getSearchCacheKey = (from: string, to: string, distanceMetres: number) =>
    `${from.trim().toLowerCase()}|${to.trim().toLowerCase()}|${distanceMetres}`;

  const sortAndFilter = useCallback((kindergartens: Kindergarten[], distanceMetres: number) => {
    const filtered = kindergartens.filter(kg => kg.distanceFromRoute * 1000 <= distanceMetres);
    filtered.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return a.distanceFromRoute - b.distanceFromRoute;
    });
    return filtered;
  }, []);

  const handleSearch = async () => {
    if (isLoading) return;

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const cacheKey = getSearchCacheKey(pointA, pointB, maxDistanceMetres);

    const cached = searchCacheRef.current.get(cacheKey);
    if (cached) {
      setPointACoords(cached.pointA);
      setPointBCoords(cached.pointB);
      setRoute(cached.route);
      setRouteSummary(cached.routeSummary);
      setAllKindergartens(cached.all);
      setFilteredKindergartens(cached.filtered);
      setSelectedKindergarten(null);
      setError(cached.filtered.length === 0
        ? `No kindergartens found within ${maxDistanceMetres}m of the route. Try increasing the distance.`
        : null);
      setHasSearched(true);
      setSearchNotice('Loaded cached results.');
      abortControllerRef.current = null;
      return;
    }

    setIsLoading(true);
    setSearchStage('geocoding');
    setSearchNotice(null);
    setError(null);

    try {
      const [locA, locB] = await Promise.all([
        geocodeAddress(pointA, { signal: controller.signal }),
        geocodeAddress(pointB, { signal: controller.signal }),
      ]);

      if (!locA || !locB) {
        setError('Could not find one or both locations. Try a well-known landmark or neighbourhood.');
        return;
      }

      setSearchStage('routing');
      const routeData = await getRoute(
        { lat: locA.lat, lon: locA.lon },
        { lat: locB.lat, lon: locB.lon },
        { signal: controller.signal }
      );

      if (!routeData) {
        setError('Could not calculate a driving route between these two points.');
        return;
      }

      setSearchStage('finding');
      const kgs = await searchKindergartensAlongRoute(routeData, maxDistanceMetres, {
        signal: controller.signal,
      });

      const filtered = sortAndFilter(kgs, maxDistanceMetres);

      if (filtered.length === 0) {
        setError(`No kindergartens found within ${maxDistanceMetres}m of the route. Try increasing the distance.`);
      }

      const coordsA: [number, number] = [locA.lat, locA.lon];
      const coordsB: [number, number] = [locB.lat, locB.lon];
      setPointACoords(coordsA);
      setPointBCoords(coordsB);
      setRoute(routeData);
      setRouteSummary({ distance: routeData.distance, duration: routeData.duration });
      setAllKindergartens(kgs);
      setFilteredKindergartens(filtered);
      setSelectedKindergarten(null);
      setHasSearched(true);

      searchCacheRef.current.set(cacheKey, {
        pointA: coordsA,
        pointB: coordsB,
        route: routeData,
        routeSummary: { distance: routeData.distance, duration: routeData.duration },
        all: kgs,
        filtered,
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setSearchNotice('Search canceled.');
        return;
      }
      console.error('[handleSearch] Error:', err);
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(`Search failed: ${msg}. Please try again.`);
    } finally {
      setIsLoading(false);
      setSearchStage('idle');
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  };

  const handleCancelSearch = () => {
    abortControllerRef.current?.abort();
  };

  const handleSliderChange = useCallback((newDistance: number) => {
    setMaxDistanceMetres(newDistance);
    setError(null);
    if (sliderDebounceRef.current) {
      clearTimeout(sliderDebounceRef.current);
    }
    sliderDebounceRef.current = setTimeout(() => {
      if (allKindergartens.length > 0) {
        const filtered = sortAndFilter(allKindergartens, newDistance);
        setFilteredKindergartens(filtered);
        if (filtered.length === 0) {
          setError(`No kindergartens within ${newDistance}m of the route.`);
        }
      }
    }, 100);
  }, [allKindergartens, sortAndFilter]);

  useEffect(() => {
    return () => {
      if (sliderDebounceRef.current) {
        clearTimeout(sliderDebounceRef.current);
      }
    };
  }, []);

  const handleKindergartenSelect = (kg: Kindergarten) => setSelectedKindergarten(kg);

  const handleKindergartenUpdate = useCallback((updated: Kindergarten) => {
    setAllKindergartens(prev => prev.map(k => k.id === updated.id ? updated : k));
    setFilteredKindergartens(prev => prev.map(k => k.id === updated.id ? updated : k));
  }, []);

  const distLabel = maxDistanceMetres >= 1000
    ? `${(maxDistanceMetres / 1000).toFixed(1)} km`
    : `${maxDistanceMetres} m`;

  return (
    <>
      <ServiceWorkerRegistration />
      <div className="flex flex-col h-screen bg-gray-50">

        {/* ── HEADER ── */}
        <header className="bg-gradient-to-r from-indigo-600 via-blue-600 to-blue-500 text-white shadow-xl z-[9999] overflow-visible">
          <div className="px-4 py-3">

            {/* Logo row */}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-lg">🏫</div>
              <div>
                <span className="text-lg font-extrabold tracking-tight">KinderRoute</span>
                <span className="ml-2 text-xs font-medium text-blue-200 hidden sm:inline">Find kindergartens along your daily route</span>
              </div>
            </div>

            {/* Search inputs */}
            <div className="flex flex-col sm:flex-row gap-2">
              <AddressInput
                value={pointA}
                onChange={setPointA}
                onSelect={setPointA}
                placeholder="From (e.g. home address)"
                icon={<span className="text-green-300">▲</span>}
              />
              <AddressInput
                value={pointB}
                onChange={setPointB}
                onSelect={setPointB}
                placeholder="To (e.g. office, school)"
                icon={<span className="text-red-300">▼</span>}
              />
              <button
                onClick={handleSearch}
                disabled={isLoading}
                className="sm:w-auto w-full px-6 py-2.5 bg-white text-indigo-700 font-bold rounded-xl hover:bg-indigo-50 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl active:scale-95 text-sm whitespace-nowrap"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                    {stageLabel[searchStage] || 'Searching...'}
                  </span>
                ) : '🔍 Find Kindergartens'}
              </button>
              {isLoading && (
                <button
                  onClick={handleCancelSearch}
                  className="sm:w-auto w-full px-4 py-2.5 bg-white/20 text-white font-semibold rounded-xl hover:bg-white/30 transition-all text-sm whitespace-nowrap border border-white/30"
                >
                  Cancel Search
                </button>
              )}
            </div>

            {isLoading && searchStage !== 'idle' && (
              <div className="mt-2 text-xs text-blue-100">
                {hasSearched ? 'Updating results… ' : ''}
                {stageLabel[searchStage]}
              </div>
            )}

            {/* Distance slider */}
            <div className="flex items-center gap-3 mt-2.5">
              <span className="text-xs text-blue-200 whitespace-nowrap">📏 Within:</span>
              <input
                type="range"
                min={100}
                max={2000}
                step={50}
                value={maxDistanceMetres}
                onChange={(e) => handleSliderChange(Number(e.target.value))}
                className="flex-1 h-1.5 accent-white cursor-pointer"
              />
              <span className="text-sm font-bold text-white min-w-[55px] text-right bg-white/20 rounded-lg px-2 py-0.5">{distLabel}</span>
            </div>

            {/* Route summary */}
            {routeSummary && (
              <div className="flex items-center gap-3 mt-1.5 text-xs text-blue-100">
                <span>🛣 {(routeSummary.distance / 1000).toFixed(1)} km route</span>
                <span>·</span>
                <span>⏱ ~{Math.round(routeSummary.duration / 60)} min drive</span>
                <span>·</span>
                <span>🏫 {filteredKindergartens.length} kindergartens</span>
              </div>
            )}

            {error && (
              <div className="mt-2 flex items-start gap-2 px-3 py-2 bg-red-500/20 border border-red-400/30 text-red-100 rounded-xl text-xs">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {searchNotice && (
              <div className="mt-2 flex items-start gap-2 px-3 py-2 bg-blue-500/20 border border-blue-300/30 text-blue-100 rounded-xl text-xs">
                <span>ℹ️</span>
                <span>{searchNotice}</span>
              </div>
            )}
          </div>
        </header>

        {/* ── MAIN CONTENT ── */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1">
            <Map
              pointA={pointACoords}
              pointB={pointBCoords}
              kindergartens={filteredKindergartens}
              selectedKindergarten={selectedKindergarten}
              route={route}
              onKindergartenClick={handleKindergartenSelect}
            />
          </div>
          <Sidebar
            kindergartens={filteredKindergartens}
            selectedKindergarten={selectedKindergarten}
            onSelect={handleKindergartenSelect}
            isLoading={isLoading}
            hasSearched={hasSearched}
            onKindergartenUpdate={handleKindergartenUpdate}
          />
        </div>
      </div>
    </>
  );
}
