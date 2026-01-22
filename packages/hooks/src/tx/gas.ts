import { IGasConfig, UIProperties } from "./types";
import { TxChainSetter } from "./chain";
import { ChainGetter } from "@keplr-wallet/stores";
import { action, computed, makeObservable, observable } from "mobx";
import { useState } from "react";

export class GasConfig extends TxChainSetter implements IGasConfig {
  /*
   This field is used to handle the value from the input more flexibly.
   We use string because there is no guarantee that only number is input in input component.
   */
  @observable
  protected _value: string = "";

  /*
   There are services that sometimes use invalid tx to sign arbitrary data on the sign page.
   In this case, there is no obligation to deal with it, but 0 gas is favorably allowed. This option is used for this case.
   */
  @observable
  protected _allowZeroGas?: boolean = undefined;

  constructor(
    chainGetter: ChainGetter,
    initialChainId: string,
    initialGas?: number,
    allowZeroGas?: boolean
  ) {
    super(chainGetter, initialChainId);

    if (initialGas) {
      this._value = initialGas.toString();
    }
    this._allowZeroGas = allowZeroGas;

    makeObservable(this);
  }

  get value(): string {
    return this._value;
  }

  @action
  setValue(value: string | number): void {
    if (typeof value === "number") {
      this._value = Math.ceil(value).toString();
    } else {
      this._value = value;
    }
  }

  get gas(): number {
    if (this.value.trim() === "") {
      return 0;
    }

    const num = Number.parseInt(this.value);
    if (Number.isNaN(num)) {
      return 0;
    }

    return num;
  }

  @computed
  get uiProperties(): UIProperties {
    if (this.value.trim() === "") {
      return {
        error: new Error("Please enter a gas amount"),
      };
    }

    const parsed = Number.parseFloat(this.value);
    if (Number.isNaN(parsed)) {
      return {
        error: new Error("Enter a valid number for gas"),
      };
    }

    if (this.value.includes(".") || !Number.isInteger(parsed)) {
      return {
        error: new Error("Gas must be a whole number"),
      };
    }

    if (!this._allowZeroGas) {
      if (this.gas <= 0) {
        return {
          error: new Error("Gas must be greater than 0"),
        };
      }
    } else {
      if (this.gas < 0) {
        return {
          error: new Error("Enter a positive number for gas"),
        };
      }
    }

    return {};
  }
}

export const useGasConfig = (
  chainGetter: ChainGetter,
  chainId: string,
  initialGas?: number
) => {
  const [txConfig] = useState(
    () => new GasConfig(chainGetter, chainId, initialGas)
  );
  txConfig.setChain(chainId);

  return txConfig;
};

/*
 There are services that sometimes use invalid tx to sign arbitrary data on the sign page.
 In this case, there is no obligation to deal with it, but 0 gas is favorably allowed. This option is used for this case.
 */
export const useZeroAllowedGasConfig = (
  chainGetter: ChainGetter,
  chainId: string,
  initialGas?: number
) => {
  const [txConfig] = useState(
    () => new GasConfig(chainGetter, chainId, initialGas, true)
  );
  txConfig.setChain(chainId);

  return txConfig;
};
