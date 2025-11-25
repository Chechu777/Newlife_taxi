"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// icons
const pickupIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/149/149059.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const destIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/149/149060.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

// Fix default icons placeholder (we won't use default)
delete (L.Icon.Default.prototype as any)._getIconUrl;

export default function MapComponent({
  onPick,
  onMarkerDrag,
  pickupInitial,
  destinationInitial,
  selectedField,
  onRouteCalculated,
}: any) {
  const mapRef = useRef<any>(null);
  const pickupMarkerRef = useRef<any>(null);
  const destMarkerRef = useRef<any>(null);
  const routeLayerRef = useRef<any>(null);

  // keep up-to-date selectedField in a ref to use inside event handlers
  const fieldRef = useRef(selectedField);
  useEffect(() => {
    fieldRef.current = selectedField;
  }, [selectedField]);

  // reverse geocode helper
  async function reverseGeocode(lat: number, lng: number) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      const d = await res.json();
      const a = d.address || {};
      const road = a.road || "";
      const house = a.house_number || "";
      const district = a.city_district || a.suburb || "";
      const city = a.city || a.town || a.village || "Madrid";
      const postcode = a.postcode || "";
      const formatted = [ `${road}${house ? `, ${house}` : ""}`, district, city, postcode ].filter(Boolean).join(", ");
      return formatted;
    } catch {
      return `${lat}, ${lng}`;
    }
  }

  // Draw / request route via OSRM between two points
  async function requestRouteAndDraw(lat1: number, lng1: number, lat2: number, lng2: number) {
    try {
      // OSRM expects lng,lat order
      const url = `https://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const json = await res.json();
      if (!json || !json.routes || json.routes.length === 0) {
        // remove layer if exists
        if (routeLayerRef.current) {
          routeLayerRef.current.remove();
          routeLayerRef.current = null;
        }
        if (onRouteCalculated) onRouteCalculated(null, null);
        return;
      }

      const route = json.routes[0];
      const coords = route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]); // lat,lng
      // remove existing
      if (routeLayerRef.current) {
        routeLayerRef.current.remove();
        routeLayerRef.current = null;
      }
      routeLayerRef.current = L.polyline(coords, { color: "#0ea5a4", weight: 5, opacity: 0.8 }).addTo(mapRef.current);
      mapRef.current.fitBounds(routeLayerRef.current.getBounds(), { padding: [40, 40] });

      const meters = route.distance;
      const seconds = route.duration;
      const km = meters / 1000;
      const minutes = seconds / 60;

      if (onRouteCalculated) onRouteCalculated(km, minutes);
    } catch (err) {
      console.error("Route error", err);
      if (onRouteCalculated) onRouteCalculated(null, null);
    }
  }

  // INIT MAP
  useEffect(() => {
    if (mapRef.current) return;

    const map = L.map("theMap", { center: [40.416775, -3.70379], zoom: 13 });
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);

    // click handler: place marker according to current active field (via fieldRef)
    map.on("click", async (e: any) => {
      const { lat, lng } = e.latlng;
      const formatted = await reverseGeocode(lat, lng);
      const active = fieldRef.current;

      if (active === "pickup") {
        if (!pickupMarkerRef.current) {
          pickupMarkerRef.current = L.marker([lat, lng], { draggable: true, icon: pickupIcon }).addTo(map);
          pickupMarkerRef.current.on("dragend", async (ev: any) => {
            const p = ev.target.getLatLng();
            const rev = await reverseGeocode(p.lat, p.lng);
            onMarkerDrag && onMarkerDrag("pickup", { lat: p.lat, lng: p.lng, address: rev });
            // if other point exists, request route
            if (destinationInitial && destinationInitial.lat != null && destinationInitial.lng != null) {
              requestRouteAndDraw(p.lat, p.lng, destinationInitial.lat, destinationInitial.lng);
            }
          });
        } else {
          pickupMarkerRef.current.setLatLng([lat, lng]);
        }
        pickupMarkerRef.current.bindPopup(formatted).openPopup();
        onPick && onPick("pickup", { lat, lng, address: formatted });

        // if destination already exists, request route
        if (destinationInitial && destinationInitial.lat != null && destinationInitial.lng != null) {
          requestRouteAndDraw(lat, lng, destinationInitial.lat, destinationInitial.lng);
        }
      } else {
        if (!destMarkerRef.current) {
          destMarkerRef.current = L.marker([lat, lng], { draggable: true, icon: destIcon }).addTo(map);
          destMarkerRef.current.on("dragend", async (ev: any) => {
            const p = ev.target.getLatLng();
            const rev = await reverseGeocode(p.lat, p.lng);
            onMarkerDrag && onMarkerDrag("destination", { lat: p.lat, lng: p.lng, address: rev });
            if (pickupInitial && pickupInitial.lat != null && pickupInitial.lng != null) {
              requestRouteAndDraw(pickupInitial.lat, pickupInitial.lng, p.lat, p.lng);
            }
          });
        } else {
          destMarkerRef.current.setLatLng([lat, lng]);
        }
        destMarkerRef.current.bindPopup(formatted).openPopup();
        onPick && onPick("destination", { lat, lng, address: formatted });

        if (pickupInitial && pickupInitial.lat != null && pickupInitial.lng != null) {
          requestRouteAndDraw(pickupInitial.lat, pickupInitial.lng, lat, lng);
        }
      }
    });
  }, [onPick, onMarkerDrag, pickupInitial, destinationInitial]);

  // update markers when props change (initials)
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    // pickup initial
    if (pickupInitial && pickupInitial.lat != null && pickupInitial.lng != null) {
      const { lat, lng, address } = pickupInitial;
      if (!pickupMarkerRef.current) {
        pickupMarkerRef.current = L.marker([lat, lng], { draggable: true, icon: pickupIcon }).addTo(map);
        pickupMarkerRef.current.on("dragend", async (ev: any) => {
          const p = ev.target.getLatLng();
          const rev = await reverseGeocode(p.lat, p.lng);
          onMarkerDrag && onMarkerDrag("pickup", { lat: p.lat, lng: p.lng, address: rev });
          if (destinationInitial && destinationInitial.lat != null && destinationInitial.lng != null) {
            requestRouteAndDraw(p.lat, p.lng, destinationInitial.lat, destinationInitial.lng);
          }
        });
      } else {
        pickupMarkerRef.current.setLatLng([lat, lng]);
      }
      pickupMarkerRef.current.bindPopup(address || "");
      if (selectedField === "pickup") map.setView([lat, lng], 15);
    }

    // destination initial
    if (destinationInitial && destinationInitial.lat != null && destinationInitial.lng != null) {
      const { lat, lng, address } = destinationInitial;
      if (!destMarkerRef.current) {
        destMarkerRef.current = L.marker([lat, lng], { draggable: true, icon: destIcon }).addTo(map);
        destMarkerRef.current.on("dragend", async (ev: any) => {
          const p = ev.target.getLatLng();
          const rev = await reverseGeocode(p.lat, p.lng);
          onMarkerDrag && onMarkerDrag("destination", { lat: p.lat, lng: p.lng, address: rev });
          if (pickupInitial && pickupInitial.lat != null && pickupInitial.lng != null) {
            requestRouteAndDraw(pickupInitial.lat, pickupInitial.lng, p.lat, p.lng);
          }
        });
      } else {
        destMarkerRef.current.setLatLng([lat, lng]);
      }
      destMarkerRef.current.bindPopup(address || "");
      if (selectedField === "destination") map.setView([lat, lng], 15);
    }

    // if both exist, draw route
    if (
      pickupInitial &&
      destinationInitial &&
      pickupInitial.lat != null &&
      pickupInitial.lng != null &&
      destinationInitial.lat != null &&
      destinationInitial.lng != null
    ) {
      requestRouteAndDraw(pickupInitial.lat, pickupInitial.lng, destinationInitial.lat, destinationInitial.lng);
    }
  }, [pickupInitial, destinationInitial, selectedField, onMarkerDrag]);

  return <div id="theMap" style={{ width: "100%", height: "360px", borderRadius: 12, overflow: "hidden" }} />;
}
