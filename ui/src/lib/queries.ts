import type { AppState } from '@/types/app';
import { CORE_URL } from './const';

export function createAppStateQuery() {
  return {
    queryKey: ['app-state'],
    queryFn: async (): Promise<AppState> => {
      const response = await fetch(`${CORE_URL}/api/state`);
      return response.json();
    },
  };
}
