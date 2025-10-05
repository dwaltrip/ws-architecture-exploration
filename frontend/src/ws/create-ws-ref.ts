import type { AppWsClient } from './types';

export function createWsRef(domainName: string) {
  let client: AppWsClient | null = null;

  return {
    getClient(): AppWsClient {
      if (!client) {
        throw new Error(`${domainName} WS effects not initialized`);
      }
      return client;
    },

    init(wsClient: AppWsClient): void {
      client = wsClient;
    },

    reset(): void {
      client = null;
    },
  };
}
