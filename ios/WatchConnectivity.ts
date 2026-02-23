/**
 * WatchConnectivity.ts
 * Maslow
 * 
 * Created on 2/20/26.
 * 
 * JavaScript/TypeScript module for communicating with Apple Watch
 * Use this in your React Native app to sync data with the Watch app
 */

import { NativeModules, Platform } from 'react-native';

const { RNWatchConnectivity } = NativeModules;

export interface MaslowUser {
  memberId: string;
  name: string;
  membershipTier: string;
  email?: string;
}

class WatchConnectivity {
  /**
   * Send user data to Apple Watch
   * Call this when:
   * - User logs in
   * - User data changes
   * - You want to sync to the Watch
   */
  static sendUserData(user: MaslowUser): void {
    if (Platform.OS !== 'ios') {
      console.warn('WatchConnectivity is only available on iOS');
      return;
    }

    if (!RNWatchConnectivity) {
      console.warn('RNWatchConnectivity native module not found');
      return;
    }

    try {
      RNWatchConnectivity.sendUserData(
        user.memberId,
        user.name,
        user.membershipTier,
        user.email || ''
      );
      console.log('✅ Sent user data to Apple Watch:', user.name);
    } catch (error) {
      console.error('❌ Error sending data to Watch:', error);
    }
  }

  /**
   * Clear user data from Apple Watch
   * Call this when user logs out
   */
  static clearUserData(): void {
    if (Platform.OS !== 'ios') {
      return;
    }

    if (!RNWatchConnectivity) {
      console.warn('RNWatchConnectivity native module not found');
      return;
    }

    try {
      RNWatchConnectivity.clearUserData();
      console.log('✅ Cleared user data from Apple Watch');
    } catch (error) {
      console.error('❌ Error clearing Watch data:', error);
    }
  }

  /**
   * Check if Watch Connectivity is available
   */
  static isAvailable(): boolean {
    return Platform.OS === 'ios' && !!RNWatchConnectivity;
  }
}

export default WatchConnectivity;

/**
 * Usage Example:
 * 
 * import WatchConnectivity from './WatchConnectivity';
 * 
 * // When user logs in:
 * WatchConnectivity.sendUserData({
 *   memberId: 'MASLOW-001',
 *   name: 'John Doe',
 *   membershipTier: 'Founding Member',
 *   email: 'john@example.com'
 * });
 * 
 * // When user logs out:
 * WatchConnectivity.clearUserData();
 * 
 * // Check availability:
 * if (WatchConnectivity.isAvailable()) {
 *   // Watch Connectivity is available
 * }
 */
