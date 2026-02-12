import React, { FunctionComponent } from "react";
import { useIntl } from "react-intl";
import { VerticalCollapseTransition } from "../../../components/transition/vertical-collapse";
import { GuideBox } from "../../../components/guide-box";
import { Gutter } from "../../../components/gutter";
import { Box } from "../../../components/box";
import { Checkbox } from "../../../components/checkbox";
import { Body2 } from "../../../components/typography";

export const UnfilteredUtxoWarning: FunctionComponent<{
  isLoading?: boolean;
  apiError?: Error;
  allowUnfilteredOnApiError: boolean;
  setAllowUnfilteredOnApiError: (value: boolean) => void;
}> = ({
  isLoading,
  apiError,
  allowUnfilteredOnApiError,
  setAllowUnfilteredOnApiError,
}) => {
  const intl = useIntl();

  return (
    <VerticalCollapseTransition collapsed={isLoading || !apiError}>
      <Gutter size="0.75rem" />
      <GuideBox
        color="warning"
        hideInformationIcon={true}
        title={intl.formatMessage({
          id: "page.send.bitcoin.amount.unfiltered-assets-warning.title",
        })}
      />
      <Gutter size="0.5rem" />
      <Box
        cursor="pointer"
        onClick={(e) => {
          e.preventDefault();
          setAllowUnfilteredOnApiError(!allowUnfilteredOnApiError);
        }}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: "0.625rem",
          width: "fit-content",
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        <Checkbox
          size="small"
          checked={allowUnfilteredOnApiError}
          onChange={() => {
            // noop
          }}
        />
        <Body2>
          {intl.formatMessage({
            id: "page.send.bitcoin.amount.unfiltered-assets-warning.consent",
          })}
        </Body2>
      </Box>
      <Gutter size="0.5rem" />
    </VerticalCollapseTransition>
  );
};
