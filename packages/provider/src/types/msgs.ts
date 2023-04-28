import { Message } from "@keplr-wallet/router";
import { ChainInfo, ChainInfoWithoutEndpoints } from "@keplr-wallet/types";

export class SuggestChainInfoMsg extends Message<void> {
  public static type() {
    return "suggest-chain-info";
  }

  constructor(public readonly chainInfo: ChainInfo) {
    super();
  }

  validateBasic(): void {
    if (!this.chainInfo) {
      throw new Error("chain info not set");
    }
  }

  route(): string {
    return "chains";
  }

  type(): string {
    return SuggestChainInfoMsg.type();
  }
}

export class SuggestTokenMsg extends Message<void> {
  public static type() {
    return "suggest-token";
  }

  constructor(
    public readonly chainId: string,
    public readonly contractAddress: string,
    public readonly viewingKey?: string
  ) {
    super();
  }

  validateBasic(): void {
    if (!this.chainId) {
      throw new Error("Chain id is empty");
    }

    if (!this.contractAddress) {
      throw new Error("Contract address is empty");
    }
  }

  route(): string {
    return "tokens";
  }

  type(): string {
    return SuggestTokenMsg.type();
  }
}

export class GetSecret20ViewingKey extends Message<string> {
  public static type() {
    return "get-secret20-viewing-key";
  }

  constructor(
    public readonly chainId: string,
    public readonly contractAddress: string
  ) {
    super();
  }

  validateBasic(): void {
    if (!this.chainId) {
      throw new Error("Chain id is empty");
    }

    if (!this.contractAddress) {
      throw new Error("Contract address is empty");
    }
  }

  route(): string {
    return "tokens";
  }

  type(): string {
    return GetSecret20ViewingKey.type();
  }
}

export class RequestICNSAdr36SignaturesMsg extends Message<
  {
    chainId: string;
    bech32Prefix: string;
    bech32Address: string;
    addressHash: "cosmos" | "ethereum";
    pubKey: Uint8Array;
    signatureSalt: number;
    signature: Uint8Array;
  }[]
> {
  public static type() {
    return "request-icns-adr-36-signatures";
  }

  constructor(
    readonly chainId: string,
    readonly contractAddress: string,
    readonly owner: string,
    readonly username: string,
    readonly addressChainIds: string[]
  ) {
    super();
  }

  validateBasic(): void {
    if (!this.chainId) {
      throw new Error("chain id not set");
    }

    if (!this.contractAddress) {
      throw new Error("contract address not set");
    }

    if (!this.owner) {
      throw new Error("signer not set");
    }

    // Validate bech32 address.
    // Bech32Address.validate(this.signer);

    if (!this.username) {
      throw new Error("username not set");
    }

    if (!this.addressChainIds || this.addressChainIds.length === 0) {
      throw new Error("address chain ids not set");
    }
  }

  override approveExternal(): boolean {
    return true;
  }

  route(): string {
    return "keyring";
  }

  type(): string {
    return RequestICNSAdr36SignaturesMsg.type();
  }
}

export class GetPubkeyMsg extends Message<Uint8Array> {
  public static type() {
    return "get-pubkey-msg";
  }

  constructor(public readonly chainId: string) {
    super();
  }

  validateBasic(): void {
    if (!this.chainId) {
      throw new Error("chain id not set");
    }
  }

  route(): string {
    return "secret-wasm";
  }

  type(): string {
    return GetPubkeyMsg.type();
  }
}

export class ReqeustEncryptMsg extends Message<Uint8Array> {
  public static type() {
    return "request-encrypt-msg";
  }

  constructor(
    public readonly chainId: string,
    public readonly contractCodeHash: string,
    // eslint-disable-next-line @typescript-eslint/ban-types
    public readonly msg: object
  ) {
    super();
  }

  validateBasic(): void {
    if (!this.chainId) {
      throw new Error("chain id not set");
    }

    if (!this.contractCodeHash) {
      throw new Error("contract code hash not set");
    }

    if (!this.msg) {
      throw new Error("msg not set");
    }
  }

  route(): string {
    return "secret-wasm";
  }

  type(): string {
    return ReqeustEncryptMsg.type();
  }
}

export class RequestDecryptMsg extends Message<Uint8Array> {
  public static type() {
    return "request-decrypt-msg";
  }

  constructor(
    public readonly chainId: string,
    public readonly cipherText: Uint8Array,
    public readonly nonce: Uint8Array
  ) {
    super();
  }

  validateBasic(): void {
    if (!this.chainId) {
      throw new Error("chain id not set");
    }

    if (!this.cipherText || this.cipherText.length === 0) {
      throw new Error("ciphertext not set");
    }

    if (!this.nonce || this.nonce.length === 0) {
      throw new Error("nonce not set");
    }
  }

  route(): string {
    return "secret-wasm";
  }

  type(): string {
    return RequestDecryptMsg.type();
  }
}

export class GetTxEncryptionKeyMsg extends Message<Uint8Array> {
  public static type() {
    return "get-tx-encryption-key-msg";
  }

  constructor(
    public readonly chainId: string,
    public readonly nonce: Uint8Array
  ) {
    super();
  }

  validateBasic(): void {
    if (!this.chainId) {
      throw new Error("chain id not set");
    }

    if (!this.nonce) {
      // Nonce of zero length is permitted.
      throw new Error("nonce is null");
    }
  }

  route(): string {
    return "secret-wasm";
  }

  type(): string {
    return GetTxEncryptionKeyMsg.type();
  }
}

export class GetChainInfosWithoutEndpointsMsg extends Message<{
  chainInfos: ChainInfoWithoutEndpoints[];
}> {
  public static type() {
    return "get-chain-infos-without-endpoints";
  }

  validateBasic(): void {
    // noop
  }

  route(): string {
    return "chains";
  }

  type(): string {
    return GetChainInfosWithoutEndpointsMsg.type();
  }
}

export class GetAnalyticsIdMsg extends Message<string> {
  public static type() {
    return "get-analytics-id";
  }

  constructor() {
    super();
  }

  validateBasic(): void {
    // noop
  }

  override approveExternal(): boolean {
    return true;
  }

  route(): string {
    return "analytics";
  }

  type(): string {
    return GetAnalyticsIdMsg.type();
  }
}

export class ChangeKeyRingNameMsg extends Message<string> {
  public static type() {
    return "change-keyring-name-msg";
  }

  constructor(
    public readonly defaultName: string,
    public readonly editable: boolean
  ) {
    super();
  }

  validateBasic(): void {
    // Not allow empty name.
    if (!this.defaultName) {
      throw new Error("default name not set");
    }
  }

  route(): string {
    return "keyring";
  }

  type(): string {
    return ChangeKeyRingNameMsg.type();
  }
}
