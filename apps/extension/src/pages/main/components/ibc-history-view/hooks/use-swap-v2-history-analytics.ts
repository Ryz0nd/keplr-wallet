import { useRef, useEffect } from "react";
import { useStore } from "../../../../../stores";
import { SwapV2TxStatus } from "@keplr-wallet/background";
import type { SwapV2History } from "@keplr-wallet/background";
import { ChainIdHelper } from "@keplr-wallet/cosmos";

// 전체 히스토리의 polling으로 인한 상태 변경 감지
export const useSwapV2HistoryAnalytics = (histories: SwapV2History[]) => {
  const { analyticsAmplitudeStore } = useStore();
  const prevStatusMap = useRef(new Map<string, SwapV2TxStatus>());
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      histories.forEach((history) => {
        prevStatusMap.current.set(history.id, history.status);
      });
      isFirstRender.current = false;
      return;
    }

    histories.forEach((history) => {
      const prevStatus = prevStatusMap.current.get(history.id);

      if (prevStatus !== undefined && prevStatus !== history.status) {
        const baseEventData = {
          history_id: history.id,
          provider: history.provider,
          in_chain_identifier: ChainIdHelper.parse(history.fromChainId)
            .identifier,
          out_chain_identifier: ChainIdHelper.parse(history.toChainId)
            .identifier,
          route_count: history.simpleRoute.length,
          time_since_start_ms: Date.now() - history.timestamp,
          in_coin_denom: history.amount[0]?.denom,
          out_coin_denom: history.destinationAsset.denom,
          route_duration_estimate_sec: history.routeDurationSeconds,
          is_only_bridge: history.isOnlyUseBridge,
        };

        switch (history.status) {
          case SwapV2TxStatus.SUCCESS: {
            analyticsAmplitudeStore.logEvent("swap_v2_history_completed", {
              ...baseEventData,
            });
            break;
          }
          case SwapV2TxStatus.FAILED: {
            analyticsAmplitudeStore.logEvent("swap_v2_history_failed", {
              ...baseEventData,
              failed_at_route_index: history.routeIndex,
              error_type: history.additionalTrackError
                ? "additional_track_error"
                : history.trackError
                ? "track_error"
                : "status_failed",
              error_message: history.additionalTrackError || history.trackError,
            });
            if (history.assetLocationInfo?.type === "refund") {
              analyticsAmplitudeStore.logEvent(
                "swap_v2_history_refund_completed",
                {
                  ...baseEventData,
                  refund_chain_identifier: ChainIdHelper.parse(
                    history.assetLocationInfo.chainId
                  ).identifier,
                  refund_coin_denom:
                    history.assetLocationInfo.amount?.[0]?.denom,
                }
              );
            }
            break;
          }
          case SwapV2TxStatus.PARTIAL_SUCCESS: {
            analyticsAmplitudeStore.logEvent(
              "swap_v2_history_partial_success",
              {
                ...baseEventData,
                stopped_at_route_index: history.routeIndex,
                intermediate_chain_identifier: history.assetLocationInfo
                  ?.chainId
                  ? ChainIdHelper.parse(history.assetLocationInfo.chainId)
                      .identifier
                  : undefined,
                intermediate_coin_denom:
                  history.assetLocationInfo?.amount?.[0]?.denom,
              }
            );
            break;
          }
          case SwapV2TxStatus.UNKNOWN: {
            analyticsAmplitudeStore.logEvent("swap_v2_history_unknown", {
              ...baseEventData,
            });
            break;
          }
        }
      }
      prevStatusMap.current.set(history.id, history.status);
    });
  }, [analyticsAmplitudeStore, histories]);
};
