// utils/scanRateLimiter.js - Rate limiter for scan requests (10 per day)
import StorageService from '../services/storage';

const RATE_LIMIT_KEY = 'scan_rate_limit';
const MAX_SCANS_PER_DAY = 10;

class ScanRateLimiter {
  /**
   * Get today's date as a string (YYYY-MM-DD)
   */
  getTodayKey() {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  }

  /**
   * Get current rate limit data from storage
   */
  async getRateLimitData() {
    try {
      const data = await StorageService.getItem(RATE_LIMIT_KEY);
      return data || { date: null, count: 0 };
    } catch (error) {
      console.error('Error getting rate limit data:', error);
      return { date: null, count: 0 };
    }
  }

  /**
   * Check if user can perform a scan
   * @returns {Object} { canScan: boolean, remaining: number, resetTime: string }
   */
  async canScan() {
    try {
      const todayKey = this.getTodayKey();
      const data = await this.getRateLimitData();

      // Reset count if it's a new day
      if (data.date !== todayKey) {
        return {
          canScan: true,
          remaining: MAX_SCANS_PER_DAY,
          used: 0,
          limit: MAX_SCANS_PER_DAY,
          resetTime: this.getResetTime(),
        };
      }

      const remaining = MAX_SCANS_PER_DAY - data.count;
      return {
        canScan: remaining > 0,
        remaining: Math.max(0, remaining),
        used: data.count,
        limit: MAX_SCANS_PER_DAY,
        resetTime: this.getResetTime(),
      };
    } catch (error) {
      console.error('Error checking rate limit:', error);
      // Allow scan on error to prevent blocking users
      return {
        canScan: true,
        remaining: MAX_SCANS_PER_DAY,
        used: 0,
        limit: MAX_SCANS_PER_DAY,
        resetTime: this.getResetTime(),
      };
    }
  }

  /**
   * Increment the scan count for today
   * @returns {Object} { success: boolean, remaining: number }
   */
  async incrementScanCount() {
    try {
      const todayKey = this.getTodayKey();
      const data = await this.getRateLimitData();

      // Reset if new day
      if (data.date !== todayKey) {
        const newData = { date: todayKey, count: 1 };
        await StorageService.setItem(RATE_LIMIT_KEY, newData);
        return {
          success: true,
          remaining: MAX_SCANS_PER_DAY - 1,
          used: 1,
          limit: MAX_SCANS_PER_DAY,
        };
      }

      // Check if limit reached
      if (data.count >= MAX_SCANS_PER_DAY) {
        return {
          success: false,
          remaining: 0,
          used: data.count,
          limit: MAX_SCANS_PER_DAY,
        };
      }

      // Increment count
      const newCount = data.count + 1;
      const newData = { date: todayKey, count: newCount };
      await StorageService.setItem(RATE_LIMIT_KEY, newData);

      return {
        success: true,
        remaining: MAX_SCANS_PER_DAY - newCount,
        used: newCount,
        limit: MAX_SCANS_PER_DAY,
      };
    } catch (error) {
      console.error('Error incrementing scan count:', error);
      return {
        success: true, // Allow on error
        remaining: MAX_SCANS_PER_DAY,
        used: 0,
        limit: MAX_SCANS_PER_DAY,
      };
    }
  }

  /**
   * Get the time until rate limit resets (midnight)
   */
  getResetTime() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const diff = tomorrow - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
  }

  /**
   * Get scan usage info for display
   */
  async getUsageInfo() {
    const { canScan, remaining, used, limit, resetTime } = await this.canScan();
    return {
      canScan,
      remaining,
      used,
      limit,
      resetTime,
      percentage: Math.round((used / limit) * 100),
    };
  }
}

export default new ScanRateLimiter();
