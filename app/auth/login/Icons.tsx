import Svg, { Circle, Path, Rect, Polyline, Line } from "react-native-svg";

// ════════════════════════════════════════════════════════════════════════════
//  SVG ICONS
// ════════════════════════════════════════════════════════════════════════════

export function IconUser({ color = "rgba(255,255,255,0.45)", size = 17 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      />
      <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

export function IconLock({ color = "rgba(255,255,255,0.45)", size = 17 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="11" width="18" height="11" rx="2"
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      />
      <Path d="M7 11V7a5 5 0 0 1 10 0v4"
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  );
}

export function IconEyeOn({ color = "rgba(255,255,255,0.4)", size = 17 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

export function IconEyeOff({ color = "rgba(255,255,255,0.4)", size = 17 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      />
      <Line x1="1" y1="1" x2="23" y2="23"
        stroke={color} strokeWidth="2" strokeLinecap="round"
      />
    </Svg>
  );
}

export function IconLogin({ color = "#fff", size = 16 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"
        stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      />
      <Polyline points="10 17 15 12 10 7"
        stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      />
      <Line x1="15" y1="12" x2="3" y2="12"
        stroke={color} strokeWidth="2.5" strokeLinecap="round"
      />
    </Svg>
  );
}

export function IconWarning({ color = "rgba(248,113,113,0.9)", size = 15 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Line x1="12" y1="8" x2="12" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="12" y1="16" x2="12.01" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function WaterDropIcon() {
  return (
    <Svg width="32" height="32" viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C12 2 4 10 4 15a8 8 0 0 0 16 0C20 10 12 2 12 2z"
        fill="rgba(255,255,255,0.95)"
      />
      <Path
        d="M9 16.5a3 3 0 0 0 4.5 1.5"
        stroke="rgba(99,102,241,0.8)" strokeWidth="1.5" strokeLinecap="round"
      />
    </Svg>
  );
}