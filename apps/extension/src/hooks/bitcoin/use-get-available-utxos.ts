import { useMemo } from "react";
import { Network } from "@keplr-wallet/types";
import { useStore } from "../../stores";
import { useBitcoinNetworkConfig } from "./use-bitcoin-network-config";
import {
  mergeUniSatAvailableUtxosResponses,
  UniSatAvailableUtxoSet,
  UniSatAvailableUtxosResponse,
} from "./unisat-available-utxos";

const UNISAT_AVAILABLE_UTXO_PAGE_SIZE = 500;
const UNISAT_AVAILABLE_UTXO_MAX_PAGES = 2;
const UNISAT_AVAILABLE_UTXO_COMMON_QUERY = `size=${UNISAT_AVAILABLE_UTXO_PAGE_SIZE}&withLowFee=true`;

export const useGetAvailableUtxos = (chainId: string, address: string) => {
  const { queriesStore } = useStore();
  const { bitcoinInscriptionApiUrl, currentNetwork } =
    useBitcoinNetworkConfig(chainId);

  const shouldUseUniSat =
    address !== "" &&
    (currentNetwork === Network.MAINNET || currentNetwork === Network.LIVENET);

  const baseURL = shouldUseUniSat ? `${bitcoinInscriptionApiUrl}/unisat` : "";
  const firstPageUrl = `/v1/indexer/address/${address}/available-utxo-data?cursor=0&${UNISAT_AVAILABLE_UTXO_COMMON_QUERY}`;

  const firstPageQuery =
    queriesStore.simpleQuery.queryGet<UniSatAvailableUtxosResponse>(
      baseURL,
      firstPageUrl
    );

  const shouldFetchSecondPage =
    shouldUseUniSat &&
    UNISAT_AVAILABLE_UTXO_MAX_PAGES > 1 &&
    !!firstPageQuery.response?.data &&
    firstPageQuery.response.data.data.total > UNISAT_AVAILABLE_UTXO_PAGE_SIZE;

  const secondPageUrl = `/v1/indexer/address/${address}/available-utxo-data?cursor=${UNISAT_AVAILABLE_UTXO_PAGE_SIZE}&${UNISAT_AVAILABLE_UTXO_COMMON_QUERY}`;
  const secondPageQuery =
    queriesStore.simpleQuery.queryGet<UniSatAvailableUtxosResponse>(
      shouldFetchSecondPage ? baseURL : "",
      secondPageUrl
    );

  const isFetching =
    shouldUseUniSat &&
    (firstPageQuery.isFetching ||
      (shouldFetchSecondPage && secondPageQuery.isFetching));

  const error =
    firstPageQuery.error ||
    (shouldFetchSecondPage ? secondPageQuery.error : undefined);

  const data = useMemo<UniSatAvailableUtxoSet | undefined>(() => {
    if (!shouldUseUniSat || error || !firstPageQuery.response?.data) {
      return undefined;
    }

    if (shouldFetchSecondPage && !secondPageQuery.response?.data) {
      return undefined;
    }

    const responses = [firstPageQuery.response.data];
    if (shouldFetchSecondPage && secondPageQuery.response?.data) {
      responses.push(secondPageQuery.response.data);
    }

    return mergeUniSatAvailableUtxosResponses(responses);
  }, [
    error,
    firstPageQuery.response?.data,
    secondPageQuery.response?.data,
    shouldFetchSecondPage,
    shouldUseUniSat,
  ]);

  return {
    isFetching,
    error,
    data,
    shouldUseUniSat,
  };
};
