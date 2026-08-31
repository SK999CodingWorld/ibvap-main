import { useAppStore } from "@/stores/appStore";

export const SimulationBanner = () => {
  const { simulationMode } = useAppStore();
  
  if (!simulationMode) return null;
  
  return (
    <div className="bg-amber-500/20 text-amber-500 text-xs font-bold px-4 py-1 flex justify-center items-center uppercase tracking-widest border-b border-amber-500/30">
      <span className="animate-pulse mr-2">●</span>
      Demo / Simulation Mode Active
    </div>
  );
};
