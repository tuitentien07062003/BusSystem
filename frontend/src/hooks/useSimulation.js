import { useContext } from "react";
import { SimulationContext } from "@/context/SimulationContext";

export function useSimulation() {
  const ctx = useContext(SimulationContext);
  if (!ctx) {
    throw new Error(
      "useSimulation phải được dùng bên trong <SimulationProvider>",
    );
  }
  return ctx;
}
