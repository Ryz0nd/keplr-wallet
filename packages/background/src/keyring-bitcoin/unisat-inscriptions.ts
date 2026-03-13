import { Inscription, Network } from "@keplr-wallet/types";

export interface UniSatInscriptionDataItem {
  utxo: {
    txid: string;
    vout: number;
    satoshi: number;
    address: string;
  };
  address: string;
  offset: number;
  inscriptionNumber: number;
  inscriptionId: string;
  contentType?: string;
  height: number;
}

export interface UniSatInscriptionDataResponse {
  code: number;
  msg?: string;
  data: {
    cursor: number;
    total: number;
    totalConfirmed?: number;
    totalUnconfirmed?: number;
    totalUnconfirmedSpend?: number;
    inscription: UniSatInscriptionDataItem[];
  };
}

export const getOrdinalsExplorerBaseUrl = (network: Network): string => {
  switch (network) {
    case Network.LIVENET:
    case Network.MAINNET:
      return "https://ordinals.com";
    case Network.TESTNET:
    case Network.SIGNET:
      return "";
  }
};

export const adaptUniSatInscriptionDataResponse = (
  network: Network,
  response: UniSatInscriptionDataResponse
): { total: number; list: Inscription[] } => {
  const explorerBaseUrl = getOrdinalsExplorerBaseUrl(network);

  return {
    total: response.data.total,
    list: response.data.inscription.map((item) => {
      const {
        inscriptionId,
        inscriptionNumber,
        address,
        contentType,
        offset,
        height,
        utxo,
      } = item;

      return {
        id: inscriptionId,
        inscriptionId,
        content: `${explorerBaseUrl}/content/${inscriptionId}`,
        number: inscriptionNumber,
        address,
        contentType: contentType ?? "",
        output: `${utxo.txid}:${utxo.vout}`,
        location: `${utxo.txid}:${utxo.vout}:${offset}`,
        genesisTransaction: utxo.txid,
        height,
        preview: `${explorerBaseUrl}/preview/${inscriptionId}`,
        outputValue: utxo.satoshi,
        offset,
      };
    }),
  };
};
