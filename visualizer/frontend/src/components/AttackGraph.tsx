import { useEffect, useMemo, useRef, useState } from "react";
import ForceGraph3D from "react-force-graph-3d";
import * as THREE from "three";
import { RotateCcw } from "lucide-react";
import type { GraphData, GraphEdge, GraphNode, Severity } from "../types";
import { eventLabel, severityFrom } from "../lib/format";
import { SeverityBadge } from "./SeverityBadge";

const tokenBySeverity: Record<Severity, string> = {
  recon: "--sev-recon", "brute-force": "--sev-bruteforce", idor: "--sev-recon", sqli: "--sev-authsuccess",
  "path-traversal": "--sev-bruteforce", "stored-xss": "--sev-adminaccess", "auth-success": "--sev-authsuccess",
  "admin-access": "--sev-adminaccess", info: "--sev-info",
};
const css = (token: string) => getComputedStyle(document.documentElement).getPropertyValue(token).trim();
type RenderedEdge = Omit<GraphEdge, "source" | "target"> & { source: GraphNode | string; target: GraphNode | string };

function labelSprite(label: string) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  canvas.width = 512; canvas.height = 72;
  if (context) {
    context.font = "600 24px IBM Plex Mono, monospace";
    context.textAlign = "center"; context.textBaseline = "middle";
    context.fillStyle = css("--text-secondary");
    context.fillText(label.slice(0, 32), 256, 36);
  }
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, depthWrite: false }));
  sprite.position.set(0, 8, 0); sprite.scale.set(34, 4.8, 1);
  return sprite;
}

export function AttackGraph({ graph, confidence, selectedId, onSelect, onHover }: { graph: GraphData; confidence: number; selectedId?: string; onSelect: (id?: string) => void; onHover: (id?: string) => void }) {
  const host = useRef<HTMLDivElement>(null); const graphRef = useRef<any>(null); const [size, setSize] = useState({ width: 800, height: 520 }); const [hovered, setHovered] = useState<string>();
  useEffect(() => { if (!host.current) return; const observer = new ResizeObserver(([entry]) => entry && setSize({ width: entry.contentRect.width, height: entry.contentRect.height })); observer.observe(host.current); return () => observer.disconnect(); }, []);
  const data = useMemo(() => ({ nodes: graph.nodes.map((node) => ({ ...node })), links: graph.edges.map((edge) => ({ ...edge })) }), [graph]);
  const activeId = hovered ?? selectedId;
  const connected = useMemo(() => { const ids = new Set<string>(); if (activeId) graph.edges.forEach((edge) => { if (edge.source === activeId || edge.target === activeId) { ids.add(edge.source); ids.add(edge.target); } }); return ids; }, [activeId, graph.edges]);
  const color = (node: GraphNode) => css(tokenBySeverity[severityFrom(node.stage ?? node.type)]);
  const makeNode = (raw: object) => { const node = raw as GraphNode; const severity = severityFrom(node.stage ?? node.type); const radius = Math.max(3, Math.min(7, 3 + confidence * 4)) + (severity === "admin-access" ? 1.5 : 0); const group = new THREE.Group(); const dimmed = activeId && node.id !== activeId && !connected.has(node.id); const sphere = new THREE.Mesh(new THREE.SphereGeometry(radius, 20, 20), new THREE.MeshLambertMaterial({ color: color(node), transparent: true, opacity: dimmed ? .35 : 1 })); group.add(sphere); group.add(labelSprite(eventLabel(node.type))); if (node.id === selectedId) { const ring = new THREE.Mesh(new THREE.TorusGeometry(radius + 1.7, .35, 8, 32), new THREE.MeshBasicMaterial({ color: css("--brand") })); group.add(ring); } if (node.id === activeId) group.scale.setScalar(1.15); return group; };
  const reset = () => graphRef.current?.cameraPosition({ x: 0, y: 0, z: 180 }, { x: 0, y: 0, z: 0 }, 400);
  const selectNode = (raw: object) => { const node = raw as GraphNode & { x?: number; y?: number; z?: number }; onSelect(node.id); const distance = 70; const length = Math.hypot(node.x ?? 0, node.y ?? 0, node.z ?? 0) || 1; graphRef.current?.cameraPosition({ x: (node.x ?? 0) * (1 + distance / length), y: (node.y ?? 0) * (1 + distance / length), z: (node.z ?? 0) * (1 + distance / length) }, node, 400); };
  return <div ref={host} className="graph-area" aria-label="Grafo tridimensional de eventos"><div className="graph-toolbar"><div><div className="legend" aria-label="Leyenda de clasificación"><SeverityBadge severity="brute-force" /><SeverityBadge severity="idor" /><SeverityBadge severity="sqli" /><SeverityBadge severity="path-traversal" /><SeverityBadge severity="stored-xss" /></div><p className="edge-legend"><span className="edge-sample causal" />Causa declarada <span className="edge-sample sequence" />Orden observado</p></div><button className="button-secondary bg-[color-mix(in_srgb,var(--surface)_85%,transparent)]" onClick={reset}><RotateCcw size={15} />Restablecer vista</button></div>
    <ForceGraph3D ref={graphRef} width={size.width} height={size.height} graphData={data} backgroundColor={css("--bg")} showNavInfo={false} dagMode="lr" dagLevelDistance={34} nodeThreeObject={makeNode} nodeLabel={() => ""} onNodeHover={(raw) => { const id = (raw as GraphNode | null)?.id; setHovered(id); onHover(id); }} onNodeClick={selectNode} onBackgroundClick={() => onSelect(undefined)} linkColor={(raw) => { const edge = raw as RenderedEdge; const source = typeof edge.source === "string" ? edge.source : edge.source.id; const target = typeof edge.target === "string" ? edge.target : edge.target.id; if (activeId && (source === activeId || target === activeId)) return css("--text-primary"); return edge.relationship === "causes" ? css("--accent") : css("--border-strong"); }} linkOpacity={activeId ? .55 : .7} linkWidth={(raw) => { const edge = raw as RenderedEdge; const source = typeof edge.source === "string" ? edge.source : edge.source.id; const target = typeof edge.target === "string" ? edge.target : edge.target.id; if (activeId && (source === activeId || target === activeId)) return 2.5; return edge.relationship === "causes" ? 2 : 1; }} linkDirectionalParticles={(raw) => (raw as GraphEdge).relationship === "causes" ? 2 : 0} linkDirectionalParticleWidth={1.8} linkDirectionalArrowLength={4} linkDirectionalArrowRelPos={1} enableNodeDrag={false} warmupTicks={60} cooldownTicks={80} />
  </div>;
}
