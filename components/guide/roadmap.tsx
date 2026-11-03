"use client";

import "@xyflow/react/dist/style.css";
import { Background, Handle, Position, ReactFlow, type Edge, type Node, type NodeProps } from "@xyflow/react";
import { Warning as TriangleAlert } from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useRef, useState } from "react";
import { OwnerBadge } from "@/components/guide/owner-badge";
import type { Guide, Step } from "@/lib/schema/guide.schema";
import { cn } from "@/lib/utils";

type Side = "top" | "right" | "bottom" | "left";
type StepNodeData = { step: Step; blockers: number; waitRatio: number };
type StepNode = Node<StepNodeData, "step">;

const NODE_W = 220;
const NODE_H = 118;
const GAP_X = 40;
const GAP_Y = 36;
const POS: Record<Side, Position> = { top: Position.Top, right: Position.Right, bottom: Position.Bottom, left: Position.Left };
const SIDES: Side[] = ["top", "right", "bottom", "left"];

const BORDER = { agent: "border-l-own-agent", human: "border-l-own-human", provider: "border-l-own-provider" } as const;
const handleCls = "!size-1 !min-h-0 !min-w-0 !border-0 !bg-transparent";

function StepCard({ data }: NodeProps<StepNode>) {
  const { step, blockers, waitRatio } = data;
  return (
    <button
      type="button"
      onClick={() => document.getElementById(`step-${step.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}
      className={cn(
        "relative flex h-full w-full flex-col gap-1.5 rounded-lg border border-l-[3px] bg-card p-3 text-left shadow-card transition-colors hover:border-border-strong focus-visible:outline-2",
        BORDER[step.owner],
      )}
      aria-label={`Step ${step.order}: ${step.title}. Jump to details`}
    >
      {SIDES.map((side) => (
        <Handle key={`t-${side}`} id={`t-${side}`} type="target" position={POS[side]} className={handleCls} isConnectable={false} />
      ))}
      {SIDES.map((side) => (
        <Handle key={`s-${side}`} id={`s-${side}`} type="source" position={POS[side]} className={handleCls} isConnectable={false} />
      ))}
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] text-subtle-foreground">{String(step.order).padStart(2, "0")}</span>
        <OwnerBadge owner={step.owner} />
      </div>
      <p className="line-clamp-2 text-[13px] leading-snug font-medium">{step.title}</p>
      <div className="mt-auto flex items-center gap-2">
        {step.owner === "provider" ? (
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted" title="Waiting on the provider">
            <div className="stripes h-full rounded-full" style={{ width: `${Math.max(15, waitRatio * 100)}%` }} />
          </div>
        ) : (
          <span className="font-mono text-[11px] text-subtle-foreground">{step.estMinutes ? `~${step.estMinutes} min` : "time n/a"}</span>
        )}
        {blockers > 0 && (
          <span className="ml-auto inline-flex items-center gap-0.5 rounded-full bg-destructive/15 px-1.5 text-[10px] font-medium text-destructive" title={`${blockers} known blocker${blockers > 1 ? "s" : ""}`}>
            <TriangleAlert className="size-3" aria-hidden />
            {blockers}
          </span>
        )}
      </div>
    </button>
  );
}

const nodeTypes = { step: StepCard };

function useWidth(ref: React.RefObject<HTMLDivElement | null>): number {
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(e!.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

/**
 * Read-only roadmap: one node per step, coloured by owner, blockers as red markers.
 * Steps snake left→right then right→left so nodes stay readable instead of shrinking to fit.
 */
export function Roadmap({ guide }: { guide: Guide }) {
  const ref = useRef<HTMLDivElement>(null);
  const width = useWidth(ref);
  const { resolvedTheme } = useTheme();
  const cols = width ? Math.max(1, Math.min(guide.steps.length, Math.floor((width - 24 + GAP_X) / (NODE_W + GAP_X)))) : 0;

  const { nodes, edges, rows } = useMemo(() => {
    if (!cols) return { nodes: [], edges: [], rows: 0 };
    const steps = [...guide.steps].sort((a, b) => a.order - b.order);
    const blockerCount = new Map<string, number>();
    for (const b of guide.blockers) if (b.stepId) blockerCount.set(b.stepId, (blockerCount.get(b.stepId) ?? 0) + 1);
    const maxDays = guide.time.approvalWait.maxDays ?? 0;
    const waitRatio = maxDays > 0 ? Math.min(1, maxDays / 60) : 0.3;

    const place = (i: number) => {
      const r = Math.floor(i / cols);
      const c = i % cols;
      const reversed = r % 2 === 1;
      return { r, reversed, x: (reversed ? cols - 1 - c : c) * (NODE_W + GAP_X), y: r * (NODE_H + GAP_Y) };
    };

    const nodes: StepNode[] = steps.map((step, i) => {
      const p = place(i);
      return {
        id: step.id,
        type: "step",
        position: { x: p.x, y: p.y },
        data: { step, blockers: blockerCount.get(step.id) ?? 0, waitRatio },
        width: NODE_W,
        height: NODE_H,
        draggable: false,
        selectable: false,
        connectable: false,
      };
    });
    const edges: Edge[] = steps.slice(1).map((s, i) => {
      const a = place(i);
      const b = place(i + 1);
      const [out, inn]: [Side, Side] = a.r !== b.r ? ["bottom", "top"] : a.reversed ? ["left", "right"] : ["right", "left"];
      return {
        id: `${steps[i]!.id}->${s.id}`,
        source: steps[i]!.id,
        target: s.id,
        sourceHandle: `s-${out}`,
        targetHandle: `t-${inn}`,
        type: "smoothstep",
        animated: s.owner === "provider",
        style: { stroke: "var(--border-strong)", strokeWidth: 1.25 },
      };
    });
    return { nodes, edges, rows: Math.ceil(steps.length / cols) };
  }, [guide, cols]);

  const height = rows ? rows * NODE_H + (rows - 1) * GAP_Y + 48 : 184;

  return (
    <div ref={ref} className="overflow-hidden rounded-xl border bg-surface" style={{ height }} aria-label="Setup roadmap" role="figure">
      {cols > 0 && (
        <ReactFlow
          key={cols}
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.06, minZoom: 0.6, maxZoom: 1 }}
          minZoom={0.6}
          maxZoom={1}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          zoomOnScroll={false}
          zoomOnPinch={false}
          zoomOnDoubleClick={false}
          panOnScroll={false}
          panOnDrag={false}
          preventScrolling={false}
          colorMode={resolvedTheme === "light" ? "light" : "dark"}
          className="[&_.react-flow__pane]:!cursor-default"
        >
          <Background gap={24} size={1} color="var(--grid-line)" />
        </ReactFlow>
      )}
    </div>
  );
}

export function RoadmapLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5"><span className="h-3 w-1 rounded-full bg-own-agent" /> Agent can do</span>
      <span className="flex items-center gap-1.5"><span className="h-3 w-1 rounded-full bg-own-human" /> You do</span>
      <span className="flex items-center gap-1.5"><span className="h-3 w-1 rounded-full bg-own-provider" /> Waiting on provider</span>
      <span className="flex items-center gap-1.5"><TriangleAlert className="size-3 text-destructive" /> Known blocker</span>
    </div>
  );
}
