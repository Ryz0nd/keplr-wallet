import React, { FunctionComponent, useState } from "react";
import { observer } from "mobx-react-lite";
import { Box } from "../../../components/box";
import { ColorPalette } from "../../../styles";
import { XAxis, YAxis } from "../../../components/axis";
import { Gutter } from "../../../components/gutter";
import { Body3, Subtitle1, Subtitle3 } from "../../../components/typography";
import { useStore } from "../../../stores";
import { Dec } from "@keplr-wallet/unit";
import { useTheme } from "styled-components";
import {
  ChainInfo,
  ModularChainInfo,
  StarknetChainInfo,
} from "@keplr-wallet/types";
import { ThemeOption } from "../../../theme";
import { INITIA_CHAIN_ID } from "../../../config.ui";
import { useGetStakingApr } from "../../../hooks/use-get-staking-apr";

export const StakedBalance: FunctionComponent<{
  modularChainInfo: ModularChainInfo;
}> = observer(({ modularChainInfo }) => {
  if ("starknet" in modularChainInfo) {
    return (
      <StarknetStakedBalance starknetChainInfo={modularChainInfo.starknet} />
    );
  }

  if ("cosmos" in modularChainInfo) {
    return <CosmosStakedBalance chainInfo={modularChainInfo.cosmos} />;
  }

  // modularChainInfo가 추가됨에 따라 새로운 분기 처리가 필요할 수 있음

  return null;
});

const CosmosStakedBalance: FunctionComponent<{
  chainInfo: ChainInfo;
}> = observer(({ chainInfo }) => {
  const theme = useTheme();

  const { queriesStore, accountStore, chainStore, uiConfigStore } = useStore();

  const [isHover, setIsHover] = useState(false);

  const chainId = chainInfo.chainId;
  const chain = chainStore.getChain(chainId);

  const cosmosAPRDec = useGetStakingApr(chainId);
  const cosmosAPR = cosmosAPRDec
    ? `${cosmosAPRDec.toString(2)}% APR`
    : undefined;

  const isInitia = chainId === INITIA_CHAIN_ID;

  const queries = queriesStore.get(chainId);
  const queryDelegation = (
    isInitia
      ? queries.cosmos.queryInitiaDelegations
      : queries.cosmos.queryDelegations
  ).getQueryBech32Address(accountStore.getAccount(chainId).bech32Address);

  const stakeBalanceIsZero =
    !queryDelegation.total || queryDelegation.total.toDec().equals(new Dec(0));

  return (
    <StakedBalanceLayout
      stakingUrl={chain.walletUrlForStaking}
      isHover={isHover}
      onHoverStateChange={setIsHover}
    >
      <XAxis alignY="center">
        {theme.mode === "light" ? (
          <StakingGradientLightIcon />
        ) : (
          <StakingGradientDarkIcon />
        )}
        <Gutter size="0.75rem" />
        <YAxis>
          {(() => {
            if (stakeBalanceIsZero && chain.walletUrlForStaking) {
              return (
                <React.Fragment>
                  <Subtitle1
                    color={
                      theme.mode === "light"
                        ? ColorPalette["black"]
                        : ColorPalette["white"]
                    }
                  >
                    Start Staking
                  </Subtitle1>
                  <Gutter size="0.25rem" />
                  {cosmosAPR && (
                    <Body3
                      color={
                        theme.mode === "light"
                          ? ColorPalette["gray-300"]
                          : ColorPalette["gray-200"]
                      }
                    >
                      {cosmosAPR}
                    </Body3>
                  )}
                </React.Fragment>
              );
            } else {
              return (
                <React.Fragment>
                  <Body3
                    color={
                      theme.mode === "light"
                        ? ColorPalette["gray-300"]
                        : ColorPalette["gray-200"]
                    }
                  >
                    Staked Balance
                  </Body3>
                  <Gutter size="0.25rem" />
                  <Subtitle3
                    color={
                      theme.mode === "light"
                        ? ColorPalette["black"]
                        : ColorPalette["white"]
                    }
                  >
                    {queryDelegation.total
                      ? uiConfigStore.hideStringIfPrivacyMode(
                          queryDelegation.total
                            .maxDecimals(6)
                            .shrink(true)
                            .inequalitySymbol(true)
                            .trim(true)
                            .toString(),
                          2
                        )
                      : "-"}
                  </Subtitle3>
                </React.Fragment>
              );
            }
          })()}
        </YAxis>
        <div
          style={{
            flex: 1,
          }}
        />
        <XAxis alignY="center">
          {!stakeBalanceIsZero && cosmosAPR ? (
            <Subtitle3
              color={
                theme.mode === "light"
                  ? ColorPalette["gray-200"]
                  : ColorPalette["gray-300"]
              }
            >
              {cosmosAPR}
            </Subtitle3>
          ) : null}

          {chain.walletUrlForStaking ? (
            stakeBalanceIsZero ? (
              <React.Fragment>
                <Gutter size="0.25rem" />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  fill="none"
                  viewBox="0 0 20 20"
                >
                  <path
                    stroke={getStrokeColor(isHover, theme.mode)}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.7"
                    d="M11.25 5H4.375C3.339 5 2.5 5.84 2.5 6.875v8.75c0 1.035.84 1.875 1.875 1.875h8.75c1.036 0 1.875-.84 1.875-1.875V8.75m-8.75 5L17.5 2.5m0 0h-4.375m4.375 0v4.375"
                  />
                </svg>
              </React.Fragment>
            ) : (
              <React.Fragment>
                <Gutter size="0.25rem" />
                <Box marginBottom="2px">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="none"
                    viewBox="0 0 16 16"
                  >
                    <path
                      stroke={getStrokeColor(isHover, theme.mode)}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M9 4.5H3.5A1.5 1.5 0 002 6v7a1.5 1.5 0 001.5 1.5h7A1.5 1.5 0 0012 13V7.5m-7 4l9-9m0 0h-3.5m3.5 0V6"
                    />
                  </svg>
                </Box>
              </React.Fragment>
            )
          ) : null}
        </XAxis>
      </XAxis>
    </StakedBalanceLayout>
  );
});

const StarknetStakedBalance: FunctionComponent<{
  starknetChainInfo: StarknetChainInfo;
}> = observer(({ starknetChainInfo }) => {
  const { accountStore, starknetQueriesStore, uiConfigStore } = useStore();

  const theme = useTheme();

  const [isHover, setIsHover] = useState(false);

  const chainId = starknetChainInfo.chainId;
  const account = accountStore.getAccount(chainId);

  const queryApr = starknetQueriesStore.get(chainId).queryStakingApr;

  const stakingApr = queryApr.apr ? queryApr.apr.toString(2) : null;

  const queryStakingInfo = starknetQueriesStore
    .get(chainId)
    .stakingInfoManager.getStakingInfo(account.starknetHexAddress);

  const totalStakedAmount = queryStakingInfo?.totalStakedAmount;

  const stakeBalanceIsZero =
    !totalStakedAmount || totalStakedAmount.toDec().equals(new Dec(0));

  return (
    <StakedBalanceLayout
      stakingUrl={"https://voyager.online/staking"}
      isHover={isHover}
      onHoverStateChange={setIsHover}
    >
      <XAxis alignY="center">
        {theme.mode === "light" ? (
          stakeBalanceIsZero ? (
            <VoyagerLightIcon />
          ) : (
            <StakingGradientLightIcon />
          )
        ) : stakeBalanceIsZero ? (
          <VoyagerDarkIcon />
        ) : (
          <StakingGradientDarkIcon />
        )}
        <Gutter size="0.75rem" />
        <YAxis>
          {(() => {
            if (stakeBalanceIsZero) {
              return (
                <React.Fragment>
                  <Subtitle1
                    color={
                      theme.mode === "light"
                        ? ColorPalette["black"]
                        : ColorPalette["white"]
                    }
                  >
                    Start Staking
                  </Subtitle1>
                  {stakingApr && (
                    <React.Fragment>
                      <Gutter size="0.25rem" />
                      <Body3
                        color={
                          theme.mode === "light"
                            ? ColorPalette["gray-300"]
                            : ColorPalette["gray-200"]
                        }
                        style={{
                          lineHeight: "140%",
                        }}
                      >
                        {`${stakingApr}% APR`}
                      </Body3>
                    </React.Fragment>
                  )}
                </React.Fragment>
              );
            } else {
              return (
                <React.Fragment>
                  <Body3
                    color={
                      theme.mode === "light"
                        ? ColorPalette["gray-300"]
                        : ColorPalette["gray-200"]
                    }
                    style={{
                      lineHeight: "140%",
                    }}
                  >
                    Staked Balance
                  </Body3>
                  <Gutter size="0.25rem" />
                  <Subtitle3
                    color={
                      theme.mode === "light"
                        ? ColorPalette["black"]
                        : ColorPalette["white"]
                    }
                    style={{}}
                  >
                    {totalStakedAmount
                      ? uiConfigStore.hideStringIfPrivacyMode(
                          totalStakedAmount
                            .maxDecimals(6)
                            .shrink(true)
                            .inequalitySymbol(true)
                            .trim(true)
                            .toString(),
                          2
                        )
                      : "-"}
                  </Subtitle3>
                </React.Fragment>
              );
            }
          })()}
        </YAxis>
        <div
          style={{
            flex: 1,
          }}
        />
        <YAxis alignX="right">
          <XAxis alignY="center">
            {stakeBalanceIsZero ? (
              <React.Fragment>
                <Subtitle3
                  color={
                    theme.mode === "light"
                      ? isHover
                        ? ColorPalette["gray-300"]
                        : ColorPalette["gray-200"]
                      : isHover
                      ? ColorPalette["gray-100"]
                      : ColorPalette["gray-300"]
                  }
                >
                  Voyager
                </Subtitle3>
                <Gutter size="0.25rem" />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="21"
                  viewBox="0 0 20 21"
                  fill="none"
                >
                  <path
                    d="M11.25 5.5H4.375C3.33947 5.5 2.5 6.33947 2.5 7.375V16.125C2.5 17.1605 3.33947 18 4.375 18H13.125C14.1605 18 15 17.1605 15 16.125V9.25M6.25 14.25L17.5 3M17.5 3L13.125 3M17.5 3V7.375"
                    stroke={getStrokeColor(isHover, theme.mode)}
                    strokeWidth="1.875"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </React.Fragment>
            ) : (
              <React.Fragment>
                <Body3
                  color={
                    theme.mode === "light"
                      ? isHover
                        ? ColorPalette["gray-300"]
                        : ColorPalette["gray-200"]
                      : isHover
                      ? ColorPalette["gray-100"]
                      : ColorPalette["gray-300"]
                  }
                  style={{
                    lineHeight: "140%",
                  }}
                >
                  Voyager
                </Body3>
                <Gutter size="0.25rem" />
                <Box marginBottom="2px">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                  >
                    <path
                      d="M9 4H3.5C2.67157 4 2 4.67157 2 5.5V12.5C2 13.3284 2.67157 14 3.5 14H10.5C11.3284 14 12 13.3284 12 12.5V7M5 11L14 2M14 2L10.5 2M14 2V5.5"
                      stroke={getStrokeColor(isHover, theme.mode)}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Box>
              </React.Fragment>
            )}
          </XAxis>
          {!stakeBalanceIsZero && stakingApr && (
            <React.Fragment>
              <Gutter size="0.25rem" />
              <Body3
                color={
                  theme.mode === "light"
                    ? ColorPalette["gray-200"]
                    : ColorPalette["gray-300"]
                }
                style={{
                  lineHeight: "140%",
                }}
              >
                {`${stakingApr}% APR`}
              </Body3>
            </React.Fragment>
          )}
        </YAxis>
      </XAxis>
    </StakedBalanceLayout>
  );
});

const StakedBalanceLayout: FunctionComponent<{
  stakingUrl?: string;
  isHover: boolean;
  onHoverStateChange: (isHover: boolean) => void;
  children: React.ReactNode;
}> = observer(({ stakingUrl, isHover, onHoverStateChange, children }) => {
  const theme = useTheme();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (stakingUrl) {
      browser.tabs.create({ url: stakingUrl });
    }
  };

  return (
    <Box paddingX="0.75rem">
      <Box
        backgroundColor={getBackgroundColor(isHover, theme.mode)}
        style={{
          boxShadow:
            theme.mode === "light"
              ? "0 1px 4px 0 rgba(43,39,55,0.1)"
              : undefined,
        }}
        cursor={stakingUrl ? "pointer" : undefined}
        onClick={handleClick}
        onHoverStateChange={onHoverStateChange}
        borderRadius="0.375rem"
        padding="1rem"
      >
        {children}
      </Box>
    </Box>
  );
});

const StakingGradientLightIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="33"
      fill="none"
      viewBox="0 0 32 33"
    >
      <circle
        cx="16"
        cy="16.5"
        r="16"
        fill="url(#paint0_linear_9517_5789)"
        opacity="0.4"
      />
      <path
        fill="#fff"
        d="M16 9.299a1.25 1.25 0 00-.566.14h-.011L9.46 12.5a.628.628 0 00-.005 1.164v.012l5.972 3.05.004-.003c.172.087.362.14.568.14.206 0 .396-.053.567-.14l.005.003 5.972-3.05v-.012a.628.628 0 00-.005-1.165L16.577 9.44h-.01A1.25 1.25 0 0016 9.3zm-5.372 6.383l-1.167.598a.628.628 0 00-.005 1.165v.012l5.972 3.05.004-.003c.172.087.362.14.568.14.206 0 .396-.053.567-.14l.005.002 5.972-3.049v-.012a.628.628 0 00-.005-1.165l-1.167-.598c-1.83.937-4.33 2.213-4.359 2.223a2.468 2.468 0 01-2.03-.001c-.028-.01-2.524-1.284-4.355-2.222zm0 3.782l-1.167.598a.628.628 0 00-.005 1.165v.012l5.972 3.05.004-.003c.172.087.362.14.568.14.206 0 .396-.053.567-.14l.005.002 5.972-3.05v-.011a.628.628 0 00-.005-1.165l-1.167-.598c-1.83.937-4.33 2.212-4.359 2.223a2.466 2.466 0 01-2.03-.001c-.028-.01-2.524-1.284-4.355-2.222z"
      />
      <defs>
        <linearGradient
          id="paint0_linear_9517_5789"
          x1="32"
          x2="0"
          y1="16.5"
          y2="16.5"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#48A2E1" />
          <stop offset="1" stopColor="#B04AE0" />
        </linearGradient>
      </defs>
    </svg>
  );
};

const StakingGradientDarkIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="33"
      fill="none"
      viewBox="0 0 32 33"
    >
      <circle
        cx="16"
        cy="16.5"
        r="16"
        fill="url(#paint0_linear_9027_4987)"
        opacity="0.4"
      />
      <path
        fill="#fff"
        d="M16 9.299a1.25 1.25 0 00-.566.14h-.011L9.46 12.5a.628.628 0 00-.005 1.164v.012l5.972 3.05.004-.003c.172.087.363.14.568.14.206 0 .396-.053.568-.14l.005.003 5.971-3.05v-.012a.628.628 0 00-.005-1.165L16.577 9.44h-.01A1.25 1.25 0 0016 9.3zm-5.372 6.383l-1.167.598a.628.628 0 00-.005 1.165v.012l5.972 3.05.004-.003c.172.087.363.14.568.14.206 0 .396-.053.568-.14l.005.002 5.971-3.049v-.012a.628.628 0 00-.005-1.165l-1.167-.598c-1.83.937-4.33 2.213-4.359 2.223a2.468 2.468 0 01-2.03-.001c-.027-.01-2.524-1.284-4.355-2.222zm0 3.782l-1.167.598a.628.628 0 00-.005 1.165v.012l5.972 3.05.004-.003c.172.087.363.14.568.14.206 0 .396-.053.568-.14l.005.002 5.971-3.05v-.011a.628.628 0 00-.005-1.165l-1.167-.598c-1.83.937-4.33 2.212-4.359 2.223a2.466 2.466 0 01-2.03-.001c-.027-.01-2.524-1.284-4.355-2.222z"
      />
      <defs>
        <linearGradient
          id="paint0_linear_9027_4987"
          x1="32"
          x2="0"
          y1="16.5"
          y2="16.5"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#71C4FF" />
          <stop offset="1" stopColor="#D378FE" />
        </linearGradient>
      </defs>
    </svg>
  );
};

const VoyagerLightIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      viewBox="0 0 44 36"
      fill="none"
    >
      <path
        d="M43.3307 22.7714C43.3307 27.2229 41.9705 31.3568 39.643 34.78C35.3938 34.2759 31.0905 33.9467 26.7407 33.7999L26.7252 33.7629L17.2263 14.6406C16.3348 12.8458 14.5037 11.7108 12.4996 11.7107L3.64131 11.7106C7.38834 5.52269 14.1845 1.38715 21.9465 1.38715C33.7567 1.38715 43.3307 10.9612 43.3307 22.7714Z"
        fill="#1B1B50"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0.562256 22.7714C0.562256 27.1824 1.89778 31.2814 4.18652 34.6862C8.68291 34.1771 13.2391 33.8638 17.8462 33.755C17.5186 33.7132 17.2304 33.5085 17.0848 33.2059L8.78396 15.9507C7.7948 13.8945 5.71488 12.587 3.43311 12.587H3.13856C1.49546 15.6149 0.562256 19.0842 0.562256 22.7714ZM5.51387 23.5988L5.88294 24.7396C5.93395 24.8974 6.1577 24.8957 6.20614 24.737L6.55805 23.5911C6.62964 23.3582 6.8101 23.1747 7.04157 23.0996L8.18219 22.7304C8.33993 22.6794 8.33822 22.4559 8.17962 22.407L7.03385 22.055C6.80109 21.9833 6.61806 21.8028 6.54305 21.5712L6.17399 20.4305C6.12298 20.2726 5.89923 20.2744 5.85079 20.4326L5.49887 21.5789C5.42729 21.8118 5.24683 21.9949 5.01536 22.07L3.87474 22.4392C3.71742 22.4902 3.71871 22.7141 3.87731 22.7626L5.02308 23.1151C5.25583 23.1863 5.43886 23.3668 5.51387 23.5988Z"
        fill="#1B1B50"
      />
      <path
        d="M4.50464 34.6505C8.89774 34.1625 13.3476 33.8612 17.8461 33.755C17.5185 33.7132 17.2303 33.5086 17.0847 33.206L12.7627 24.2216C9.53896 27.2799 6.75205 30.7902 4.50464 34.6505Z"
        fill="#FF4F0A"
      />
      <path
        d="M19.3836 18.9835C25.4747 14.997 32.5545 12.3847 40.1777 11.5894C42.1775 14.8429 43.3307 18.6725 43.3307 22.7714C43.3307 27.223 41.9705 31.3568 39.6431 34.7801C35.3938 34.2759 31.0904 33.9467 26.7406 33.7999L26.7252 33.7629L19.3836 18.9835Z"
        fill="#FF4F0A"
      />
      <path
        opacity="0.65"
        d="M40.1777 11.5894C40.4071 11.9625 40.6253 12.3432 40.8319 12.731C38.7165 13.3441 36.9172 14.8304 35.9331 16.8762L27.8629 33.6521C27.8308 33.7188 27.7918 33.7807 27.747 33.8372C27.4118 33.8237 27.0764 33.8113 26.7407 33.8L26.7253 33.763L23.1169 26.499L25.73 20.0879C26.9421 17.1138 29.1184 14.7308 31.8108 13.2401C34.5066 12.4474 37.3035 11.8892 40.1777 11.5894Z"
        fill="#1B1B50"
      />
      <path
        d="M27.7251 33.8363C27.3972 33.8231 27.069 33.811 26.7406 33.7999L26.7252 33.7629L23.4304 27.1302C26.3832 25.5447 29.5262 24.2675 32.8164 23.3417L27.8781 33.6072C27.8374 33.6916 27.7857 33.7685 27.7251 33.8363Z"
        fill="#1B1B50"
      />
    </svg>
  );
};

const VoyagerDarkIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      viewBox="0 0 54 42"
      fill="none"
    >
      <path
        d="M53.2833 27.0578C53.2833 32.5318 51.6107 37.6152 48.7486 41.8247C43.5233 41.2048 38.2316 40.8 32.8827 40.6195L32.8637 40.574L21.183 17.0595C20.0867 14.8525 17.835 13.4567 15.3706 13.4566L4.47768 13.4565C9.08536 5.84728 17.4425 0.761841 26.9874 0.761841C41.5102 0.761841 53.2833 12.5349 53.2833 27.0578Z"
        fill="#FFEAD2"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0.691406 27.0578C0.691406 32.4819 2.33368 37.5225 5.14813 41.7093C10.6773 41.0833 16.2799 40.698 21.9452 40.5642C21.5424 40.5129 21.188 40.2612 21.009 39.8891L10.8015 18.6705C9.58519 16.142 7.02753 14.5341 4.22166 14.5341H3.85945C1.83895 18.2576 0.691406 22.5237 0.691406 27.0578ZM6.78035 28.0753L7.23419 29.4781C7.29691 29.6721 7.57206 29.67 7.63162 29.4749L8.06437 28.0658C8.1524 27.7795 8.37431 27.5538 8.65894 27.4615L10.0616 27.0074C10.2555 26.9447 10.2534 26.6699 10.0584 26.6098L8.64945 26.1768C8.36324 26.0888 8.13816 25.8667 8.04592 25.582L7.59209 24.1792C7.52936 23.9851 7.25422 23.9872 7.19466 24.1818L6.76191 25.5915C6.67388 25.8778 6.45197 26.103 6.16734 26.1953L4.76473 26.6493C4.57128 26.7121 4.57286 26.9874 4.76789 27.047L6.17683 27.4804C6.46304 27.568 6.68811 27.79 6.78035 28.0753Z"
        fill="#FFEAD2"
      />
      <path
        d="M5.53906 41.6654C10.9412 41.0652 16.4132 40.6948 21.9449 40.5642C21.5421 40.5128 21.1876 40.2611 21.0086 39.889L15.6939 28.8411C11.7297 32.6017 8.30268 36.9184 5.53906 41.6654Z"
        fill="#FF4F0A"
      />
      <path
        d="M23.8355 22.3999C31.3257 17.4977 40.0316 14.2853 49.4059 13.3074C51.8649 17.3081 53.2831 22.0173 53.2831 27.0577C53.2831 32.5318 51.6105 37.6151 48.7484 41.8246C43.5231 41.2047 38.2313 40.7999 32.8824 40.6194L32.8634 40.5739L23.8355 22.3999Z"
        fill="#FF4F0A"
      />
      <path
        opacity="0.65"
        d="M49.4062 13.3075C49.6882 13.7663 49.9565 14.2344 50.2106 14.7113C47.6093 15.4653 45.3968 17.2929 44.1867 19.8086L34.2628 40.4377C34.2233 40.5197 34.1754 40.5959 34.1202 40.6653C33.7081 40.6488 33.2957 40.6335 32.8828 40.6196L32.8639 40.574L28.4268 31.6417L31.64 23.758C33.1305 20.1008 35.8067 17.1704 39.1174 15.3373C42.4325 14.3625 45.8718 13.6762 49.4062 13.3075Z"
        fill="#121212"
      />
      <path
        opacity="0.56"
        d="M34.0936 40.6642C33.6904 40.648 33.2869 40.6331 32.883 40.6194L32.864 40.5739L28.8125 32.4178C32.4435 30.4681 36.3084 28.8975 40.3543 27.7592L34.2817 40.3825C34.2318 40.4863 34.1681 40.5808 34.0936 40.6642Z"
        fill="#1B1B1B"
      />
    </svg>
  );
};

const getBackgroundColor = (isHover: boolean, mode: ThemeOption) =>
  isHover
    ? mode === "light"
      ? ColorPalette["gray-10"]
      : ColorPalette["gray-500"]
    : mode === "light"
    ? ColorPalette["white"]
    : ColorPalette["gray-550"];

const getStrokeColor = (isHover: boolean, mode: ThemeOption) =>
  mode === "light"
    ? isHover
      ? ColorPalette["gray-300"]
      : ColorPalette["gray-200"]
    : isHover
    ? ColorPalette["gray-100"]
    : ColorPalette["gray-300"];
