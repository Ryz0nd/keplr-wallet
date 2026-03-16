export interface IndexedBitcoinUtxoLike {
  txid: string;
  vout: number;
  value: number;
}

export interface UniSatAvailableUtxo {
  txid: string;
  vout: number;
  satoshi: number;
  address: string;
  height: number;
}

export interface UniSatAvailableUtxosResponse {
  code: number;
  msg?: string;
  data: {
    cursor: number;
    total: number;
    totalConfirmed?: number;
    totalUnconfirmed?: number;
    totalUnconfirmedSpend?: number;
    utxo: UniSatAvailableUtxo[];
  };
}

export interface UniSatAvailableUtxoSet {
  data: Array<{
    txid: string;
    vout: number;
  }>;
}

export const mergeUniSatAvailableUtxosResponses = (
  responses: UniSatAvailableUtxosResponse[]
): UniSatAvailableUtxoSet => {
  const seen = new Set<string>();
  const utxos = responses.flatMap((response) => response.data.utxo);

  return {
    data: utxos.flatMap((utxo) => {
      const key = `${utxo.txid}:${utxo.vout}`;
      if (seen.has(key)) {
        return [];
      }

      seen.add(key);

      return [
        {
          txid: utxo.txid,
          vout: utxo.vout,
        },
      ];
    }),
  };
};

export const deriveAvailableUtxoState = <T extends IndexedBitcoinUtxoLike>({
  confirmedUTXOs,
  uniSatAvailableUtxoSet,
  useUniSatSelection,
  hasApiError,
  indexerIsHealthy,
  allowUnfilteredOnApiError,
  dustThreshold,
}: {
  confirmedUTXOs: T[];
  uniSatAvailableUtxoSet?: UniSatAvailableUtxoSet;
  useUniSatSelection: boolean;
  hasApiError: boolean;
  indexerIsHealthy: boolean;
  allowUnfilteredOnApiError: boolean;
  dustThreshold: number;
}) => {
  const uniSatSet = new Set(
    (uniSatAvailableUtxoSet?.data ?? []).map(
      (utxo) => `${utxo.txid}:${utxo.vout}`
    )
  );

  const useFilteredUniSatSet =
    useUniSatSelection && !hasApiError && !!uniSatAvailableUtxoSet;

  const availableUTXOs = confirmedUTXOs.filter((utxo) => {
    if (utxo.value < dustThreshold) {
      return false;
    }

    if (!useFilteredUniSatSet) {
      return true;
    }

    return uniSatSet.has(`${utxo.txid}:${utxo.vout}`);
  });

  const shouldSkipFiltering =
    allowUnfilteredOnApiError && indexerIsHealthy && hasApiError;
  const isUnfiltered = hasApiError && indexerIsHealthy;

  return {
    availableUTXOs,
    shouldSkipFiltering,
    isUnfiltered,
  };
};
