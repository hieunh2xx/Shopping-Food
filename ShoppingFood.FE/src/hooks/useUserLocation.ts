import { useState, useEffect } from 'react';

export function useUserLocation() {
  const [address, setAddress] = useState<string>('');
  const [fullAddress, setFullAddress] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const cachedAddress = sessionStorage.getItem('user_address');
    const cachedFullAddress = sessionStorage.getItem('user_full_address');
    if (cachedAddress && cachedFullAddress) {
      setAddress(cachedAddress);
      setFullAddress(cachedFullAddress);
      setIsLoading(false);
      return;
    }

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=vi`
            );
            const data = await res.json();
            
            if (data && data.address) {
              const district = data.address.suburb || data.address.city_district || data.address.county || "";
              const city = data.address.city || data.address.state || data.address.province || "";
              
              let displayAddress = "Không xác định";
              let detailedAddress = data.display_name || "Không có thông tin chi tiết";

              if (district && city) {
                displayAddress = `${district}, ${city}`.replace('Thành phố', 'TP').replace('Quận', 'Q.').replace('Huyện', 'H.');
              } else if (data.display_name) {
                displayAddress = data.display_name.split(',').slice(0, 2).join(', ');
              }
              
              setAddress(displayAddress);
              setFullAddress(detailedAddress);
              sessionStorage.setItem('user_address', displayAddress);
              sessionStorage.setItem('user_full_address', detailedAddress);
            }
          } catch (e) {
            console.error("Geocoding failed", e);
            setAddress('Lỗi vị trí');
          } finally {
            setIsLoading(false);
          }
        },
        (error) => {
          console.error("Geolocation error", error);
          setAddress('Chưa cấp quyền');
          setIsLoading(false);
        }
      );
    } else {
      setAddress('Không hỗ trợ');
      setIsLoading(false);
    }
  }, []);

  return { address, fullAddress, isLoading };
}
