import { useCallback, useState } from 'react';

// 右侧面板抽屉式收起/展开状态（持久化到 localStorage）。供 /tuning、/report/best-phone 复用。
export function usePanelCollapse(storageKey: string): [boolean, () => void] {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(storageKey) === '1';
    } catch {
      return false;
    }
  });

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(storageKey, next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  }, [storageKey]);

  return [collapsed, toggle];
}
