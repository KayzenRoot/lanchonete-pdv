/**
 * Utility functions for statistics calculations
 */

/**
 * Calculate trend percentage between current and previous values
 * @param current Current period value
 * @param previous Previous period value
 * @returns Percentage change as a number (positive for increase, negative for decrease)
 */
export function calculateTrend(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0; // If previous was 0, and now is positive, it's a 100% increase
  }
  
  return ((current - previous) / Math.abs(previous)) * 100;
}

/**
 * Format trend as a string with + or - sign and percentage
 * @param trend Trend value (percentage)
 * @returns Formatted string with sign
 */
export function formatTrend(trend: number): string {
  const sign = trend >= 0 ? '+' : '';
  return `${sign}${trend.toFixed(2)}%`;
}

/**
 * Check if a trend is positive, negative or neutral
 * @param trend Trend value
 * @returns 'positive', 'negative', or 'neutral'
 */
export function getTrendDirection(trend: number): 'positive' | 'negative' | 'neutral' {
  if (trend > 0) return 'positive';
  if (trend < 0) return 'negative';
  return 'neutral';
} 