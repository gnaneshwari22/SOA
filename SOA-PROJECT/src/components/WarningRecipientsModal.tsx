import React, { useState } from 'react';
import { 
  Radio, 
  Car, 
  Siren, 
  TrafficCone, 
  Building2, 
  Smartphone, 
  Tv, 
  ShieldAlert,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export const WarningRecipientsModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const recipients = [
    {
      title: 'Trailing Drivers & Commuters (Corridor Traffic)',
      icon: Car,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      channels: ['Vehicle-to-Everything (V2X) On-Board Units (OBU)', 'Navigation Apps (Google Maps / Mappls / Waze)', 'Connected Dashboards'],
      purpose: 'Gives trailing vehicles 2.5–5 seconds of advance brake advisory to halt accordion pileups and shockwave collisions behind sudden braking vehicles.'
    },
    {
      title: 'Highway & Traffic Police Control Rooms (TMC / ITMS)',
      icon: Building2,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
      channels: ['Integrated Traffic Management System (ITMS) Consoles', 'Highway Operations Centers', 'NHAI Toll & Patrol Units'],
      purpose: 'Alerts traffic controllers of unfolding bottleneck blockages, allows manual signal overrides, and dispatches highway safety marshals before secondary chain crashes amplify.'
    },
    {
      title: 'Roadside Variable Message Signs (VMS Gantries)',
      icon: Tv,
      color: 'text-red-400 bg-red-500/10 border-red-500/30',
      channels: ['Overhead Highway Electronic Gantries', 'Smart City LED Variable Message Displays'],
      purpose: 'Automatically flashes high-visibility alerts ("SLOW DOWN - CRASH HAZARD 300M AHEAD", "BRAKE WAVE ALERT") to all approaching corridor vehicles.'
    },
    {
      title: 'Emergency Services (Ambulance & Fire Rescue)',
      icon: Siren,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
      channels: ['Emergency Response Support System (ERSS - 112)', 'Local Hospital Trauma Centers', 'Highway Rescue Squads'],
      purpose: 'Provides instant situational awareness and pre-dispatches trauma response teams with exact GPS coordinates and vehicle types involved.'
    },
    {
      title: 'Vulnerable Road Users (Auto-Rickshaws & 2-Wheelers)',
      icon: Smartphone,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      channels: ['Smart Helmet Audio / Intercoms', 'Smartphone Push Notifications via Mobility & Logistics Apps'],
      purpose: 'Specifically protects two-wheelers and three-wheelers in high-density corridors from being sandwiched between heavy commercial vehicles (buses/trucks).'
    }
  ];

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden font-mono text-xs">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-zinc-900/60 hover:bg-zinc-900 transition-colors flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2 text-zinc-200">
          <Radio className="w-4 h-4 text-red-400 animate-pulse" />
          <span className="font-bold uppercase tracking-wider text-xs">
            Warning Dissemination Network — Who Receives These Alerts?
          </span>
        </div>
        <div className="flex items-center gap-2 text-zinc-400">
          <span className="text-[11px]">{isOpen ? 'Hide Stakeholders' : 'View 5 Target Dissemination Channels'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 sm:p-5 border-t border-zinc-800 space-y-4">
          <p className="text-zinc-400 text-xs leading-relaxed">
            The AccidentCascade AI early warning engine broadcasts low-latency (sub-200ms) alerts to both automated infrastructure and road users to avert secondary multi-vehicle chain reactions:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recipients.map((rec, idx) => {
              const Icon = rec.icon;
              return (
                <div 
                  key={idx} 
                  className="bg-zinc-900/50 border border-zinc-800/80 rounded-lg p-3.5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`p-1.5 rounded border ${rec.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <h4 className="font-bold text-zinc-200 text-xs">
                        {rec.title}
                      </h4>
                    </div>

                    <p className="text-[11px] text-zinc-400 mb-3 leading-relaxed">
                      {rec.purpose}
                    </p>
                  </div>

                  <div className="border-t border-zinc-800/80 pt-2.5 mt-auto">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">
                      Broadcast Channels:
                    </span>
                    <ul className="space-y-1">
                      {rec.channels.map((ch, cIdx) => (
                        <li key={cIdx} className="text-[10px] text-zinc-400 flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-red-400"></span>
                          <span>{ch}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
