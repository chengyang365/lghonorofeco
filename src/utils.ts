/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Web Audio API feedback triggers to reward student actions
export const triggerHaptic = (duration: number = 12) => {
  try {
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(duration);
    }
  } catch (e) {
    // ignore
  }
};

export const playSound = (type: 'success' | 'error') => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(500, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(95, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch (e) {
    console.warn('Audio context synthesis failed or blocked by browser gesture rules.');
  }
};

// Generates Web Crypto SHA-256 standard digests for transaction safety audits
export const generateChecksum = async (payloadObj: any): Promise<string> => {
  if (!payloadObj) return "";
  try {
    const msgUint8 = new TextEncoder().encode(JSON.stringify(payloadObj));
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    return "hash_generation_failed";
  }
};

export const getLocalDateString = (): string => {
  const d = new Date(new Date().getTime() + 8 * 3600 * 1000);
  return d.toISOString().split('T')[0];
};

export const generateTimestampStr = (dateInput?: string): string => {
  const now = new Date();
  let d = new Date();
  if (dateInput) {
    const parts = dateInput.split('-');
    if (parts.length === 3) {
      d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }
  }
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()} ${now.getHours()}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
};

/**
 * Calculates total avoided carbon emissions in kg CO2e.
 * Mixed Dry Recyclables multiplier = 2.65 kg CO2e / kg
 * Used Cooking Oil (UCO) multiplier = 2.5 kg CO2e / kg (converted to biodiesel)
 * 
 * @param mixedWasteKg Weight of mixed dry recyclables in kg
 * @param ucoKg Weight of Used Cooking Oil in kg
 * @returns Total avoided carbon emissions in kg CO2e, rounded to 2 decimal places
 */
export function calculateAvoidedCarbon(mixedWasteKg: number, ucoKg: number): number {
  const mixedMultiplier = 2.65;
  const ucoMultiplier = 2.5;
  const total = (Number(mixedWasteKg) || 0) * mixedMultiplier + (Number(ucoKg) || 0) * ucoMultiplier;
  return Math.round(total * 100) / 100;
}

