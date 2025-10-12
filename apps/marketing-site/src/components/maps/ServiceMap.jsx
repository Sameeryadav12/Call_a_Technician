import { forwardRef, useImperativeHandle, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// --- FIX for Vite + Leaflet marker icons ---
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const DEFAULT_MARKERS = [
  { name: "Adelaide CBD", lat: -34.9285, lng: 138.6007 },
  { name: "Glenelg", lat: -34.9806, lng: 138.5126 },
  { name: "Mawson Lakes", lat: -34.8107, lng: 138.613 },
];

function ServiceMapInner(
  { center = { lat: -34.9285, lng: 138.6007 }, zoom = 11, markers = DEFAULT_MARKERS, className = "", height = 360 },
  ref
) {
  const mapRef = useRef(null);

  // Expose a method to the parent to pan the map
  useImperativeHandle(ref, () => ({
    flyTo(lat, lng, z = 13) {
      if (mapRef.current) {
        mapRef.current.flyTo([lat, lng], z, { duration: 0.6 });
      }
    },
  }));

  return (
    <div className={`rounded-xl overflow-hidden border bg-white ${className}`} style={{ height }}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
        whenCreated={(map) => (mapRef.current = map)}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((m) => (
          <Marker key={m.name} position={[m.lat, m.lng]}>
            <Popup>
              <div className="text-sm">
                <div className="font-semibold">{m.name}</div>
                <div>South Australia</div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

const ServiceMap = forwardRef(ServiceMapInner);
export default ServiceMap;
