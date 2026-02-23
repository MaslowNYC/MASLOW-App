import {
  getIsPaired,
  getIsWatchAppInstalled,
  updateApplicationContext,
  watchEvents,
  WatchPayload,
} from 'react-native-watch-connectivity';

export interface WatchData {
  credits: number;
  memberNumber: number;
  qrUrl: string;
  firstName?: string;
  lastName?: string;
  [key: string]: unknown;
}

export async function syncToWatch(data: WatchData): Promise<boolean> {
  try {
    const paired = await getIsPaired();
    const installed = await getIsWatchAppInstalled();

    if (!paired || !installed) {
      console.log('⌚ Watch not available - paired:', paired, 'installed:', installed);
      return false;
    }

    await updateApplicationContext(data as WatchPayload);
    console.log('✅ Synced to watch:', data);

    return true;
  } catch (error) {
    console.error('❌ Watch sync error:', error);
    return false;
  }
}

export function initWatchConnectivity(): () => void {
  const unsubscribePaired = watchEvents.on('paired', (paired) => {
    console.log('⌚ Watch paired status:', paired);
  });

  const unsubscribeInstalled = watchEvents.on('installed', (installed) => {
    console.log('⌚ Watch app installed:', installed);
  });

  const unsubscribeReachability = watchEvents.on('reachability', (reachable) => {
    console.log('⌚ Watch reachable:', reachable);
  });

  // Return cleanup function
  return () => {
    unsubscribePaired();
    unsubscribeInstalled();
    unsubscribeReachability();
  };
}
