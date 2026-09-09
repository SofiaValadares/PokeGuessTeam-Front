import { createContext, useContext } from 'react';
import type { ActiveBonusEvent } from '../../../../services/adminService';

const ActiveEventContext = createContext<ActiveBonusEvent | null>(null);

export const FriendMatchActiveEventProvider = ActiveEventContext.Provider;

export function useFriendMatchActiveEvent(): ActiveBonusEvent | null {
  return useContext(ActiveEventContext);
}
