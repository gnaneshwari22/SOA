import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Smartphone, 
  Send, 
  Radio, 
  Bell, 
  ShieldAlert, 
  CheckCheck, 
  Clock, 
  ExternalLink,
  Volume2
} from 'lucide-react';
import { CascadeRiskAssessment } from '../types/traffic';

interface DispatchedMessage {
  id: string;
  timestamp: string;
  type: 'SMS' | 'PUSH' | 'V2X' | 'VMS' | 'ITMS';
  recipient: string;
  message: string;
  status: 'DELIVERED' | 'DISPATCHED' | 'BROADCASTING';
  riskScore: number;
}

interface WarningMessageDisplayerProps {
  riskAssessment: CascadeRiskAssessment | null;
  isAnalyzing: boolean;
  hasVideo: boolean;
}

export const WarningMessageDisplayer: React.FC<WarningMessageDisplayerProps> = ({
  riskAssessment,
  isAnalyzing,
  hasVideo,
}) => {
  const [messages, setMessages] = useState<DispatchedMessage[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'mobile' | 'v2x' | 'vms'>('all');
  const [browserNotificationEnabled, setBrowserNotificationEnabled] = useState(false);
  const [lastSentScore, setLastSentScore] = useState<number>(0);

  // Request browser notification permission if desired
  const enableBrowserNotifications = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setBrowserNotificationEnabled(true);
        new Notification('AccidentCascade AI Connected', {
          body: 'You will receive instant traffic hazard and emergency brake advisories.',
          icon: '/favicon.ico',
        });
      }
    }
  };

  // Generate automated warning message whenever a critical or watch risk occurs
  useEffect(() => {
    if (!isAnalyzing || !riskAssessment) return;

    // Only dispatch if score is elevated (>= 50) and different enough from previous alert
    if (riskAssessment.score >= 50 && Math.abs(riskAssessment.score - lastSentScore) >= 8) {
      setLastSentScore(riskAssessment.score);

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const vehiclesText = riskAssessment.affectedVehicleIds.length > 0 
        ? `Vehicles: ${riskAssessment.affectedVehicleIds.join(', ')}` 
        : 'Dense trailing corridor';

      const isCritical = riskAssessment.score >= 70;

      // Create new multi-channel dispatch package
      const newDispatches: DispatchedMessage[] = [
        {
          id: `msg-${Date.now()}-sms`,
          timestamp: timeStr,
          type: 'SMS',
          recipient: 'Corridor Commuters & Drivers (+91-98xxxxxx)',
          message: isCritical 
            ? `🚨 [CRITICAL TRAFFIC ALERT] Sudden deceleration shockwave ahead! Cascade Risk: ${riskAssessment.score}/100. ${riskAssessment.primaryHazard}. ${vehiclesText}. BRAKE NOW.` 
            : `⚠️ [TRAFFIC ADVISORY] Tight vehicle headway detected ahead (${riskAssessment.score}/100). Maintain 3-second safe following distance.`,
          status: 'DELIVERED',
          riskScore: riskAssessment.score,
        },
        {
          id: `msg-${Date.now()}-v2x`,
          timestamp: timeStr,
          type: 'V2X',
          recipient: 'Connected Dashboards & Auto/2W Helmets',
          message: isCritical
            ? `[V2X HEADS-UP] EMERGENCY BRAKE WAVE — Distance: ~150m — TTC < 1.8s — Prepare to stop.`
            : `[V2X INFO] High density bottleneck in lane 1. Adjust speed to 35 km/h.`,
          status: 'BROADCASTING',
          riskScore: riskAssessment.score,
        },
        {
          id: `msg-${Date.now()}-vms`,
          timestamp: timeStr,
          type: 'VMS',
          recipient: 'Highway Overhead Gantry #04 (Sector 12)',
          message: isCritical 
            ? `🔴 CAUTION: PILEUP RISK AHEAD / SLOW DOWN IMMEDIATELY / ACCIDENT CASSIFICATION ALERT` 
            : `🟡 HEAVY TRAFFIC AHEAD / MAINTAIN HEADWAY`,
          status: 'BROADCASTING',
          riskScore: riskAssessment.score,
        },
      ];

      setMessages((prev) => [...newDispatches, ...prev].slice(0, 15));

      // If browser notifications allowed and critical
      if (browserNotificationEnabled && isCritical && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(`🚨 Emergency Cascade Warning: ${riskAssessment.score}/100`, {
          body: `${riskAssessment.primaryHazard}. Reduce speed immediately!`,
        });
      }
    }
  }, [riskAssessment, isAnalyzing, browserNotificationEnabled, lastSentScore]);

  const filteredMessages = messages.filter((m) => {
    if (activeTab === 'mobile') return m.type === 'SMS' || m.type === 'PUSH';
    if (activeTab === 'v2x') return m.type === 'V2X';
    if (activeTab === 'vms') return m.type === 'VMS';
    return true;
  });

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden font-mono text-xs flex flex-col">
      {/* Panel Header */}
      <div className="bg-zinc-900/80 px-4 py-3 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-emerald-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
            Real-Time Automated Warning Message Dispatch Center
          </h2>
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            Active CV Triggered
          </span>
        </div>

        {/* Browser Push Enable Action */}
        <div className="flex items-center gap-2">
          <button
            onClick={enableBrowserNotifications}
            className={`px-2.5 py-1 rounded text-[11px] font-mono flex items-center gap-1.5 transition-colors ${
              browserNotificationEnabled
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
            }`}
          >
            <Bell className="w-3 h-3 text-amber-400" />
            <span>{browserNotificationEnabled ? 'Web Push Active' : 'Enable Live Push Alerts'}</span>
          </button>
        </div>
      </div>

      <div className="p-4 flex flex-col lg:flex-row gap-4">
        {/* Left: Interactive Simulated Mobile Phone Screen preview */}
        <div className="w-full lg:w-80 shrink-0 bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 flex flex-col">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-2">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5 text-zinc-400" />
              Driver Phone / App Screen
            </span>
            <span className="text-[10px] text-zinc-500">Live Simulation</span>
          </div>

          <div className="flex-1 flex flex-col justify-center min-h-[160px] bg-zinc-950/70 border border-zinc-800/80 rounded-lg p-3">
            {isAnalyzing && riskAssessment && riskAssessment.score >= 50 ? (
              <div className={`p-3 rounded-lg border flex flex-col gap-2 ${
                riskAssessment.score >= 70 
                  ? 'bg-red-950/40 border-red-500/60 shadow-lg shadow-red-950/50' 
                  : 'bg-amber-950/40 border-amber-500/60'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-red-400 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3 animate-pulse text-red-400" />
                    TRAFFIC SAFETY NOTIFICATION
                  </span>
                  <span className="text-[9px] text-zinc-400">NOW</span>
                </div>

                <p className="text-xs font-bold text-zinc-100 leading-snug">
                  {riskAssessment.score >= 70 
                    ? '⚠️ EMERGENCY: Sudden braking detected ahead in your corridor!' 
                    : '⚠️ CAUTION: Heavy trailing congestion with short headway.'}
                </p>

                <p className="text-[11px] text-zinc-300">
                  Risk Level: <span className="font-bold text-red-400">{riskAssessment.level} ({riskAssessment.score}/100)</span>. 
                  {riskAssessment.affectedVehicleIds.length > 0 && ` Affecting: ${riskAssessment.affectedVehicleIds.join(', ')}.`}
                </p>

                <div className="mt-1 pt-1.5 border-t border-zinc-800 text-[10px] text-emerald-400 font-bold flex items-center justify-between">
                  <span>ACTION: TAP BRAKES & EXTEND DISTANCE</span>
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-zinc-500 space-y-1">
                <Smartphone className="w-6 h-6 mx-auto text-zinc-600 mb-1" />
                <p className="text-xs font-semibold text-zinc-400">
                  {hasVideo && isAnalyzing ? 'Road condition safe — No active hazard' : 'Standby for Video Analysis'}
                </p>
                <p className="text-[10px] text-zinc-500">
                  When risk &gt; 50 is detected, real warning SMS and push messages render here instantly.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Dispatched Broadcast Feed Log */}
        <div className="flex-1 flex flex-col">
          {/* Filter tabs */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-2">
            <div className="flex items-center gap-1.5">
              {(['all', 'mobile', 'v2x', 'vms'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-2.5 py-1 rounded text-[11px] uppercase font-bold transition-colors ${
                    activeTab === tab 
                      ? 'bg-red-600 text-white' 
                      : 'text-zinc-400 hover:text-zinc-200 bg-zinc-900'
                  }`}
                >
                  {tab === 'all' ? 'All Broadcasts' : tab === 'mobile' ? 'SMS / Driver Push' : tab === 'v2x' ? 'V2X Dashboard' : 'Roadside VMS'}
                </button>
              ))}
            </div>

            <span className="text-[11px] text-zinc-400">
              {messages.length} Messages Dispatched
            </span>
          </div>

          {/* List of dispatched messages */}
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {filteredMessages.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-zinc-800 rounded-lg text-zinc-500">
                <Send className="w-5 h-5 mx-auto text-zinc-600 mb-1.5" />
                <p className="text-xs text-zinc-400">
                  {isAnalyzing 
                    ? 'No elevated cascade risks triggered in current frame window yet.' 
                    : 'Start video analysis to trigger automated hazard alert messages.'}
                </p>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  The system automatically compiles and delivers warning messages upon sudden decelerations or tight headway.
                </p>
              </div>
            ) : (
              filteredMessages.map((msg) => (
                <div 
                  key={msg.id} 
                  className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-2.5 flex flex-col gap-1.5 hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        msg.type === 'SMS' 
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                          : msg.type === 'V2X' 
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}>
                        {msg.type}
                      </span>
                      <span className="text-zinc-300 font-bold text-xs truncate max-w-[220px] sm:max-w-xs">
                        {msg.recipient}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                      <span>{msg.timestamp}</span>
                      <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                        <CheckCheck className="w-3 h-3" />
                        {msg.status}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-zinc-200 font-mono bg-zinc-950/60 p-2 rounded border border-zinc-900">
                    "{msg.message}"
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
