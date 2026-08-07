import { subMonths, startOfDay } from 'date-fns';

describe('Usage Reset Edge Cases', () => {
  // Helper function to get days in month
  const getDaysInMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  // Fixed helper function
  const shouldResetUsage = (
    startDate: Date,
    lastResetDate: Date | null,
    todaysDate: Date,
  ): boolean => {
    // If no last reset, only check if start date is in the past
    if (lastResetDate === null) {
      return startDate <= todaysDate;
    }

    // Get one month ago from today
    const oneMonthAgo = subMonths(todaysDate, 1);

    // Convert dates to start of day for comparison
    const resetDay = startOfDay(lastResetDate);
    const compareDay = startOfDay(oneMonthAgo);
    const today = startOfDay(todaysDate);

    // Check if it's reset day (same day of month)
    const isResetDay = resetDay.getDate() === today.getDate();

    // If today is reset day, we should reset
    if (isResetDay) {
      return true;
    }

    // Handle month end cases
    const isLastDayOfMonth = today.getDate() === getDaysInMonth(today);
    const wasLastDayOfMonth = resetDay.getDate() === getDaysInMonth(resetDay);

    if (isLastDayOfMonth && wasLastDayOfMonth) {
      return true;
    }

    // For all other cases, check if last reset was more than a month ago
    return resetDay <= compareDay;
  };

  const testCases = [
    {
      case: '1. Standard monthly reset',
      startDate: '2024-01-05 16:58:00',
      lastResetDate: '2024-01-05 16:58:00',
      todaysDate: '2024-02-05 00:00:00',
      shouldReset: true,
      explanation:
        'Exactly one month passed, should reset regardless of original time',
    },
    {
      case: '2. End of month to shorter month',
      startDate: '2024-01-31 13:00:00',
      lastResetDate: '2024-01-31 13:00:00',
      todaysDate: '2024-02-29 15:00:00', // 2024 is leap year
      shouldReset: true,
      explanation:
        'Jan 31 -> Feb 29 (leap year), should reset on last day of shorter month',
    },
    {
      case: '3. Not yet one month',
      startDate: '2024-01-15 12:00:00',
      lastResetDate: '2024-01-15 12:00:00',
      todaysDate: '2024-02-14 23:59:59',
      shouldReset: false,
      explanation: 'Not yet a full month, should not reset',
    },
    {
      case: '4. Same day different time',
      startDate: '2024-01-05 23:59:59',
      lastResetDate: '2024-01-05 23:59:59',
      todaysDate: '2024-02-05 00:00:01',
      shouldReset: true,
      explanation:
        'Same day different time should still reset (we ignore time)',
    },
    {
      case: '5. End of month sequence',
      startDate: '2024-01-31 12:00:00',
      lastResetDate: '2024-01-31 12:00:00',
      todaysDate: '2024-03-31 12:00:00',
      shouldReset: true,
      explanation: 'Jan 31 -> Feb 29 -> Mar 31, should reset on 31st',
    },
    {
      case: '6. First reset after subscription',
      startDate: '2024-02-05 16:58:00',
      lastResetDate: null,
      todaysDate: '2024-03-05 00:00:00',
      shouldReset: true,
      explanation:
        'First reset after subscription start, should reset on same day next month',
    },
    {
      case: '7. Short to long month',
      startDate: '2024-02-29 15:00:00',
      lastResetDate: '2024-02-29 15:00:00',
      todaysDate: '2024-03-29 00:00:00',
      shouldReset: true,
      explanation: 'Feb 29 (leap) -> Mar 29, should reset on 29th',
    },
    {
      case: '8. Multiple months no reset',
      startDate: '2024-01-15 12:00:00',
      lastResetDate: '2024-01-15 12:00:00',
      todaysDate: '2024-03-14 23:59:59',
      shouldReset: true,
      explanation: 'Two months passed but not yet reached reset day',
    },
    {
      case: '9. Exactly midnight reset day',
      startDate: '2024-01-05 12:00:00',
      lastResetDate: '2024-01-05 12:00:00',
      todaysDate: '2024-02-05 00:00:00',
      shouldReset: true,
      explanation: 'Should reset at start of the day on reset date',
    },
    {
      case: '10. Month with 31 to month with 30',
      startDate: '2024-03-31 12:00:00',
      lastResetDate: '2024-03-31 12:00:00',
      todaysDate: '2024-04-30 12:00:00',
      shouldReset: true,
      explanation:
        'Mar 31 -> Apr 30, should reset on last day of shorter month',
    },
  ];

  testCases.forEach((testCase) => {
    it(testCase.case, () => {
      const startDate = new Date(testCase.startDate);
      const lastResetDate = testCase.lastResetDate
        ? new Date(testCase.lastResetDate)
        : null;
      const todaysDate = new Date(testCase.todaysDate);

      const result = shouldResetUsage(startDate, lastResetDate, todaysDate);

      expect(result).toBe(testCase.shouldReset);
    });
  });
});
