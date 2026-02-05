import { observer } from "mobx-react-lite";
import React, { FunctionComponent, useEffect, useMemo, useState } from "react";
import { BackButton } from "../../../layouts/header/components";
import { HeaderLayout } from "../../../layouts/header";
import styled from "styled-components";
import { Stack } from "../../../components/stack";
import { SearchTextInput } from "../../../components/input";
import { useStore } from "../../../stores";
import { TokenItem } from "../../main/components";
import { CoinPretty, Dec } from "@keplr-wallet/unit";
import { useFocusOnMount } from "../../../hooks/use-focus-on-mount";
import { useSearchParams } from "react-router-dom";
import { useNavigate } from "react-router";
import { useIntl } from "react-intl";
import { ViewToken } from "../../main";
import {
  action,
  autorun,
  computed,
  IReactionDisposer,
  makeObservable,
  observable,
  runInAction,
} from "mobx";
import {
  ObservableQuerySwapHelper,
  ObservableQueryTargetAssets,
} from "@keplr-wallet/stores-internal";
import { Currency } from "@keplr-wallet/types";
import { IChainInfoImpl } from "@keplr-wallet/stores";
import { FixedSizeList } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { DenomHelper } from "@keplr-wallet/common";
import { SwapNotAvailableModal } from "../components/swap-not-available-modal";
import { MsgItemSkeleton } from "../../main/token-detail/msg-items/skeleton";
import { ChainIdHelper } from "@keplr-wallet/cosmos";
import { ChainStore } from "../../../stores/chain";
import { HugeQueriesStore } from "../../../stores/huge-queries";

class IBCSwapDestinationState {
  @observable.ref sourceChainId: string | undefined = undefined;
  @observable.ref sourceDenom: string | undefined = undefined;
  @observable.ref search: string = "";
  @observable.ref currentPage = 1;
  @observable.ref hasNextPage = false;
  @observable.ref isFetching = false;
  @observable.shallow appendedPages: Set<number> = new Set();
  @observable.shallow targetEntriesInternal: {
    currency: Currency;
    chainInfo: IChainInfoImpl;
  }[] = [];
  protected disposer: IReactionDisposer | undefined;

  constructor(
    protected readonly hugeQueriesStore: HugeQueriesStore,
    protected readonly swapHelper: ObservableQuerySwapHelper,
    protected readonly chainStore: ChainStore,
    protected readonly targetAssets: ObservableQueryTargetAssets
  ) {
    makeObservable(this);

    this.disposer = autorun(() => {
      const query = this.currentQuery;
      if (!query) {
        return;
      }

      if (query.error && !query.isFetching) {
        runInAction(() => {
          this.isFetching = false;
        });
        return;
      }

      if (!query.response) {
        return;
      }

      const page = query.response.data.pagination.page;
      const totalPages = query.response.data.pagination.total_pages;

      if (this.appendedPages.has(page)) {
        return;
      }

      runInAction(() => {
        // 기존 엔트리 키 셋 생성
        const existingKeys = new Set(
          this.targetEntriesInternal.map(
            (e) =>
              `${ChainIdHelper.parse(e.chainInfo.chainId).identifier}/${
                e.currency.coinMinimalDenom
              }`
          )
        );

        for (const [, value] of query.currenciesMap) {
          for (const currency of value.currencies) {
            const denomHelper = new DenomHelper(currency.coinMinimalDenom);
            if (denomHelper.type === "lp") {
              continue;
            }

            // 중복 검사
            const key = `${
              ChainIdHelper.parse(value.chainInfo.chainId).identifier
            }/${currency.coinMinimalDenom}`;
            if (existingKeys.has(key)) {
              continue;
            }
            existingKeys.add(key);

            this.targetEntriesInternal.push({
              currency,
              chainInfo: value.chainInfo,
            });
          }
        }
        this.appendedPages.add(page);
        this.hasNextPage = page < totalPages;
        this.isFetching = false;
      });
    });
  }

  @action
  setSource(chainId: string | undefined, denom: string | undefined) {
    this.sourceChainId = chainId || undefined;
    this.sourceDenom = denom || undefined;
    this.currentPage = 1;
    this.hasNextPage = !!(chainId && denom);
    this.appendedPages = new Set();
    this.targetEntriesInternal = [];
    this.isFetching = !!(chainId && denom);
  }

  @action
  setSearch(search: string) {
    if (this.search === search) {
      return;
    }

    this.search = search;
    this.currentPage = 1;
    this.hasNextPage = !!(this.sourceChainId && this.sourceDenom);
    this.appendedPages = new Set();
    this.targetEntriesInternal = [];
    this.isFetching = !!(this.sourceChainId && this.sourceDenom);
  }

  @action
  requestNextPage() {
    if (!this.sourceChainId || !this.sourceDenom) {
      return;
    }

    if (!this.hasNextPage) {
      return;
    }

    if (this.isFetching) {
      return;
    }

    this.currentPage = this.currentPage + 1;
    this.isFetching = true;
  }

  @computed
  get currentQuery() {
    if (!this.sourceChainId || !this.sourceDenom) {
      return undefined;
    }

    return this.targetAssets.getObservableQueryTargetAssets(
      this.sourceChainId,
      this.sourceDenom,
      this.currentPage,
      100,
      this.search.trim()
    );
  }

  @computed
  get pagination() {
    const query = this.currentQuery;
    if (query && query.response) {
      return query.response.data.pagination;
    }
    return undefined;
  }

  @computed
  get targetEntries(): { currency: Currency; chainInfo: IChainInfoImpl }[] {
    return this.targetEntriesInternal;
  }

  @computed
  get isFetchingItems(): boolean {
    const q = this.currentQuery;
    return this.isFetching || q?.isFetching === true;
  }

  @computed
  get ownedTokens(): ViewToken[] {
    if (!this.sourceChainId || !this.sourceDenom) {
      return [];
    }

    const sourceChainId = this.sourceChainId;
    const sourceDenom = this.sourceDenom;

    return this.hugeQueriesStore
      .getAllBalances({
        allowIBCToken: false,
        enableFilterDisabledAssetToken: false,
      })
      .filter((token) => {
        if (!("currencies" in token.chainInfo)) {
          return false;
        }
        if (token.token.toDec().lte(new Dec(0))) {
          return false;
        }

        return this.swapHelper.isSwapDestinationOrAlternatives(
          sourceChainId,
          sourceDenom,
          token.chainInfo.chainId,
          token.token.currency.coinMinimalDenom
        );
      });
  }

  @computed
  get ownedTokensMap(): Map<string, ViewToken> {
    const map = new Map<string, ViewToken>();
    for (const token of this.ownedTokens) {
      const key = `${ChainIdHelper.parse(token.chainInfo.chainId).identifier}/${
        token.token.currency.coinMinimalDenom
      }`;
      map.set(key, token);
    }
    return map;
  }

  @computed
  get remainingCombined(): { currency: Currency; chainInfo: IChainInfoImpl }[] {
    if (!this.sourceChainId || !this.sourceDenom) {
      return [];
    }

    const ownedKeys = new Set(
      this.ownedTokens.map(
        (t) =>
          `${ChainIdHelper.parse(t.chainInfo.chainId).identifier}/${
            t.token.currency.coinMinimalDenom
          }`
      )
    );

    // targetEntries는 페이지 순서대로 누적된 결과이며, 보유 중인 자산 키를 제외하고 그대로 뒤에 이어 붙인다.
    const remaining = this.targetEntries.filter((entry) => {
      const key = `${ChainIdHelper.parse(entry.chainInfo.chainId).identifier}/${
        entry.currency.coinMinimalDenom
      }`;
      return !ownedKeys.has(key);
    });

    return remaining;
  }

  @computed
  get tokens(): {
    tokens: ReadonlyArray<ViewToken>;
    remaining: {
      currency: Currency;
      chainInfo: IChainInfoImpl;
    }[];
    isFetchingItems: boolean;
  } {
    return {
      tokens: this.ownedTokens,
      remaining: this.remainingCombined,
      isFetchingItems: this.isFetchingItems,
    };
  }
}

const Styles = {
  Container: styled(Stack)`
    height: 100%;
    padding: 0.75rem;
  `,
};

// /send/select-asset와 기본 로직은 거의 유사한데...
// 뷰 쪽이 생각보다 이질적이라서 그냥 분리 시킴...
// /send/select-asset 페이지와 세트로 관리하셈
export const IBCSwapDestinationSelectAssetPage: FunctionComponent = observer(
  () => {
    const { hugeQueriesStore, chainStore, swapQueriesStore } = useStore();
    const navigate = useNavigate();
    const intl = useIntl();
    const [searchParams] = useSearchParams();

    /*
    navigate(
      `/send/select-asset?isIBCTransfer=true&navigateTo=${encodeURIComponent(
        "/ibc-transfer?chainId={chainId}&coinMinimalDenom={coinMinimalDenom}"
      )}`
    );
    같은 형태로 써야함...
   */
    const paramNavigateTo = searchParams.get("navigateTo");
    const paramNavigateReplace = searchParams.get("navigateReplace");
    // {chain_identifier}/{coinMinimalDenom}
    const excludeKey = searchParams.get("excludeKey");
    const inChainId = searchParams.get("inChainId") ?? undefined;
    const inDenom = searchParams.get("inDenom") ?? undefined;

    const [search, setSearch] = useState("");

    const searchRef = useFocusOnMount<HTMLInputElement>();

    const [state] = useState(
      () =>
        new IBCSwapDestinationState(
          hugeQueriesStore,
          swapQueriesStore.querySwapHelper,
          chainStore,
          swapQueriesStore.queryTargetAssets
        )
    );

    useEffect(() => {
      state.setSource(inChainId, inDenom);
    }, [inChainId, inDenom, state]);

    useEffect(() => {
      const handle = setTimeout(() => {
        state.setSearch(search);
      }, 300);
      return () => clearTimeout(handle);
    }, [search, state]);

    const { tokens, remaining, isFetchingItems } = state.tokens;

    const filteredTokens = useMemo(() => {
      const filtered = tokens.filter((token) => {
        if (!("currencies" in token.chainInfo)) {
          return false;
        }

        const denomHelper = new DenomHelper(
          token.token.currency.coinMinimalDenom
        );
        if (denomHelper.type === "lp") {
          return false;
        }

        return (
          !excludeKey ||
          `${token.chainInfo.chainIdentifier}/${token.token.currency.coinMinimalDenom}` !==
            excludeKey
        );
      });

      return filtered;
    }, [excludeKey, tokens]);

    const filteredRemaining = useMemo(() => {
      const filtered = remaining.filter((r) => {
        const denomHelper = new DenomHelper(r.currency.coinMinimalDenom);
        if (denomHelper.type === "lp") {
          return false;
        }

        return (
          !excludeKey ||
          `${r.chainInfo.chainIdentifier}/${r.currency.coinMinimalDenom}` !==
            excludeKey
        );
      });

      return filtered;
    }, [excludeKey, remaining]);

    // 검색어가 있을 때는 서버 순서 그대로, 없을 때는 보유 자산 우선
    // state.search 기준으로 해야 targetEntries와 동기화됨 (300ms 디바운스)
    const hasSearch = state.search.trim().length > 0;

    // useMemo 밖에서 targetEntries 접근해야 mobx가 추적함
    const targetEntries = state.targetEntries;

    // 검색어가 있을 때 사용할 targetEntries (서버 순서 유지)
    // useMemo 제거: mobx 배열은 내용 변경 시 참조가 유지되어 의존성 감지 안 됨
    const filteredTargetEntries = hasSearch
      ? targetEntries.filter((entry) => {
          const denomHelper = new DenomHelper(entry.currency.coinMinimalDenom);
          if (denomHelper.type === "lp") {
            return false;
          }

          return (
            !excludeKey ||
            `${ChainIdHelper.parse(entry.chainInfo.chainId).identifier}/${
              entry.currency.coinMinimalDenom
            }` !== excludeKey
          );
        })
      : [];

    const [selectedCoinMinimalDenom, setSelectedCoinMinimalDenom] =
      useState<string>();
    const [unsupportedCoinMinimalDenoms, setUnsupportedCoinMinimalDenoms] =
      useState<Set<string>>(new Set());
    const [isSwapNotAvailableModalOpen, setIsSwapNotAvailableModalOpen] =
      useState(false);

    return (
      <HeaderLayout
        title={intl.formatMessage({ id: "page.send.select-asset.title" })}
        left={<BackButton />}
        contentContainerStyle={{ height: "100vh" }}
      >
        <Styles.Container gutter="0.5rem">
          <SearchTextInput
            ref={searchRef}
            placeholder={intl.formatMessage({
              id: "page.send.select-asset.search-placeholder",
            })}
            value={search}
            onChange={(e) => {
              e.preventDefault();

              setSearch(e.target.value);
            }}
          />
          <AutoSizer>
            {({ height, width }: { height: number; width: number }) => (
              <FixedSizeList
                itemData={{
                  hasSearch,
                  filteredTokens,
                  filteredRemaining,
                  filteredTargetEntries,
                  ownedTokensMap: state.ownedTokensMap,
                  selectedCoinMinimalDenom,
                  unsupportedCoinMinimalDenoms,
                  isFetchingItems,
                  onClick: async (viewToken) => {
                    let timer: NodeJS.Timeout | undefined;
                    let disposal: IReactionDisposer | undefined;
                    await Promise.race([
                      new Promise((resolve) => {
                        timer = setTimeout(resolve, 3000);
                      }),
                      new Promise((resolve) => {
                        // findCurrency가 동기적이기 때문에 currency를 찾는 동안에도 undefined를 리턴한다.
                        // findCurrencyAsync를 쓰면 되지만 현재 의도대로 동작하지 않는다.
                        // 따라서 findCurrency를 쓰되 정해진 timeout 동안에도 찾지 못하면 찾지 못했다고 판단하도록 한다.
                        disposal = autorun(() => {
                          const currency = chainStore
                            .getChain(viewToken.chainInfo.chainId)
                            .findCurrency(
                              viewToken.token.currency.coinMinimalDenom
                            );
                          setSelectedCoinMinimalDenom(
                            `${
                              ChainIdHelper.parse(viewToken.chainInfo.chainId)
                                .identifier
                            }/${viewToken.token.currency.coinMinimalDenom}`
                          );
                          if (currency) {
                            if (paramNavigateTo) {
                              navigate(
                                paramNavigateTo
                                  .replace(
                                    "{chainId}",
                                    viewToken.chainInfo.chainId
                                  )
                                  .replace(
                                    "{coinMinimalDenom}",
                                    viewToken.token.currency.coinMinimalDenom
                                  ),
                                {
                                  replace: paramNavigateReplace === "true",
                                }
                              );
                            } else {
                              console.error("Empty navigateTo param");
                            }
                            resolve(null);
                          }
                        });
                      }),
                    ]);

                    setSelectedCoinMinimalDenom(undefined);
                    const newUnsupportedCoinMinimalDenoms = new Set(
                      unsupportedCoinMinimalDenoms
                    );
                    newUnsupportedCoinMinimalDenoms.add(
                      `${
                        ChainIdHelper.parse(viewToken.chainInfo.chainId)
                          .identifier
                      }/${viewToken.token.currency.coinMinimalDenom}`
                    );
                    setUnsupportedCoinMinimalDenoms(
                      newUnsupportedCoinMinimalDenoms
                    );
                    setIsSwapNotAvailableModalOpen(true);

                    if (timer) {
                      clearTimeout(timer);
                    }
                    if (disposal) {
                      disposal();
                    }
                  },
                }}
                width={width}
                height={height}
                itemCount={
                  (hasSearch
                    ? filteredTargetEntries.length
                    : filteredTokens.length + filteredRemaining.length) +
                  (isFetchingItems ? 1 : 0)
                }
                itemSize={66}
                onItemsRendered={({ visibleStartIndex, visibleStopIndex }) => {
                  if (isFetchingItems || !state.hasNextPage) {
                    return;
                  }

                  const visibleCount = visibleStopIndex - visibleStartIndex + 1;
                  const threshold = Math.max(5, Math.ceil(visibleCount * 0.5));

                  const totalCount = hasSearch
                    ? filteredTargetEntries.length
                    : filteredTokens.length + filteredRemaining.length;

                  if (
                    totalCount > threshold &&
                    visibleStopIndex >= totalCount - threshold
                  ) {
                    state.requestNextPage();
                  }
                }}
              >
                {TokenListItem}
              </FixedSizeList>
            )}
          </AutoSizer>
        </Styles.Container>
        <SwapNotAvailableModal
          isOpen={isSwapNotAvailableModalOpen}
          close={() => setIsSwapNotAvailableModalOpen(false)}
        />
      </HeaderLayout>
    );
  }
);

const TOKEN_LIST_ITEM_GUTTER = 8;

const TokenListItem = ({
  data,
  index,
  style,
}: {
  data: {
    hasSearch: boolean;
    filteredTokens: ViewToken[];
    filteredRemaining: {
      currency: Currency;
      chainInfo: IChainInfoImpl;
    }[];
    filteredTargetEntries: {
      currency: Currency;
      chainInfo: IChainInfoImpl;
    }[];
    ownedTokensMap: Map<string, ViewToken>;
    selectedCoinMinimalDenom?: string;
    unsupportedCoinMinimalDenoms: Set<string>;
    isFetchingItems: boolean;
    onClick: (viewToken: ViewToken, index: number) => void;
  };
  index: number;
  style: any;
}) => {
  const total = data.hasSearch
    ? data.filteredTargetEntries.length
    : data.filteredTokens.length + data.filteredRemaining.length;
  const isLoader = data.isFetchingItems && index === total;

  if (isLoader) {
    return (
      <div
        style={{
          ...style,
          paddingTop: index === 0 ? 0 : TOKEN_LIST_ITEM_GUTTER,
          height:
            index === 0 ? style.height - TOKEN_LIST_ITEM_GUTTER : style.height,
          top: index === 0 ? style.top : style.top - TOKEN_LIST_ITEM_GUTTER,
        }}
      >
        {/* 로딩 시 리스트 끝에만 스켈레톤 한 칸을 추가하기 위한 분기 */}
        <MsgItemSkeleton />
      </div>
    );
  }

  let item: ViewToken | { currency: Currency; chainInfo: IChainInfoImpl };
  let isOwned: boolean;

  if (data.hasSearch) {
    // 검색어가 있을 때: 서버 순서 그대로, ownedTokensMap으로 보유 여부 확인
    const entry = data.filteredTargetEntries[index];
    const key = `${ChainIdHelper.parse(entry.chainInfo.chainId).identifier}/${
      entry.currency.coinMinimalDenom
    }`;
    const ownedToken = data.ownedTokensMap.get(key);

    if (ownedToken) {
      item = ownedToken;
      isOwned = true;
    } else {
      item = entry;
      isOwned = false;
    }
  } else {
    // 검색어가 없을 때: 보유 자산 먼저, 그 다음 나머지
    isOwned = index < data.filteredTokens.length;
    item = isOwned
      ? data.filteredTokens[index]
      : data.filteredRemaining[index - data.filteredTokens.length];
  }

  const isFindingCurrency =
    data.selectedCoinMinimalDenom ===
    `${ChainIdHelper.parse(item.chainInfo.chainId).identifier}/${
      "currency" in item
        ? item.currency.coinMinimalDenom
        : item.token.currency.coinMinimalDenom
    }`;

  const viewToken =
    "currency" in item
      ? {
          chainInfo: item.chainInfo,
          token: new CoinPretty(item.currency, new Dec(0)),
          isFetching: isFindingCurrency,
          error: undefined,
        }
      : item;

  // CHECK: swap v1처럼 상관없는 토큰 전체를 가져오는 것이 아니므로 굳이 따로 처리하지 않아도 될 것 같음
  const isUnsupportedToken = data.unsupportedCoinMinimalDenoms.has(
    `${ChainIdHelper.parse(item.chainInfo.chainId).identifier}/${
      "currency" in item
        ? item.currency.coinMinimalDenom
        : item.token.currency.coinMinimalDenom
    }`
  );

  return (
    <div
      style={{
        ...style,
        paddingTop: index === 0 ? 0 : TOKEN_LIST_ITEM_GUTTER,
        height:
          index === 0 ? style.height - TOKEN_LIST_ITEM_GUTTER : style.height,
        top: index === 0 ? style.top : style.top - TOKEN_LIST_ITEM_GUTTER,
        opacity: isUnsupportedToken ? 0.7 : 1,
      }}
    >
      <TokenItem
        viewToken={viewToken}
        hideBalance={!isOwned}
        onClick={() => !isUnsupportedToken && data.onClick(viewToken, index)}
        noTokenTag
        disabled={isUnsupportedToken}
      />
    </div>
  );
};
