import { cloneElement, isValidElement, type ReactElement } from "react"
import { useEffect, useRef, useState } from "react"

type StableChartProps = {
  height?: number
  minHeight?: number
  children: ReactElement
}

export default function StableChart({ height = 320, minHeight, children }: StableChartProps) {
  const boxRef = useRef<HTMLDivElement | null>(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const element = boxRef.current
    if (!element) return

    const updateWidth = () => {
      const rect = element.getBoundingClientRect()
      setWidth(Math.max(1, Math.floor(rect.width)))
    }

    updateWidth()

    const observer = new ResizeObserver(updateWidth)
    observer.observe(element)

    window.addEventListener("resize", updateWidth)

    return () => {
      observer.disconnect()
      window.removeEventListener("resize", updateWidth)
    }
  }, [])

  return (
    <div
      ref={boxRef}
      className="w-full min-w-0 overflow-hidden"
      style={{ height, minHeight: minHeight ?? height }}
    >
      {width > 1 && isValidElement(children)
        ? cloneElement(children, {
            width,
            height,
          } as any)
        : null}
    </div>
  )
}
