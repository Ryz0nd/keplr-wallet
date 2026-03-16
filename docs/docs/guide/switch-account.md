# Switch Account / Get All Wallets

## Overview

Keplr provides two methods that allow dApps to interact with the user's wallet list:

- **`getAllWallets()`** retrieves a list of wallets available in Keplr, including their addresses for permitted chains.
- **`switchAccount(id)`** switches the active wallet to the one specified by the given vault ID.

These methods enable dApps to offer account-switching functionality directly within their UI, without requiring the user to open the Keplr extension.

:::note
Both methods require the webpage to have called [`enable()`](./enable-connection) first. If no chains have been permitted, `getAllWallets()` will throw an error.
:::

---

## Get All Wallets

### Function Signature

```javascript
getAllWallets(): Promise<Wallet[]>
```

When invoked, `getAllWallets` prompts the user with a permission request. Depending on the user's choice, the behavior differs:

- **Allow all wallets**: Returns the full list of wallets in Keplr.
- **Allow selected wallet only**: Returns only the currently selected wallet.

### Return Type

```typescript
interface Wallet {
  readonly id: string;
  readonly name: string;
  readonly isSelected: boolean;
  readonly addresses: { [chainId: string]: string };
}
```

### Properties Table

| **Property**  | **Type**                          | **Description**                                                                                                    |
|---------------|-----------------------------------|--------------------------------------------------------------------------------------------------------------------|
| `id`          | `string`                          | The unique vault identifier of the wallet. Use this value as the parameter for `switchAccount()`.                  |
| `name`        | `string`                          | The user-defined label for the wallet (e.g., "My Wallet", "Ledger 1").                                             |
| `isSelected`  | `boolean`                         | Indicates whether this wallet is the currently active wallet in Keplr.                                             |
| `addresses`   | `{ [chainId: string]: string }`   | A map of chain IDs to their corresponding addresses. Only chains permitted via `enable()` are included.            |

<br/>

:::info
**Permission Behavior:**
When `getAllWallets()` is called for the first time from an origin, Keplr displays a permission popup asking the user to choose between:
1. **Share all wallet information** — The method returns all wallets.
2. **Share selected wallet only** — The method returns only the currently active wallet (array with one element).

This permission is remembered for subsequent calls from the same origin.
:::

### Example Usage

```javascript
const wallets = await window.keplr.getAllWallets();

for (const wallet of wallets) {
  console.log(`Wallet: ${wallet.name} (${wallet.isSelected ? "active" : "inactive"})`);

  for (const [chainId, address] of Object.entries(wallet.addresses)) {
    console.log(`  ${chainId}: ${address}`);
  }
}
```

---

## Switch Account

The `switchAccount` method changes the active wallet in Keplr to the wallet with the specified vault ID.

### Function Signature

```javascript
switchAccount(id: string): Promise<void>
```

### Parameters

- **`id`** (`string`): The vault ID of the wallet to switch to. This value should come from the `id` property returned by `getAllWallets()`.

### Example Usage

```javascript
// 1. Get all available wallets
const wallets = await window.keplr.getAllWallets();

// 2. Find a specific wallet (e.g., by name)
const targetWallet = wallets.find((w) => w.name === "My Ledger");

if (targetWallet && !targetWallet.isSelected) {
  // 3. Switch to the target wallet
  await window.keplr.switchAccount(targetWallet.id);
  console.log(`Switched to wallet: ${targetWallet.name}`);
}
```

---

## Detecting Account Changes

After calling `switchAccount()`, Keplr emits the `keplr_keystorechange` event. You can listen for this event to update your application state accordingly. See [Custom Event](./custom-event) for more details.

```javascript
window.addEventListener("keplr_keystorechange", () => {
  console.log("Active wallet has changed. Refreshing account info...");
  // Re-fetch account data using getKey() or similar methods
});
```

### Full Example

Here is a complete example combining `getAllWallets`, `switchAccount`, and the change event:

```javascript
// Listen for account changes
window.addEventListener("keplr_keystorechange", async () => {
  const key = await window.keplr.getKey("cosmoshub-4");
  console.log("Updated address:", key.bech32Address);
});

// Enable connection first
await window.keplr.enable("cosmoshub-4");

// Get wallets and display them
const wallets = await window.keplr.getAllWallets();
console.log("Available wallets:", wallets.map((w) => w.name));

// Switch to a different wallet
const inactive = wallets.find((w) => !w.isSelected);
if (inactive) {
  await window.keplr.switchAccount(inactive.id);
  // The keplr_keystorechange event will fire after the switch
}
```
