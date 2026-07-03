import { useEffect, useMemo } from 'react';
import { MapContainer, Marker, Popup, TileLayer, Polyline, Tooltip, useMap } from 'react-leaflet';
import L, { type LatLngExpression, type LatLngBoundsExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAppSelector } from '@/app/hooks';
import { refName } from '@/lib/entity';
import type { Store, Warehouse, TransferStatus } from '@/types';

export interface MapNode {
  id: string;
  name: string;
  kind: 'warehouse' | 'hub' | 'store' | 'cold';
  typeLabel: string;
  lat: number;
  lng: number;
  manager?: string;
  meta?: string;
  raw: Warehouse | Store;
}

/** An active transfer resolved to source/destination coordinates for drawing. */
export interface TransferRoute {
  id: string;
  code: string;
  status: TransferStatus;
  fromName: string;
  toName: string;
  from: [number, number];
  to: [number, number];
}

const TILES = {
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  light: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
};

// Per-status styling for active transfer routes.
const ROUTE_STYLE: Record<string, { color: string; weight: number; dashArray?: string }> = {
  in_transit: { color: '#0ecb81', weight: 3.5 },
  dispatched: { color: '#fcd535', weight: 2.5, dashArray: '8 7' },
  delivered: { color: '#38bdf8', weight: 2, dashArray: '2 7' },
};

function markerIcon(kind: MapNode['kind']) {
  return L.divIcon({
    className: '',
    html: `<div class="geo-marker ${kind}"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

function truckIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="background:${color};color:#04150e;width:22px;height:22px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;box-shadow:0 0 0 4px ${color}33">&#9654;</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

const midpoint = (a: [number, number], b: [number, number]): [number, number] => [
  (a[0] + b[0]) / 2,
  (a[1] + b[1]) / 2,
];

/** Convert a warehouse to a map node. */
export function warehouseNode(w: Warehouse): MapNode {
  const kind: MapNode['kind'] = w.type === 'hub' ? 'hub' : w.type === 'cold' ? 'cold' : 'warehouse';
  return {
    id: w.id ?? w._id ?? w.code,
    name: w.name,
    kind,
    typeLabel: w.type === 'hub' ? 'Distribution Hub' : w.type === 'cold' ? 'Cold Warehouse' : 'Warehouse',
    lat: w.location?.lat ?? 0,
    lng: w.location?.lng ?? 0,
    manager: refName(w.manager),
    meta: `${w.utilization ?? 0}% · ${w.capacityPallets ?? 0} pallets`,
    raw: w,
  };
}

export function storeNode(s: Store): MapNode {
  return {
    id: s.id ?? s._id ?? s.code,
    name: s.name,
    kind: 'store',
    typeLabel: 'Store',
    lat: s.location?.lat ?? 0,
    lng: s.location?.lng ?? 0,
    manager: refName(s.manager),
    meta: [s.location?.city, s.location?.country].filter(Boolean).join(', ') || '—',
    raw: s,
  };
}

function FitBounds({ nodes }: { nodes: MapNode[] }) {
  const map = useMap();
  useEffect(() => {
    const valid = nodes.filter((n) => n.lat || n.lng);
    if (valid.length === 0) return;
    if (valid.length === 1) {
      map.setView([valid[0].lat, valid[0].lng], 6);
      return;
    }
    const bounds: LatLngBoundsExpression = valid.map((n) => [n.lat, n.lng] as [number, number]);
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 7 });
  }, [nodes, map]);
  return null;
}

export interface NetworkMapProps {
  nodes: MapNode[];
  height?: number | string;
  route?: { from?: MapNode; to?: MapNode };
  transfers?: TransferRoute[];
  onSelect?: (node: MapNode) => void;
  selectedId?: string;
}

export function NetworkMap({ nodes, height = 380, route, transfers = [], onSelect, selectedId }: NetworkMapProps) {
  const theme = useAppSelector((s) => s.ui.theme);
  const tiles = theme === 'light' ? TILES.light : TILES.dark;

  const center = useMemo<LatLngExpression>(() => {
    const valid = nodes.filter((n) => n.lat || n.lng);
    if (!valid.length) return [39.5, -98.35]; // continental US fallback
    const lat = valid.reduce((s, n) => s + n.lat, 0) / valid.length;
    const lng = valid.reduce((s, n) => s + n.lng, 0) / valid.length;
    return [lat, lng];
  }, [nodes]);

  const routeLine: LatLngExpression[] | null =
    route?.from && route?.to
      ? [
          [route.from.lat, route.from.lng],
          [route.to.lat, route.to.lng],
        ]
      : null;

  return (
    <MapContainer
      center={center}
      zoom={4}
      style={{ height, width: '100%' }}
      scrollWheelZoom
      attributionControl
    >
      <TileLayer key={theme} url={tiles.url} attribution={tiles.attribution} subdomains="abcd" />
      <FitBounds nodes={nodes} />

      {/* Active transfers (dispatched / in_transit / delivered) */}
      {transfers.map((t) => {
        const style = ROUTE_STYLE[t.status] ?? ROUTE_STYLE.dispatched;
        return (
          <Polyline key={t.id} positions={[t.from, t.to]} pathOptions={style}>
            <Tooltip sticky>
              {t.code} · {t.status.replace('_', ' ')} — {t.fromName} → {t.toName}
            </Tooltip>
          </Polyline>
        );
      })}
      {/* A truck marker at the midpoint of every in-transit shipment */}
      {transfers
        .filter((t) => t.status === 'in_transit')
        .map((t) => (
          <Marker key={`truck-${t.id}`} position={midpoint(t.from, t.to)} icon={truckIcon('#0ecb81')}>
            <Popup>
              <div className="map-pop">
                <h4>{t.code}</h4>
                <div className="sub">In transit</div>
                <div className="kv">
                  <span className="mute">Route</span>
                  <span>{t.fromName} → {t.toName}</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

      {/* Manually-planned route from the source/destination pickers */}
      {routeLine ? (
        <Polyline positions={routeLine} pathOptions={{ color: '#eaecef', weight: 2, dashArray: '4 6' }} />
      ) : null}

      {nodes
        .filter((n) => n.lat || n.lng)
        .map((n) => (
          <Marker
            key={n.id}
            position={[n.lat, n.lng]}
            icon={markerIcon(n.kind)}
            eventHandlers={{ click: () => onSelect?.(n) }}
            zIndexOffset={selectedId === n.id ? 1000 : 0}
          >
            <Popup>
              <div className="map-pop">
                <h4>{n.name}</h4>
                <div className="sub">
                  {n.typeLabel} · Manager {n.manager || '—'}
                </div>
                <div className="kv">
                  <span className="mute">Location</span>
                  <span className="num">
                    {n.lat.toFixed(2)}, {n.lng.toFixed(2)}
                  </span>
                </div>
                <div className="kv">
                  <span className="mute">Detail</span>
                  <span className="num">{n.meta || '—'}</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
    </MapContainer>
  );
}
