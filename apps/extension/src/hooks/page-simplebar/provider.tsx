import React, {
  FunctionComponent,
  PropsWithChildren,
  useMemo,
  useRef,
} from "react";
import { PageSimpleBarContext } from "./internal";
import SimpleBar from "simplebar-react";
import SimpleBarCore from "simplebar-core";
import styled, { css } from "styled-components";

const StyledSimpleBar = styled(SimpleBar)<{
  $fillHeight?: boolean;
  $displayFlex?: boolean;
}>`
  & .simplebar-content {
    ${({ $fillHeight }) =>
      $fillHeight &&
      css`
        height: 100%;
      `}
    ${({ $displayFlex }) =>
      $displayFlex &&
      css`
        display: flex;
        flex-direction: column;
      `}
  }
`;

export const PageSimpleBarProvider: FunctionComponent<
  PropsWithChildren<{
    style: React.CSSProperties;
    fillHeight?: boolean;
    displayFlex?: boolean;
  }>
> = ({ children, style, fillHeight, displayFlex }) => {
  const ref = useRef<SimpleBarCore | null>(null);
  const refHandlers = useRef<((ref: SimpleBarCore | null) => void)[]>([]);

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
        $displayFlex={displayFlex}
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
