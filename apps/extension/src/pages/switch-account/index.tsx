import React, { FunctionComponent } from "react";
import { observer } from "mobx-react-lite";
import { useStore } from "../../stores";
import { useInteractionInfo } from "../../hooks";
import { HeaderLayout } from "../../layouts/header";
import { Box } from "../../components/box";
import { Image } from "../../components/image";
import { Body1, H2, Subtitle3 } from "../../components/typography";
import { ColorPalette } from "../../styles";
import { Gutter } from "../../components/gutter";
import { FormattedMessage, useIntl } from "react-intl";
import { useTheme } from "styled-components";
import { handleExternalInteractionWithNoProceedNext } from "../../utils";
import { Splash } from "../../components/splash";
import { ApproveIcon, CancelIcon } from "../../components/button";
import { dispatchGlobalEventExceptSelf } from "../../utils/global-events";

export const SwitchAccountPage: FunctionComponent = observer(() => {
  const { keyRingStore, interactionStore, chainStore } = useStore();
  const intl = useIntl();
  const theme = useTheme();

  const interactionData = interactionStore.getAllData<{
    vaultId: string;
    name: string;
    origin: string;
  }>("switch-account")[0];

  const handleReject = () => interactionStore.rejectAll("switch-account");

  const interactionInfo = useInteractionInfo({
    onWindowClose: handleReject,
    onUnmount: handleReject,
  });

  if (!interactionData) {
    return <Splash />;
  }

  const { name, origin, vaultId } = interactionData.data;

  const isLoading = interactionStore.isObsoleteInteractionApproved(
    interactionData.id
  );

  return (
    <HeaderLayout
      title=""
      bottomButtons={[
        {
          textOverrideIcon: (
            <CancelIcon
              color={
                theme.mode === "light"
                  ? ColorPalette["blue-400"]
                  : ColorPalette["gray-200"]
              }
            />
          ),
          size: "large",
          color: "secondary",
          style: {
            width: "3.25rem",
          },
          onClick: async () => {
            await interactionStore.rejectWithProceedNextV2(
              interactionData.id,
              (proceedNext) => {
                if (!proceedNext) {
                  if (
                    interactionInfo.interaction &&
                    !interactionInfo.interactionInternal
                  ) {
                    handleExternalInteractionWithNoProceedNext();
                  }
                }
              }
            );
          },
        },
        {
          text: intl.formatMessage({ id: "button.approve" }),
          left: !isLoading && <ApproveIcon />,
          type: "submit",
          size: "large",
          isLoading,
        },
      ]}
      onSubmit={async (e) => {
        e.preventDefault();

        await interactionStore.approveWithProceedNextV2(
          [interactionData.id],
          {},
          async (proceedNext) => {
            await keyRingStore.selectKeyRing(vaultId);
            await chainStore.waitSyncedEnabledChains();
            dispatchGlobalEventExceptSelf("keplr_keyring_changed");

            if (!proceedNext) {
              if (
                interactionInfo.interaction &&
                !interactionInfo.interactionInternal
              ) {
                handleExternalInteractionWithNoProceedNext();
              }
            }
          }
        );
      }}
    >
      <Box height="100%" padding="0.75rem" paddingBottom="0">
        <Box alignX="center">
          <Image
            alt="Keplr Logo Image"
            src={require("../../public/assets/logo-256.png")}
            style={{ width: "4.625rem", height: "4.625rem" }}
          />

          <Gutter size="1.125rem" />

          <H2
            color={
              theme.mode === "light"
                ? ColorPalette["gray-600"]
                : ColorPalette["gray-10"]
            }
          >
            <FormattedMessage id="page.switch-account.title" />
          </H2>

          <Gutter size="1rem" />

          <Body1
            color={
              theme.mode === "light"
                ? ColorPalette["gray-300"]
                : ColorPalette["gray-200"]
            }
          >
            {origin}
          </Body1>

          <Gutter size="1.5rem" />

          <Subtitle3
            color={
              theme.mode === "light"
                ? ColorPalette["gray-400"]
                : ColorPalette["gray-200"]
            }
          >
            <FormattedMessage
              id="page.switch-account.description"
              values={{ name }}
            />
          </Subtitle3>
        </Box>
      </Box>
    </HeaderLayout>
  );
});
