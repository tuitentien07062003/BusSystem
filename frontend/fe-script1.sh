#!/bin/bash
set -e

python3 -X utf8 - <<'PY'
p = "src/admin/components/routes/RouteComposerDialog.jsx"
with open(p, encoding="utf-8") as f:
    content = f.read()

# 1. Import RoadPickerDialog + override API
if "RoadPickerDialog" not in content:
    content = content.replace(
        "import { RoutePreviewMap } from './RoutePreviewMap';",
        "import { RoutePreviewMap } from './RoutePreviewMap';\nimport { RoadPickerDialog } from './RoadPickerDialog';"
    )
    print("[OK] Import RoadPickerDialog")

# 2. Import hook lấy override
if "getStopOverride" not in content:
    # Không cần fetch inline, để dialog RoadPicker tự fetch khi mở
    pass

# 3. Thêm state cho RoadPicker
old_state = "  // Drag reorder\n  const [draggedIdx, setDraggedIdx] = useState(null);"
new_state = """  // Drag reorder
  const [draggedIdx, setDraggedIdx] = useState(null);

  // Road override picker
  const [roadPickerStop, setRoadPickerStop] = useState(null);
  const [roadOverrides, setRoadOverrides] = useState({}); // { stop_id: override_data }"""

if old_state in content:
    content = content.replace(old_state, new_state)
    print("[OK] Thêm state roadPicker")

# 4. Tìm SelectedStopRow usage và thêm onPickRoad
old_selected = """                        {cur.stops.map((s, idx) => (
                            <SelectedStopRow
                              key={s.id}
                              stop={s}
                              index={idx}
                              total={cur.stops.length}
                              onRemove={() => handleRemoveStop(s.id)}
                              onHover={setHoveredStop}
                              onFocus={setFocusedStop}
                              hoveredId={hoveredStop?.id}
                              focusedId={focusedStop?.id}
                              isDragging={draggedIdx === idx}
                              onDragStart={() => setDraggedIdx(idx)}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={() => {
                                if (draggedIdx != null && draggedIdx !== idx) {
                                  handleReorder(draggedIdx, idx);
                                }
                                setDraggedIdx(null);
                              }}
                              onDragEnd={() => setDraggedIdx(null)}
                            />
                          ))}"""

new_selected = """                        {cur.stops.map((s, idx) => (
                            <SelectedStopRow
                              key={s.id}
                              stop={s}
                              index={idx}
                              total={cur.stops.length}
                              onRemove={() => handleRemoveStop(s.id)}
                              onHover={setHoveredStop}
                              onFocus={setFocusedStop}
                              onPickRoad={() => setRoadPickerStop(s)}
                              hasOverride={!!roadOverrides[s.id]}
                              overrideInfo={roadOverrides[s.id]}
                              hoveredId={hoveredStop?.id}
                              focusedId={focusedStop?.id}
                              isDragging={draggedIdx === idx}
                              onDragStart={() => setDraggedIdx(idx)}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={() => {
                                if (draggedIdx != null && draggedIdx !== idx) {
                                  handleReorder(draggedIdx, idx);
                                }
                                setDraggedIdx(null);
                              }}
                              onDragEnd={() => setDraggedIdx(null)}
                            />
                          ))}"""

if old_selected in content:
    content = content.replace(old_selected, new_selected)
    print("[OK] Thêm onPickRoad vào SelectedStopRow")
else:
    print("[!] Không match SelectedStopRow usage")

# 5. Thêm RoadPickerDialog vào cuối component (trước closing </div> của return)
old_close = """      </div>
    </div>
  );
}"""

new_close = """      </div>

      {/* Road override picker */}
      <RoadPickerDialog
        open={!!roadPickerStop}
        stop={roadPickerStop}
        currentOverride={roadPickerStop ? roadOverrides[roadPickerStop.id] : null}
        onClose={() => setRoadPickerStop(null)}
        onSaved={async () => {
          if (!roadPickerStop) return;
          // Reload override info
          const { getStopOverride } = await import('@/api/stopsApi');
          try {
            const ov = await getStopOverride(roadPickerStop.id);
            setRoadOverrides((prev) => {
              const next = { ...prev };
              if (ov) next[roadPickerStop.id] = ov;
              else delete next[roadPickerStop.id];
              return next;
            });
          } catch (e) {
            console.warn('Failed to reload override', e);
          }
        }}
      />
    </div>
  );
}"""

# Chỉ replace lần cuối cùng (closing của main return)
last_idx = content.rfind(old_close)
if last_idx > 0:
    content = content[:last_idx] + new_close + content[last_idx + len(old_close):]
    print("[OK] Thêm RoadPickerDialog vào main return")
else:
    print("[!] Không match closing return")

# 6. Update SelectedStopRow function
old_row = """function SelectedStopRow({
  stop, index, total,
  onRemove, onHover, onFocus, hoveredId, focusedId,
  isDragging, onDragStart, onDragOver, onDrop, onDragEnd,
}) {
  const isHovered = hoveredId === stop.id;
  const isFocused = focusedId === stop.id;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      onMouseEnter={() => onHover?.(stop)}
      onMouseLeave={() => onHover?.(null)}
      onClick={() => onFocus?.(stop)}
      className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-all ${
        isDragging ? 'opacity-40' : ''
      } ${isHovered ? 'bg-amber-50' : ''} ${isFocused ? 'bg-teal-50' : ''}`}
    >
      <GripVertical
        size={14}
        className="text-slate-300 hover:text-slate-500 cursor-grab flex-shrink-0"
      />

      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
        index === 0
          ? 'bg-teal-700 text-white'
          : index === total - 1
          ? 'bg-rose-600 text-white'
          : 'bg-slate-100 text-slate-700'
      }`}>
        {index + 1}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-slate-900 truncate">{stop.stop_name}</div>
        <div className="text-[10px] text-slate-400 font-mono">{stop.stop_id}</div>
      </div>

      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer flex-shrink-0"
      >
        <X size={12} />
      </button>
    </div>
  );
}"""

new_row = """function SelectedStopRow({
  stop, index, total,
  onRemove, onHover, onFocus, onPickRoad,
  hasOverride, overrideInfo,
  hoveredId, focusedId,
  isDragging, onDragStart, onDragOver, onDrop, onDragEnd,
}) {
  const isHovered = hoveredId === stop.id;
  const isFocused = focusedId === stop.id;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      onMouseEnter={() => onHover?.(stop)}
      onMouseLeave={() => onHover?.(null)}
      onClick={() => onFocus?.(stop)}
      className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-all ${
        isDragging ? 'opacity-40' : ''
      } ${isHovered ? 'bg-amber-50' : ''} ${isFocused ? 'bg-teal-50' : ''}`}
    >
      <GripVertical
        size={14}
        className="text-slate-300 hover:text-slate-500 cursor-grab flex-shrink-0"
      />

      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
        index === 0
          ? 'bg-teal-700 text-white'
          : index === total - 1
          ? 'bg-rose-600 text-white'
          : 'bg-slate-100 text-slate-700'
      }`}>
        {index + 1}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-900 truncate">{stop.stop_name}</span>
          {hasOverride && (
            <span
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[9px] font-bold uppercase tracking-wide flex-shrink-0"
              title={overrideInfo?.road_name ? `Override: ${overrideInfo.road_name}` : 'Có override'}
            >
              <Road size={9} />
              {overrideInfo?.road_name || 'Override'}
            </span>
          )}
        </div>
        <div className="text-[10px] text-slate-400 font-mono">{stop.stop_id}</div>
      </div>

      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onPickRoad?.(); }}
        title="Chọn đường override"
        className={`w-6 h-6 rounded flex items-center justify-center cursor-pointer flex-shrink-0 transition-colors ${
          hasOverride
            ? 'text-amber-700 bg-amber-50 hover:bg-amber-100'
            : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
        }`}
      >
        <Road size={12} />
      </button>

      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer flex-shrink-0"
      >
        <X size={12} />
      </button>
    </div>
  );
}"""

if old_row in content:
    content = content.replace(old_row, new_row)
    print("[OK] Update SelectedStopRow với road button")
else:
    print("[!] Không match SelectedStopRow function")

# 7. Import Road icon
if "Road," not in content and "Road }" not in content:
    # Thêm Road vào import từ lucide-react
    import_match = "import {\n  ArrowLeft, Loader2, Save, MapPin, Search, X, GripVertical,\n  Check, Info, Ruler, Clock, ListOrdered, ArrowRight, Building2,\n  AlertTriangle, Plus, Palette, Route as RouteIcon,\n} from 'lucide-react';"

    new_import = "import {\n  ArrowLeft, Loader2, Save, MapPin, Search, X, GripVertical,\n  Check, Info, Ruler, Clock, ListOrdered, ArrowRight, Building2,\n  AlertTriangle, Plus, Palette, Route as RouteIcon, Road,\n} from 'lucide-react';"

    if import_match in content:
        content = content.replace(import_match, new_import)
        print("[OK] Import Road icon")
    else:
        # Fallback
        if "Route as RouteIcon," in content:
            content = content.replace(
                "Route as RouteIcon,",
                "Route as RouteIcon, Road,"
            )
            print("[OK] Import Road icon (fallback)")

with open(p, "w", encoding="utf-8") as f:
    f.write(content)
print("Đã lưu RouteComposerDialog.jsx")
PY

echo ""
echo "═══════════════════════════════════════════"
echo "[OK] FE HOÀN THÀNH"
echo "═══════════════════════════════════════════"
echo ""
echo "🚀 Chạy: npm run dev"