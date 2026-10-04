import { addDays, toUtcDate } from "./dates";

const TITHI_NAMES = [
  "Pratipada",
  "Dwitiya",
  "Tritiya",
  "Chaturthi",
  "Panchami",
  "Shashthi",
  "Saptami",
  "Ashtami",
  "Navami",
  "Dashami",
  "Ekadashi",
  "Dwadashi",
  "Trayodashi",
  "Chaturdashi",
] as const;

export type Paksha = "shukla" | "krishna";
export type MoonPeak = "amavasya" | "purnima" | null;

export type HinduDay = {
  tithi: number;
  tithiName: string;
  paksha: Paksha;
  pakshaLabel: string;
  peak: MoonPeak;
  elongation: number;
  illumination: number;
  phaseLabel: string;
};

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

function normalizeDegrees(degrees: number) {
  const value = degrees % 360;
  return value < 0 ? value + 360 : value;
}

function sind(degrees: number) {
  return Math.sin(toRadians(degrees));
}

/** Julian date at about 6:30 in India — near sunrise, when a tithi is usually named. */
export function julianDateForIndia(isoDate: string) {
  const date = toUtcDate(isoDate);
  let year = date.getUTCFullYear();
  let month = date.getUTCMonth() + 1;
  const day = date.getUTCDate() + 1 / 24;
  if (month <= 2) {
    year -= 1;
    month += 12;
  }
  const century = Math.floor(year / 100);
  const gregorian = 2 - century + Math.floor(century / 4);
  return (
    Math.floor(365.25 * (year + 4716)) +
    Math.floor(30.6001 * (month + 1)) +
    day +
    gregorian -
    1524.5
  );
}

function sunLongitude(jde: number) {
  const t = (jde - 2451545) / 36525;
  const mean = normalizeDegrees(280.46646 + 36000.76983 * t + 0.0003032 * t * t);
  const anomaly = normalizeDegrees(357.52911 + 35999.05029 * t - 0.0001537 * t * t);
  const equation =
    (1.914602 - 0.004817 * t) * sind(anomaly) +
    (0.019993 - 0.000101 * t) * sind(2 * anomaly) +
    0.000289 * sind(3 * anomaly);
  return normalizeDegrees(mean + equation);
}

function moonLongitude(jde: number) {
  const t = (jde - 2451545) / 36525;
  const mean = normalizeDegrees(218.3164477 + 481267.88123421 * t);
  const elongation = normalizeDegrees(297.8501921 + 445267.1114034 * t);
  const sunAnomaly = normalizeDegrees(357.5291092 + 35999.0502909 * t);
  const moonAnomaly = normalizeDegrees(134.9633964 + 477198.8675055 * t);
  return normalizeDegrees(
    mean +
      6.289 * sind(moonAnomaly) +
      1.274 * sind(2 * elongation - moonAnomaly) +
      0.658 * sind(2 * elongation) +
      0.214 * sind(2 * moonAnomaly) +
      0.186 * sind(sunAnomaly) +
      0.114 * sind(2 * normalizeDegrees(93.272095 + 483202.0175233 * t)) +
      0.059 * sind(2 * elongation - 2 * moonAnomaly) +
      0.057 * sind(2 * elongation - sunAnomaly - moonAnomaly) +
      0.053 * sind(2 * elongation + moonAnomaly) +
      0.046 * sind(2 * elongation - sunAnomaly) +
      0.041 * sind(sunAnomaly - moonAnomaly) +
      0.035 * sind(elongation) +
      0.019 * sind(moonAnomaly + sunAnomaly),
  );
}

function phaseLabel(elongation: number): string {
  if (elongation < 22.5 || elongation >= 337.5) return "New moon";
  if (elongation < 67.5) return "Waxing crescent";
  if (elongation < 112.5) return "First quarter";
  if (elongation < 157.5) return "Waxing gibbous";
  if (elongation < 202.5) return "Full moon";
  if (elongation < 247.5) return "Waning gibbous";
  if (elongation < 292.5) return "Last quarter";
  return "Waning crescent";
}

export function hinduDay(isoDate: string): HinduDay {
  const jde = julianDateForIndia(isoDate);
  const elongation = normalizeDegrees(moonLongitude(jde) - sunLongitude(jde));
  const tithi = Math.min(30, Math.floor(elongation / 12) + 1);
  const paksha: Paksha = tithi <= 15 ? "shukla" : "krishna";
  const pakshaIndex = tithi <= 15 ? tithi : tithi - 15;
  const peak: MoonPeak = tithi === 15 ? "purnima" : tithi === 30 ? "amavasya" : null;
  const tithiName =
    peak === "purnima"
      ? "Purnima"
      : peak === "amavasya"
        ? "Amavasya"
        : TITHI_NAMES[pakshaIndex - 1];

  return {
    tithi,
    tithiName,
    paksha,
    pakshaLabel: paksha === "shukla" ? "Shukla paksha" : "Krishna paksha",
    peak,
    elongation,
    illumination: (1 - Math.cos(toRadians(elongation))) / 2,
    phaseLabel: phaseLabel(elongation),
  };
}

export function daysFromPeak(isoDate: string, peak: Exclude<MoonPeak, null>) {
  let best = { offset: 0, distance: 99 };
  for (let offset = -3; offset <= 3; offset += 1) {
    const date = new Date(`${isoDate}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + offset);
    const nearby = hinduDay(date.toISOString().slice(0, 10));
    if (nearby.peak === peak) {
      const distance = Math.abs(offset);
      if (distance < best.distance) best = { offset, distance };
    }
  }
  return best.distance === 99 ? null : best;
}

export function nextPeakOnOrAfter(isoDate: string, peak: Exclude<MoonPeak, null>) {
  for (let offset = 0; offset <= 40; offset += 1) {
    const date = addDays(isoDate, offset);
    if (hinduDay(date).peak === peak) return date;
  }
  return null;
}
