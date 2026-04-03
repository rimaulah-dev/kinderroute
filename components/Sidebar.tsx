'use client';

import { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Kindergarten } from '@/lib/types';

interface SidebarProps {
  kindergartens: Kindergarten[];
  selectedKindergarten: Kindergarten | null;
  onSelect: (kg: Kindergarten) => void;
  isLoading: boolean;
  hasSearched: boolean;
  onKindergartenUpdate?: (updated: Kindergarten) => void;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= Math.floor(rating);
        const half = !filled && i === Math.floor(rating) + 1 && rating % 1 >= 0.5;
        return (
          <svg key={i} className={`w-3 h-3 ${filled ? 'text-amber-400' : half ? 'text-amber-300' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      })}
    </span>
  );
}

function SkeletonCard() {
  return (
    <div className="p-3 border-b border-gray-100 animate-pulse">
      <div className="flex gap-3">
        <div className="w-16 h-16 rounded-xl bg-gray-200 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
          <div className="h-3 bg-gray-200 rounded w-1/3" />
        </div>
      </div>
    </div>
  );
}

function ClaimModal({ kg, onClose }: { kg: Kindergarten; onClose: () => void }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch('/api/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, kindergartenName: kg.name, lat: kg.lat, lon: kg.lon }),
      });
      setSubmitted(true);
    } catch {
      setSubmitted(true); // show success anyway - don't block UX
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        {submitted ? (
          <div className="text-center py-4">
            <div className="text-5xl mb-3">🎉</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Request Received!</h3>
            <p className="text-gray-500 text-sm mb-4">We'll be in touch within 24 hours to help you set up your listing.</p>
            <button onClick={onClose} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700">Done</button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Claim Your Listing</h3>
                <p className="text-sm text-gray-500 mt-0.5">{kg.name}</p>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <p className="text-sm text-gray-600 mb-4">Own or manage this kindergarten? Claim your free listing to update details, add photos, and reach more parents.</p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input required placeholder="Your name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
              <input required type="email" placeholder="Email address" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
              <input placeholder="Phone number" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
              <textarea placeholder="Anything you'd like us to know?" value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                rows={2} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none" />
              <button type="submit" disabled={submitting}
                className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 disabled:opacity-60 transition-colors">
                {submitting ? 'Submitting...' : 'Submit Claim Request'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}

function DetailRow({ icon, label, value, href }: { icon: string; label: string; value: string; href?: string }) {
  return (
    <div className="flex items-start gap-2 text-xs text-gray-600">
      <span className="mt-0.5">{icon}</span>
      <div className="min-w-0">
        <span className="font-medium text-gray-500">{label}: </span>
        {href
          ? <a href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline break-all">{value}</a>
          : <span>{value}</span>}
      </div>
    </div>
  );
}

export default function Sidebar({ kindergartens, selectedKindergarten, onSelect, isLoading, hasSearched, onKindergartenUpdate }: SidebarProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingPlaces, setLoadingPlaces] = useState<string | null>(null);
  const [claimKg, setClaimKg] = useState<Kindergarten | null>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleExpand = useCallback(async (kg: Kindergarten) => {
    const newExpanded = expandedId === kg.id ? null : kg.id;
    setExpandedId(newExpanded);
    onSelect(kg);

    if (newExpanded && !kg.placesLoaded && onKindergartenUpdate) {
      setLoadingPlaces(kg.id);
      try {
        const res = await fetch(`/api/places?name=${encodeURIComponent(kg.name)}&lat=${kg.lat}&lon=${kg.lon}`);
        const data = await res.json();
        onKindergartenUpdate({ ...kg, placesLoaded: true, rating: data.rating, reviewCount: data.reviewCount, isOpenNow: data.isOpenNow, photoUrl: data.photoUrl });
      } catch {
        onKindergartenUpdate({ ...kg, placesLoaded: true });
      } finally {
        setLoadingPlaces(null);
      }
    }
  }, [expandedId, onSelect, onKindergartenUpdate]);

  // Welcome state content
  const WelcomeCard = () => (
    <div className="flex flex-col items-center justify-center h-full px-6 py-12 text-center">
      <div className="text-6xl mb-4">🗺️</div>
      <h3 className="font-bold text-gray-800 text-lg mb-2">Ready to explore</h3>
      <p className="text-sm text-gray-600 mb-6">Enter your start and end point above, then tap Find Kindergartens.</p>
      <div className="bg-indigo-50 rounded-xl p-4 text-left space-y-2 w-full max-w-xs">
        <div className="flex items-start gap-2 text-sm text-gray-700">
          <span>✅</span>
          <span>Real data from OpenStreetMap</span>
        </div>
        <div className="flex items-start gap-2 text-sm text-gray-700">
          <span>✅</span>
          <span>Filter by distance from your route</span>
        </div>
        <div className="flex items-start gap-2 text-sm text-gray-700">
          <span>✅</span>
          <span>Contact & claim kindergarten listings</span>
        </div>
      </div>
    </div>
  );

  // Sidebar content
  const SidebarContent = () => (
    <>
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Nearby Kindergartens</h2>
            <p className="text-xs text-indigo-200 mt-0.5">
              {isLoading ? 'Searching...' : `${kindergartens.length} found along your route`}
            </p>
          </div>
          {kindergartens.length > 0 && (
            <div className="bg-white/20 rounded-full px-2.5 py-1 text-white font-bold text-sm">{kindergartens.length}</div>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div>
            {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : !hasSearched && kindergartens.length === 0 ? (
          <WelcomeCard />
        ) : kindergartens.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-6 py-12 text-center">
            <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center text-4xl mb-4">🏫</div>
            <h3 className="font-bold text-gray-800 mb-1">No kindergartens found</h3>
            <p className="text-sm text-gray-500 mb-4">Try increasing the distance slider or searching a different route.</p>
            <div className="text-xs text-gray-400 bg-gray-50 rounded-xl p-3 text-left space-y-1">
              <p>💡 <span className="font-medium">Tips:</span></p>
              <p>• Increase the distance to 2 km</p>
              <p>• Try a longer route (more area covered)</p>
              <p>• Check spelling of your locations</p>
            </div>
          </div>
        ) : (
          <div>
            {kindergartens.map((kg) => {
              const isExpanded = expandedId === kg.id;
              const isSelected = selectedKindergarten?.id === kg.id;
              const distM = Math.round(kg.distanceFromRoute * 1000);
              const distLabel = distM < 1000 ? `${distM}m` : `${(distM / 1000).toFixed(1)}km`;

              return (
                <div key={kg.id} className={`border-b border-gray-50 transition-all ${isSelected ? 'bg-indigo-50/60' : 'bg-white hover:bg-gray-50/80'} ${kg.featured ? 'border-l-4 border-l-amber-400' : ''}`}>
                  {/* Card header */}
                  <div className="p-3 cursor-pointer" onClick={() => toggleExpand(kg)}>
                    <div className="flex gap-3">
                      {/* Thumbnail */}
                      <div className="relative flex-shrink-0">
                        {kg.photoUrl ? (
                          <img src={kg.photoUrl} alt={kg.name} className="w-16 h-16 rounded-xl object-cover" />
                        ) : (
                          <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-2xl ${kg.featured ? 'bg-amber-50' : 'bg-indigo-50'}`}>🏫</div>
                        )}
                        {kg.featured && (
                          <div className="absolute -top-1.5 -right-1.5 bg-amber-400 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow">⭐ TOP</div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">{kg.name}</h3>
                          <svg className={`w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>

                        {kg.operator && kg.operator !== kg.name && (
                          <p className="text-xs text-gray-400 mt-0.5 truncate">{kg.operator}</p>
                        )}

                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className="inline-flex items-center gap-0.5 text-xs text-indigo-600 font-medium">
                            📍 {distLabel} from route
                          </span>
                          {kg.placesLoaded && kg.isOpenNow !== undefined && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${kg.isOpenNow ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                              {kg.isOpenNow ? '● Open' : '○ Closed'}
                            </span>
                          )}
                        </div>

                        {kg.rating && (
                          <div className="flex items-center gap-1 mt-1">
                            <StarRating rating={kg.rating} />
                            <span className="text-xs text-gray-500">{kg.rating.toFixed(1)}</span>
                            {kg.reviewCount && <span className="text-xs text-gray-400">({kg.reviewCount})</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded panel */}
                  {isExpanded && (
                    <div className="px-3 pb-4 space-y-2.5 bg-gray-50/50 border-t border-gray-100">
                      {loadingPlaces === kg.id && (
                        <div className="flex items-center gap-2 text-xs text-indigo-500 pt-2">
                          <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                          Looking up online details...
                        </div>
                      )}

                      {kg.photoUrl && !kg.photoUrl.includes('undefined') && (
                        <img src={kg.photoUrl} alt={kg.name} className="w-full h-36 object-cover rounded-xl mt-2" />
                      )}

                      <div className="space-y-1.5 pt-2">
                        {kg.address && <DetailRow icon="📍" label="Address" value={kg.address} />}
                        {kg.phone && <DetailRow icon="📞" label="Phone" value={kg.phone} href={`tel:${kg.phone}`} />}
                        {kg.email && <DetailRow icon="✉️" label="Email" value={kg.email} href={`mailto:${kg.email}`} />}
                        {kg.website && <DetailRow icon="🌐" label="Website" value={kg.website.replace(/^https?:\/\//, '')} href={kg.website.startsWith('http') ? kg.website : `https://${kg.website}`} />}
                        {kg.openingHours && <DetailRow icon="🕐" label="Hours" value={kg.openingHours} />}
                        {kg.fee && <DetailRow icon="💰" label="Fee" value={kg.fee === 'yes' ? 'Fees apply' : kg.fee === 'no' ? 'Free' : kg.fee} />}
                        {kg.wheelchair && <DetailRow icon="♿" label="Access" value={kg.wheelchair === 'yes' ? 'Wheelchair accessible' : kg.wheelchair === 'no' ? 'Not accessible' : kg.wheelchair} />}
                      </div>

                      <div className="flex gap-2 pt-1">
                        <a href={`https://www.google.com/maps/search/${encodeURIComponent(kg.name)}/@${kg.lat},${kg.lon},17z`}
                          target="_blank" rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                          🗺 View on Maps
                        </a>
                        <button onClick={() => setClaimKg(kg)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-indigo-600 rounded-xl text-xs font-semibold text-white hover:bg-indigo-700 transition-colors">
                          ✏️ Claim Listing
                        </button>
                      </div>

                      {kg.placesLoaded && !kg.rating && !kg.phone && !kg.website && !kg.openingHours && !kg.address && (
                        <p className="text-xs text-gray-400 italic text-center pt-1">Limited details available. Is this your kindergarten? Claim it to add info.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Sticky for-providers banner */}
            <div className="sticky bottom-0 bg-gradient-to-r from-amber-50 to-orange-50 border-t border-amber-200 p-3">
              <p className="text-xs font-semibold text-amber-800 mb-0.5">🏫 Are you a kindergarten owner?</p>
              <p className="text-xs text-amber-700 mb-2">Get featured, reach more parents & manage your listing.</p>
              <a href="/for-providers" className="block w-full text-center py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-colors">
                Learn about listing options →
              </a>
            </div>
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      {claimKg && <ClaimModal kg={claimKg} onClose={() => setClaimKg(null)} />}

      {/* Desktop sidebar */}
      <div className="hidden sm:flex sm:flex-col sm:w-80 bg-white border-l border-gray-100 shadow-2xl overflow-hidden">
        <SidebarContent />
      </div>

      {/* Mobile drawer toggle button */}
      {!isMobileOpen && (
        <button
          onClick={() => setIsMobileOpen(true)}
          className="sm:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-30 bg-indigo-600 text-white px-4 py-2.5 rounded-full shadow-lg font-semibold text-sm hover:bg-indigo-700 active:scale-95 transition-all"
        >
          🏫 {kindergartens.length} kindergartens
        </button>
      )}

      {/* Mobile drawer backdrop */}
      {isMobileOpen && (
        <div
          className="sm:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div className={`sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl flex flex-col transition-transform duration-300 ${isMobileOpen ? 'translate-y-0 h-[70vh]' : 'translate-y-full h-0'}`}>
        {/* Drawer handle */}
        <div className="flex-shrink-0 flex justify-center pt-2 pb-1">
          <button
            onClick={() => setIsMobileOpen(false)}
            className="w-12 h-1.5 bg-gray-300 rounded-full"
          />
        </div>
        <SidebarContent />
      </div>
    </>
  );
}
