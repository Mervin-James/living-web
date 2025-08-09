import React, { useRef, useCallback, ReactElement, cloneElement } from 'react';

interface TrackedInteraction {
  elementId?: string;
  elementContent: string;
  timestamp: number;
  interactionType: 'hover' | 'click';
}

interface ElementProps {
  children: ReactElement;
  elementId?: string;
  analyticsEndpoint?: string;
}

const Element: React.FC<ElementProps> = ({ 
  children, 
  elementId,
  analyticsEndpoint = '/api/analytics'
}) => {
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasHoveredRef = useRef(false);

  const getElementContent = (element: HTMLElement): string => {
    return element.getAttribute('alt') || 
           element.getAttribute('aria-label') || 
           element.textContent || 
           element.getAttribute('title') || 
           '';
  };

  const sendAnalytics = useCallback(async (data: TrackedInteraction) => {
    try {
      await fetch(analyticsEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Failed to send analytics:', error);
    }
  }, [analyticsEndpoint]);

  const handleMouseEnter = useCallback((event: React.MouseEvent<HTMLElement>) => {
    if (children.props.onMouseEnter) {
      children.props.onMouseEnter(event);
    }

    if (!hasHoveredRef.current) {
      hoverTimeoutRef.current = setTimeout(() => {
        hasHoveredRef.current = true;
        const interaction: TrackedInteraction = {
          elementId,
          elementContent: getElementContent(event.currentTarget),
          timestamp: Date.now(),
          interactionType: 'hover',
        };
        sendAnalytics(interaction);
      }, 500);
    }
  }, [children.props, elementId, sendAnalytics]);

  const handleMouseLeave = useCallback((event: React.MouseEvent<HTMLElement>) => {
    if (children.props.onMouseLeave) {
      children.props.onMouseLeave(event);
    }

    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  }, [children.props]);

  const handleClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    if (children.props.onClick) {
      children.props.onClick(event);
    }

    const interaction: TrackedInteraction = {
      elementId,
      elementContent: getElementContent(event.currentTarget),
      timestamp: Date.now(),
      interactionType: 'click',
    };
    sendAnalytics(interaction);
  }, [children.props, elementId, sendAnalytics]);

  return cloneElement(children, {
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onClick: handleClick,
  });
};

export default Element;