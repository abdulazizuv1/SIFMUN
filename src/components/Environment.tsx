import { useEffect, useRef } from 'react'
import { clamp, onReducedMotionChange, prefersReducedMotion } from '../lib/motion'

/* One fixed layer behind the whole site, so scrolling feels like moving through a
   place: warm paper grain and faint contour lines, like a map of the valley.
   It drifts on a 90 second cycle. Purely decorative. */
export function Environment() {
  return (
    <div className="env" aria-hidden="true">
      <svg className="env__contours" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" focusable="false">
        <g fill="none" strokeWidth="1">
          <path d="M-40 210C180 150 330 250 540 215S900 110 1120 170s330 110 520 60" />
          <path d="M-40 290C200 240 350 330 560 300s330-95 560-40 330 105 520 60" />
          <path d="M-40 400c210-70 400 40 620 10s300-110 520-60 350 120 540 70" />
          <path d="M-40 520c240-60 420 60 640 30s280-120 500-80 370 130 540 90" />
          <path d="M-40 640c260-40 440 70 660 50s260-110 480-90 390 120 540 100" />
          <path d="M-40 760c280-30 460 60 680 50s240-90 460-80 410 100 540 90" />
          <path d="M-40 880c300-20 480 40 700 40s220-60 440-60 430 70 540 70" />
          <path d="M620 430c60-40 150-40 200 0s40 100-20 130-170 20-200-30-20-70 20-100z" />
          <path d="M670 462c35-22 85-20 112 2s22 55-12 72-95 10-112-18-10-40 12-56z" />
        </g>
      </svg>
      <div className="env__grain" />
    </div>
  )
}

/* The flight line: one gold hairline that runs down a page and draws itself as the
   visitor scrolls. A single passive scroll listener, coalesced through rAF, writing
   one style property and only when the value changed. */
export function FlightLine() {
  const svg = useRef<SVGSVGElement>(null)
  const path = useRef<SVGPathElement>(null)

  useEffect(() => {
    const el = svg.current
    const line = path.current
    if (!el || !line) return
    let raf = 0
    let written = -1
    let armed = false

    const measure = () => {
      raf = 0
      const rect = el.getBoundingClientRect()
      const total = rect.height
      if (total <= 0) return
      // Drawn up to the point that sits 60% of the way down the viewport.
      const p = clamp((window.innerHeight * 0.6 - rect.top) / total, 0, 1)
      if (Math.abs(p - written) < 0.002) return
      written = p
      line.style.strokeDashoffset = String(1 - p)
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure)
    }
    const arm = () => {
      if (armed) return
      armed = true
      window.addEventListener('scroll', onScroll, { passive: true })
      window.addEventListener('resize', onScroll)
      onScroll()
    }
    const disarm = () => {
      armed = false
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
      raf = 0
    }
    const apply = (reduced: boolean) => {
      if (reduced) {
        disarm()
        written = 1
        line.style.strokeDashoffset = '0' // pinned to its final, fully drawn state
      } else {
        written = -1
        arm()
      }
    }
    apply(prefersReducedMotion())
    const off = onReducedMotionChange(apply)
    return () => {
      off()
      disarm()
    }
  }, [])

  return (
    <svg ref={svg} className="flightline" viewBox="0 0 100 1000" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path
        ref={path}
        d="M50 0C10 90 90 170 50 260S10 430 50 520s80 170 40 260-70 130-40 220"
        pathLength={1}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
