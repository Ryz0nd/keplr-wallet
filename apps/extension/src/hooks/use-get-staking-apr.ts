import { useStore } from "../stores";
import { ChainIdHelper } from "@keplr-wallet/cosmos";
import { Dec } from "@keplr-wallet/unit";

export function useGetStakingApr(chainId: string) {
  const { chainStore, starknetQueriesStore, queriesStore } = useStore();

  const isStarknet = "starknet" in chainStore.getModularChain(chainId);

  if (isStarknet) {
    const queryApr = starknetQueriesStore.get(chainId).queryStakingApr;

    return queryApr.apr ? queryApr.apr : undefined;
  }

  const chainIdentifier = ChainIdHelper.parse(chainId).identifier;

  const queryApr = queriesStore.simpleQuery.queryGet<{
    overview: {
      apr: number;
    };
    lastUpdated: number;
  }>("https://apr-lambda.keplr.app", `/apr/${chainIdentifier}`);

  if (
    queryApr.response &&
    "apr" in queryApr.response.data &&
    typeof queryApr.response.data.apr === "number" &&
    queryApr.response.data.apr > 0
  ) {
    return new Dec(queryApr.response.data.apr).mul(new Dec(100));
  }

  return undefined;
}
