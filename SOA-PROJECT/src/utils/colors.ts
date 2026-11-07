import { IndianVehicleClass } from '../types/traffic';

export const VEHICLE_CLASS_COLORS: Record<IndianVehicleClass, { hex: string; bg: string; border: string; text: string }> = {
  'Auto-rickshaw': {
    hex: '#f59e0b', // Amber/Yellow
    bg: 'bg-amber-500/15',
    border: 'border-amber-500',
    text: 'text-amber-400',
  },
  'Motorcycle': {
    hex: '#06b6d4', // Cyan
    bg: 'bg-cyan-500/15',
    border: 'border-cyan-500',
    text: 'text-cyan-400',
  },
  'Scooter': {
    hex: '#10b981', // Emerald
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500',
    text: 'text-emerald-400',
  },
  'Car': {
    hex: '#3b82f6', // Blue
    bg: 'bg-blue-500/15',
    border: 'border-blue-500',
    text: 'text-blue-400',
  },
  'Bus': {
    hex: '#8b5cf6', // Violet
    bg: 'bg-violet-500/15',
    border: 'border-violet-500',
    text: 'text-violet-400',
  },
  'Truck': {
    hex: '#ec4899', // Pink / Magenta
    bg: 'bg-pink-500/15',
    border: 'border-pink-500',
    text: 'text-pink-400',
  },
  'Tempo': {
    hex: '#f97316', // Orange
    bg: 'bg-orange-500/15',
    border: 'border-orange-500',
    text: 'text-orange-400',
  },
  'Bicycle': {
    hex: '#84cc16', // Lime
    bg: 'bg-lime-500/15',
    border: 'border-lime-500',
    text: 'text-lime-400',
  },
  'Pedestrian': {
    hex: '#e2e8f0', // Slate
    bg: 'bg-slate-500/15',
    border: 'border-slate-400',
    text: 'text-slate-300',
  },
};

export function getVehicleColor(vehicleClass: IndianVehicleClass): string {
  return VEHICLE_CLASS_COLORS[vehicleClass]?.hex || '#38bdf8';
}
