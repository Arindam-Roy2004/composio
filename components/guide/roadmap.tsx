"use client";

import "@xyflow/react/dist/style.css";
import { HourglassMedium, Robot, User, Warning } from "@phosphor-icons/react";
import { Handle, Position, ReactFlow, type Edge, type Node, type NodeProps } from "@xyflow/react";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Guide, Step } from "@/lib/schema/guide.schema";
import { cn } from "@/lib/utils";

const LANES = [
  { owner: "human", label: "You", icon: User, dot: "bg-own-human", text: "text-own-human" },
  { owner: "agent", label: "Agent", icon: Robot, dot: "bg-own-agent", text: "text-own-agent" },
  { owner: "provider", label: "Provider", icon: HourglassMedium, dot: "bg-own-provider", text: "text-own-provider" },
] as const;
type Owner = Step["owner"];

const LABEL_W = 60;
const LANE_H = 92;
const NODE_H = 78;
const MIN_COL = 104;
const MOBILE_NODE_H = 44;

type StepData = { step: Step; blockers: number; width: number; height: number; inline?: boolean };
type LaneData = { owner: Owner; width: number };
type StepNodeT = Node<StepData, "step">;
type LaneNodeT = Node<LaneData, "lane">;

const handle = "!size-1 !min-h-0 !min-w-0 !border-0 !bg-transparent";
const SIDES = ["Left", "Right", "Top", "Bottom"] as const;

function StepNode({ data }: NodeProps<StepNodeT>) {
  const { step, blockers, width, height, inline } = data;
  const lane = LANES.find((l) => l.owner === step.owner)!;
  return (
    <button
      type="button"
      style={{ width, height }}
      title={step.title}
      onClick={() => document.getElementById(`step-${step.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}
      className={cn(
        "relative flex rounded-xl bg-background px-2.5 text-left shadow-card ring-1 ring-border transition-[box-shadow,transform] hover:-translate-y-px hover:ring-border-strong focus-visible:outline-2",
        inline ? "items-center gap-2.5" : "flex-col justify-center gap-1.5 py-2",
      )}
      aria-label={`Step ${step.order}, ${lane.label}: ${step.title}. Jump to details`}
    >
      {SIDES.map((p) => (
        <Handle key={`t${p}`} id={`t-${p}`} type="target" position={Position[p]} className={handle} isConnectable={false} />
      ))}
      {SIDES.map((p) => (
        <Handle key={`s${p}`} id={`s-${p}`} type="source" position={Position[p]} className={handle} isConnectable={false} />
      ))}
      <span className={cn("flex items-center gap-1.5", inline && "contents")}>
        <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-semibold text-background", lane.dot)}>{step.order}</span>
        {!inline && blockers > 0 && <Warning size={13} weight="fill" className="ml-auto shrink-0 text-destructive" aria-label={`${blockers} known blocker`} />}
      </span>
      <span className={cn("text-[12px] leading-snug font-medium", inline ? "min-w-0 flex-1 truncate" : "line-clamp-2")}>{step.title}</span>
      {inline && blockers > 0 && <Warning size={13} weight="fill" className="shrink-0 text-destructive" aria-label={`${blockers} known blocker`} />}
    </button>
  );
}

function LaneNode({ data }: NodeProps<LaneNodeT>) {
  const lane = LANES.find((l) => l.owner === data.owner)!;
  return (
    <div style={{ width: data.width, height: LANE_H - 6 }} className="pointer-events-none flex items-center rounded-xl bg-muted/50">
      <span className={cn("flex w-[60px] flex-col items-center gap-0.5 text-[10.5px] font-medium", lane.text)}>
        <lane.icon size={15} weight="duotone" />
        {lane.label}
      </span>
    </div>
  );
}

const nodeTypes = { step: StepNode, lane: LaneNode };

function useWidth(ref: React.RefObject<HTMLDivElement | null>) {
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

/** Read-only swimlane roadmap: steps in order, placed in the lane of whoever does them. */
export function Roadmap({ guide }: { guide: Guide }) {
  const ref = useRef<HTMLDivElement>(null);
  const width = useWidth(ref);
  const { resolvedTheme } = useTheme();
  const mobile = width > 0 && width < 560;

  const { nodes, edges, height, minWidth } = useMemo(() => {
    if (!width) return { nodes: [] as Node[], edges: [] as Edge[], height: 220, minWidth: 0 };
    const steps = [...guide.steps].sort((a, b) => a.order - b.order);
    const blockers = new Map<string, number>();
    for (const b of guide.blockers) if (b.stepId) blockers.set(b.stepId, (blockers.get(b.stepId) ?? 0) + 1);

    if (mobile) {
      const nodes: Node[] = steps.map((s, i) => ({
        id: s.id,
        type: "step",
        position: { x: 0, y: i * (MOBILE_NODE_H + 14) },
        data: { step: s, blockers: blockers.get(s.id) ?? 0, width: width - 2, height: MOBILE_NODE_H, inline: true },
        draggable: false,
        selectable: false,
      }));
      const edges: Edge[] = steps.slice(1).map((s, i) => ({
        id: `e${i}`,
        source: steps[i]!.id,
        target: s.id,
        sourceHandle: "s-Bottom",
        targetHandle: "t-Top",
        style: { stroke: "var(--border-strong)" },
      }));
      return { nodes, edges, height: steps.length * (MOBILE_NODE_H + 14), minWidth: 0 };
    }

    const lanes = LANES.filter((l) => steps.some((s) => s.owner === l.owner));
    const laneIdx = new Map<Owner, number>(lanes.map((l, i) => [l.owner, i]));
    const col = Math.max(MIN_COL, (width - LABEL_W - 4) / steps.length);
    const total = LABEL_W + col * steps.length;

    const laneNodes: Node[] = lanes.map((l, i) => ({
      id: `lane-${l.owner}`,
      type: "lane",
      position: { x: 0, y: i * LANE_H },
      data: { owner: l.owner, width: total },
      draggable: false,
      selectable: false,
      zIndex: -1,
    }));
    const stepNodes: Node[] = steps.map((s, i) => ({
      id: s.id,
      type: "step",
      position: { x: LABEL_W + i * col + 2, y: laneIdx.get(s.owner)! * LANE_H + (LANE_H - 6 - NODE_H) / 2 },
      data: { step: s, blockers: blockers.get(s.id) ?? 0, width: col - 8, height: NODE_H },
      draggable: false,
      selectable: false,
    }));
    const edges: Edge[] = steps.slice(1).map((s, i) => {
      const prev = steps[i]!;
      const same = prev.owner === s.owner;
      const down = laneIdx.get(s.owner)! > laneIdx.get(prev.owner)!;
      return {
        id: `e${i}`,
        source: prev.id,
        target: s.id,
        type: "smoothstep",
        sourceHandle: same ? "s-Right" : down ? "s-Bottom" : "s-Top",
        targetHandle: "t-Left",
        animated: s.owner === "provider",
        // Hand-offs between owners are highlighted.
        style: { stroke: same ? "var(--border-strong)" : "var(--brand)", strokeWidth: 1.25, opacity: same ? 1 : 0.75 },
      };
    });
    return { nodes: [...laneNodes, ...stepNodes], edges, height: lanes.length * LANE_H - 6, minWidth: total };
  }, [guide, width, mobile]);

  return (
    <div ref={ref} className="w-full overflow-x-auto [scrollbar-width:thin]" role="figure" aria-label="Setup roadmap by owner">
      {width > 0 && (
        <div style={{ height, minWidth }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            defaultViewport={{ x: 0, y: 0, zoom: 1 }}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            zoomOnScroll={false}
            zoomOnPinch={false}
            zoomOnDoubleClick={false}
            panOnScroll={false}
            panOnDrag={false}
            preventScrolling={false}
            proOptions={{ hideAttribution: true }}
            colorMode={resolvedTheme === "light" ? "light" : "dark"}
            className="!bg-transparent [&_.react-flow__pane]:!cursor-default"
          />
        </div>
      )}
    </div>
  );
}
