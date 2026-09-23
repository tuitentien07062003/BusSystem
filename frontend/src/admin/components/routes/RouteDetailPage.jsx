import { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, MapPin, Calendar, Building2, Clock, Palette, Loader2 } from 'lucide-react';
import L from 'leaflet';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useFullRoute } from '@/hooks/useRoutes';

// ─── Format helpers ───
function formatSec(s) {
  if (s == null) return '—';
  const total = Number(s);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = total % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

function formatDate(s) {
  if (!s) return '—';
  try {
    return new Date(s).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

// ─── Map con ───
function MiniMap({ shape, points, color = '#1a5a8a' }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!shape?.coordinates?.length) return;

    const container = document.getElementById('route-detail-map');
    if (!container) return;

    const map = L.map(container, { zoomControl: true, attributionControl: false });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd', maxZoom: 19,
    }).addTo(map);

    const layer = L.geoJSON(shape, {
      style: { color, weight: 5, opacity: 0.85 },
    }).addTo(map);

    (points || []).forEach((p, idx) => {
      const isDepot = p.stop_type === 1;
      const icon = L.divIcon({
        html: `<div style="
          width:${isDepot ? 22 : 18}px;height:${isDepot ? 22 : 18}px;
          background:${isDepot ? '#d48c2c' : '#1a5a8a'};
          border:2px solid #fff;border-radius:50%;
          color:#fff;font-size:9px;font-weight:700;
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 1px 4px rgba(0,0,0,0.3)">
          ${idx + 1}
        </div>`,
        className: '',
        iconSize: isDepot ? [22, 22] : [18, 18],
        iconAnchor: isDepot ? [11, 11] : [9, 9],
      });
      L.marker([p.latitude, p.longitude], { icon })
        .addTo(map)
        .bindPopup(`<b>${p.stop_name}</b><br><small>#${p.sequence}</small>`);
    });

    map.fitBounds(layer.getBounds(), { padding: [30, 30] });
    setReady(true);

    return () => map.remove();
  }, [shape, points, color]);

  if (!shape?.coordinates?.length) {
    return (
      <div className="h-[280px] flex items-center justify-center bg-[#f8fafc] rounded-md border border-[#e5eaf0] text-xs text-[#8a9aaa]">
        Chưa có dữ liệu bản đồ
      </div>
    );
  }

  return (
    <div
      id="route-detail-map"
      className="h-[280px] rounded-md border border-[#e5eaf0] overflow-hidden"
    />
  );
}

// ─── Bảng stops của 1 pattern ───
function StopsTable({ stops, direction }) {
  if (!stops?.length) {
    return (
      <div className="py-10 text-center text-xs text-[#8a9aaa] bg-white rounded-md border border-dashed border-[#d0d7e2]">
        Pattern này chưa có trạm nào
      </div>
    );
  }

  return (
    <div className="border border-[#e5eaf0] rounded-md overflow-hidden bg-white">
      <table className="w-full text-sm">
        <thead className="bg-[#f8fafc] border-b border-[#e5eaf0]">
          <tr>
            <th className="text-center px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide text-[#6a7a9a] w-14">
              #
            </th>
            <th className="text-left px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide text-[#6a7a9a]">
              Trạm
            </th>
            <th className="text-center px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide text-[#6a7a9a] w-28">
              Loại
            </th>
            <th className="text-right px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide text-[#6a7a9a] w-32">
              Đến
            </th>
            <th className="text-right px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide text-[#6a7a9a] w-32">
              Đi
            </th>
          </tr>
        </thead>
        <tbody>
          {stops.map((s, idx) => (
            <tr
              key={`${s.stop_id}-${idx}`}
              className="border-b border-[#f3f5f9] last:border-0 hover:bg-[#f8fafc]"
            >
              <td className="px-3 py-2.5 text-center">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#dce8f0] text-[#1a5a8a] text-[11px] font-bold">
                  {s.stop_sequence ?? idx + 1}
                </span>
              </td>
              <td className="px-3 py-2.5">
                <div className="text-xs font-medium text-[#1a2332] truncate" title={s.stop_name}>
                  {s.stop_name || `#${s.stop_id}`}
                </div>
                <div className="text-[10px] text-[#8a9aaa] font-mono">{s.stop_id}</div>
              </td>
              <td className="px-3 py-2.5 text-center">
                {s.stop_type === 1 ? (
                  <Badge variant="warning">Depot</Badge>
                ) : (
                  <Badge variant="muted">Trạm dừng</Badge>
                )}
              </td>
              <td className="px-3 py-2.5 text-right font-mono text-xs text-[#1a2332]">
                <div className="font-semibold">{formatSec(s.arrival_offset_seconds)}</div>
                <div className="text-[10px] text-[#8a9aaa]">+{s.arrival_offset_seconds}s</div>
              </td>
              <td className="px-3 py-2.5 text-right font-mono text-xs text-[#1a2332]">
                <div className="font-semibold">{formatSec(s.departure_offset_seconds)}</div>
                <div className="text-[10px] text-[#8a9aaa]">+{s.departure_offset_seconds}s</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════
export function RouteDetailPage({ routeId, onBack }) {
  const { data, isLoading } = useFullRoute(routeId, { enabled: !!routeId });
  const [activeTab, setActiveTab] = useState('0');

  const route = data?.route;
  const patterns = data?.patterns || [];

  // Sắp xếp patterns: GO (0) trước, RETURN (1) sau
  const sortedPatterns = useMemo(() => {
    return [...patterns].sort((a, b) => (a.direction_id ?? 0) - (b.direction_id ?? 0));
  }, [patterns]);

  const activePattern = sortedPatterns.find(
    (p) => String(p.direction_id) === activeTab
  ) || sortedPatterns[0];

  if (isLoading) {
    return (
      <div className="absolute inset-0 bg-[#eef2f6] z-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-[#1a5a8a] mx-auto mb-3" />
          <p className="text-sm text-[#6a7a9a]">Đang tải chi tiết tuyến...</p>
        </div>
      </div>
    );
  }

  if (!route) return null;

  return (
    <div className="absolute inset-0 bg-[#eef2f6] z-50 overflow-y-auto">
      <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-5">
        {/* Header với nút back */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="h-9 px-3 rounded-md border border-[#cbd5e1] bg-white hover:bg-[#eef2f6] flex items-center gap-1.5 text-xs font-semibold text-[#4a5a7a] cursor-pointer"
          >
            <ArrowLeft size={14} />
            Quay lại
          </button>
          <div>
            <h1 className="text-lg font-bold text-[#1a2332] flex items-center gap-2">
              {route.route_short_name}
              <Badge variant="info">{route.route_id}</Badge>
              {route.is_active ? (
                <Badge variant="success">Hoạt động</Badge>
              ) : (
                <Badge variant="danger">Ngưng</Badge>
              )}
            </h1>
            <p className="text-xs text-[#6a7a9a] mt-0.5">{route.route_full_name}</p>
          </div>
        </div>

        {/* Thông tin tuyến (readonly) */}
        <div className="bg-white rounded-lg border border-[#d0d7e2] p-4">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-[#8a9aaa] mb-3">
            Thông tin tuyến
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#dce8f0] flex items-center justify-center">
                <Palette size={14} className="text-[#1a5a8a]" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-[#8a9aaa] uppercase tracking-wide">Màu</div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-4 h-4 rounded border border-[#d0d7e2]"
                    style={{ background: route.route_color || '#ccc' }}
                  />
                  <span className="text-xs font-mono text-[#1a2332]">
                    {route.route_color || '—'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#dce8de] flex items-center justify-center">
                <Building2 size={14} className="text-[#2e7d5a]" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-[#8a9aaa] uppercase tracking-wide">Nhà vận hành</div>
                <div className="text-xs text-[#1a2332] truncate">
                  {route.agency_id != null ? `#${route.agency_id}` : '—'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#eef2f6] flex items-center justify-center">
                <Calendar size={14} className="text-[#4a5a7a]" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-[#8a9aaa] uppercase tracking-wide">Ngày tạo</div>
                <div className="text-xs text-[#1a2332]">{formatDate(route.created_at)}</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#fdf2e3] flex items-center justify-center">
                <Clock size={14} className="text-[#d48c2c]" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-[#8a9aaa] uppercase tracking-wide">Cập nhật</div>
                <div className="text-xs text-[#1a2332]">{formatDate(route.updated_at)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs cho các chiều */}
        {sortedPatterns.length === 0 ? (
          <div className="bg-white rounded-lg border border-dashed border-[#d0d7e2] py-16 text-center">
            <p className="text-sm text-[#8a9aaa]">Tuyến này chưa có pattern nào.</p>
          </div>
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-4"
          >
            <TabsList>
              {sortedPatterns.map((p) => (
                <TabsTrigger key={p.id} value={String(p.direction_id)}>
                  {p.direction_id === 0 ? 'Chiều đi' : p.direction_id === 1 ? 'Chiều về' : `Hướng ${p.direction_id}`}
                </TabsTrigger>
              ))}
            </TabsList>

            {sortedPatterns.map((p) => (
              <TabsContent key={p.id} value={String(p.direction_id)} className="space-y-4">
                {/* Header của pattern */}
                <div className="bg-white rounded-lg border border-[#d0d7e2] p-4 flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={p.direction_id === 0 ? 'success' : 'info'}>
                        {p.direction_id === 0 ? 'Chiều đi' : p.direction_id === 1 ? 'Chiều về' : `Hướng ${p.direction_id}`}
                      </Badge>
                      <span className="text-sm font-semibold text-[#1a2332]">
                        {p.trip_headsign || '(Chưa có biển hiệu)'}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#8a9aaa] font-mono mt-1">
                      Pattern: {p.pattern_code}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#6a7a9a]">
                    <span>
                      <b className="text-[#1a2332]">{p.stops?.length || 0}</b> trạm
                    </span>
                    {p.shape?.coordinates?.length > 0 && (
                      <span>
                        <b className="text-[#1a2332]">{p.shape.coordinates.length}</b> điểm shape
                      </span>
                    )}
                  </div>
                </div>

                {/* Bảng stops */}
                <StopsTable stops={p.stops} direction={p.direction_id} />

                {/* Map */}
                <div className="bg-white rounded-lg border border-[#d0d7e2] p-4">
                  <div className="flex items-center gap-1.5 mb-3">
                    <MapPin size={13} className="text-[#8a9aaa]" />
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#8a9aaa]">
                      Bản đồ lộ trình
                    </h3>
                  </div>
                  <MiniMap
                    shape={p.shape}
                    points={p.stops}
                    color={route.route_color || (p.direction_id === 0 ? '#2e7d5a' : '#1a5a8a')}
                  />
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </div>
  );
}
