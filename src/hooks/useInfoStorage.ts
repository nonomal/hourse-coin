import { useCallback, useEffect, useRef, useState } from "react";
import type { infoInter } from "@/types/useInfo";

const STORAGE_KEY = "local:info";
const DEFAULT_KEY = "local:defaultId";

type Result = { success: boolean; message?: string };

export default function useInfoStorage() {
  const [info, setInfo] = useState<infoInter[]>([]);
  const [defaultId, setDefaultIdState] = useState<string | undefined>(
    undefined
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const writingRef = useRef(false);

  const loadAll = useCallback(async (): Promise<infoInter[]> => {
    setLoading(true);
    try {
      const res: infoInter[] | null = await storage.getItem(STORAGE_KEY);
      const list = res || [];
      setInfo(list);
      const def: string | null = await storage.getItem(DEFAULT_KEY);
      setDefaultIdState(def ?? undefined);
      return list;
    } catch (e) {
      setError(e);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const add = useCallback(async (item: infoInter): Promise<Result> => {
    if (writingRef.current) return { success: false, message: "busy" };
    writingRef.current = true;
    try {
      const cur: infoInter[] | null = await storage.getItem(STORAGE_KEY);
      const list = cur ? [...cur] : [];
      if (list.some((i) => i.idCard === item.idCard)) {
        return { success: false, message: "duplicate idCard" };
      }
      list.push(item);
      await storage.setItem(STORAGE_KEY, list);
      setInfo(list);
      return { success: true };
    } catch (e) {
      setError(e);
      return { success: false, message: String(e) };
    } finally {
      writingRef.current = false;
    }
  }, []);

  const update = useCallback(async (item: infoInter): Promise<Result> => {
    if (writingRef.current) return { success: false, message: "busy" };
    writingRef.current = true;
    try {
      const cur: infoInter[] | null = await storage.getItem(STORAGE_KEY);
      const list = cur
        ? cur.map((i) => (i.idCard === item.idCard ? item : i))
        : [item];
      await storage.setItem(STORAGE_KEY, list);
      setInfo(list);
      return { success: true };
    } catch (e) {
      setError(e);
      return { success: false, message: String(e) };
    } finally {
      writingRef.current = false;
    }
  }, []);

  const remove = useCallback(
    async (idCard: string): Promise<Result> => {
      if (writingRef.current) return { success: false, message: "busy" };
      writingRef.current = true;
      try {
        const cur: infoInter[] | null = await storage.getItem(STORAGE_KEY);
        const list = cur ? cur.filter((i) => i.idCard !== idCard) : [];
        await storage.setItem(STORAGE_KEY, list);
        setInfo(list);
        if (defaultId === idCard) {
          await storage.setItem(DEFAULT_KEY, undefined);
          setDefaultIdState(undefined);
        }
        return { success: true };
      } catch (e) {
        setError(e);
        return { success: false, message: String(e) };
      } finally {
        writingRef.current = false;
      }
    },
    [defaultId]
  );

  const setDefaultId = useCallback(async (id?: string): Promise<Result> => {
    try {
      await storage.setItem(DEFAULT_KEY, id);
      setDefaultIdState(id);
      return { success: true };
    } catch (e) {
      setError(e);
      return { success: false, message: String(e) };
    }
  }, []);

  const getDefaultId = useCallback(() => defaultId, [defaultId]);

  return {
    info,
    loading,
    error,
    defaultId,
    loadAll,
    add,
    update,
    remove,
    setDefaultId,
    getDefaultId,
  } as const;
}
