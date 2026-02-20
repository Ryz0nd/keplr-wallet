import styled, { keyframes } from "styled-components";

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

export const FadeInContainer = styled.div`
  animation: ${fadeIn} 200ms ease-out;
`;
