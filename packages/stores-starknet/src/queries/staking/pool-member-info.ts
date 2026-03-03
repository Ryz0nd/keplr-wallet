import {
  ChainGetter,
  ObservableJsonRpcBatchQuery,
  JsonRpcBatchRequest,
  QueryError,
  QueryResponse,
  QuerySharedContext,
} from "@keplr-wallet/stores";
import { CoinPretty, Dec, Int } from "@keplr-wallet/unit";
import {
  computed,
  makeObservable,
  observable,
  reaction,
  runInAction,
} from "mobx";
import { ObservableQueryValidators } from "./validators";
import { CairoUint256, selector } from "starknet";
import { ClaimableReward, UnpoolDelegation } from "./types";
import { computedFn } from "mobx-utils";
import { ERC20Currency } from "@keplr-wallet/types";

const MIN_REQUIRED_LENGTH = 6;
const BATCH_CHUNK_SIZE = 10;

export class ObservableQueryStakingInfo {
  protected readonly chainId: string;
  protected readonly chainGetter: ChainGetter;
  protected readonly sharedContext: QuerySharedContext;
  protected starknetHexAddress: string;

  @observable.shallow
  protected queryValidators: ObservableQueryValidators;

  @observable.ref
  protected batchQueries: ObservableJsonRpcBatchQuery<string[]>[] = [];

  constructor(
    sharedContext: QuerySharedContext,
    chainId: string,
    chainGetter: ChainGetter,
    starknetHexAddress: string,
    queryValidators: ObservableQueryValidators
  ) {
    this.sharedContext = sharedContext;
    this.chainId = chainId;
    this.chainGetter = chainGetter;
    this.starknetHexAddress = starknetHexAddress;
    this.queryValidators = queryValidators;

    makeObservable(this);

    // When validator pool addresses change, rebuild batch queries
    reaction(
      () => {
        if (this.chainId === "starknet:SN_SEPOLIA") {
          return "";
        }
        return this.queryValidators.validators
          .filter((v) => v.pool_address)
          .map((v) => v.pool_address!)
          .join(",");
      },
      (poolAddressesKey) => {
        if (poolAddressesKey) {
          this.buildBatchQueries();
        }
      },
      { fireImmediately: true }
    );
  }

  protected buildBatchQueries(): void {
    if (this.chainId === "starknet:SN_SEPOLIA") {
      return;
    }

    const rpcUrl = this.getRpcUrl();
    if (!rpcUrl) {
      return;
    }

    const validators = this.queryValidators.validators;
    const poolAddresses = validators
      .filter((v) => v.pool_address)
      .map((v) => v.pool_address!);

    if (poolAddresses.length === 0) {
      return;
    }

    const entryPointSelector = selector.getSelectorFromName(
      "pool_member_info_v1"
    );
    const chunks = chunkArray(poolAddresses, BATCH_CHUNK_SIZE);

    runInAction(() => {
      this.batchQueries = chunks.map((chunk) => {
        const requests: JsonRpcBatchRequest[] = chunk.map((poolAddr) => ({
          method: "starknet_call",
          params: {
            block_id: "latest",
            request: {
              contract_address: poolAddr,
              calldata: [this.starknetHexAddress],
              entry_point_selector: entryPointSelector,
            },
          },
          id: poolAddr,
        }));

        return new ObservableJsonRpcBatchQuery<string[]>(
          this.sharedContext,
          rpcUrl,
          "",
          requests
        );
      });
    });
  }

  protected getPoolData(poolAddress: string): string[] | undefined {
    for (const batchQuery of this.batchQueries) {
      if (!batchQuery.response?.data) {
        continue;
      }
      const data = batchQuery.response.data[poolAddress];
      if (data) {
        return data;
      }
    }
    return undefined;
  }

  protected getRpcUrl(): string {
    const modularChainInfo = this.chainGetter.getModularChain(this.chainId);
    if ("starknet" in modularChainInfo) {
      return modularChainInfo.starknet.rpc;
    }
    return "";
  }

  // only use for refreshing staking info
  async waitFreshResponse(): Promise<
    Readonly<QueryResponse<void>> | undefined
  > {
    const response = await this.queryValidators.waitFreshResponse();
    if (response) {
      // reaction has already rebuilt batchQueries by this point
      await Promise.all(this.batchQueries.map((q) => q.waitFreshResponse()));
    }

    return undefined;
  }

  get isFetching(): boolean {
    if (this.queryValidators.isFetching) {
      return true;
    }

    return this.batchQueries.some((q) => q.isFetching);
  }

  get error(): QueryError<any> | undefined {
    if (this.queryValidators.error) {
      return this.queryValidators.error;
    }

    return undefined; // ignore error from batch queries (partial failure OK)
  }

  @computed
  get totalStakedAmount(): CoinPretty | undefined {
    const stakingCurrency = this.stakingCurrency;
    if (!stakingCurrency) {
      return;
    }

    let totalStakedAmount = new CoinPretty(stakingCurrency, new Int(0));

    const validators = this.queryValidators.validators;

    for (const validator of validators) {
      if (!validator.pool_address) {
        continue;
      }

      const data = this.getPoolData(validator.pool_address);
      if (!data || data.length < MIN_REQUIRED_LENGTH) {
        continue;
      }

      const stakedBalance = new CairoUint256({
        low: data[1],
        high: 0,
      });

      totalStakedAmount = totalStakedAmount.add(
        new CoinPretty(stakingCurrency, new Int(stakedBalance.toBigInt()))
      );
    }

    return totalStakedAmount;
  }

  @computed
  get totalClaimableRewardAmount(): CoinPretty | undefined {
    const stakingCurrency = this.stakingCurrency;
    if (!stakingCurrency) {
      return;
    }

    let amount = new CoinPretty(stakingCurrency, new Int(0));

    const validators = this.queryValidators.validators;

    for (const validator of validators) {
      if (!validator.pool_address) {
        continue;
      }

      const data = this.getPoolData(validator.pool_address);
      if (!data || data.length < MIN_REQUIRED_LENGTH) {
        continue;
      }

      const unclaimedRewards = new CairoUint256({
        low: data[2],
        high: 0,
      });

      amount = amount.add(
        new CoinPretty(stakingCurrency, new Int(unclaimedRewards.toBigInt()))
      );
    }

    return amount;
  }

  @computed
  get claimableRewards():
    | {
        claimableRewards: ClaimableReward[];
        totalClaimableRewardAmount: CoinPretty;
      }
    | undefined {
    const stakingCurrency = this.stakingCurrency;
    if (!stakingCurrency) {
      return;
    }

    const claimableRewards = [];
    let amount = new CoinPretty(stakingCurrency, new Int(0));

    const validators = this.queryValidators.validators;
    if (validators.length === 0) {
      return;
    }

    for (const validator of validators) {
      if (!validator.pool_address) {
        continue;
      }

      const data = this.getPoolData(validator.pool_address);
      if (!data || data.length < MIN_REQUIRED_LENGTH) {
        continue;
      }

      const unclaimedRewards = new CairoUint256({
        low: data[2],
        high: 0,
      });

      const rewardAmount = new CoinPretty(
        stakingCurrency,
        new Int(unclaimedRewards.toBigInt())
      );

      if (rewardAmount.toDec().gt(new Dec(0))) {
        claimableRewards.push({
          validatorAddress: validator.operational_address,
          poolAddress: validator.pool_address,
          rewardAddress: validator.reward_address,
          amount: rewardAmount,
        });

        amount = amount.add(rewardAmount);
      }
    }

    return {
      claimableRewards,
      totalClaimableRewardAmount: amount,
    };
  }

  @computed
  get unbondings():
    | {
        unbondings: UnpoolDelegation[];
        totalUnbondingAmount: CoinPretty;
      }
    | undefined {
    const stakingCurrency = this.stakingCurrency;
    if (!stakingCurrency) {
      return;
    }

    const unbondings = [];
    let amount = new CoinPretty(stakingCurrency, new Int(0));

    const validators = this.queryValidators.validators;
    if (validators.length === 0) {
      return;
    }

    for (const validator of validators) {
      if (!validator.pool_address) {
        continue;
      }

      const data = this.getPoolData(validator.pool_address);
      if (!data || data.length < MIN_REQUIRED_LENGTH) {
        continue;
      }

      const hasUnpoolTime = data[5] !== "0x0";
      const unpoolTime = hasUnpoolTime ? parseInt(data[6], 16) : undefined;

      const unpoolAmountValue = new CairoUint256({
        low: data[4],
        high: 0,
      });

      const unpoolAmount = new CoinPretty(
        stakingCurrency,
        new Int(unpoolAmountValue.toBigInt())
      );

      if (
        !unpoolTime ||
        unpoolAmount.toDec().lte(new Dec(0)) ||
        unpoolTime < Date.now() / 1000
      ) {
        continue;
      }

      unbondings.push({
        validatorAddress: validator.operational_address,
        poolAddress: validator.pool_address,
        rewardAddress: validator.reward_address,
        amount: unpoolAmount,
        completeTime: unpoolTime,
      });

      amount = amount.add(unpoolAmount);
    }

    return {
      unbondings,
      totalUnbondingAmount: amount,
    };
  }

  readonly getDescendingPendingClaimableRewards = computedFn(
    (maxValiadtors: number): ClaimableReward[] => {
      const rewards = this.claimableRewards;
      if (!rewards) {
        return [];
      }

      const sortedRewards = rewards.claimableRewards.slice();
      sortedRewards.sort((reward1, reward2) => {
        return reward2.amount.toDec().gt(reward1.amount.toDec()) ? 1 : -1;
      });

      return sortedRewards.slice(0, maxValiadtors);
    }
  );

  private get stakingCurrency(): ERC20Currency | undefined {
    const modularChainInfo = this.chainGetter.getModularChain(this.chainId);
    if (!("starknet" in modularChainInfo)) {
      return;
    }

    return modularChainInfo.starknet.currencies.find(
      (c) =>
        c.coinMinimalDenom ===
        `erc20:${modularChainInfo.starknet.strkContractAddress}`
    );
  }
}

export class StakingInfoManager {
  @observable.shallow
  protected stakingInfoByStarknetHexAddress: Map<
    string,
    ObservableQueryStakingInfo
  > = new Map();

  @observable.shallow
  protected queryValidators: ObservableQueryValidators;

  protected sharedContext: QuerySharedContext;
  protected chainId: string;
  protected chainGetter: ChainGetter;

  constructor(
    sharedContext: QuerySharedContext,
    chainId: string,
    chainGetter: ChainGetter,
    queryValidators: ObservableQueryValidators
  ) {
    makeObservable(this);

    this.sharedContext = sharedContext;
    this.chainId = chainId;
    this.chainGetter = chainGetter;
    this.queryValidators = queryValidators;
  }

  getStakingInfo = computedFn((starknetHexAddress: string) => {
    if (!this.stakingInfoByStarknetHexAddress.has(starknetHexAddress)) {
      runInAction(() => {
        const stakingInfo = new ObservableQueryStakingInfo(
          this.sharedContext,
          this.chainId,
          this.chainGetter,
          starknetHexAddress,
          this.queryValidators
        );

        this.stakingInfoByStarknetHexAddress.set(
          starknetHexAddress,
          stakingInfo
        );
      });
    }
    return this.stakingInfoByStarknetHexAddress.get(starknetHexAddress)!;
  });
}

function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}
