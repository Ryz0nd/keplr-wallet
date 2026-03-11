import { ObservableQuery, QueryOptions } from "./query";
import { QuerySharedContext } from "./context";
import { simpleFetch } from "@keplr-wallet/simple-fetch";
import { JsonRpcResponse } from "@keplr-wallet/types";
import { Hash } from "@keplr-wallet/crypto";
import { Buffer } from "buffer/";

export interface JsonRpcBatchRequest {
  method: string;
  params: unknown;
  id: string;
}

/**
 * Observable query for batched JSON-RPC requests.
 * Manages an array of `JsonRpcBatchRequest` and returns a map of results keyed by request ID.
 */
export class ObservableJsonRpcBatchQuery<T = unknown> extends ObservableQuery<
  Record<string, T>
> {
  constructor(
    sharedContext: QuerySharedContext,
    baseURL: string,
    url: string,
    protected readonly requests: JsonRpcBatchRequest[],
    options: Partial<QueryOptions> = {}
  ) {
    super(sharedContext, baseURL, url, options);
  }

  protected override getCacheKey(): string {
    const requestsHash = Buffer.from(
      Hash.sha256(
        Buffer.from(
          JSON.stringify(this.requests, (_, value) => {
            if (typeof value === "bigint") {
              return value.toString();
            }
            return value;
          })
        )
      ).slice(0, 8)
    ).toString("hex");

    return `${super.getCacheKey()}-${requestsHash}`;
  }

  protected override async fetchResponse(
    abortController: AbortController
  ): Promise<{ headers: any; data: Record<string, T> }> {
    const batchBody = this.requests.map((req) => ({
      jsonrpc: "2.0",
      method: req.method,
      params: req.params,
      id: req.id,
    }));

    const response = await simpleFetch<JsonRpcResponse<T>[]>(
      this.baseURL,
      this.url,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(batchBody, (_, value) => {
          if (typeof value === "bigint") {
            return value.toString();
          }
          return value;
        }),
        signal: abortController.signal,
      }
    );

    if (!response.data || !Array.isArray(response.data)) {
      throw new Error("Invalid batch response");
    }

    const data: Record<string, T> = {};

    for (const res of response.data) {
      if (res.error) {
        continue;
      }

      data[String(res.id)] = res.result as T;
    }

    return {
      headers: response.headers,
      data,
    };
  }
}
