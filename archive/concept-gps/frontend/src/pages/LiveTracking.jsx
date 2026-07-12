import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { trackingApi } from '../api/client';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconRetinaUrl: iconRetina,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function LiveTracking() {
  const [locations, setLocations] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLocations();
    const interval = setInterval(fetchLocations, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, []);

  const fetchLocations = async () => {
    try {
      const data = await trackingApi.getActive();
      setLocations(data || []);
    } catch (err) {
      console.error('Error fetching active locations', err);
      setError('An error occurred while fetching locations.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '80vh' }}>
      <header className="page-header">
        <div>
          <h1 className="page-title">Live Tracking</h1>
          <p className="page-subtitle">Real-time GPS tracking for active fleet</p>
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <div style={{ flex: 1, borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border-subtle)', minHeight: '500px' }}>
        <MapContainer center={[51.505, -0.09]} zoom={3} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {locations.map(loc => (
            <Marker key={loc.vehicle_id} position={[loc.latitude, loc.longitude]}>
              <Popup>
                <strong>{loc.name_model} ({loc.registration_number})</strong><br/>
                Driver: {loc.driver_name}<br/>
                Route: {loc.source} &rarr; {loc.destination}<br/>
                Last Update: {new Date(loc.recorded_at).toLocaleTimeString()}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
