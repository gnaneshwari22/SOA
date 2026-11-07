import React, { useState } from 'react';
import { ChevronDown, ChevronUp, BookOpen, ShieldCheck, Zap, AlertCircle } from 'lucide-react';

export const CascadePhysicsExplainer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden font-mono text-xs">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-zinc-900/50 hover:bg-zinc-900 transition-colors flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2 text-zinc-300">
          <BookOpen className="w-4 h-4 text-red-500" />
          <span className="font-bold uppercase tracking-wider text-xs">
            Indian Traffic Secondary Accident Cascade Formulation & CV Model
          </span>
        </div>
        <div className="flex items-center gap-2 text-zinc-400">
          <span>{isOpen ? 'Collapse Docs' : 'View Methodology'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 sm:p-5 border-t border-zinc-800 space-y-4 text-zinc-400 leading-relaxed">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-zinc-900/60 p-3.5 rounded-lg border border-zinc-800">
              <h4 className="text-zinc-200 font-bold mb-1.5 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                1. Mixed Traffic Vulnerability
              </h4>
              <p className="text-[11px]">
                Indian roads combine light two-wheelers (motorcycles, scooters), three-wheelers (auto-rickshaws), and heavy commercial vehicles (buses, trucks). When a heavy vehicle trails a vulnerable two-wheeler with reduced headway, the cascade fatality index escalates by 2.4×.
              </p>
            </div>

            <div className="bg-zinc-900/60 p-3.5 rounded-lg border border-zinc-800">
              <h4 className="text-zinc-200 font-bold mb-1.5 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                2. Shockwave Deceleration
              </h4>
              <p className="text-[11px]">
                Sudden deceleration (deceleration &lt; -3.5 m/s²) triggers a backwards-propagating compression wave. If the trailing vehicles have Time-to-Collision (TTC = D / Δv) under 1.8 seconds, multi-vehicle accordion pileups occur.
              </p>
            </div>

            <div className="bg-zinc-900/60 p-3.5 rounded-lg border border-zinc-800">
              <h4 className="text-zinc-200 font-bold mb-1.5 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                3. Early Warning Broadcast
              </h4>
              <p className="text-[11px]">
                When the composite Cascade Risk Score reaches 70+, automated alarms trigger roadside Variable Message Signs (VMS) and connected dashboard alerts to flash emergency brake advisories before secondary impacts occur.
              </p>
            </div>
          </div>

          <div className="bg-zinc-900/40 p-3 rounded-lg border border-zinc-800/80 text-[11px]">
            <span className="text-zinc-200 font-bold block mb-1">
              Accident Cascade Index (ACI) Equation:
            </span>
            <code>
              ACI = w₁·[1 - min(TTC, 3)/3] + w₂·[Decel_norm] + w₃·[TwoWheeler_Sandwich] + w₄·[Follower_Density]
            </code>
          </div>
        </div>
      )}
    </div>
  );
};
