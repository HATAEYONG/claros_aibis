/**
 * Testing Utilities
 * 테스트 유틸리티 함수
 */

import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/context/ToastContext';
import { AuthProvider } from '@/context/AuthContext';
import { WidgetProvider } from '@/context/WidgetContext';

/**
 * 테스트용 커스텀 렌더 함수
 * 모든 Provider를 포함하여 컴포넌트 렌더링
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    return (
      <BrowserRouter>
        <ThemeProvider>
          <WidgetProvider>
            <AuthProvider>
              <ToastProvider>
                {children}
              </ToastProvider>
            </AuthProvider>
          </WidgetProvider>
        </ThemeProvider>
      </BrowserRouter>
    );
  };

  return render(ui, { wrapper: AllTheProviders, ...options });
}

/**
 * API 모킹 유틸리티
 */
export const mockApi = {
  /**
   * 성공 응답 모킹
   */
  success: <T,>(data: T, delay = 0) => {
    return new Promise<{ data: T }>((resolve) => {
      setTimeout(() => resolve({ data }), delay);
    });
  },

  /**
   * 실패 응답 모킹
   */
  error: (message: string, delay = 0) => {
    return new Promise<{ error: string }>((resolve) => {
      setTimeout(() => resolve({ error: message }), delay);
    });
  },

  /**
   * fetch API 모킹
   */
  mockFetch: (response: any, ok = true, status = 200) => {
    return jest.fn(() =>
      Promise.resolve({
        ok,
        status,
        json: () => Promise.resolve(response),
      })
    );
  },
};

/**
 * 데이터 생성 헬퍼 함수
 */
export const mockData = {
  /**
   * O2C 스테이지 데이터 생성
   */
  createO2CStages: (count = 5) => {
    return Array.from({ length: count }, (_, i) => ({
      id: `stage-${i + 1}`,
      name: `스테이지 ${i + 1}`,
      nameEn: `Stage ${i + 1}`,
      icon: 'activity',
      status: ['pending', 'in_progress', 'completed', 'delayed'][i % 4],
      order: i + 1,
      duration: Math.floor(Math.random() * 100) + 10,
      estimatedDuration: 48,
      volume: Math.floor(Math.random() * 200) + 50,
      value: Math.floor(Math.random() * 1000000000) + 100000000,
      issues: [],
      kpis: [
        {
          name: '처리 시간',
          value: Math.floor(Math.random() * 100) + 10,
          target: 48,
          unit: 'h',
          trend: ['up', 'down', 'stable'][i % 3],
        },
      ],
    }));
  },

  /**
   * P2P 스테이지 데이터 생성
   */
  createP2PStages: (count = 6) => {
    return Array.from({ length: count }, (_, i) => ({
      id: `p2p-stage-${i + 1}`,
      name: `P2P 스테이지 ${i + 1}`,
      nameEn: `P2P Stage ${i + 1}`,
      icon: 'package',
      status: ['pending', 'in_progress', 'completed', 'delayed'][i % 4],
      order: i + 1,
      duration: Math.floor(Math.random() * 100) + 10,
      estimatedDuration: 48,
      volume: Math.floor(Math.random() * 200) + 50,
      value: Math.floor(Math.random() * 1000000000) + 100000000,
      issues: [],
      kpis: [
        {
          name: '처리 시간',
          value: Math.floor(Math.random() * 100) + 10,
          target: 48,
          unit: 'h',
          trend: ['up', 'down', 'stable'][i % 3],
        },
      ],
    }));
  },

  /**
   * 주문 데이터 생성
   */
  createOrders: (count = 20) => {
    const customers = ['삼성전자', 'LG전자', '현대자동차', 'SK하이닉스', '포스코'];
    const products = ['반도체부품', '정밀기계부품', '자동차부품'];

    return Array.from({ length: count }, (_, i) => ({
      id: `ORD-${String(i + 1).padStart(4, '0')}`,
      customer: customers[Math.floor(Math.random() * customers.length)],
      product: products[Math.floor(Math.random() * products.length)],
      quantity: Math.floor(Math.random() * 1000) + 100,
      amount: Math.floor(Math.random() * 50000000) + 1000000,
      stage: ['order_entry', 'production', 'delivery', 'billing', 'payment'][i % 5],
      status: ['pending', 'in_progress', 'completed', 'delayed'][i % 4],
      orderDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      promisedDate: new Date(Date.now() + Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    }));
  },

  /**
   * KPI 데이터 생성
   */
  createKPIs: (count = 10) => {
    const kpiNames = [
      '매출 달성률',
      '생산 완료율',
      '품질 수율',
      '재고 회전율',
      '리드타임',
    ];

    return Array.from({ length: count }, (_, i) => ({
      id: `kpi-${i + 1}`,
      name: kpiNames[i % kpiNames.length],
      value: Math.floor(Math.random() * 100),
      target: 95,
      unit: '%',
      trend: ['up', 'down', 'stable'][i % 3],
      category: ['sales', 'production', 'quality', 'inventory'][i % 4],
    }));
  },
};

/**
 * 테스트 더블 (Test Double) 헬퍼
 */
export const testDoubles = {
  /**
   * 가짜 (Fake) 데이터베이스
   */
  createFakeDB: () => {
    const store = new Map<string, any>();

    return {
      get: (key: string) => store.get(key),
      set: (key: string, value: any) => store.set(key, value),
      delete: (key: string) => store.delete(key),
      clear: () => store.clear(),
      has: (key: string) => store.has(key),
    };
  },

  /**
   * 가짜 (Fake) API 서비스
   */
  createFakeApi: () => {
    const handlers = new Map<string, () => Promise<any>>();

    return {
      register: (endpoint: string, handler: () => Promise<any>) => {
        handlers.set(endpoint, handler);
      },
      call: async (endpoint: string) => {
        const handler = handlers.get(endpoint);
        if (handler) {
          return await handler();
        }
        throw new Error(`Endpoint not found: ${endpoint}`);
      },
    };
  },
};

/**
 * 시간 관련 테스트 유틸리티
 */
export const timeTestUtils = {
  /**
   * 가짜 타이머 생성
   */
  createFakeTimer: () => {
    let currentTime = Date.now();

    return {
      now: () => currentTime,
      advance: (ms: number) => {
        currentTime += ms;
      },
      setTime: (time: number) => {
        currentTime = time;
      },
    };
  },

  /**
   * 비동기 작업 대기
   */
  wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  /**
   * 조건 만족时可까지 대기
   */
  waitFor: async (
    condition: () => boolean,
    timeout = 5000,
    interval = 100
  ): Promise<boolean> => {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (condition()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }

    return false;
  },
};

/**
 * 이벤트 테스트 유틸리티
 */
export const eventTestUtils = {
  /**
   * 키보드 이벤트 생성
   */
  createKeyboardEvent: (key: string, code?: string) => {
    return new KeyboardEvent('keydown', {
      key,
      code: code || key,
      bubbles: true,
      cancelable: true,
    });
  },

  /**
   * 마우스 이벤트 생성
   */
  createMouseEvent: (type: string, element: HTMLElement) => {
    const event = new MouseEvent(type, {
      bubbles: true,
      cancelable: true,
      view: window,
    });

    Object.assign(event, {
      clientX: element.getBoundingClientRect().left,
      clientY: element.getBoundingClientRect().top,
    });

    return event;
  },

  /**
   * 폼 제출 이벤트 생성
   */
  createFormEvent: () => {
    return new Event('submit', {
      bubbles: true,
      cancelable: true,
    });
  },
};

/**
 * 스토리지 테스트 유틸리티
 */
export const storageTestUtils = {
  /**
   * localStorage 모킹
   */
  createMockLocalStorage: () => {
    const store = new Map<string, string>();

    return {
      getItem: (key: string) => store.get(key) || null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
      get length() {
        return store.size;
      },
      key: (index: number) => {
        return Array.from(store.keys())[index] || null;
      },
    };
  },
};

export default {
  renderWithProviders,
  mockApi,
  mockData,
  testDoubles,
  timeTestUtils,
  eventTestUtils,
  storageTestUtils,
};
