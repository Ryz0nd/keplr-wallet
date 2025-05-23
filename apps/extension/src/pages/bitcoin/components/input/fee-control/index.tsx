import React, { FunctionComponent, useState } from "react";
import { observer } from "mobx-react-lite";
import {
  IFeeConfig,
  IFeeRateConfig,
  IPsbtSimulator,
  InsufficientFeeError,
  ISenderConfig,
  UnableToFindProperUtxosError,
} from "@keplr-wallet/hooks-bitcoin";
import { useTheme } from "styled-components";
import { ColorPalette } from "../../../../../styles";
import {
  Body2,
  Caption1,
  Subtitle4,
} from "../../../../../components/typography";
import { LoadingIcon } from "../../../../../components/icon";
import { useStore } from "../../../../../stores";
import { Box } from "../../../../../components/box";
import { VerticalResizeTransition } from "../../../../../components/transition";
import { FormattedMessage, useIntl } from "react-intl";
import { XAxis, YAxis } from "../../../../../components/axis";
import { Tooltip } from "../../../../../components/tooltip";
import { Modal } from "../../../../../components/modal";
import { TransactionFeeModal } from "../../transaction-fee-modal";

export const FeeControl: FunctionComponent<{
  senderConfig: ISenderConfig;
  feeConfig: IFeeConfig;
  feeRateConfig: IFeeRateConfig;
  psbtSimulator?: IPsbtSimulator;

  disableAutomaticFeeSet?: boolean;
  disableClick?: boolean;
}> = observer(
  ({
    senderConfig,
    feeConfig,
    feeRateConfig,
    psbtSimulator,
    disableAutomaticFeeSet,
    disableClick,
  }) => {
    const { analyticsStore, priceStore } = useStore();

    const intl = useIntl();
    const theme = useTheme();

    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
      <Box>
        <YAxis alignX="center">
          <Box
            /* text underline의 offset을 수동으로 설정했기 때문에 그만큼 paddnig bottom을 넣어줘야 paret가 overflow: hidden이여도 밑줄이 보임 */
            paddingBottom="0.21rem"
            cursor={disableClick ? undefined : "pointer"}
            onClick={(e) => {
              if (disableClick) {
                return;
              }
              e.preventDefault();

              analyticsStore.logEvent("click_txFeeSet");
              setIsModalOpen(true);
            }}
          >
            <XAxis alignY="center">
              {/* 밑의 박스는 현재 기억된 fee 옵션을 사용하기 옵션이 on되어있다는 표시하기 위한 box와 양옆의 균형을 맞추기 위해서 존재함 */}
              <Box minWidth="0.875rem" />
              <Body2
                color={(() => {
                  if (
                    feeConfig.uiProperties.error ||
                    feeConfig.uiProperties.warning
                  ) {
                    return theme.mode === "light"
                      ? ColorPalette["orange-400"]
                      : ColorPalette["yellow-400"];
                  }

                  return theme.mode === "light"
                    ? ColorPalette["blue-400"]
                    : ColorPalette["white"];
                })()}
                style={{
                  ...(!disableClick && {
                    textDecoration: "underline",
                    textUnderlineOffset: "0.2rem",
                  }),
                }}
              >
                {
                  <FormattedMessage
                    id="components.input.fee-control.fee"
                    values={{
                      assets: (() => {
                        if (!feeConfig.fee) {
                          return "-";
                        }

                        return feeConfig.fee
                          .maxDecimals(6)
                          .inequalitySymbol(true)
                          .trim(true)
                          .shrink(true)
                          .hideIBCMetadata(true)
                          .toString();
                      })(),
                    }}
                  />
                }
              </Body2>
              <Body2
                color={
                  theme.mode === "light"
                    ? ColorPalette["gray-300"]
                    : ColorPalette["gray-300"]
                }
                style={{
                  whiteSpace: "pre-wrap",
                  ...(!disableClick && {
                    textDecoration: "underline",
                    textUnderlineOffset: "0.2rem",
                  }),
                }}
              >
                {` ${(() => {
                  if (!feeConfig.fee) {
                    return "";
                  }
                  if (!feeConfig.fee.currency.coinGeckoId) {
                    return "";
                  }
                  return `(${(() => {
                    return priceStore.calculatePrice(feeConfig.fee);
                  })()})`;
                })()}`}
              </Body2>
              <Box minWidth="0.875rem" height="1px" alignY="center">
                {(() => {
                  if (
                    (feeConfig.uiProperties.loadingState &&
                      feeConfig.uiProperties.error?.message !==
                        "Fee is not set") ||
                    psbtSimulator?.uiProperties.loadingState
                  ) {
                    return (
                      <Box alignY="center" marginLeft="0.25rem">
                        <LoadingIcon
                          width="1.25rem"
                          height="1.25rem"
                          color={ColorPalette["gray-200"]}
                        />
                      </Box>
                    );
                  }

                  if (disableAutomaticFeeSet) {
                    return (
                      <Tooltip
                        content={intl.formatMessage({
                          id: "components.input.fee-control.tooltip.external-fee-set",
                        })}
                      >
                        <Box alignY="center" marginLeft="0.25rem">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="17"
                            height="17"
                            fill="none"
                            viewBox="0 0 17 17"
                          >
                            <path
                              fill={
                                theme.mode === "light"
                                  ? ColorPalette["gray-200"]
                                  : ColorPalette["gray-300"]
                              }
                              d="M8.5 1.833A6.67 6.67 0 001.833 8.5 6.67 6.67 0 008.5 15.167 6.67 6.67 0 0015.167 8.5 6.67 6.67 0 008.5 1.833zm.667 10H7.834v-4h1.333v4zm0-5.333H7.834V5.167h1.333V6.5z"
                            />
                          </svg>
                        </Box>
                      </Tooltip>
                    );
                  }

                  return null;
                })()}
              </Box>
            </XAxis>
          </Box>
          <Box
            marginTop="0.375rem"
            padding="0.125rem 0.25rem"
            backgroundColor={(() => {
              return theme.mode === "light"
                ? ColorPalette["gray-50"]
                : ColorPalette["gray-500"];
            })()}
            borderRadius="0.5rem"
          >
            <XAxis alignY="center">
              <Caption1
                color={(() => {
                  if (
                    feeConfig.uiProperties.error ||
                    feeConfig.uiProperties.warning
                  ) {
                    return theme.mode === "light"
                      ? ColorPalette["orange-300"]
                      : ColorPalette["yellow-300"];
                  }

                  return theme.mode === "light"
                    ? ColorPalette["blue-300"]
                    : ColorPalette["gray-300"];
                })()}
              >
                <FormattedMessage
                  id="components.input.fee-control.fee-rate"
                  values={{
                    feeRate: feeRateConfig.feeRate.toFixed(3),
                  }}
                />
              </Caption1>
            </XAxis>
          </Box>
        </YAxis>
        <VerticalResizeTransition transitionAlign="top">
          {(feeConfig.uiProperties.error &&
            feeConfig.uiProperties.error.message !== "Fee is not set") ||
          feeConfig.uiProperties.warning ||
          feeRateConfig.uiProperties.error ||
          feeRateConfig.uiProperties.warning ||
          psbtSimulator?.uiProperties.error ? (
            <Box
              marginTop="1.04rem"
              borderRadius="0.5rem"
              alignX="center"
              alignY="center"
              paddingY="1.125rem"
              backgroundColor={
                theme.mode === "light"
                  ? ColorPalette["orange-50"]
                  : ColorPalette["yellow-800"]
              }
            >
              <Subtitle4
                color={
                  theme.mode === "light"
                    ? ColorPalette["orange-400"]
                    : ColorPalette["yellow-400"]
                }
              >
                {(() => {
                  if (feeConfig.uiProperties.error) {
                    if (
                      feeConfig.uiProperties.error instanceof
                      InsufficientFeeError
                    ) {
                      return intl.formatMessage({
                        id: "components.input.fee-control.error.insufficient-fee",
                      });
                    }

                    return (
                      feeConfig.uiProperties.error.message ||
                      feeConfig.uiProperties.error.toString()
                    );
                  }

                  if (feeConfig.uiProperties.warning) {
                    return (
                      feeConfig.uiProperties.warning.message ||
                      feeConfig.uiProperties.warning.toString()
                    );
                  }

                  if (feeRateConfig.uiProperties.error) {
                    return (
                      feeRateConfig.uiProperties.error.message ||
                      feeRateConfig.uiProperties.error.toString()
                    );
                  }

                  if (feeRateConfig.uiProperties.warning) {
                    console.log(
                      "feeRateConfig.uiProperties.warning",
                      feeRateConfig.uiProperties.warning
                    );
                    return (
                      feeRateConfig.uiProperties.warning.message ||
                      feeRateConfig.uiProperties.warning.toString()
                    );
                  }

                  if (psbtSimulator?.uiProperties.error) {
                    console.log(
                      "psbtSimulator?.uiProperties.error",
                      psbtSimulator?.uiProperties.error
                    );
                    if (
                      psbtSimulator.uiProperties.error instanceof
                      UnableToFindProperUtxosError
                    ) {
                      return intl.formatMessage({
                        id: "components.input.fee-control.error.unable-to-find-proper-utxos",
                      });
                    }
                  }
                })()}
              </Subtitle4>
            </Box>
          ) : null}
        </VerticalResizeTransition>

        <Modal
          isOpen={isModalOpen}
          align="bottom"
          maxHeight="95vh"
          close={() => setIsModalOpen(false)}
          forceNotUseSimplebar={true}
          forceNotOverflowAuto={true}
        >
          <TransactionFeeModal
            close={() => setIsModalOpen(false)}
            senderConfig={senderConfig}
            feeConfig={feeConfig}
            feeRateConfig={feeRateConfig}
            disableAutomaticFeeSet={disableAutomaticFeeSet}
          />
        </Modal>
      </Box>
    );
  }
);
