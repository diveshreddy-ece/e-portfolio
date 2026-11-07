"use client"

import * as React from "react"

export type NebulaParams = {
  pixel: number
  dotMin: number
  dotMax: number
  levels: number
  scale: number
  warp: number
  drift: number
  density: number
  threshold: number
  softness: number
  band: number
  bandAngle: number
  bandOffset: number
  bandWidth: number
  haze: number
  stars: number
  twinkle: number
  starDrift: number
  sparkles: number
  seed: number
  spikeWidth: number
  planet: boolean
  planetX: number
  planetY: number
  planetRadius: number
  parallax: number
  lens: number
  lensRadius: number
  lensPush: number
  rippleSpeed: number
  speed: number
  vignette: number
  grain: number
  voidColor: string
  hazeColor: string
  duskColor: string
  wineColor: string
  crimsonColor: string
  hotColor: string
  starColor: string
}

export const NEBULA_DEFAULTS: NebulaParams = {
  pixel: 6,
  dotMin: 0.12,
  dotMax: 0.56,
  levels: 7,
  scale: 1.7,
  warp: 1.5,
  drift: 0.035,
  density: 0.5,
  threshold: 0.54,
  softness: 0.5,
  band: 0.5,
  bandAngle: 1.05,
  bandOffset: 0.42,
  bandWidth: 0.34,
  haze: 0.8,
  stars: 1,
  twinkle: 1.4,
  starDrift: 1.2,
  sparkles: 9,
  seed: 11,
  spikeWidth: 1,
  planet: true,
  planetX: 0.26,
  planetY: 0.36,
  planetRadius: 0.075,
  parallax: 1,
  lens: 0.55,
  lensRadius: 170,
  lensPush: 0.3,
  rippleSpeed: 420,
  speed: 1,
  vignette: 0.5,
  grain: 0.035,
  voidColor: "#050309",
  hazeColor: "#161a38",
  duskColor: "#3b1646",
  wineColor: "#5c0d31",
  crimsonColor: "#c01245",
  hotColor: "#ff1f5a",
  starColor: "#f6e2e8",
}

export const NEBULA_PRESETS: Record<string, Partial<NebulaParams>> = {
  crimson: {},
  ultraviolet: {
    hazeColor: "#10183f", duskColor: "#2a1a5e", wineColor: "#3d1478",
    crimsonColor: "#7b2cf0", hotColor: "#c77dff", starColor: "#eef0ff",
    bandAngle: 2.2, bandOffset: 0.3, planetX: 0.74, planetY: 0.3, seed: 4,
  },
  abyssal: {
    voidColor: "#02060a", hazeColor: "#0a1f2e", duskColor: "#0d2f3f", wineColor: "#0a4453",
    crimsonColor: "#0f8f9f", hotColor: "#3ff2e0", starColor: "#e4fffb",
    band: 0.5, bandAngle: -0.4, bandOffset: -0.2, planetX: 0.7, planetY: 0.66, seed: 23,
  },
  solar: {
    voidColor: "#070403", hazeColor: "#231208", duskColor: "#3d1a07", wineColor: "#6e2406",
    crimsonColor: "#d8520c", hotColor: "#ffb020", starColor: "#fff3d6",
    warp: 1.9, band: 0.72, bandAngle: 0.4, planetRadius: 0.1, seed: 5,
  },
  phosphor: {
    voidColor: "#020502", hazeColor: "#08170c", duskColor: "#0c2412", wineColor: "#0e3d18",
    crimsonColor: "#1f9d3a", hotColor: "#6dff7a", starColor: "#e6ffe8",
    pixel: 5, levels: 5, planet: false, sparkles: 6, seed: 31,
  },
}

export type HalftoneNebulaProps = {
  height?: string
  preset?: keyof typeof NEBULA_PRESETS
  params?: Partial<NebulaParams>
  interactive?: boolean
  touch?: "scroll" | "draw"
  maxDpr?: number
  children?: React.ReactNode
  className?: string
}

export default function HalftoneNebula({
  height = "100svh",
  preset = "crimson",
  params,
  interactive = true,
  touch = "scroll",
  maxDpr = 2,
  children,
  className = "",
}: HalftoneNebulaProps) {
  const P = React.useMemo<NebulaParams>(
    () => ({ ...NEBULA_DEFAULTS, ...(NEBULA_PRESETS[preset] ?? {}), ...(params ?? {}) }),
    [preset, params],
  )

  return (
    <section
      className={
        "relative w-full overflow-hidden bg-[#050309] " +
        (interactive ? "cursor-crosshair " : "") +
        (touch === "draw" ? "touch-none " : "touch-pan-y ") +
        className
      }
      style={{ height }}
      aria-label="A pixel-art nebula printed in halftone dots"
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 45% at 12% 88%, #ff1f5a 0%, #c01245 22%, #5c0d31 50%, transparent 75%)," +
            "radial-gradient(45% 30% at 22% 22%, #5c0d31 0%, transparent 70%)," +
            "radial-gradient(40% 30% at 80% 30%, #3b1646 0%, transparent 70%)," +
            "#050309",
        }}
      />
      {children ? (
        <div className="pointer-events-none relative z-10 flex h-full w-full flex-col">{children}</div>
      ) : null}
    </section>
  )
}
