import {
  Env,
  FnRequestInteraction,
  MessageSender,
  APP_PORT,
} from "@keplr-wallet/router";
import { openPopupWindow as openPopupWindowInner } from "@keplr-wallet/popup";
import { InExtensionMessageRequester } from "../requester";
import { ReplacePageMsg } from "../interaction-addon";

class PromiseQueue {
  protected workingOnPromise: boolean = false;
  protected queue: {
    fn: () => Promise<unknown>;
    resolve: (result: any) => void;
    reject: (e: any) => void;
  }[] = [];

  enqueue<R>(fn: () => Promise<R>): Promise<R> {
    return new Promise<R>((resolve, reject) => {
      this.queue.push({
        fn,
        resolve,
        reject,
      });

      this.dequeue();
    });
  }

  protected dequeue() {
    if (this.workingOnPromise) {
      return;
    }
    const item = this.queue.shift();
    if (!item) {
      return;
    }

    this.workingOnPromise = true;
    item
      .fn()
      .then((result) => {
        item.resolve(result);
      })
      .catch((e) => {
        item.reject(e);
      })
      .finally(() => {
        this.workingOnPromise = false;
        this.dequeue();
      });
  }
}

const openPopupQueue = new PromiseQueue();

// To handle the opening popup more easily,
// just open the popup one by one.
async function openPopupWindow(
  url: string,
  channel: string = "default",
  options: { ignoreURIReplacement?: boolean } = {}
): Promise<number> {
  const MAX_RETRY = 4;
  return await openPopupQueue.enqueue(async () => {
    let windowId = await openPopupWindowInner(url, channel, options);
    let i = 0;
    while (i < MAX_RETRY) {
      if (typeof browser === "undefined" || !browser.windows) {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, i === 0 ? 100 : 500));

      try {
        const window = await browser.windows.get(windowId);
        if (window) {
          break;
        }
      } catch (e) {
        console.log("Failed to get window", e);
        // Ignore
      }

      windowId = await openPopupWindowInner(url, channel, options);
      i++;
    }

    return windowId;
  });
}

const MAX_RETRIES_TO_OPEN_WINDOW_AND_GET_TAB_ID = 2;

export class ExtensionEnv {
  static readonly produceEnv = (
    sender: MessageSender,
    routerMeta: Record<string, any>
  ): Env => {
    const isInternalMsg = ExtensionEnv.checkIsInternalMessage(
      sender,
      browser.runtime.id,
      browser.runtime.getURL("/")
    );

    // Add additional query string for letting the extension know it is for interaction.
    const queryString = `interaction=true&interactionInternal=${isInternalMsg}`;

    const openAndSendMsg: FnRequestInteraction = async (url, msg, options) => {
      if (url.startsWith("/")) {
        url = url.slice(1);
      }

      url = browser.runtime.getURL("/popup.html#/" + url);

      if (url.includes("?")) {
        url += "&" + queryString;
      } else {
        url += "?" + queryString;
      }

      let retries = 0;
      const openWindowAndGetTabId: () => Promise<number> = async () => {
        try {
          const windowId = await openPopupWindow(url, undefined, {
            ignoreURIReplacement: options?.ignoreURIReplacement,
          });
          const window = await browser.windows.get(windowId, {
            populate: true,
          });

          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const tabId = window.tabs![0].id!;

          if (tabId && options?.unstableOnClose) {
            const listener = (_tabId: number) => {
              if (tabId === _tabId) {
                if (options?.unstableOnClose) {
                  options.unstableOnClose();
                }
                browser.tabs.onRemoved.removeListener(listener);
              }
            };
            browser.tabs.onRemoved.addListener(listener);
          }

          // Wait until that tab is loaded
          await (async () => {
            const tab = await browser.tabs.get(tabId);
            if (tab.status === "complete") {
              return;
            }

            return new Promise<void>((resolve) => {
              browser.tabs.onUpdated.addListener((_tabId, changeInfo) => {
                if (tabId === _tabId && changeInfo.status === "complete") {
                  resolve();
                }
              });
            });
          })();

          return tabId;
        } catch (e) {
          if (retries > MAX_RETRIES_TO_OPEN_WINDOW_AND_GET_TAB_ID) {
            throw e;
          } else {
            // Retry to open window and get tab id to resolve an issue that open closed window.
            retries++;
            return await openWindowAndGetTabId();
          }
        }
      };
      const tabId = await openWindowAndGetTabId();

      return await InExtensionMessageRequester.sendMessageToTab(
        tabId,
        APP_PORT,
        msg
      );
    };

    if (!isInternalMsg) {
      // If msg is from external (probably from webpage), it opens the popup for extension and send the msg back to the tab opened.
      return {
        isInternalMsg,
        requestInteraction: openAndSendMsg,
        sender,
      };
    } else {
      // If msg is from the extension itself, it can send the msg back to the extension itself.
      // In this case, this expects that there is only one extension popup have been opened.
      const requestInteraction: FnRequestInteraction = async (url, msg) => {
        if (url.startsWith("/")) {
          url = url.slice(1);
        }

        let isFromSidePanel = false;
        if (sender.url) {
          isFromSidePanel = new URL(sender.url).pathname === "/sidePanel.html";
        } else {
          console.warn(
            "No way to determine that the sender is from popup or side panel due to empty sender url. Fallback to popup"
          );
        }
        url = browser.runtime.getURL(
          `/${isFromSidePanel ? "sidePanel" : "popup"}.html#/` + url
        );

        if (url.includes("?")) {
          url += "&" + queryString;
        } else {
          url += "?" + queryString;
        }

        const messageRequester = new InExtensionMessageRequester();
        const replacePageMsg = new ReplacePageMsg(url);
        replacePageMsg.routerMeta = {
          ...replacePageMsg.routerMeta,
          receiverRouterId: routerMeta["routerId"],
        };
        await messageRequester.sendMessage(APP_PORT, replacePageMsg);

        msg.routerMeta = {
          ...msg.routerMeta,
          receiverRouterId: routerMeta["routerId"],
        };

        return await new InExtensionMessageRequester().sendMessage(
          APP_PORT,
          msg
        );
      };

      return {
        isInternalMsg,
        requestInteraction,
        sender,
      };
    }
  };

  public static readonly checkIsInternalMessage = (
    sender: MessageSender,
    extensionId: string,
    extensionUrl: string
  ): boolean => {
    if (!sender.url) {
      throw new Error("Empty sender url");
    }
    const url = new URL(sender.url);
    if (!url.origin || url.origin === "null") {
      throw new Error("Invalid sender url");
    }

    const browserURL = new URL(extensionUrl);
    if (!browserURL.origin || browserURL.origin === "null") {
      throw new Error("Invalid browser url");
    }

    if (url.origin !== browserURL.origin) {
      return false;
    }

    return sender.id === extensionId;
  };
}
