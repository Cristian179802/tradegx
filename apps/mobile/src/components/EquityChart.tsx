import Svg, { Path, Defs, LinearGradient, Stop } from "react-native-svg";
import { colors } from "@/theme";

// Equity curve nativă (SVG): linie + arie cu gradient. Fără dependențe grele.
export function EquityChart({
  data,
  width,
  height = 130,
}: {
  data: number[];
  width: number;
  height?: number;
}) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 8;
  const h = height - pad * 2;
  const stepX = width / (data.length - 1);

  const pts = data.map((v, i) => ({
    x: i * stepX,
    y: pad + h - ((v - min) / range) * h,
  }));

  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
  const area = `${line} L${width.toFixed(1)},${height} L0,${height} Z`;

  const positive = data[data.length - 1] >= data[0];
  const color = positive ? colors.bull : colors.bear;

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity="0.35" />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Path d={area} fill="url(#equityGrad)" />
      <Path d={line} stroke={color} strokeWidth={2.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
    </Svg>
  );
}
