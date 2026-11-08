import { createContext, useEffect, useState, useCallback, useRef } from "react";
import { engine } from "@/engine/simulationEngine";
import { DEFAULT_SPEED } from "@/engine/simConstants";

export const SimulationContext = createContext(null);

function formatClock(sec) {
  if (sec == null) return "--:--:--";
  const h = Math.floor(sec / 3600) % 24;
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const p = (n) => String(n).padStart(2, "0");
  return `${p(h)}:${p(m)}:${p(s)}`;
}

export function SimulationProvider({ children }) {
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [routesList, setRoutesList] = useState([]);

  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeedState] = useState(DEFAULT_SPEED);
  const [clockText, setClockText] = useState("--:--:--");
  const [stats, setStats] = useState({
    running: 0,
    stopped: 0,
    waiting: 0,
    done: 0,
    total: 0,
  });
  const [blockList, setBlockList] = useState([]);
  const [trackedBlockId, setTrackedBlockId] = useState(null);
  const [routeMeta, setRouteMeta] = useState(null);

  const lastStatTime = useRef(0);
  const lastListTime = useRef(0);

  // ═══════════════════════════════════════════════════════════════
  // SYNC FROM ENGINE
  // ═══════════════════════════════════════════════════════════════
  const syncStats = useCallback(() => {
    let r = 0,
      s = 0,
      w = 0,
      d = 0;
    for (const b of engine.blocks) {
      if (b.status === "running") r++;
      else if (b.status === "stopped") s++;
      else if (b.status === "done") d++;
      else w++;
    }
    setStats({
      running: r,
      stopped: s,
      waiting: w,
      done: d,
      total: engine.blocks.length,
    });
  }, []);

  const syncClock = useCallback(() => {
    if (engine.blocks.length === 0) {
      setClockText("--:--:--");
      return;
    }
    const absTime = engine.baseTime + engine.globalElapsed;
    setClockText(formatClock(absTime));
  }, []);

  const syncBlockList = useCallback(() => {
    const list = engine.blocks.map((b) => {
      const absTime = engine.baseTime + engine.globalElapsed;
      let timeStr = "";
      if (b.status === "done") {
        timeStr = "Xong";
      } else if (b.active_trip) {
        const te = absTime - b.active_trip.start_sec;
        timeStr = `+${Math.floor(Math.max(0, te) / 60)}p`;
      } else {
        timeStr = "Chờ";
      }

      return {
        id: b.id,
        vehicle_code: b.vehicle_code,
        license_plate: b.license_plate,
        driver_code: b.driver_code,
        driver_name: b.driver_name,
        direction_id: b.direction_id,
        status: b.status,
        current_trip: b.active_trip?.trip_id || null,
        timeStr,
        trip_count: b.trips.length,
      };
    });
    setBlockList(list);
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // SUBSCRIBE
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    const unsub = engine.onTick(() => {
      const now = performance.now();
      if (now - lastStatTime.current > 100) {
        syncStats();
        syncClock();
        lastStatTime.current = now;
      }
      if (now - lastListTime.current > 800) {
        syncBlockList();
        lastListTime.current = now;
      }

      setIsRunning(engine.isRunning);
      setIsPaused(engine.isPaused);

      if (engine.allDone() && engine.isRunning) {
        engine.stop();
        setIsRunning(false);
        setClockText("🏁 Hoàn tất");
      }
    });
    return unsub;
  }, [syncStats, syncClock, syncBlockList]);

  // ═══════════════════════════════════════════════════════════════
  // LOAD
  // ═══════════════════════════════════════════════════════════════
  const loadSimData = useCallback(
    (patterns, trips, assignments) => {
      engine.reset();
      engine.loadRoute(patterns);
      engine.loadBlocks(assignments, trips);

      const meta = {};
      for (const p of patterns) {
        meta[p.direction_id] = {
          direction_id: p.direction_id,
          trip_headsign: p.trip_headsign,
          stop_count: (p.stops || []).length,
        };
      }
      setRouteMeta(meta);

      syncStats();
      syncBlockList();
      setClockText("--:--:--");
    },
    [syncStats, syncBlockList],
  );

  // ═══════════════════════════════════════════════════════════════
  // CONTROLS
  // ═══════════════════════════════════════════════════════════════
  const start = useCallback(() => {
    if (engine.blocks.length === 0) return;
    engine.start(speed);
    setIsRunning(true);
    setIsPaused(false);
    syncStats();
    syncBlockList();
  }, [speed, syncStats, syncBlockList]);

  const pause = useCallback(() => {
    engine.pause();
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    engine.resume();
    setIsPaused(false);
  }, []);

  const reset = useCallback(() => {
    engine.reset();
    setIsRunning(false);
    setIsPaused(false);
    setClockText("--:--:--");
    syncStats();
    syncBlockList();
  }, [syncStats, syncBlockList]);

  const setSpeed = useCallback((v) => {
    const val = parseInt(v) || DEFAULT_SPEED;
    setSpeedState(val);
    engine.setSpeed(val);
  }, []);

  const toggleTrackBlock = useCallback((blockId) => {
    setTrackedBlockId((prev) => (prev === blockId ? null : blockId));
  }, []);

  const clearTrack = useCallback(() => setTrackedBlockId(null), []);

  const value = {
    selectedRouteId,
    setSelectedRouteId,
    routesList,
    setRoutesList,
    routeMeta,

    isRunning,
    isPaused,
    speed,
    clockText,
    stats,
    blockList,
    trackedBlockId,

    loadSimData,
    start,
    pause,
    resume,
    reset,
    setSpeed,
    toggleTrackBlock,
    clearTrack,
  };

  return (
    <SimulationContext.Provider value={value}>
      {children}
    </SimulationContext.Provider>
  );
}
