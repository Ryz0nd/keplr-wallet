import React, {
  FunctionComponent,
  PropsWithChildren,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { VerticalCollapseTransitionProps } from "./types";
import {
  useVerticalResizeObserver,
  VerticalResizeContainer,
} from "../internal";
import { animated, useSpring, useSpringValue } from "@react-spring/web";
import {
  DescendantHeightPxRegistry,
  IDescendantRegistry,
  useVerticalSizeInternalContext,
  _VerticalSizeInternalContext,
} from "../vertical-size/internal";
import { defaultSpringConfig } from "../../../styles/spring";

export const VerticalCollapseTransition: FunctionComponent<
  PropsWithChildren<
    VerticalCollapseTransitionProps & {
      onTransitionEnd?: () => void;
      onResize?: (height: number) => void;
      animateOnResize?: boolean;
    }
  >
> = ({
  children,
  collapsed,
  width,
  transitionAlign,
  onTransitionEnd,
  onResize,
  animateOnResize = false,
}) => {
  const onTransitionEndRef = useRef(onTransitionEnd);
  onTransitionEndRef.current = onTransitionEnd;

  const heightPx = useSpringValue(collapsed ? 0 : -1, {
    config: defaultSpringConfig,
    onRest: () => {
      if (onTransitionEndRef.current) {
        onTransitionEndRef.current();
      }
    },
  });

  const [registry] = useState<IDescendantRegistry>(
    () => new DescendantHeightPxRegistry(heightPx)
  );
  const internalContext = useVerticalSizeInternalContext();

  useLayoutEffect(() => {
    if (internalContext) {
      const registryKey = internalContext.registry.registerRegistry(registry);

      return () => {
        internalContext.registry.unregisterRegistry(registryKey);
      };
    }
  }, [internalContext, registry]);

  const lastHeight = useRef(collapsed ? 0 : -1);
  const ref = useVerticalResizeObserver((height: number) => {
    lastHeight.current = height;
    if (!collapsed) {
      heightPx.set(height);
    }

    if (onResize) {
      onResize(height);
    }
  });

  const resizeAnimation = useSpring({
    opacity: collapsed ? 0.1 : 1,
    scale: collapsed ? 0.8 : 1,
    config: defaultSpringConfig,
  });

  useEffect(() => {
    if (collapsed) {
      heightPx.start(0);
    } else {
      heightPx.start(lastHeight.current);
    }
  }, [collapsed, heightPx]);

  const contextValue = useMemo(() => {
    return {
      registry,
    };
  }, [registry]);

  return (
    <VerticalResizeContainer
      ref={ref}
      heightPx={heightPx}
      width={width}
      transitionAlign={transitionAlign}
    >
      <_VerticalSizeInternalContext.Provider value={contextValue}>
        <animated.div
          style={{
            opacity: resizeAnimation.opacity,
            transform: animateOnResize
              ? resizeAnimation.scale.to((s) => `scale(${s})`)
              : "scale(1)",
          }}
        >
          {children}
        </animated.div>
      </_VerticalSizeInternalContext.Provider>
    </VerticalResizeContainer>
  );
};
