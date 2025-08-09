import { useRef, useCallback, cloneElement, isValidElement } from 'react'
import type { ReactElement } from 'react'

interface TrackedInteraction {
  elementId?: string
  elementContent: string
  timestamp: number
  interactionType: 'hover' | 'click'
}

interface ElementProps {
  children: ReactElement<any>
  elementId?: string
  analyticsEndpoint?: string
}

export default function Element({ children, elementId, analyticsEndpoint = '/api/analytics' }: ElementProps) {
  const hoverTimeoutRef = useRef<number | null>(null)
  const hasHoveredRef = useRef(false)

  function getElementContent(element: HTMLElement): string {
    return (
      element.getAttribute('alt') ||
      element.getAttribute('aria-label') ||
      element.textContent ||
      element.getAttribute('title') ||
      ''
    )
  }

  const sendAnalytics = useCallback(async (data: TrackedInteraction) => {
    try {
      await fetch(analyticsEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
    } catch {
      // ignore network errors for now
    }
  }, [analyticsEndpoint])

  const handleMouseEnter = useCallback((event: React.MouseEvent<HTMLElement>) => {
    const anyChild: any = children as any
    if (anyChild?.props?.onMouseEnter) anyChild.props.onMouseEnter(event)

    if (!hasHoveredRef.current) {
      hoverTimeoutRef.current = window.setTimeout(() => {
        hasHoveredRef.current = true
        const interaction: TrackedInteraction = {
          elementId,
          elementContent: getElementContent(event.currentTarget as HTMLElement),
          timestamp: Date.now(),
          interactionType: 'hover',
        }
        sendAnalytics(interaction)
      }, 500)
    }
  }, [children, elementId, sendAnalytics])

  const handleMouseLeave = useCallback((event: React.MouseEvent<HTMLElement>) => {
    const anyChild: any = children as any
    if (anyChild?.props?.onMouseLeave) anyChild.props.onMouseLeave(event)
    if (hoverTimeoutRef.current !== null) {
      window.clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
  }, [children])

  const handleClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    const anyChild: any = children as any
    if (anyChild?.props?.onClick) anyChild.props.onClick(event)
    const interaction: TrackedInteraction = {
      elementId,
      elementContent: getElementContent(event.currentTarget as HTMLElement),
      timestamp: Date.now(),
      interactionType: 'click',
    }
    sendAnalytics(interaction)
  }, [children, elementId, sendAnalytics])

  if (!isValidElement(children)) return children as any

  return cloneElement(children as any, {
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onClick: handleClick,
  })
}