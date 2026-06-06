import { useCallback, useEffect, useState } from 'react';

// localStorage 入口：保存用户手长 / 手宽 / 性别 / 年龄 / 自定义最优机型参数 / 对比清单 / 历史记录
export type FlowState = {
  handLength: number;
  handWidth: number;
  gender: 'male' | 'female';
  ageGroup: '18-35' | '36-55' | '56+';
  // 自定义微调的最优参数
  custom: {
    width: number;
    height: number;
    thickness: number;
    weight: number;
    cameraBump: number;
    cornerRadius: number;
    sideArc: number;
    backArc: number;
    centerOfMassOffset: number;
  };
  // 对比清单（机型 id 数组，最多 3 个）
  compareIds: string[];
  // 收藏机型 id
  favoriteIds: string[];
  // 历史记录
  history: {
    id: string;
    timestamp: number;
    label: string;
    phoneId?: string;
  }[];
};

const FLOW_KEY = 'gripfit-flow-state-v2';

export const defaultFlow: FlowState = {
  handLength: 183,
  handWidth: 82,
  gender: 'male',
  ageGroup: '18-35',
  custom: {
    width: 70.6,
    height: 151.4,
    thickness: 7.6,
    weight: 180,
    cameraBump: 1.6,
    cornerRadius: 12,
    sideArc: 3,
    backArc: 60,
    centerOfMassOffset: 2.5,
  },
  compareIds: [],
  favoriteIds: [],
  history: [],
};

export function readFlowState(): FlowState {
  if (typeof window === 'undefined') return defaultFlow;
  try {
    const raw = window.localStorage.getItem(FLOW_KEY);
    if (!raw) return defaultFlow;
    const parsed = JSON.parse(raw) as Partial<FlowState>;
    return {
      ...defaultFlow,
      ...parsed,
      custom: { ...defaultFlow.custom, ...(parsed.custom ?? {}) },
      compareIds: parsed.compareIds ?? [],
      favoriteIds: parsed.favoriteIds ?? [],
      history: parsed.history ?? [],
    };
  } catch {
    return defaultFlow;
  }
}

export function writeFlowState(patch: Partial<FlowState>) {
  if (typeof window === 'undefined') return;
  const next = { ...readFlowState(), ...patch };
  window.localStorage.setItem(FLOW_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent('gripfit-flow-state-change'));
}

// React hook：跨组件同步
export function useFlowState(): [FlowState, (patch: Partial<FlowState>) => void] {
  const [state, setState] = useState<FlowState>(() => readFlowState());

  useEffect(() => {
    const onChange = () => setState(readFlowState());
    window.addEventListener('gripfit-flow-state-change', onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener('gripfit-flow-state-change', onChange);
      window.removeEventListener('storage', onChange);
    };
  }, []);

  const update = useCallback((patch: Partial<FlowState>) => {
    writeFlowState(patch);
  }, []);

  return [state, update];
}
