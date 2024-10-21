import { Quickstart } from "./tabs";
import { TabTitle } from "./components/OnboardingCardTabs";
import styled from "styled-components";
import { defaultBorderRadius, vscInputBackground } from "../";

const StyledCard = styled.div`
  margin: auto;
  border-radius: ${defaultBorderRadius};
  background-color: ${vscInputBackground};
  box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1),
    0 8px 10px -6px rgb(0 0 0 / 0.1);
`;

export interface OnboardingCardState {
  show?: boolean;
  activeTab?: TabTitle;
}

export function OnboardingCard() {
  return (
    <StyledCard className="relative px-2 py-3 xs:py-4 xs:px-4">
      <div className="content py-4"><Quickstart /></div>
    </StyledCard>
  );
}
