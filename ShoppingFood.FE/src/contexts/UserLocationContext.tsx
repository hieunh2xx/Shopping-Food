import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

const CACHE_KEYS = {
  address: 'user_address',
  fullAddress: 'user_full_address',
  lat: 'user_lat',
  lng: 'user_lng',
  hasGps: 'user_has_gps',
} as const;

interface UserLocationState {
  address: string;
  fullAddress: string;
  latitude: number | null;
  longitude: number | null;
  hasGps: boolean;
  isLoading: boolean;
}

const UserLocationContext = createContext<UserLocationState | null>(null);

export function UserLocationProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [hasGps, setHasGps] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const cachedAddress = sessionStorage.getItem(CACHE_KEYS.address);
    const cachedFullAddress = sessionStorage.getItem(CACHE_KEYS.fullAddress);
    const cachedLat = sessionStorage.getItem(CACHE_KEYS.lat);
    const cachedLng = sessionStorage.getItem(CACHE_KEYS.lng);
    const cachedGps = sessionStorage.getItem(CACHE_KEYS.hasGps);

    if (cachedAddress && cachedFullAddress && cachedLat && cachedLng && cachedGps === '1') {
      setAddress(cachedAddress);
      setFullAddress(cachedFullAddress);
      setLatitude(Number(cachedLat));
      setLongitude(Number(cachedLng));
      setHasGps(true);
      setIsLoading(false);
      return;
    }

    if (!('geolocation' in navigator)) {
      setAddress('Không hỗ trợ');
      setHasGps(false);
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        setLatitude(lat);
        setLongitude(lng);
        setHasGps(true);
        sessionStorage.setItem(CACHE_KEYS.lat, String(lat));
        sessionStorage.setItem(CACHE_KEYS.lng, String(lng));
        sessionStorage.setItem(CACHE_KEYS.hasGps, '1');

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=vi`
          );
          const data = await res.json();

          if (data?.address) {
            const district =
              data.address.suburb || data.address.city_district || data.address.county || '';
            const city = data.address.city || data.address.state || data.address.province || '';

            let displayAddress = 'Không xác định';
            const detailedAddress = data.display_name || 'Không có thông tin chi tiết';

            if (district && city) {
              displayAddress = `${district}, ${city}`
                .replace('Thành phố', 'TP')
                .replace('Quận', 'Q.')
                .replace('Huyện', 'H.');
            } else if (data.display_name) {
              displayAddress = data.display_name.split(',').slice(0, 2).join(', ');
            }

            setAddress(displayAddress);
            setFullAddress(detailedAddress);
            sessionStorage.setItem(CACHE_KEYS.address, displayAddress);
            sessionStorage.setItem(CACHE_KEYS.fullAddress, detailedAddress);
          } else {
            setAddress('Đã định vị');
          }
        } catch {
          setAddress('Đã định vị');
        } finally {
          setIsLoading(false);
        }
      },
      () => {
        setAddress('Chưa cấp quyền');
        setHasGps(false);
        sessionStorage.setItem(CACHE_KEYS.hasGps, '0');
        setIsLoading(false);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 }
    );
  }, []);

  return (
    <UserLocationContext.Provider
      value={{ address, fullAddress, latitude, longitude, hasGps, isLoading }}
    >
      {children}
    </UserLocationContext.Provider>
  );
}

export function useUserLocation(): UserLocationState {
  const ctx = useContext(UserLocationContext);
  if (!ctx) {
    // Fallback so tests / isolated renders don't crash — still same hook count (1 context)
    return {
      address: '',
      fullAddress: '',
      latitude: null,
      longitude: null,
      hasGps: false,
      isLoading: false,
    };
  }
  return ctx;
}
