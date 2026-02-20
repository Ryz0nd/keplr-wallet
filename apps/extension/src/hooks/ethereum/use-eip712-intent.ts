import { SignEthereumInteractionStore } from "@keplr-wallet/stores-core";
import { EIP712MessageValidator } from "@keplr-wallet/background";
import { EthereumAccountBase } from "@keplr-wallet/stores-eth";
import { useMemo } from "react";
import Joi from "joi";
import { Buffer } from "buffer/";
import { EthSignType } from "@keplr-wallet/types";

export type EIP712IntentResult = {
  intent: EIP712Intent;
  signingDataBuff: Buffer;
  signingDataText: string;
};

export interface EIP712Domain {
  name: string;
  version?: string;
  chainId: number;
  verifyingContract: string;
}

export interface ERC2612PermitIntent {
  kind: "erc2612.permit";
  owner: string;
  spender: string;
  amount: string;
  deadline: string;
  nonce: string;
  domain: EIP712Domain;
}

export interface DAIPermitIntent {
  kind: "dai.permit";
  holder: string;
  spender: string;
  nonce: string;
  expiry: string;
  allowed: boolean;
  domain: EIP712Domain;
}

export interface PermitDetails {
  token: string;
  amount: string;
  expiration: string;
  nonce: string;
}

export interface UniswapPermitSingleIntent {
  kind: "uniswap.permitSingle";
  details: PermitDetails;
  spender: string;
  sigDeadline: string;
  domain: EIP712Domain;
}

export interface ERC3009TransferWithAuthorizationIntent {
  kind: "erc3009.transferWithAuthorization";
  from: string;
  to: string;
  value: string;
  validAfter: string;
  validBefore: string;
  nonce: string;
  domain: EIP712Domain;
}

export interface ERC3009ReceiveWithAuthorizationIntent {
  kind: "erc3009.receiveWithAuthorization";
  from: string;
  to: string;
  value: string;
  validAfter: string;
  validBefore: string;
  nonce: string;
  domain: EIP712Domain;
}

export interface UnknownIntent {
  kind: "unknown";
}

export type EIP712Intent =
  | ERC2612PermitIntent
  | DAIPermitIntent
  | UniswapPermitSingleIntent
  | ERC3009TransferWithAuthorizationIntent
  | ERC3009ReceiveWithAuthorizationIntent
  | UnknownIntent;

const EthereumAddressSchema = Joi.string()
  .pattern(/^0x[a-fA-F0-9]{40}$/)
  .custom((value: string, helpers) => {
    if (!EthereumAccountBase.isEthereumHexAddressWithChecksum(value)) {
      return helpers.error("any.invalid", {
        message: "Invalid Ethereum address format",
      });
    }
    return value;
  });

const BigIntStringSchema = Joi.string()
  .pattern(/^\d+$/)
  .custom((value: string, helpers) => {
    try {
      BigInt(value);
      return value;
    } catch {
      return helpers.error("any.invalid", { message: "Invalid BigInt string" });
    }
  });

const EIP712DomainSchema: Joi.ObjectSchema<EIP712Domain> = Joi.object({
  name: Joi.string().min(1).required(),
  version: Joi.string().optional(),
  chainId: Joi.alternatives()
    .try(Joi.number(), Joi.string().pattern(/^\d+$/))
    .required(),
  verifyingContract: EthereumAddressSchema.required(),
});

const ERC2612PermitMessageSchema = Joi.object({
  owner: EthereumAddressSchema.required(),
  spender: EthereumAddressSchema.required(),
  value: BigIntStringSchema.required(),
  nonce: BigIntStringSchema.required(),
  deadline: BigIntStringSchema.required(),
});

const DAIPermitMessageSchema = Joi.object({
  holder: EthereumAddressSchema.required(),
  spender: EthereumAddressSchema.required(),
  nonce: BigIntStringSchema.required(),
  expiry: BigIntStringSchema.required(),
  allowed: Joi.boolean().required(),
});

const PermitDetailsSchema = Joi.object({
  token: EthereumAddressSchema.required(),
  amount: BigIntStringSchema.required(),
  expiration: BigIntStringSchema.required(),
  nonce: BigIntStringSchema.required(),
});

const UniswapPermitSingleMessageSchema = Joi.object({
  details: PermitDetailsSchema.required(),
  spender: EthereumAddressSchema.required(),
  sigDeadline: BigIntStringSchema.required(),
});

const Bytes32HexSchema = Joi.string().pattern(/^0x[a-fA-F0-9]{64}$/);

const ERC3009TransferAuthorizationMessageSchema = Joi.object({
  from: EthereumAddressSchema.required(),
  to: EthereumAddressSchema.required(),
  value: BigIntStringSchema.required(),
  validAfter: BigIntStringSchema.required(),
  validBefore: BigIntStringSchema.required(),
  nonce: Bytes32HexSchema.required(),
});

export function useEIP712Intent(
  interactionData: NonNullable<SignEthereumInteractionStore["waitingData"]>
) {
  const signingDataBuff = Buffer.from(interactionData.data.message);

  const signingDataText = useMemo(() => {
    return JSON.stringify(JSON.parse(signingDataBuff.toString()), null, 2);
  }, [signingDataBuff]);

  const intent = useMemo(() => {
    return parseIntent(interactionData);
  }, [interactionData]);

  return {
    intent,
    signingDataBuff,
    signingDataText,
  };
}

function parseEIP712Domain(
  domain: Record<string, unknown>
): EIP712Domain | null {
  const validatedDomain = EIP712DomainSchema.validate(domain);
  if (validatedDomain.error) {
    console.warn("EIP712 Domain validation failed:", validatedDomain.error);
    return null;
  }
  return validatedDomain.value;
}

function parseERC2612Permit(data: any): ERC2612PermitIntent | null {
  const permitType = data.types?.Permit;
  if (!Array.isArray(permitType)) {
    return null;
  }

  const message = data.message;
  if (!message || typeof message !== "object") {
    return null;
  }

  const validatedMessage = ERC2612PermitMessageSchema.validate(message);
  if (validatedMessage.error) {
    console.warn("ERC2612 Permit validation failed:", validatedMessage.error);
    return null;
  }

  if (!data.domain || typeof data.domain !== "object") {
    return null;
  }

  const domain = parseEIP712Domain(data.domain);
  if (!domain) {
    return null;
  }

  return {
    kind: "erc2612.permit",
    owner: validatedMessage.value.owner,
    spender: validatedMessage.value.spender,
    amount: validatedMessage.value.value,
    deadline: validatedMessage.value.deadline,
    nonce: validatedMessage.value.nonce,
    domain: domain,
  };
}

function parseDAIPermit(data: any): DAIPermitIntent | null {
  const permitType = data.types?.Permit;
  if (!Array.isArray(permitType)) {
    return null;
  }

  const message = data.message;
  if (!message || typeof message !== "object") {
    return null;
  }

  const validatedMessage = DAIPermitMessageSchema.validate(message);
  if (validatedMessage.error) {
    console.warn("DAI Permit validation failed:", validatedMessage.error);
    return null;
  }

  if (!data.domain || typeof data.domain !== "object") {
    return null;
  }

  const domain = parseEIP712Domain(data.domain);
  if (!domain) {
    return null;
  }

  return {
    kind: "dai.permit",
    holder: validatedMessage.value.holder,
    spender: validatedMessage.value.spender,
    nonce: validatedMessage.value.nonce,
    expiry: validatedMessage.value.expiry,
    allowed: validatedMessage.value.allowed,
    domain: domain,
  };
}

function parseUniswapPermitSingle(data: any): UniswapPermitSingleIntent | null {
  const permitType = data.types?.PermitSingle;
  if (!Array.isArray(permitType)) {
    return null;
  }

  const message = data.message;
  if (!message || typeof message !== "object") {
    return null;
  }

  const validatedMessage = UniswapPermitSingleMessageSchema.validate(message);
  if (validatedMessage.error) {
    console.warn(
      "Uniswap PermitSingle validation failed:",
      validatedMessage.error
    );
    return null;
  }

  if (!data.domain || typeof data.domain !== "object") {
    return null;
  }

  const domain = parseEIP712Domain(data.domain);
  if (!domain) {
    return null;
  }

  return {
    kind: "uniswap.permitSingle",
    details: {
      token: validatedMessage.value.details.token,
      amount: validatedMessage.value.details.amount,
      expiration: validatedMessage.value.details.expiration,
      nonce: validatedMessage.value.details.nonce,
    },
    spender: validatedMessage.value.spender,
    sigDeadline: validatedMessage.value.sigDeadline,
    domain: domain,
  };
}

function parseERC3009TransferWithAuthorization(
  data: any
): ERC3009TransferWithAuthorizationIntent | null {
  const authorizationType = data.types?.TransferWithAuthorization;
  if (!Array.isArray(authorizationType)) {
    return null;
  }

  const message = data.message;
  if (!message || typeof message !== "object") {
    return null;
  }

  const validatedMessage =
    ERC3009TransferAuthorizationMessageSchema.validate(message);
  if (validatedMessage.error) {
    console.warn(
      "ERC3009 TransferWithAuthorization validation failed:",
      validatedMessage.error
    );
    return null;
  }

  if (!data.domain || typeof data.domain !== "object") {
    return null;
  }

  const domain = parseEIP712Domain(data.domain);
  if (!domain) {
    return null;
  }

  return {
    kind: "erc3009.transferWithAuthorization",
    from: validatedMessage.value.from,
    to: validatedMessage.value.to,
    value: validatedMessage.value.value,
    validAfter: validatedMessage.value.validAfter,
    validBefore: validatedMessage.value.validBefore,
    nonce: validatedMessage.value.nonce,
    domain,
  };
}

function parseERC3009ReceiveWithAuthorization(
  data: any
): ERC3009ReceiveWithAuthorizationIntent | null {
  const authorizationType = data.types?.ReceiveWithAuthorization;
  if (!Array.isArray(authorizationType)) {
    return null;
  }

  const message = data.message;
  if (!message || typeof message !== "object") {
    return null;
  }

  const validatedMessage =
    ERC3009TransferAuthorizationMessageSchema.validate(message);
  if (validatedMessage.error) {
    console.warn(
      "ERC3009 ReceiveWithAuthorization validation failed:",
      validatedMessage.error
    );
    return null;
  }

  if (!data.domain || typeof data.domain !== "object") {
    return null;
  }

  const domain = parseEIP712Domain(data.domain);
  if (!domain) {
    return null;
  }

  return {
    kind: "erc3009.receiveWithAuthorization",
    from: validatedMessage.value.from,
    to: validatedMessage.value.to,
    value: validatedMessage.value.value,
    validAfter: validatedMessage.value.validAfter,
    validBefore: validatedMessage.value.validBefore,
    nonce: validatedMessage.value.nonce,
    domain,
  };
}

function parseIntent(
  interactionData: NonNullable<SignEthereumInteractionStore["waitingData"]>
): EIP712Intent {
  if (interactionData.data.signType !== EthSignType.EIP712) {
    throw new Error("Invalid sign type");
  }

  try {
    const typedData = JSON.parse(
      Buffer.from(interactionData.data.message).toString()
    );

    const { value: validatedTypedData, error } =
      EIP712MessageValidator.validate(typedData);
    if (error) {
      console.warn("EIP712 validation failed:", error);
      throw new Error("Invalid EIP712 data");
    }

    if (!validatedTypedData.types[validatedTypedData.primaryType]) {
      throw new Error(
        `Primary type '${typedData.primaryType}' not found in types`
      );
    }

    switch (validatedTypedData.primaryType) {
      case "Permit": {
        const erc2612Intent = parseERC2612Permit(validatedTypedData);
        if (erc2612Intent) {
          return erc2612Intent;
        }

        const daiPermitIntent = parseDAIPermit(validatedTypedData);
        if (daiPermitIntent) {
          return daiPermitIntent;
        }
        break;
      }

      case "PermitSingle": {
        const permitSingleIntent = parseUniswapPermitSingle(validatedTypedData);
        if (permitSingleIntent) {
          return permitSingleIntent;
        }
        break;
      }

      case "TransferWithAuthorization": {
        const transferIntent =
          parseERC3009TransferWithAuthorization(validatedTypedData);
        if (transferIntent) {
          return transferIntent;
        }
        break;
      }

      case "ReceiveWithAuthorization": {
        const receiveIntent =
          parseERC3009ReceiveWithAuthorization(validatedTypedData);
        if (receiveIntent) {
          return receiveIntent;
        }
        break;
      }

      // Add more cases here for future implementations
      default:
        break;
    }

    // fallback to unknown intent
    return {
      kind: "unknown",
    };
  } catch (error) {
    console.warn("EIP712 parsing failed, falling back to unknown:", error);
    return {
      kind: "unknown",
    };
  }
}
