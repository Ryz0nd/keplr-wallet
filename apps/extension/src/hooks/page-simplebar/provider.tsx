import React, {
  FunctionComponent,
  PropsWithChildren,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { PageSimpleBarContext } from "./internal";
import SimpleBar from "simplebar-react";
import SimpleBarCore from "simplebar-core";
import styled, { css } from "styled-components";

const StyledSimpleBar = styled(SimpleBar)<{
  $fillHeight?: boolean;
}>`
  ${({ $fillHeight }) =>
    $fillHeight &&
    css`
      & .simplebar-content:not(.simplebar-content .simplebar-content) {
        height: 100%;
      }
    `}
`;

export const PageSimpleBarProvider: FunctionComponent<
  PropsWithChildren<{
    style: React.CSSProperties;
    fillHeight?: boolean;
  }>
> = ({ children, style, fillHeight }) => {
  const ref = useRef<SimpleBarCore | null>(null);
  const refHandlers = useRef<((ref: SimpleBarCore | null) => void)[]>([]);

  // CSS 애니메이션(VerticalCollapseTransition 등)에 의한 자식 크기 변화를 감지하여 스크롤 바의 크기를 실시간으로 업데이트
  useEffect(() => {
    const simpleBar = ref.current;
    const contentEl = simpleBar?.contentEl;
    if (!contentEl) {
      return;
    }

    const ro = new ResizeObserver(() => {
      simpleBar?.recalculate();
    });

    const observeChildren = () => {
      ro.disconnect();
      Array.from(contentEl.children).forEach((child) => ro.observe(child));
    };

    observeChildren();

    const mo = new MutationObserver(() => {
      observeChildren();
    });
    mo.observe(contentEl, { childList: true });

    return () => {
      ro.disconnect();
      mo.disconnect();
    };
  }, []);

  return (
    <PageSimpleBarContext.Provider
      value={useMemo(() => {
        return {
          ref,
          refChangeHandler: (handler) => {
            refHandlers.current.push(handler);

            if (ref.current) {
              handler(ref.current);
            }

            return () => {
              refHandlers.current = refHandlers.current.filter(
                (h) => h !== handler
              );
            };
          },
        };
      }, [])}
    >
      <StyledSimpleBar
        $fillHeight={fillHeight}
        style={style}
        ref={(r) => {
          ref.current = r;

          refHandlers.current.forEach((handler) => {
            handler(r);
          });
        }}
      >
        {children}
      </StyledSimpleBar>
    </PageSimpleBarContext.Provider>
  );
};
