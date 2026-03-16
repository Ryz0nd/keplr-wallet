import React, { FunctionComponent } from "react";
import { observer } from "mobx-react-lite";
import { useStore } from "../../stores";
import { useInteractionInfo } from "../../hooks";
import { HeaderLayout } from "../../layouts/header";
import { Box } from "../../components/box";
import { Image } from "../../components/image";
import {
  Body1,
  Body2,
  Caption1,
  H3,
  Subtitle4,
} from "../../components/typography";
import { ColorPalette } from "../../styles";
import { Gutter } from "../../components/gutter";
import { FormattedMessage, useIntl } from "react-intl";
import { useTheme } from "styled-components";
import {
  getFaviconUrl,
  handleExternalInteractionWithNoProceedNext,
} from "../../utils";
import { Splash } from "../../components/splash";
import { ApproveIcon, CancelIcon } from "../../components/button";
import { dispatchGlobalEventExceptSelf } from "../../utils/global-events";
import { XAxis, YAxis } from "../../components/axis";
import { ShieldExclamationIcon } from "../../components/icon";

function getHostname(origin: string): string {
  try {
    return new URL(origin).hostname;
  } catch (e) {
    return origin;
  }
}

const ArrowDivider: FunctionComponent<{ color: string }> = ({ color }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      gap: "0.375rem",
      // Figma에서 divider 프레임은 1.5px 높이로 고정되고, 24px 아이콘은 overflow로 처리됨.
      // 이렇게 해야 부모의 gap(16px)이 라인 기준으로 계산되어 디자인과 동일한 여백이 나옴.
      height: "1.5px",
      overflow: "visible",
    }}
  >
    <div
      style={{
        flex: 1,
        height: "1.5px",
        backgroundColor: color,
        borderRadius: "99px",
      }}
    />
    <div
      style={{
        width: "1.5rem",
        height: "1.5rem",
        borderRadius: "50%",
        border: `2px solid ${color}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M8.00016 3.33331V12.6666M8.00016 12.6666L12.6668 7.99998M8.00016 12.6666L3.3335 7.99998"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
    <div
      style={{
        flex: 1,
        height: "1.5px",
        backgroundColor: color,
        borderRadius: "99px",
      }}
    />
  </div>
);

const WalletAvatar: FunctionComponent<{
  name: string;
  theme: { mode: string };
}> = ({ name, theme }) => {
  const initial = name ? name[0].toUpperCase() : "?";
  return (
    <div
      style={{
        width: "1.5rem",
        height: "1.5rem",
        borderRadius: "50%",
        backgroundColor:
          theme.mode === "light"
            ? ColorPalette["gray-100"]
            : ColorPalette["gray-500"],
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Caption1
        color={
          theme.mode === "light"
            ? ColorPalette["gray-300"]
            : ColorPalette["gray-200"]
        }
      >
        {initial}
      </Caption1>
    </div>
  );
};

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

  const { name: toName, origin, vaultId } = interactionData.data;
  const fromName =
    (keyRingStore.selectedKeyInfo?.insensitive["keyRingName"] as string) || "";

  const isLoading = interactionStore.isObsoleteInteractionApproved(
    interactionData.id
  );

  const hostname = getHostname(origin);
  const faviconUrl = getFaviconUrl(origin);

  const dividerColor =
    theme.mode === "light"
      ? ColorPalette["gray-100"]
      : ColorPalette["gray-400"];

  return (
    <HeaderLayout
      title=""
      headerContainerStyle={{ display: "none" }}
      contentContainerStyle={{ paddingTop: "0" }}
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
          text: intl.formatMessage({ id: "button.confirm" }),
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
      <Box height="100%" padding="0.75rem" paddingTop="2rem" paddingBottom="0">
        <YAxis alignX="center">
          <H3
            color={
              theme.mode === "light"
                ? ColorPalette["gray-600"]
                : ColorPalette["gray-10"]
            }
          >
            <FormattedMessage id="page.switch-account.title" />
          </H3>

          <Gutter size="0.75rem" />

          <XAxis alignY="center">
            <Box
              style={{
                width: "1.5rem",
                height: "1.5rem",
                borderRadius: "50%",
                backgroundColor:
                  theme.mode === "light"
                    ? ColorPalette.white
                    : ColorPalette["gray-600"],
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              <Image
                src={faviconUrl}
                alt="origin_favicon"
                defaultSrc={require("../../public/assets/img/dapp-icon-alt.svg")}
                style={{
                  objectFit: "contain",
                  width: "1rem",
                  height: "1rem",
                }}
              />
            </Box>
            <Gutter size="0.5rem" direction="horizontal" />
            <Body1
              color={
                theme.mode === "light"
                  ? ColorPalette["gray-600"]
                  : ColorPalette.white
              }
            >
              {hostname}
            </Body1>
          </XAxis>

          <Gutter size="0.75rem" />

          <div style={{ opacity: 0.7 }}>
            <XAxis alignY="center">
              <ShieldExclamationIcon
                width="1rem"
                height="1rem"
                color={
                  theme.mode === "light"
                    ? ColorPalette["gray-400"]
                    : ColorPalette["gray-200"]
                }
              />
              <Gutter size="0.25rem" direction="horizontal" />
              <Subtitle4
                color={
                  theme.mode === "light"
                    ? ColorPalette["gray-400"]
                    : ColorPalette["gray-200"]
                }
              >
                <FormattedMessage id="page.sign.adr36.warning-origin" />
              </Subtitle4>
            </XAxis>
          </div>
        </YAxis>

        <Gutter size="1.5rem" />

        {/* From/To Block */}
        <Box
          backgroundColor={
            theme.mode === "light"
              ? ColorPalette.white
              : ColorPalette["gray-600"]
          }
          borderRadius="0.5rem"
          padding="1rem"
        >
          {/* From row */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Body2
              color={
                theme.mode === "light"
                  ? ColorPalette["gray-700"]
                  : ColorPalette.white
              }
            >
              <FormattedMessage id="page.switch-account.from" />
            </Body2>
            <XAxis alignY="center" gap="0.5rem">
              <Body2
                color={
                  theme.mode === "light"
                    ? ColorPalette["gray-700"]
                    : ColorPalette.white
                }
              >
                {fromName}
              </Body2>
              <WalletAvatar name={fromName} theme={theme} />
            </XAxis>
          </div>

          <Gutter size="1rem" />

          <ArrowDivider color={dividerColor} />

          <Gutter size="1rem" />

          {/* To row */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Body2
              color={
                theme.mode === "light"
                  ? ColorPalette["gray-700"]
                  : ColorPalette.white
              }
            >
              <FormattedMessage id="page.switch-account.to" />
            </Body2>
            <XAxis alignY="center" gap="0.5rem">
              <Body2
                color={
                  theme.mode === "light"
                    ? ColorPalette["gray-700"]
                    : ColorPalette.white
                }
              >
                {toName}
              </Body2>
              <WalletAvatar name={toName} theme={theme} />
            </XAxis>
          </div>
        </Box>
      </Box>
    </HeaderLayout>
  );
});
