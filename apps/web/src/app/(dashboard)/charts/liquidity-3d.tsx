"use client";

import * as React from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Loader2, Move3d } from "lucide-react";

interface Candle { time: number; open: number; high: number; low: number; close: number; v: number }

const PB = 46; // buckete preț
const TB = 80; // buckete timp (max)

// gradient întunecat → indigo → violet → auriu (vârfuri = munți de lichiditate)
function heat(t: number): [number, number, number] {
  const stops: [number, [number, number, number]][] = [
    [0.0, [0.04, 0.05, 0.12]],
    [0.35, [0.31, 0.27, 0.9]],
    [0.65, [0.55, 0.36, 0.96]],
    [0.85, [0.98, 0.45, 0.63]],
    [1.0, [0.98, 0.75, 0.14]],
  ];
  for (let i = 0; i < stops.length - 1; i++) {
    const [a, ca] = stops[i]!, [b, cb] = stops[i + 1]!;
    if (t >= a && t <= b) {
      const f = (t - a) / (b - a || 1);
      return [ca[0] + (cb[0] - ca[0]) * f, ca[1] + (cb[1] - ca[1]) * f, ca[2] + (cb[2] - ca[2]) * f];
    }
  }
  return stops[stops.length - 1]![1];
}

export function Liquidity3D({
  symbol, timeframe, loadingLabel, errorLabel, hintLabel,
}: {
  symbol: string; timeframe: string; loadingLabel: string; errorLabel: string; hintLabel: string;
}) {
  const mountRef = React.useRef<HTMLDivElement>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [meta, setMeta] = React.useState<{ hasVolume: boolean; priceMin: number; priceMax: number } | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    let renderer: THREE.WebGLRenderer | null = null;
    let controls: OrbitControls | null = null;
    let raf = 0;
    let ro: ResizeObserver | null = null;
    const disposables: { dispose: () => void }[] = [];

    (async () => {
      setLoading(true); setError(false);
      let candles: Candle[] = [];
      try {
        const res = await fetch(`/api/charts/candles?symbol=${symbol}&tf=${timeframe}`, { cache: "no-store" });
        if (!res.ok) throw new Error();
        candles = (await res.json()).candles;
      } catch { if (!cancelled) { setError(true); setLoading(false); } return; }
      if (cancelled || !mountRef.current) return;
      if (!candles || candles.length < 20) { setError(true); setLoading(false); return; }

      // downsample timp la TB coloane
      const step = Math.max(1, Math.ceil(candles.length / TB));
      const cols: Candle[] = [];
      for (let i = 0; i < candles.length; i += step) {
        const chunk = candles.slice(i, i + step);
        cols.push({
          time: chunk[0]!.time,
          open: chunk[0]!.open,
          high: Math.max(...chunk.map((c) => c.high)),
          low: Math.min(...chunk.map((c) => c.low)),
          close: chunk[chunk.length - 1]!.close,
          v: chunk.reduce((s, c) => s + (c.v || 0), 0),
        });
      }
      const nT = cols.length;
      const priceMin = Math.min(...cols.map((c) => c.low));
      const priceMax = Math.max(...cols.map((c) => c.high));
      const span = priceMax - priceMin || 1;
      const totalVol = cols.reduce((s, c) => s + c.v, 0);
      const hasVolume = totalVol > 0;

      // matrice timp × preț (volum sau timp-la-preț ca fallback)
      const M: number[][] = Array.from({ length: nT }, () => new Array(PB).fill(0));
      for (let ti = 0; ti < nT; ti++) {
        const c = cols[ti]!;
        const b0 = Math.floor(((c.low - priceMin) / span) * (PB - 1));
        const b1 = Math.floor(((c.high - priceMin) / span) * (PB - 1));
        const lo = Math.max(0, Math.min(b0, b1)), hi = Math.min(PB - 1, Math.max(b0, b1));
        const cnt = hi - lo + 1;
        const w = (hasVolume ? c.v : 1) / cnt;
        for (let b = lo; b <= hi; b++) M[ti]![b] += w;
      }
      let maxV = 0;
      for (const row of M) for (const v of row) if (v > maxV) maxV = v;
      maxV = maxV || 1;

      if (!cancelled) setMeta({ hasVolume, priceMin, priceMax });

      // ── Scenă Three.js ──
      const mount = mountRef.current;
      const W = mount.clientWidth, H = mount.clientHeight;
      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x09090b, 0.03);

      const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 1000);
      camera.position.set(0, 26, 40);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(W, H);
      renderer.setClearColor(0x09090b, 1);
      mount.appendChild(renderer.domElement);

      const GW = 60, GD = 40; // dimensiuni teren
      const geo = new THREE.PlaneGeometry(GW, GD, nT - 1, PB - 1);
      geo.rotateX(-Math.PI / 2);
      const pos = geo.attributes.position as THREE.BufferAttribute;
      const colors = new Float32Array(pos.count * 3);
      const HSCALE = 16;
      for (let v = 0; v < pos.count; v++) {
        const ix = v % nT;          // timp
        const iy = Math.floor(v / nT); // preț
        const val = (M[ix]?.[iy] ?? 0) / maxV;
        pos.setY(v, val * HSCALE);
        const [r, g, b] = heat(val);
        colors[v * 3] = r; colors[v * 3 + 1] = g; colors[v * 3 + 2] = b;
      }
      geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      geo.computeVertexNormals();
      disposables.push(geo);

      const mat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide });
      disposables.push(mat);
      const mesh = new THREE.Mesh(geo, mat);
      scene.add(mesh);

      // grilă wireframe subtilă peste teren (aspect „tech")
      const wire = new THREE.WireframeGeometry(geo);
      const wireMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.05 });
      disposables.push(wire, wireMat);
      scene.add(new THREE.LineSegments(wire, wireMat));

      // linia prețului curent (bright)
      const lastPrice = cols[nT - 1]!.close;
      const pFrac = (lastPrice - priceMin) / span;
      const zCur = GD / 2 - pFrac * GD;
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-GW / 2, 0.5, zCur), new THREE.Vector3(GW / 2, 0.5, zCur),
      ]);
      const lineMat = new THREE.LineBasicMaterial({ color: 0x818cf8, transparent: true, opacity: 0.7 });
      disposables.push(lineGeo, lineMat);
      scene.add(new THREE.Line(lineGeo, lineMat));

      // podea glow discretă
      const glowGeo = new THREE.PlaneGeometry(GW * 1.4, GD * 1.4);
      glowGeo.rotateX(-Math.PI / 2);
      const glowMat = new THREE.MeshBasicMaterial({ color: 0x1e1b4b, transparent: true, opacity: 0.35 });
      disposables.push(glowGeo, glowMat);
      const floor = new THREE.Mesh(glowGeo, glowMat);
      floor.position.y = -0.2;
      scene.add(floor);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.5;
      controls.minDistance = 20;
      controls.maxDistance = 80;
      controls.maxPolarAngle = Math.PI / 2.05;
      controls.target.set(0, 3, 0);
      // pauză auto-rotire cât utilizatorul interacționează
      controls.addEventListener("start", () => { if (controls) controls.autoRotate = false; });

      if (!cancelled) setLoading(false);

      const animate = () => {
        raf = requestAnimationFrame(animate);
        controls?.update();
        renderer?.render(scene, camera);
      };
      animate();

      ro = new ResizeObserver(() => {
        if (!renderer || !mount) return;
        const w = mount.clientWidth, h = mount.clientHeight;
        camera.aspect = w / h; camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      });
      ro.observe(mount);
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      ro?.disconnect();
      controls?.dispose();
      for (const d of disposables) d.dispose();
      if (renderer) {
        renderer.dispose();
        renderer.domElement.remove();
      }
    };
  }, [symbol, timeframe]);

  const fmt = (n: number) => (n >= 1000 ? n.toFixed(0) : n >= 10 ? n.toFixed(2) : n.toFixed(4));

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div ref={mountRef} className="absolute inset-0" />

      {/* etichete preț sus/jos */}
      {meta && !loading && !error && (
        <>
          <div className="absolute top-2 left-3 font-mono text-[10px] text-zinc-500 pointer-events-none">{fmt(meta.priceMax)}</div>
          <div className="absolute bottom-2 left-3 font-mono text-[10px] text-zinc-500 pointer-events-none">{fmt(meta.priceMin)}</div>
          <div className="absolute top-2 right-3 flex items-center gap-1.5 text-[10px] text-zinc-500 pointer-events-none">
            <Move3d className="w-3 h-3 text-indigo-400" />{hintLabel}
          </div>
          <div className="absolute bottom-2 right-3 font-mono text-[9px] uppercase tracking-widest text-indigo-400/60 pointer-events-none">
            {meta.hasVolume ? "VOLUME-BY-PRICE" : "TIME-AT-PRICE"}
          </div>
        </>
      )}

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/50 z-10">
          <div className="flex items-center gap-2 text-xs text-zinc-400"><Loader2 className="w-4 h-4 animate-spin text-indigo-400" />{loadingLabel}</div>
        </div>
      )}
      {error && !loading && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <p className="text-xs text-zinc-500">{errorLabel}</p>
        </div>
      )}
    </div>
  );
}
