// app/components/MapComponent.tsx
"use client";

import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from "react-leaflet";
import L, { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

type LatLngObj = {
  lat?: number;
  lng?: number;
  address?: string;
} | null;

interface Props {
  pickupInitial?: LatLngObj | null;
  destinationInitial?: LatLngObj | null;
  selectedField?: "pickup" | "destination" | null;
  lockedUI?: boolean;
  onPick: (type: "pickup" | "destination", loc: LatLngObj) => void;
  onMarkerDrag: (which: "pickup" | "destination", loc: { lat: number; lng: number; address?: string }) => void;
  onRouteCalculated: (km: number | null, minutes: number | null) => void;
}

// ICONS: use public files (no blur)
const pickupIcon = L.divIcon({
  className: "pickup-pin",
  html: `<span style="font-size:40px;">📍</span>`,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

const destIcon = new L.Icon({
  iconUrl: "/marker-icon-2x.png", // destination
  iconSize: [34, 46],
  iconAnchor: [17, 46],
});

const userDivClass = "nl-user-dot-wrapper";

function injectUserStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById("nl-user-styles")) return;
  const s = document.createElement("style");
  s.id = "nl-user-styles";
  s.innerHTML = `
    .nl-user-dot-wrapper { position: relative; width: 34px; height: 34px; transform: translate(-50%, -50%); }
    .nl-user-halo { position: absolute; left:50%; top:50%; transform: translate(-50%,-50%); width:34px; height:34px; border-radius:50%; background: rgba(0, 111, 255, 0.14); animation: nl-pulse 2s infinite; }
    .nl-user-dot { position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); width:12px; height:12px; border-radius:50%; background:#007bff; border:2px solid white; box-shadow:0 0 6px rgba(0,0,0,0.15); }
    @keyframes nl-pulse { 0% { transform: translate(-50%,-50%) scale(.9); opacity:0.6 } 70% { transform: translate(-50%,-50%) scale(1.6); opacity:0 } 100% { opacity:0 } }
  `;
  document.head.appendChild(s);
}

const MapComponent = forwardRef<any, Props>(function MapComponent(
  {
    pickupInitial,
    destinationInitial,
    selectedField,
    lockedUI,
    onPick,
    onMarkerDrag,
    onRouteCalculated,
  },
  ref
) {
  // internal state mirrors initial props but controlled inside
  const [pickup, setPickup] = useState<LatLngObj>(pickupInitial || null);
  const [destination, setDestination] = useState<LatLngObj>(destinationInitial || null);

  const [routeCoords, setRouteCoords] = useState<LatLngExpression[]>([]);
  const mapRef = useRef<any>(null);

  // user position marker
  const userMarkerRef = useRef<L.Marker | null>(null);
  const lastUserPosRef = useRef<{ lat: number; lng: number } | null>(null);

  // Expose API: fitMarkers / lock / unlock
  useImperativeHandle(ref, () => ({
    fitMarkers() {
      const map = mapRef.current;
      if (!map) return;
      const bounds: LatLngExpression[] = [];
      if (pickup && typeof pickup.lat === "number") bounds.push([pickup.lat as number, pickup.lng as number]);
      if (destination && typeof destination.lat === "number") bounds.push([destination.lat as number, destination.lng as number]);
      if (bounds.length === 0 && lastUserPosRef.current) {
        map.setView([lastUserPosRef.current.lat, lastUserPosRef.current.lng], 15, { animate: true });
        return;
      }
      if (bounds.length === 1) {
        //map.setView(bounds[0], 15, { animate: true });
        map.flyTo(bounds[0], 15);
        return;
      }
      try {
        const b = L.latLngBounds(bounds as any);
        //map.fitBounds(b, { padding: [80, 80], maxZoom: 16 });
        if (pickup && destination) {map.fitBounds(b, { padding: [80, 80], maxZoom: 16 });}
      } catch {}
    },
    lock() {
      const map = mapRef.current;
      if (!map) return;
      map.dragging.disable();
      map.scrollWheelZoom.disable();
      map.doubleClickZoom.disable();
    },
    unlock() {
      const map = mapRef.current;
      if (!map) return;
      map.dragging.enable();
      map.scrollWheelZoom.enable();
      map.doubleClickZoom.enable();
    },
  }));

  // keep internal state in sync with props when they change externally
  useEffect(() => {
    if (pickupInitial) {
      setPickup(pickupInitial);
    }
  }, [pickupInitial?.lat, pickupInitial?.lng]);

  useEffect(() => {
    if (destinationInitial) {
      setDestination(destinationInitial);
    }
  }, [destinationInitial?.lat, destinationInitial?.lng]);

  // inject styles for user dot
  useEffect(() => {
    injectUserStyles();
  }, []);

  // Handle clicks on map: only when selectedField != null and not lockedUI
  function MapClickHandler() {
    useMapEvents({
      click: async (e) => {
        // ignore if not allowed
        if (!selectedField) return;
        if (lockedUI) return;

        const lat = e.latlng.lat;
        const lng = e.latlng.lng;

        // reverse geocode
        try {
          const r = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=es`
          );
          const json = await r.json();
          const display = json.display_name || "";
          const addr = json.address || {};
          // build readable address minimal (full formatting done in PageClient)
          const short = display || `${lat}, ${lng}`;
          const loc = { lat, lng, address: short };

          if (selectedField === "pickup") {
            setPickup(loc);
            onPick("pickup", loc);
          } else {
            setDestination(loc);
            onPick("destination", loc);
          }
        } catch (err) {
          const loc = { lat, lng, address: `${lat}, ${lng}` };
          if (selectedField === "pickup") {
            setPickup(loc);
            onPick("pickup", loc);
          } else {
            setDestination(loc);
            onPick("destination", loc);
          }
        }
      },
    });
    return null;
  }

  // Watch for changes in pickup/destination to compute route (OSRM)
  useEffect(() => {
    async function computeRoute(p: LatLngObj, d: LatLngObj) {
      if (!p || !d) {
        setRouteCoords([]);
        onRouteCalculated(null, null);
        return;
      }
      // use OSRM public demo server
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${p.lng},${p.lat};${d.lng},${d.lat}?overview=full&geometries=geojson&annotations=duration,distance`;
        const res = await fetch(url);
        const data = await res.json();
        if (data && data.routes && data.routes.length) {
          const route = data.routes[0];
          const coords = (route.geometry.coordinates as [number, number][]).map((c) => [c[1], c[0]] as LatLngExpression);
          setRouteCoords(coords);
          const distanceKm = route.distance / 1000;
          const minutes = Math.round(route.duration / 60);
          onRouteCalculated(Math.round(distanceKm * 10) / 10, minutes);
          // fit bounds to route
          setTimeout(() => {
            try {
              const map = mapRef.current;
              if (!map) return;
              const b = L.latLngBounds(coords as any);
              //map.fitBounds(b, { padding: [80, 80], maxZoom: 16 });
              if (pickup && destination) {map.fitBounds(b, { padding: [80, 80], maxZoom: 16 });}
            } catch {}
          }, 150);
        } else {
          // fallback straight line + haversine in parent
          setRouteCoords([
            [p.lat as number, p.lng as number],
            [d.lat as number, d.lng as number],
          ]);
          onRouteCalculated(null, null);
        }
      } catch (err) {
        // fallback
        setRouteCoords([
          [p.lat as number, p.lng as number],
          [d.lat as number, d.lng as number],
        ]);
        onRouteCalculated(null, null);
      }
    }

    computeRoute(pickup, destination);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickup?.lat, pickup?.lng, destination?.lat, destination?.lng]);

  // user geolocation marker (blue dot + halo) - run inside effect only on client
  useEffect(() => {
    if (typeof navigator === "undefined") return;
    let mounted = true;

    async function setUserMarker() {
      try {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (!mounted) return;
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            lastUserPosRef.current = { lat, lng };

            // create element
            const html = `
              <div class="${userDivClass}">
                <div class="nl-user-halo"></div>
                <div class="nl-user-dot"></div>
              </div>
            `;

            if (!userMarkerRef.current) {
              userMarkerRef.current = L.marker([lat, lng], {
                icon: L.divIcon({
                  className: "",
                  html,
                  iconSize: [34, 34],
                  iconAnchor: [17, 17],
                }),
              }).addTo(mapRef.current);
            } else {
              userMarkerRef.current.setLatLng([lat, lng]);
            }
            // if no pickup/destination, center smoothly on user
            if (!pickup && !destination) {
              try {
                mapRef.current.setView([lat, lng], 15, { animate: true });
              } catch {}
            }
          },
          () => {},
          { maximumAge: 60000, timeout: 7000, enableHighAccuracy: false }
        );
      } catch {}
    }

    setUserMarker();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  // marker drag handlers: when user drags a marker, update internal state and notify parent
  function handlePickupDrag(e: any) {
    const lat = e.target.getLatLng().lat;
    const lng = e.target.getLatLng().lng;
    // reverse geocode approx (no blocking)
    (async () => {
      try {
        const r = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=es`
        );
        const json = await r.json();
        const display = json.display_name || `${lat}, ${lng}`;
        const loc = { lat, lng, address: display };
        setPickup(loc);
        onMarkerDrag("pickup", loc);
      } catch {
        const loc = { lat, lng, address: `${lat}, ${lng}` };
        setPickup(loc);
        onMarkerDrag("pickup", loc);
      }
    })();
  }

  function handleDestDrag(e: any) {
    const lat = e.target.getLatLng().lat;
    const lng = e.target.getLatLng().lng;
    (async () => {
      try {
        const r = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=es`
        );
        const json = await r.json();
        const display = json.display_name || `${lat}, ${lng}`;
        const loc = { lat, lng, address: display };
        setDestination(loc);
        onMarkerDrag("destination", loc);
      } catch {
        const loc = { lat, lng, address: `${lat}, ${lng}` };
        setDestination(loc);
        onMarkerDrag("destination", loc);
      }
    })();
  }

  // Render
  return (
    <MapContainer
      ref={mapRef} // ahora mapRef es MutableRefObject<L.Map | null>
      center={
        pickup
          ? [pickup.lat as number, pickup.lng as number]
          : [40.4168, -3.7038]
      }
      zoom={13}
      style={{ width: "100%", height: "100%" }}
      preferCanvas={true}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />

      {/* route polyline (road geometry from OSRM) */}
      {routeCoords.length > 0 && <Polyline positions={routeCoords} pathOptions={{ color: "#007bff", weight: 5, opacity: 0.9 }} />}

      {/* pickup marker */}
      {pickup && typeof pickup.lat === "number" && (
        <Marker
          position={[pickup.lat, pickup.lng]}
          icon={pickupIcon}
          draggable={!lockedUI}
          eventHandlers={{
            dragend: handlePickupDrag,
          }}
        />
      )}

      {/* destination marker */}
      {destination && typeof destination.lat === "number" && (
        <Marker
          position={[destination.lat, destination.lng]}
          icon={destIcon}
          draggable={!lockedUI}
          eventHandlers={{
            dragend: handleDestDrag,
          }}
        />
      )}

      {/* click handler component */}
      <MapClickHandler />
    </MapContainer>
  );
});

export default MapComponent;
