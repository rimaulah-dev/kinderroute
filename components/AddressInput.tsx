'use client';

import { useState, useEffect, useRef, ReactNode } from 'react';

interface AddressInputProps {
  value: string;
  onChange: (v: string) => void;
  onSelect: (v: string) => void;
  placeholder: string;
  icon: ReactNode;
}

interface Suggestion {
  display_name: string;
  lat: string;
  lon: string;
}

export default function AddressInput({ value, onChange, onSelect, placeholder, icon }: AddressInputProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isSelectedRef = useRef(false);
  const cacheRef = useRef<Map<string, unknown[]>>(new Map());

  useEffect(() => {
    if (isSelectedRef.current) {
      isSelectedRef.current = false;
      return;
    }

    if (value.length >= 2) {
      // Check cache first
      const cacheKey = value.toLowerCase().trim();
      const cached = cacheRef.current.get(cacheKey);
      if (cached) {
        setSuggestions(cached as Suggestion[]);
        setShowDropdown(true);
        return;
      }

      // Debounce 150ms
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/autocomplete?q=${encodeURIComponent(value)}`);
          const data = await response.json();
          cacheRef.current.set(cacheKey, data || []);
          setSuggestions(data || []);
          setShowDropdown(true);
        } catch (error) {
          console.error('[AddressInput] Autocomplete error:', error);
          setSuggestions([]);
        } finally {
          setIsLoading(false);
        }
      }, 150);
    } else {
      setSuggestions([]);
      setShowDropdown(false);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value]);

  const handleSelectSuggestion = (displayName: string) => {
    isSelectedRef.current = true;
    onSelect(displayName);
    setShowDropdown(false);
    setSuggestions([]);
  };

  const handleBlur = () => {
    // Delay to allow click to register
    setTimeout(() => {
      setShowDropdown(false);
    }, 150);
  };

  const truncate = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div ref={containerRef} className="relative z-[9999] flex-1">
      <div className="flex items-center gap-2 bg-white/15 backdrop-blur rounded-xl px-3 py-2 border border-white/20 focus-within:border-white/60 transition-colors">
        <span className="text-sm">{icon}</span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={handleBlur}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowDropdown(true);
            }
          }}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-white placeholder-white/50 text-sm outline-none"
        />
      </div>

      {showDropdown && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-[9999] max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelectSuggestion(suggestion.display_name)}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 transition-colors border-b border-gray-50 last:border-b-0"
            >
              {truncate(suggestion.display_name, 60)}
            </button>
          ))}
        </div>
      )}

      {isLoading && showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-100 px-3 py-2 z-[9999]">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            Searching...
          </div>
        </div>
      )}
    </div>
  );
}
