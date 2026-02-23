/**
 * WatchSync.ts
 * MASLOW
 * 
 * Created on 2/20/26.
 * 
 * Sync member data to Apple Watch
 */

import { NativeModules, Platform } from 'react-native';

const { RNWatchSync } = NativeModules;

interface WatchSyncModule {
  syncToWatch(credits: number, memberNumber: number): void;
  clearWatchData(): void;
}

class WatchSync {
  private static module: WatchSyncModule | null = Platform.OS === 'ios' ? RNWatchSync : null;

  /**
   * Sync member credits and number to Apple Watch
   * Call this after login or when credits change
   * 
   * @param credits - Current credit count
   * @param memberNumber - Member ID number
   */
  static syncToWatch(credits: number, memberNumber: number): void {
    if (!this.module) {
      console.log('WatchSync: Not available on this platform');
      return;
    }

    try {
      this.module.syncToWatch(credits, memberNumber);
      console.log(`✅ Synced to Watch: ${credits} credits, member #${memberNumber}`);
    } catch (error) {
      console.error('❌ Error syncing to Watch:', error);
    }
  }

  /**
   * Clear Watch data (call on logout)
   */
  static clearWatchData(): void {
    if (!this.module) {
      return;
    }

    try {
      this.module.clearWatchData();
      console.log('✅ Cleared Watch data');
    } catch (error) {
      console.error('❌ Error clearing Watch data:', error);
    }
  }

  /**
   * Check if Watch sync is available
   */
  static isAvailable(): boolean {
    return this.module !== null;
  }
}

export default WatchSync;

/**
 * Usage Example:
 * 
 * import WatchSync from './WatchSync';
 * 
 * // After login or credit update:
 * WatchSync.syncToWatch(50, 12345);
 * 
 * // On logout:
 * WatchSync.clearWatchData();
 * 
 * // Check availability:
 * if (WatchSync.isAvailable()) {
 *   WatchSync.syncToWatch(credits, memberNumber);
 * }
 */
