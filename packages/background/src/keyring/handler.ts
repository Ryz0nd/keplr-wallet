import {
  Env,
  Handler,
  InternalHandler,
  KeplrError,
  Message,
} from "@keplr-wallet/router";
import {
  GetIsLockedMsg,
  ChangeKeyRingNameMsg,
  DeleteKeyRingMsg,
  FinalizeKeyCoinTypeMsg,
  GetKeyRingStatusMsg,
  GetKeyRingStatusOnlyMsg,
  LockKeyRingMsg,
  NewLedgerKeyMsg,
  NewPrivateKeyKeyMsg,
  AppendLedgerKeyAppMsg,
  AppendLedgerExtendedKeysMsg,
  NewMnemonicKeyMsg,
  SelectKeyRingMsg,
  ShowSensitiveKeyRingDataMsg,
  UnlockKeyRingMsg,
  ChangeUserPasswordMsg,
  ChangeKeyRingNameInteractiveMsg,
  ExportKeyRingDataMsg,
  CheckLegacyKeyRingPasswordMsg,
  NewKeystoneKeyMsg,
  CheckPasswordMsg,
  GetLegacyKeyRingInfosMsg,
  ShowSensitiveLegacyKeyRingDataMsg,
  ExportKeyRingVaultsMsg,
  SearchKeyRingsMsg,
  GetAllWalletsMsg,
  SwitchAccountMsg,
} from "./messages";
import { KeyRingService } from "./service";
import { PermissionService } from "../permission/service";
import { getBasicAccessPermissionType } from "../permission/types";
import { ChainsService } from "../chains/service";
import type { KeyRingCosmosService } from "../keyring-cosmos/service";
import type { KeyRingStarknetService } from "../keyring-starknet/service";
import type { PermissionInteractiveService } from "../permission-interactive/service";

export const getHandler: (
  service: KeyRingService,
  permissionService: PermissionService,
  permissionInteractiveService: PermissionInteractiveService,
  chainsService: ChainsService,
  keyRingCosmosService: KeyRingCosmosService,
  keyRingStarknetService: KeyRingStarknetService
) => Handler = (
  service,
  permissionService,
  permissionInteractiveService,
  chainsService,
  keyRingCosmosService,
  keyRingStarknetService
) => {
  return (env: Env, msg: Message<unknown>) => {
    switch (msg.constructor) {
      case GetIsLockedMsg:
        return handleGetIsLockedMsg(service)(env, msg as GetIsLockedMsg);
      case GetKeyRingStatusMsg:
        return handleGetKeyRingStatusMsg(service)(
          env,
          msg as GetKeyRingStatusMsg
        );
      case GetKeyRingStatusOnlyMsg:
        return handleGetKeyRingStatusOnlyMsg(service)(
          env,
          msg as GetKeyRingStatusOnlyMsg
        );
      case SelectKeyRingMsg:
        return handleSelectKeyRingMsg(service)(env, msg as SelectKeyRingMsg);
      case LockKeyRingMsg:
        return handleLockKeyRingMsg(service)(env, msg as LockKeyRingMsg);
      case UnlockKeyRingMsg:
        return handleUnlockKeyRingMsg(service)(env, msg as UnlockKeyRingMsg);
      case FinalizeKeyCoinTypeMsg:
        return handleFinalizeKeyCoinTypeMsg(service)(
          env,
          msg as FinalizeKeyCoinTypeMsg
        );
      case NewMnemonicKeyMsg:
        return handleNewMnemonicKeyMsg(service)(env, msg as NewMnemonicKeyMsg);
      case NewLedgerKeyMsg:
        return handleNewLedgerKeyMsg(service)(env, msg as NewLedgerKeyMsg);
      case NewKeystoneKeyMsg:
        return handleNewKeystoneKeyMsg(service)(env, msg as NewKeystoneKeyMsg);
      case NewPrivateKeyKeyMsg:
        return handleNewPrivateKeyKeyMsg(service)(
          env,
          msg as NewPrivateKeyKeyMsg
        );
      case AppendLedgerKeyAppMsg:
        return handleAppendLedgerKeyAppMsg(service)(
          env,
          msg as AppendLedgerKeyAppMsg
        );
      case AppendLedgerExtendedKeysMsg:
        return handleAppendLedgerExtendedKeysMsg(service)(
          env,
          msg as AppendLedgerExtendedKeysMsg
        );
      case ChangeKeyRingNameMsg:
        return handleChangeKeyRingNameMsg(service)(
          env,
          msg as ChangeKeyRingNameMsg
        );
      case DeleteKeyRingMsg:
        return handleDeleteKeyRingMsg(service)(env, msg as DeleteKeyRingMsg);
      case ShowSensitiveKeyRingDataMsg:
        return handleShowSensitiveKeyRingDataMsg(service)(
          env,
          msg as ShowSensitiveKeyRingDataMsg
        );
      case ChangeUserPasswordMsg:
        return handleChangeUserPasswordMsg(service)(
          env,
          msg as ChangeUserPasswordMsg
        );
      case ChangeKeyRingNameInteractiveMsg:
        return handleChangeKeyRingNameInteractiveMsg(service)(
          env,
          msg as ChangeKeyRingNameInteractiveMsg
        );
      case ExportKeyRingDataMsg:
        return handleExportKeyRingDatasMsg(service)(
          env,
          msg as ExportKeyRingDataMsg
        );
      case CheckLegacyKeyRingPasswordMsg:
        return handleCheckLegacyKeyRingPasswordMsg(service)(
          env,
          msg as CheckLegacyKeyRingPasswordMsg
        );
      case GetLegacyKeyRingInfosMsg:
        return handleGetLegacyKeyRingInfosMsg(service)(
          env,
          msg as GetLegacyKeyRingInfosMsg
        );
      case ShowSensitiveLegacyKeyRingDataMsg:
        return handleShowSensitiveLegacyKeyRingDataMsg(service)(
          env,
          msg as ShowSensitiveLegacyKeyRingDataMsg
        );
      case CheckPasswordMsg:
        return handleCheckPasswordMsg(service)(env, msg as CheckPasswordMsg);
      case ExportKeyRingVaultsMsg:
        return handleExportKeyRingVaultsMsg(service)(
          env,
          msg as ExportKeyRingVaultsMsg
        );
      case SearchKeyRingsMsg:
        return handleSearchKeyRingsMsg(service)(env, msg as SearchKeyRingsMsg);
      case GetAllWalletsMsg:
        return handleGetAllWalletsMsg(
          service,
          permissionService,
          permissionInteractiveService,
          chainsService,
          keyRingCosmosService,
          keyRingStarknetService
        )(env, msg as GetAllWalletsMsg);
      case SwitchAccountMsg:
        return handleSwitchAccountMsg(service, permissionService)(
          env,
          msg as SwitchAccountMsg
        );
      default:
        throw new KeplrError("keyring", 221, "Unknown msg type");
    }
  };
};

const handleGetIsLockedMsg: (
  service: KeyRingService
) => InternalHandler<GetIsLockedMsg> = (service) => {
  return () => {
    return service.keyRingStatus === "locked";
  };
};

const handleGetKeyRingStatusMsg: (
  service: KeyRingService
) => InternalHandler<GetKeyRingStatusMsg> = (service) => {
  return () => {
    return {
      status: service.keyRingStatus,
      keyInfos: service.getKeyInfos(),
      needMigration: service.needMigration,
      isMigrating: service.isMigrating,
    };
  };
};

const handleGetKeyRingStatusOnlyMsg: (
  service: KeyRingService
) => InternalHandler<GetKeyRingStatusOnlyMsg> = (service) => {
  return () => {
    return {
      status: service.keyRingStatus,
    };
  };
};

const handleSelectKeyRingMsg: (
  service: KeyRingService
) => InternalHandler<SelectKeyRingMsg> = (service) => {
  return (_, msg) => {
    service.selectKeyRing(msg.vaultId);
    return {
      status: service.keyRingStatus,
      keyInfos: service.getKeyInfos(),
    };
  };
};

const handleLockKeyRingMsg: (
  service: KeyRingService
) => InternalHandler<LockKeyRingMsg> = (service) => {
  return () => {
    service.lockKeyRing();
    return {
      status: service.keyRingStatus,
    };
  };
};

const handleUnlockKeyRingMsg: (
  service: KeyRingService
) => InternalHandler<UnlockKeyRingMsg> = (service) => {
  return async (_env, msg) => {
    await service.unlockKeyRing(msg.password);
    return {
      status: service.keyRingStatus,
      keyInfos: service.getKeyInfos(),
    };
  };
};

const handleFinalizeKeyCoinTypeMsg: (
  service: KeyRingService
) => InternalHandler<FinalizeKeyCoinTypeMsg> = (service) => {
  return (_, msg) => {
    service.finalizeKeyCoinType(msg.id, msg.chainId, msg.coinType);
    return {
      status: service.keyRingStatus,
      keyInfos: service.getKeyInfos(),
    };
  };
};

const handleNewMnemonicKeyMsg: (
  service: KeyRingService
) => InternalHandler<NewMnemonicKeyMsg> = (service) => {
  return async (_, msg) => {
    const vaultId = await service.createMnemonicKeyRing(
      msg.mnemonic,
      msg.bip44HDPath,
      msg.name,
      msg.password,
      msg.meta
    );
    return {
      vaultId,
      status: service.keyRingStatus,
      keyInfos: service.getKeyInfos(),
    };
  };
};

const handleNewLedgerKeyMsg: (
  service: KeyRingService
) => InternalHandler<NewLedgerKeyMsg> = (service) => {
  return async (_, msg) => {
    const vaultId = await service.createLedgerKeyRing(
      msg.pubKey,
      msg.app,
      msg.bip44HDPath,
      msg.name,
      msg.password
    );
    return {
      vaultId,
      status: service.keyRingStatus,
      keyInfos: service.getKeyInfos(),
    };
  };
};

const handleNewKeystoneKeyMsg: (
  service: KeyRingService
) => InternalHandler<NewKeystoneKeyMsg> = (service) => {
  return async (_, msg) => {
    const vaultId = await service.createKeystoneKeyRing(
      msg.multiAccounts,
      msg.name,
      msg.password
    );
    return {
      vaultId,
      status: service.keyRingStatus,
      keyInfos: service.getKeyInfos(),
    };
  };
};

const handleNewPrivateKeyKeyMsg: (
  service: KeyRingService
) => InternalHandler<NewPrivateKeyKeyMsg> = (service) => {
  return async (_, msg) => {
    const vaultId = await service.createPrivateKeyKeyRing(
      msg.privateKey,
      msg.meta,
      msg.name,
      msg.password
    );
    return {
      vaultId,
      status: service.keyRingStatus,
      keyInfos: service.getKeyInfos(),
    };
  };
};

const handleAppendLedgerKeyAppMsg: (
  service: KeyRingService
) => InternalHandler<AppendLedgerKeyAppMsg> = (service) => {
  return (_, msg) => {
    service.appendLedgerKeyRing(msg.vaultId, msg.pubKey, msg.app);
    return {
      status: service.keyRingStatus,
      keyInfos: service.getKeyInfos(),
    };
  };
};

const handleAppendLedgerExtendedKeysMsg: (
  service: KeyRingService
) => InternalHandler<AppendLedgerExtendedKeysMsg> = (service) => {
  return (_, msg) => {
    service.appendLedgerExtendedKeyRings(
      msg.vaultId,
      msg.extendedKeys,
      msg.app
    );
    return {
      status: service.keyRingStatus,
      keyInfos: service.getKeyInfos(),
    };
  };
};
const handleChangeKeyRingNameMsg: (
  service: KeyRingService
) => InternalHandler<ChangeKeyRingNameMsg> = (service) => {
  return (_env, msg) => {
    service.changeKeyRingName(msg.vaultId, msg.name);
    return {
      status: service.keyRingStatus,
      keyInfos: service.getKeyInfos(),
    };
  };
};

const handleDeleteKeyRingMsg: (
  service: KeyRingService
) => InternalHandler<DeleteKeyRingMsg> = (service) => {
  return async (_env, msg) => {
    const wasSelected = await service.deleteKeyRing(msg.vaultId, msg.password);
    return {
      wasSelected,
      status: service.keyRingStatus,
      keyInfos: service.getKeyInfos(),
    };
  };
};

const handleShowSensitiveKeyRingDataMsg: (
  service: KeyRingService
) => InternalHandler<ShowSensitiveKeyRingDataMsg> = (service) => {
  return async (_env, msg) => {
    return await service.showSensitiveKeyRingData(msg.vaultId, msg.password);
  };
};

const handleChangeUserPasswordMsg: (
  service: KeyRingService
) => InternalHandler<ChangeUserPasswordMsg> = (service) => {
  return async (_env, msg) => {
    return await service.changeUserPassword(
      msg.prevUserPassword,
      msg.newUserPassword
    );
  };
};

const handleChangeKeyRingNameInteractiveMsg: (
  service: KeyRingService
) => InternalHandler<ChangeKeyRingNameInteractiveMsg> = (service) => {
  return async (env, msg) => {
    await service.ensureUnlockInteractive(env);

    return await service.changeKeyRingNameInteractive(
      env,
      service.selectedVaultId,
      msg.defaultName,
      msg.editable
    );
  };
};

const handleExportKeyRingDatasMsg: (
  service: KeyRingService
) => InternalHandler<ExportKeyRingDataMsg> = (service) => {
  return async (_, msg) => {
    return await service.exportKeyRingData(msg.password);
  };
};

const handleCheckLegacyKeyRingPasswordMsg: (
  service: KeyRingService
) => InternalHandler<CheckLegacyKeyRingPasswordMsg> = (service) => {
  return async (_, msg) => {
    return await service.checkLegacyKeyRingPassword(msg.password);
  };
};

const handleGetLegacyKeyRingInfosMsg: (
  service: KeyRingService
) => InternalHandler<GetLegacyKeyRingInfosMsg> = (service) => {
  return async () => {
    return await service.getLegacyKeyringInfos();
  };
};

const handleShowSensitiveLegacyKeyRingDataMsg: (
  service: KeyRingService
) => InternalHandler<ShowSensitiveLegacyKeyRingDataMsg> = (service) => {
  return async (_, msg) => {
    return await service.showSensitiveLegacyKeyringData(
      msg.index,
      msg.password
    );
  };
};

const handleCheckPasswordMsg: (
  service: KeyRingService
) => InternalHandler<CheckPasswordMsg> = (service) => {
  return async (_, msg) => {
    return await service.checkUserPassword(msg.password);
  };
};

const handleExportKeyRingVaultsMsg: (
  service: KeyRingService
) => InternalHandler<ExportKeyRingVaultsMsg> = (service) => {
  return async (_, msg) => {
    return await service.exportKeyRingVaults(msg.password);
  };
};

const handleSearchKeyRingsMsg: (
  service: KeyRingService
) => InternalHandler<SearchKeyRingsMsg> = (service) => {
  return (_, msg) => {
    return service.searchKeyRings(msg.searchText);
  };
};

const handleGetAllWalletsMsg: (
  service: KeyRingService,
  permissionService: PermissionService,
  permissionInteractiveService: PermissionInteractiveService,
  chainsService: ChainsService,
  keyRingCosmosService: KeyRingCosmosService,
  keyRingStarknetService: KeyRingStarknetService
) => InternalHandler<GetAllWalletsMsg> = (
  service,
  permissionService,
  permissionInteractiveService,
  chainsService,
  keyRingCosmosService,
  keyRingStarknetService
) => {
  return async (env, msg) => {
    const origin = msg.origin;
    const permittedChains = permissionService.getOriginPermittedChains(
      origin,
      getBasicAccessPermissionType()
    );

    if (permittedChains.length === 0) {
      throw new KeplrError(
        "keyring",
        510,
        "No permitted chains. Call enable() first."
      );
    }

    const returnAll =
      await permissionInteractiveService.checkOrGrantGetAllKeyRingInfosPermission(
        env,
        origin
      );
    const keyInfos = returnAll
      ? service.getKeyInfos()
      : service.getKeyInfos().filter((k) => k.isSelected);
    const wallets: {
      id: string;
      name: string;
      isSelected: boolean;
      addresses: { [chainId: string]: string };
    }[] = [];

    for (const keyInfo of keyInfos) {
      const addresses: { [chainId: string]: string } = {};

      for (const chainIdentifier of permittedChains) {
        try {
          const modularChainInfo =
            chainsService.getModularChainInfoOrThrow(chainIdentifier);

          if ("cosmos" in modularChainInfo) {
            const key = await keyRingCosmosService.getKey(
              keyInfo.id,
              modularChainInfo.chainId
            );
            const chainInfo = modularChainInfo.cosmos;
            const isEthermintLike = KeyRingService.isEthermintLike(chainInfo);
            const evmInfo = ChainsService.getEVMInfo(chainInfo);

            if (isEthermintLike || evmInfo !== undefined) {
              addresses[modularChainInfo.chainId] = key.ethereumHexAddress;
            } else {
              addresses[modularChainInfo.chainId] = key.bech32Address;
            }
          } else if ("starknet" in modularChainInfo) {
            const starknetKey = await keyRingStarknetService.getStarknetKey(
              keyInfo.id,
              modularChainInfo.chainId
            );
            addresses[modularChainInfo.chainId] = starknetKey.hexAddress;
          }
          // Bitcoin: skip (out of scope)
        } catch (e) {
          console.log(e);
          continue;
        }
      }

      wallets.push({
        id: keyInfo.id,
        name: keyInfo.name,
        isSelected: keyInfo.isSelected,
        addresses,
      });
    }

    return wallets;
  };
};

const handleSwitchAccountMsg: (
  service: KeyRingService,
  permissionService: PermissionService
) => InternalHandler<SwitchAccountMsg> = (service, permissionService) => {
  return async (env, msg) => {
    if (msg.id === service.selectedVaultId) {
      return;
    }

    await service.ensureUnlockInteractive(env);

    if (
      !permissionService.hasGlobalPermission(
        "get-all-keyring-infos",
        msg.origin
      )
    ) {
      throw new KeplrError(
        "keyring",
        511,
        "Permission denied. The requested account is not accessible from this origin."
      );
    }

    await service.switchAccountInteractive(env, msg.id, msg.origin);
  };
};
