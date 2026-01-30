import { useRef, useEffect, useCallback, useMemo } from "react";
import { useStore } from "../../../../../stores";
import { BackgroundTxStatus, BackgroundTxType } from "@keplr-wallet/background";
import type { SwapV2History, TxExecution } from "@keplr-wallet/background";
import { ChainIdHelper } from "@keplr-wallet/cosmos";

const sentActionRequiredHistoryIds = new Set<string>();

const getPendingTxData = (
  blockedTx: TxExecution["txs"][number] | undefined
) => ({
  pending_tx_type:
    blockedTx?.type === BackgroundTxType.EVM
      ? "evm"
      : blockedTx?.type === BackgroundTxType.COSMOS
      ? blockedTx.txData.aminoMsgs?.[0]?.type
      : undefined,
  pending_chain_identifier: blockedTx?.chainId
    ? ChainIdHelper.parse(blockedTx.chainId).identifier
    : undefined,
});

// action_required 및 resume 관련 사용자 인터랙션 로깅을 담당
interface UseSwapV2HistoryItemAnalyticsArgs {
  history: SwapV2History;
  hasExecutableTx: boolean;
  txExecution: TxExecution | undefined;
}

export const useSwapV2HistoryItemAnalytics = ({
  history,
  hasExecutableTx,
  txExecution,
}: UseSwapV2HistoryItemAnalyticsArgs) => {
  const { analyticsAmplitudeStore } = useStore();
  const prevHasExecutableTxRef = useRef(false);

  const inChainIdentifier = ChainIdHelper.parse(history.fromChainId).identifier;
  const outChainIdentifier = ChainIdHelper.parse(history.toChainId).identifier;

  const baseEventData = useMemo(
    () => ({
      history_id: history.id,
      provider: history.provider,
      in_chain_identifier: inChainIdentifier,
      out_chain_identifier: outChainIdentifier,
      route_count: history.simpleRoute.length,
      current_route_index: history.routeIndex,
    }),
    [
      history.id,
      history.provider,
      history.routeIndex,
      history.simpleRoute.length,
      inChainIdentifier,
      outChainIdentifier,
    ]
  );

  useEffect(() => {
    if (!prevHasExecutableTxRef.current && hasExecutableTx && txExecution) {
      if (sentActionRequiredHistoryIds.has(history.id)) {
        prevHasExecutableTxRef.current = hasExecutableTx;
        return;
      }

      const blockedTx = txExecution.txs.find(
        (tx) =>
          tx.status === BackgroundTxStatus.BLOCKED &&
          txExecution.executableChainIds.includes(tx.chainId)
      );
      if (blockedTx) {
        analyticsAmplitudeStore.logEvent("swap_v2_history_action_required", {
          ...baseEventData,
          ...getPendingTxData(blockedTx),
          executed_tx_count: txExecution.txs.filter(
            (tx) => tx.status === BackgroundTxStatus.CONFIRMED
          ).length,
          total_tx_count: txExecution.txs.length,
          time_since_start_ms: Date.now() - history.timestamp,
        });
        sentActionRequiredHistoryIds.add(history.id);
      }
    }
    prevHasExecutableTxRef.current = hasExecutableTx;
  }, [
    analyticsAmplitudeStore,
    baseEventData,
    hasExecutableTx,
    history.id,
    history.timestamp,
    txExecution,
  ]);

  const logResumeClicked = useCallback(
    (blockedTx: TxExecution["txs"][number] | undefined) => {
      analyticsAmplitudeStore.logEvent("swap_v2_history_resume_clicked", {
        ...baseEventData,
        ...getPendingTxData(blockedTx),
        time_since_start_ms: Date.now() - history.timestamp,
      });
    },
    [analyticsAmplitudeStore, baseEventData, history.timestamp]
  );

  const logResumeSubmitted = useCallback(
    (blockedTx: TxExecution["txs"][number] | undefined) => {
      analyticsAmplitudeStore.logEvent("swap_v2_history_resume_tx_submitted", {
        ...baseEventData,
        ...getPendingTxData(blockedTx),
        time_since_start_ms: Date.now() - history.timestamp,
      });
    },
    [analyticsAmplitudeStore, baseEventData, history.timestamp]
  );

  const logResumeSignCanceled = useCallback(
    (blockedTx: TxExecution["txs"][number] | undefined) => {
      analyticsAmplitudeStore.logEvent("swap_v2_history_resume_sign_canceled", {
        ...baseEventData,
        ...getPendingTxData(blockedTx),
        time_since_start_ms: Date.now() - history.timestamp,
      });
    },
    [analyticsAmplitudeStore, baseEventData, history.timestamp]
  );

  const logResumeFailed = useCallback(
    (
      blockedTx: TxExecution["txs"][number] | undefined,
      errorMessage: string
    ) => {
      analyticsAmplitudeStore.logEvent("swap_v2_history_resume_tx_failed", {
        ...baseEventData,
        ...getPendingTxData(blockedTx),
        time_since_start_ms: Date.now() - history.timestamp,
        error_message: errorMessage,
      });
    },
    [analyticsAmplitudeStore, baseEventData, history.timestamp]
  );

  return {
    logResumeClicked,
    logResumeSubmitted,
    logResumeSignCanceled,
    logResumeFailed,
  };
};
