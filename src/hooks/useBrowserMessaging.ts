import { useCallback } from "react";
import type { infoInter } from "@/types/useInfo";

type Result = { success: boolean; message?: string };

export default function useBrowserMessaging() {
  const fillPersonalInfo = useCallback(
    async (person: infoInter): Promise<Result> => {
      return new Promise<Result>((resolve) => {
        try {
          browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tabId = tabs?.[0]?.id;
            if (!tabId) {
              resolve({ success: false, message: "no_active_tab" });
              return;
            }

            browser.tabs.sendMessage(
              tabId,
              { action: "fillPersonalInfo", data: person },
              (response) => {
                if (browser.runtime?.lastError) {
                  resolve({
                    success: false,
                    message: String(browser.runtime.lastError),
                  });
                  return;
                }

                if (response?.success) {
                  resolve({ success: true });
                } else {
                  resolve({
                    success: false,
                    message: response?.message || "unknown_response",
                  });
                }
              }
            );
          });
        } catch (e) {
          resolve({ success: false, message: String(e) });
        }
      });
    },
    []
  );

  return { fillPersonalInfo } as const;
}
