import { vi } from "vitest";
import type { ReactNode } from "react";

// Mock do cliente tRPC para testes de componente (sem backend).
// Controla dados por procedure e registra inputs/opções para asserção.

export interface QueryState {
  data?: unknown;
  isPending?: boolean;
  isError?: boolean;
  refetch?: () => void;
}
export interface MutationState {
  mutate?: (...args: unknown[]) => void;
  mutateAsync?: (...args: unknown[]) => Promise<unknown>;
  isPending?: boolean;
  isError?: boolean;
}

const queryStates = new Map<string, QueryState>();
const mutationStates = new Map<string, MutationState>();
const queryCalls = new Map<string, unknown[]>();
const mutationOptions = new Map<string, unknown[]>();
let procedureCache = new Map<string, ReturnType<typeof makeProcedure>>();

export function setQuery(path: string, state: QueryState): void {
  queryStates.set(path, state);
}
export function setMutation(path: string, state: MutationState): void {
  mutationStates.set(path, state);
}
export function lastQueryInput(path: string): any {
  const arr = queryCalls.get(path);
  return arr?.[arr.length - 1];
}
export function lastMutationOptions(path: string): any {
  const arr = mutationOptions.get(path);
  return arr?.[arr.length - 1];
}
export function resetTrpcMock(): void {
  queryStates.clear();
  mutationStates.clear();
  queryCalls.clear();
  mutationOptions.clear();
  procedureCache = new Map();
}

function deepFnProxy(): any {
  const f = vi.fn();
  return new Proxy(f, { get: () => deepFnProxy() });
}

function makeProcedure(path: string) {
  return {
    useQuery: (input?: unknown) => {
      const arr = queryCalls.get(path) ?? [];
      arr.push(input);
      queryCalls.set(path, arr);
      const s = queryStates.get(path) ?? {};
      return {
        data: s.data,
        isPending: s.isPending ?? false,
        isError: s.isError ?? false,
        isSuccess: s.data !== undefined && !s.isPending && !s.isError,
        refetch: s.refetch ?? vi.fn(),
      };
    },
    useMutation: (options?: unknown) => {
      const arr = mutationOptions.get(path) ?? [];
      arr.push(options);
      mutationOptions.set(path, arr);
      const s = mutationStates.get(path) ?? {};
      return {
        mutate: s.mutate ?? vi.fn(),
        mutateAsync: s.mutateAsync ?? vi.fn(async () => undefined),
        isPending: s.isPending ?? false,
        isError: s.isError ?? false,
      };
    },
  };
}

function domainProxy(domain: string) {
  return new Proxy(
    {},
    {
      get: (_t, proc: string) => {
        const path = `${domain}.${proc}`;
        let p = procedureCache.get(path);
        if (!p) {
          p = makeProcedure(path);
          procedureCache.set(path, p);
        }
        return p;
      },
    },
  );
}

export const trpc: any = new Proxy(function () {}, {
  get: (_t, prop: string) => {
    if (prop === "useUtils") return () => deepFnProxy();
    if (prop === "Provider") return ({ children }: { children: ReactNode }) => children;
    if (prop === "createClient") return () => ({});
    return domainProxy(prop);
  },
});
