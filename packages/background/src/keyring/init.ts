import { Router } from "@keplr-wallet/router";
import { KeyRingService } from "./service";
import {
  GetIsLockedMsg,
  GetKeyRingStatusMsg,
  GetKeyRingStatusOnlyMsg,
  FinalizeKeyCoinTypeMsg,
  NewMnemonicKeyMsg,
  NewLedgerKeyMsg,
  NewPrivateKeyKeyMsg,
  AppendLedgerKeyAppMsg,
  LockKeyRingMsg,
  UnlockKeyRingMsg,
  SelectKeyRingMsg,
  ChangeKeyRingNameMsg,
  DeleteKeyRingMsg,
  ShowSensitiveKeyRingDataMsg,
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
  AppendLedgerExtendedKeysMsg,
  GetAllWalletsMsg,
  SwitchAccountMsg,
} from "./messages";
import { ROUTE } from "./constants";
import { getHandler } from "./handler";
import type { PermissionService } from "../permission/service";
import type { PermissionInteractiveService } from "../permission-interactive/service";
import type { ChainsService } from "../chains/service";
import type { KeyRingCosmosService } from "../keyring-cosmos/service";
import type { KeyRingStarknetService } from "../keyring-starknet/service";

export function init(
  router: Router,
  service: KeyRingService,
  permissionService: PermissionService,
  permissionInteractiveService: PermissionInteractiveService,
  chainsService: ChainsService,
  keyRingCosmosService: KeyRingCosmosService,
  keyRingStarknetService: KeyRingStarknetService
): void {
  router.registerMessage(GetIsLockedMsg);
  router.registerMessage(GetKeyRingStatusMsg);
  router.registerMessage(GetKeyRingStatusOnlyMsg);
  router.registerMessage(SelectKeyRingMsg);
  router.registerMessage(FinalizeKeyCoinTypeMsg);
  router.registerMessage(NewMnemonicKeyMsg);
  router.registerMessage(NewLedgerKeyMsg);
  router.registerMessage(NewKeystoneKeyMsg);
  router.registerMessage(NewPrivateKeyKeyMsg);
  router.registerMessage(AppendLedgerKeyAppMsg);
  router.registerMessage(AppendLedgerExtendedKeysMsg);
  router.registerMessage(LockKeyRingMsg);
  router.registerMessage(UnlockKeyRingMsg);
  router.registerMessage(ChangeKeyRingNameMsg);
  router.registerMessage(DeleteKeyRingMsg);
  router.registerMessage(ShowSensitiveKeyRingDataMsg);
  router.registerMessage(ChangeUserPasswordMsg);
  router.registerMessage(ChangeKeyRingNameInteractiveMsg);
  router.registerMessage(ExportKeyRingDataMsg);
  router.registerMessage(CheckLegacyKeyRingPasswordMsg);
  router.registerMessage(CheckPasswordMsg);
  router.registerMessage(GetLegacyKeyRingInfosMsg);
  router.registerMessage(ShowSensitiveLegacyKeyRingDataMsg);
  router.registerMessage(ExportKeyRingVaultsMsg);
  router.registerMessage(SearchKeyRingsMsg);
  router.registerMessage(GetAllWalletsMsg);
  router.registerMessage(SwitchAccountMsg);

  router.addHandler(
    ROUTE,
    getHandler(
      service,
      permissionService,
      permissionInteractiveService,
      chainsService,
      keyRingCosmosService,
      keyRingStarknetService
    )
  );
}
