import {
  addMonths,
  endOfMonth,
  isSameDay,
  isLastDayOfMonth,
  getDaysInMonth,
  startOfDay,
  isBefore,
} from 'date-fns';

export class SubscriptionDateCalculator {
  shouldResetUsage(
    startDate: Date | null | undefined,
    today: Date,
    lastResetDate: Date | null,
  ): boolean {
    // Input validation
    if (!startDate || isNaN(startDate.getTime()) || isNaN(today.getTime())) {
      return false;
    }

    // Normalize dates to start of day to avoid time component issues
    const normalizedStart = startOfDay(startDate);
    const normalizedToday = startOfDay(today);
    const normalizedLastReset = lastResetDate
      ? startOfDay(lastResetDate)
      : null;

    // Get the reset date for the current month based on the original subscription pattern
    const targetResetDate = this.getTargetResetDateForMonth(
      normalizedStart,
      normalizedToday,
    );
    // If there's no last reset date, just check if today is the target reset date
    if (!normalizedLastReset) {
      return isSameDay(normalizedToday, targetResetDate);
    }

    // With a last reset date, we need to ensure:
    // 1. Today matches the target reset pattern for this month
    // 2. We haven't already reset this period (today is after last reset)
    return (
      isSameDay(normalizedToday, targetResetDate) &&
      isBefore(normalizedLastReset, normalizedToday)
    );
  }

  private getTargetResetDateForMonth(startDate: Date, targetMonth: Date): Date {
    const startDay = startDate.getDate();
    const nextMonth = addMonths(startDate, 1);
    const daysInNextMonth = getDaysInMonth(nextMonth);

    // Only treat as end-of-month if the original date doesn't exist in the next month
    const isEndOfMonthSubscription =
      isLastDayOfMonth(startDate) && startDay > daysInNextMonth;

    if (isEndOfMonthSubscription) {
      return endOfMonth(targetMonth);
    }

    // For regular dates, try to maintain the same day number as the start date
    const targetDay = Math.min(startDay, getDaysInMonth(targetMonth));
    return new Date(
      targetMonth.getFullYear(),
      targetMonth.getMonth(),
      targetDay,
    );
  }
}
