import { useEffect, useMemo, useState } from "react";
import { DUST_THRESHOLD } from "@keplr-wallet/stores-bitcoin";
import { useStore } from "../../stores";
import { CoinPretty, Dec } from "@keplr-wallet/unit";
import { deriveAvailableUtxoState } from "./unisat-available-utxos";
import { useGetAvailableUtxos } from "./use-get-available-utxos";

export const useGetUTXOs = (chainId: string, address: string) => {
  const [allowUnfilteredOnApiError, setAllowUnfilteredOnApiError] =
    useState(false);
  const { chainStore, bitcoinQueriesStore } = useStore();

  const modularChainInfo = chainStore.getModularChain(chainId);
  if (!("bitcoin" in modularChainInfo)) {
    throw new Error("Unsupported chain");
  }

  const currency = modularChainInfo.bitcoin.currencies[0];
  if (!currency) {
    throw new Error("Bitcoin currency not found");
  }

  const {
    data: uniSatAvailableUtxoSet,
    error: uniSatApiError,
    isFetching: isFetchingUniSat,
    shouldUseUniSat,
  } = useGetAvailableUtxos(chainId, address);

  const queryUTXOs =
    address !== ""
      ? bitcoinQueriesStore
          .get(chainId)
          .queryBitcoinUTXOs.getUTXOs(chainId, chainStore, address)
      : undefined;

  const confirmedUTXOs = queryUTXOs?.confirmedUTXOs || [];

  const indexerIsHealthy =
    !queryUTXOs?.error &&
    (!queryUTXOs?.isFetching || confirmedUTXOs.length > 0);

  const hasApiError = shouldUseUniSat && !!uniSatApiError && !isFetchingUniSat;

  const { availableUTXOs, shouldSkipFiltering, isUnfiltered } = useMemo(() => {
    return deriveAvailableUtxoState({
      confirmedUTXOs,
      uniSatAvailableUtxoSet,
      useUniSatSelection: shouldUseUniSat,
      hasApiError,
      indexerIsHealthy,
      allowUnfilteredOnApiError,
      dustThreshold: DUST_THRESHOLD,
    });
  }, [
    allowUnfilteredOnApiError,
    confirmedUTXOs,
    hasApiError,
    indexerIsHealthy,
    shouldUseUniSat,
    uniSatAvailableUtxoSet,
  ]);

  const availableBalance = new CoinPretty(
    currency,
    availableUTXOs.reduce((acc, utxo) => {
      return acc.add(new Dec(utxo.value));
    }, new Dec(0))
  );

  const isFetching = isFetchingUniSat || queryUTXOs?.isFetching;
  const indexerError = queryUTXOs?.error;
  const apiError =
    hasApiError && uniSatApiError
      ? Object.assign(new Error(uniSatApiError.message), {
          cause: uniSatApiError,
        })
      : undefined;
  const error = indexerError || apiError;

  const [hasSetAvailableBalance, setHasSetAvailableBalance] = useState(false);

  useEffect(() => {
    setHasSetAvailableBalance(false);
  }, [allowUnfilteredOnApiError]);

  const setAvailableBalanceOnce = (
    setter: (sender: string, balance: CoinPretty) => void
  ) => {
    if (!isFetching && !indexerError && !hasSetAvailableBalance) {
      setHasSetAvailableBalance(true);
      setter(address, availableBalance);
    }
  };

  return {
    isFetching,
    error,
    indexerError,
    apiError,
    confirmedUTXOs,
    availableUTXOs,
    availableBalance,
    shouldSkipFiltering,
    isUnfiltered,
    allowUnfilteredOnApiError,
    setAllowUnfilteredOnApiError,
    setAvailableBalanceOnce,
  };
};
