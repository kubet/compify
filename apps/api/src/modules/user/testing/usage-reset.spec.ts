import { describe, it } from '@jest/globals';
import { expect } from '@jest/globals';
import { SubscriptionDateCalculator } from '../../../common/subscription-date-calculator';
import {
  addDays,
  addMonths,
  format,
  getDaysInMonth,
  isLastDayOfMonth,
  subDays,
  subMonths,
} from 'date-fns';

describe('SubscriptionDateCalculator', () => {
  const calculator = new SubscriptionDateCalculator();

  describe('shouldResetUsage', () => {
    // Basic functionality tests
    it('returns true on exact monthly anniversary', () => {
      const startDate = new Date(2024, 0, 15); // Jan 15
      const today = new Date(2024, 1, 15); // Feb 15
      expect(calculator.shouldResetUsage(startDate, today, null)).toBe(true);
    });

    it('returns false for day before reset', () => {
      const startDate = new Date(2024, 0, 15);
      const today = new Date(2024, 1, 14);
      expect(calculator.shouldResetUsage(startDate, today, null)).toBe(false);
    });

    it('handles last day of month transitions correctly', () => {
      const scenarios = [
        { start: new Date(2024, 0, 31), today: new Date(2024, 1, 29) }, // Jan 31 -> Feb 29 (leap)
        { start: new Date(2024, 1, 29), today: new Date(2024, 2, 29) }, // Feb 29 -> Mar 29 (CORRECTED)
        { start: new Date(2024, 2, 31), today: new Date(2024, 3, 30) }, // Mar 31 -> Apr 30
      ];

      scenarios.forEach(({ start, today }) => {
        expect(calculator.shouldResetUsage(start, today, null)).toBe(true);
      });
    });

    // Last reset date handling
    it('prevents double resets within same period', () => {
      const startDate = new Date(2024, 0, 15);
      const lastReset = new Date(2024, 1, 15);
      const today = new Date(2024, 1, 15);
      expect(calculator.shouldResetUsage(startDate, today, lastReset)).toBe(
        false,
      );
    });

    it('allows reset after full period since last reset', () => {
      const startDate = new Date(2024, 0, 15);
      const lastReset = new Date(2024, 1, 15);
      const today = new Date(2024, 2, 15);
      expect(calculator.shouldResetUsage(startDate, today, lastReset)).toBe(
        true,
      );
    });

    // Error handling
    it('handles invalid dates', () => {
      const validDate = new Date(2024, 0, 15);
      expect(calculator.shouldResetUsage(null, validDate, null)).toBe(false);
      expect(calculator.shouldResetUsage(undefined, validDate, null)).toBe(
        false,
      );
      expect(
        calculator.shouldResetUsage(new Date('invalid'), validDate, null),
      ).toBe(false);
    });

    // Time component handling
    it('considers full day for reset regardless of time', () => {
      const startDate = new Date(2024, 0, 15, 10, 0); // 10 AM
      const scenarios = [
        new Date(2024, 1, 15, 0, 0), // 12 AM
        new Date(2024, 1, 15, 12, 0), // 12 PM
        new Date(2024, 1, 15, 23, 59), // 11:59 PM
      ];

      scenarios.forEach((today) => {
        expect(calculator.shouldResetUsage(startDate, today, null)).toBe(true);
      });
    });

    // Non-leap year February
    it('handles February in non-leap year', () => {
      const startDate = new Date(2023, 0, 31); // Jan 31, 2023
      const today = new Date(2023, 1, 28); // Feb 28, 2023
      expect(calculator.shouldResetUsage(startDate, today, null)).toBe(true);
    });

    // Multi-month transitions
    it('maintains correct reset pattern across multiple months', () => {
      const startDate = new Date(2024, 0, 31); // Jan 31
      let lastReset = null;
      const months = [1, 2, 3, 4]; // Feb through May

      months.forEach((month) => {
        const lastDay = new Date(2024, month + 1, 0).getDate();
        const today = new Date(2024, month, lastDay);
        expect(calculator.shouldResetUsage(startDate, today, lastReset)).toBe(
          true,
        );
        lastReset = today;
      });
    });

    // Edge cases with last reset date
    it('handles edge cases with last reset date', () => {
      const startDate = new Date(2024, 0, 15);
      const scenarios = [
        {
          lastReset: new Date(2024, 1, 14), // Feb 14
          today: new Date(2024, 1, 15), // Feb 15
          expected: true,
        },
        {
          lastReset: new Date(2024, 1, 15), // Feb 15
          today: new Date(2024, 1, 16), // Feb 16
          expected: false,
        },
        {
          lastReset: new Date(2024, 1, 15), // Feb 15
          today: new Date(2024, 2, 14), // Mar 14
          expected: false,
        },
      ];

      scenarios.forEach(({ lastReset, today, expected }) => {
        expect(calculator.shouldResetUsage(startDate, today, lastReset)).toBe(
          expected,
        );
      });
    });
    // Suggested additional test cases
    it('maintains original day pattern after shorter months', () => {
      const startDate = new Date(2024, 0, 31); // Jan 31
      const calculator = new SubscriptionDateCalculator();

      // Should reset on Feb 29
      expect(
        calculator.shouldResetUsage(startDate, new Date(2024, 1, 29), null),
      ).toBe(true);

      // Should reset on March 31 (back to original pattern!)
      expect(
        calculator.shouldResetUsage(
          startDate,
          new Date(2024, 2, 31),
          new Date(2024, 1, 29),
        ),
      ).toBe(true);

      // Should reset on April 30 (April's max)
      expect(
        calculator.shouldResetUsage(
          startDate,
          new Date(2024, 3, 30),
          new Date(2024, 2, 31),
        ),
      ).toBe(true);

      // Should reset on May 31 (back to original pattern!)
      expect(
        calculator.shouldResetUsage(
          startDate,
          new Date(2024, 4, 31),
          new Date(2024, 3, 30),
        ),
      ).toBe(true);
    });
  });

  describe('SubscriptionDateCalculator Year-Long Patterns', () => {
    const calculator = new SubscriptionDateCalculator();

    describe('Subscription starting on the 31st', () => {
      // This test verifies the entire year pattern for a subscription starting on January 31st
      it('correctly handles resets throughout the year when starting on 31st', () => {
        // Starting January 31st, 2024 (leap year)
        const startDate = new Date(2024, 0, 31);
        let lastReset = null;

        // Define the expected reset dates for each month
        const expectedResets = [
          { date: new Date(2024, 1, 29), day: 29 }, // February (leap year)
          { date: new Date(2024, 2, 31), day: 31 }, // March (back to 31st!)
          { date: new Date(2024, 3, 30), day: 30 }, // April
          { date: new Date(2024, 4, 31), day: 31 }, // May (back to 31st!)
          { date: new Date(2024, 5, 30), day: 30 }, // June
          { date: new Date(2024, 6, 31), day: 31 }, // July (back to 31st!)
          { date: new Date(2024, 7, 31), day: 31 }, // August
          { date: new Date(2024, 8, 30), day: 30 }, // September
          { date: new Date(2024, 9, 31), day: 31 }, // October (back to 31st!)
          { date: new Date(2024, 10, 30), day: 30 }, // November
          { date: new Date(2024, 11, 31), day: 31 }, // December (back to 31st!)
        ];

        // Test each expected reset date
        expectedResets.forEach(({ date, day }, index) => {
          // Test the day before reset (should be false)
          const dayBefore = subDays(date, 1);
          expect(
            calculator.shouldResetUsage(startDate, dayBefore, lastReset),
          ).toBe(false);

          // Test the reset day (should be true)
          expect(calculator.shouldResetUsage(startDate, date, lastReset)).toBe(
            true,
          );

          // Test the day after reset (should be false)
          const dayAfter = addDays(date, 1);
          expect(calculator.shouldResetUsage(startDate, dayAfter, date)).toBe(
            false,
          );

          // Update lastReset for next iteration
          lastReset = date;
        });
      });

      // This test verifies the behavior in a non-leap year
      it('correctly handles resets throughout the year when starting on 31st (non-leap year)', () => {
        // Starting January 31st, 2023
        const startDate = new Date(2023, 0, 31);
        let lastReset = null;

        const expectedResets = [
          { date: new Date(2023, 1, 28), day: 28 }, // February (non-leap year)
          { date: new Date(2023, 2, 31), day: 31 }, // March (back to 31st!)
          { date: new Date(2023, 3, 30), day: 30 }, // April
          { date: new Date(2023, 4, 31), day: 31 }, // May (back to 31st!)
          // ... similar pattern continues
        ];

        expectedResets.forEach(({ date }) => {
          expect(calculator.shouldResetUsage(startDate, date, lastReset)).toBe(
            true,
          );
          lastReset = date;
        });
      });
    });

    describe('Edge cases and boundary conditions', () => {
      it('handles rapid date checking around reset dates', () => {
        const startDate = new Date(2024, 0, 31);
        const resetDate = new Date(2024, 1, 29); // February 29th
        let lastReset = null;

        // Check every hour on reset day
        for (let hour = 0; hour < 24; hour++) {
          const checkDate = new Date(2024, 1, 29, hour, 0);
          expect(
            calculator.shouldResetUsage(startDate, checkDate, lastReset),
          ).toBe(true);
        }
      });

      it('prevents multiple resets in the same month', () => {
        const startDate = new Date(2024, 0, 31);
        const firstResetAttempt = new Date(2024, 1, 29, 9, 0); // Feb 29th 9 AM
        const secondResetAttempt = new Date(2024, 1, 29, 17, 0); // Feb 29th 5 PM

        // First reset should succeed
        expect(
          calculator.shouldResetUsage(startDate, firstResetAttempt, null),
        ).toBe(true);

        // Second reset attempt on the same day should fail
        expect(
          calculator.shouldResetUsage(
            startDate,
            secondResetAttempt,
            firstResetAttempt,
          ),
        ).toBe(false);
      });

      it('handles transitions between months with different lengths', () => {
        const startDate = new Date(2024, 0, 31); // Jan 31
        const resets = [
          new Date(2024, 1, 29), // Feb 29
          new Date(2024, 2, 31), // Mar 31
          new Date(2024, 3, 30), // Apr 30
        ];

        let lastReset = null;
        resets.forEach((resetDate, index) => {
          expect(
            calculator.shouldResetUsage(startDate, resetDate, lastReset),
          ).toBe(true);

          // Verify no reset on the days between reset dates
          if (index < resets.length - 1) {
            const nextDay = addDays(resetDate, 1);
            expect(
              calculator.shouldResetUsage(startDate, nextDay, resetDate),
            ).toBe(false);
          }

          lastReset = resetDate;
        });
      });
    });
  });
});
describe('SubscriptionDateCalculator Advanced Edge Cases', () => {
  const calculator = new SubscriptionDateCalculator();

  describe('Multi-year patterns and transitions', () => {
    // Tests subscription behavior across year boundaries and leap years
    it('maintains correct reset pattern across multiple years including leap year transitions', () => {
      // Start on January 31st, 2023 and track through 2025
      const startDate = new Date(2023, 0, 31);
      const expectedResets = [
        { date: new Date(2023, 1, 28), comment: 'Feb 2023 - non-leap' },
        { date: new Date(2023, 2, 31), comment: 'Mar 2023 - back to 31st' },
        // ... 2023 dates ...
        { date: new Date(2023, 11, 31), comment: 'Dec 2023' },
        { date: new Date(2024, 0, 31), comment: 'Jan 2024 - leap year' },
        { date: new Date(2024, 1, 29), comment: 'Feb 2024 - leap year' },
        { date: new Date(2024, 2, 31), comment: 'Mar 2024 - back to 31st' },
        // ... test through 2025
        { date: new Date(2025, 0, 31), comment: 'Jan 2025' },
        { date: new Date(2025, 1, 28), comment: 'Feb 2025 - non-leap' },
      ];

      let lastReset = null;
      expectedResets.forEach(({ date, comment }) => {
        expect(calculator.shouldResetUsage(startDate, date, lastReset)).toBe(
          true,
        );
        lastReset = date;
      });
    });

    // Tests behavior when subscription spans a leap year boundary
    it('handles subscriptions starting on February 29th of a leap year', () => {
      const startDate = new Date(2024, 1, 29);
      const resets = [
        { date: new Date(2024, 2, 29), expect: true },
        { date: new Date(2024, 3, 29), expect: true },
        // Test transition to non-leap year
        { date: new Date(2025, 1, 28), expect: true }, // Feb 28, 2025
        { date: new Date(2025, 2, 29), expect: true }, // Mar 29, 2025
      ];

      let lastReset = null;
      resets.forEach(({ date, expect: expectedResult }) => {
        expect(calculator.shouldResetUsage(startDate, date, lastReset)).toBe(
          expectedResult,
        );
        if (expectedResult) lastReset = date;
      });
    });
  });

  describe('Time zone and DST handling', () => {
    // Ensures consistent behavior around DST transitions
    it('handles daylight saving time transitions correctly', () => {
      // Test during US DST transition dates in 2024
      const startDate = new Date(2024, 2, 10, 1, 0); // March 10, 2024 1:00 AM
      const resetDate = new Date(2024, 3, 10, 1, 0); // April 10, 2024 1:00 AM

      // Test various times around DST transition
      const times = [0, 1, 2, 3, 4].map(
        (hour) => new Date(2024, 3, 10, hour, 0),
      );

      times.forEach((time) => {
        expect(calculator.shouldResetUsage(startDate, time, null)).toBe(
          isSameDay(time, resetDate),
        );
      });
    });
  });

  describe('Complex reset patterns', () => {
    // Tests multiple reset attempts within milliseconds
    it('handles rapid successive reset attempts', () => {
      const startDate = new Date(2024, 0, 15);
      const resetDate = new Date(2024, 1, 15);
      const attempts = Array.from(
        { length: 10 },
        (_, i) => new Date(resetDate.getTime() + i),
      );

      expect(calculator.shouldResetUsage(startDate, attempts[0], null)).toBe(
        true,
      );

      attempts.slice(1).forEach((attempt) => {
        expect(
          calculator.shouldResetUsage(startDate, attempt, attempts[0]),
        ).toBe(false);
      });
    });

    // Tests behavior when crossing multiple months in a single check
    it('handles large time gaps correctly', () => {
      const startDate = new Date(2024, 0, 15);
      const skipMonths = 6;
      const futureDate = addMonths(startDate, skipMonths);

      // Should still reset on the 15th after a large time gap
      expect(calculator.shouldResetUsage(startDate, futureDate, null)).toBe(
        futureDate.getDate() === 15,
      );
    });
  });

  describe('Date manipulation resistance', () => {
    // Ensures changing reference dates doesn't break the pattern
    it('maintains correct pattern despite reference date manipulation', () => {
      const startDate = new Date(2024, 0, 31);
      const resetDate = new Date(2024, 1, 29);
      let lastReset = new Date(2024, 1, 29);

      // Manipulate last reset date in various ways
      [
        addDays(lastReset, -1), // One day before
        addDays(lastReset, 1), // One day after
        addMonths(lastReset, -1), // Previous month
        addMonths(lastReset, 1), // Next month
        subMonths(lastReset, 1), // Another previous month
      ].forEach((manipulatedDate) => {
        const nextExpectedReset = new Date(2024, 2, 31); // Should be March 31
        expect(
          calculator.shouldResetUsage(
            startDate,
            nextExpectedReset,
            manipulatedDate,
          ),
        ).toBe(true);
      });
    });

    // Tests behavior with extreme date values
    it('handles extreme date values gracefully', () => {
      const startDate = new Date(2024, 0, 31);
      const extremeDates = [
        new Date(1970, 0, 1), // Unix epoch
        new Date(2100, 11, 31), // Far future
        new Date(Date.now() + 1000000000), // Large timestamp
        new Date(0), // Zero timestamp
      ];

      extremeDates.forEach((date) => {
        // Should not throw and should return a boolean
        const result = calculator.shouldResetUsage(startDate, date, null);
        expect(typeof result).toBe('boolean');
      });
    });
  });

  describe('Special calendar scenarios', () => {
    // Tests months with different lengths consecutively
    it('handles consecutive months with varying lengths correctly', () => {
      const startDate = new Date(2024, 0, 31); // Jan 31
      const sequence = [
        { month: 1, day: 29 }, // Feb 29
        { month: 2, day: 31 }, // Mar 31
        { month: 3, day: 30 }, // Apr 30
        { month: 4, day: 31 }, // May 31
        { month: 5, day: 30 }, // Jun 30
      ];

      let lastReset = null;
      sequence.forEach(({ month, day }) => {
        const resetDate = new Date(2024, month, day);

        // Test the day before (should be false)
        const dayBefore = subDays(resetDate, 1);
        expect(
          calculator.shouldResetUsage(startDate, dayBefore, lastReset),
        ).toBe(false);

        // Test the reset day (should be true)
        expect(
          calculator.shouldResetUsage(startDate, resetDate, lastReset),
        ).toBe(true);

        lastReset = resetDate;
      });
    });

    // Tests behavior around end of year transitions
    it('handles end of year transitions with varying month lengths', () => {
      const startDate = new Date(2024, 10, 30); // Nov 30, 2024
      const transitions = [
        new Date(2024, 11, 30), // Dec 30, 2024
        new Date(2025, 0, 30), // Jan 30, 2025
        new Date(2025, 1, 28), // Feb 28, 2025
        new Date(2025, 2, 30), // Mar 30, 2025
      ];

      let lastReset = null;
      transitions.forEach((date) => {
        expect(calculator.shouldResetUsage(startDate, date, lastReset)).toBe(
          true,
        );
        lastReset = date;
      });
    });
  });
});

// Helper function for date comparison
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}
describe('SubscriptionDateCalculator Dynamic Simulation', () => {
  it('simulates 1000 different subscription scenarios across multiple years', () => {
    const calculator = new SubscriptionDateCalculator();

    // Helper function to determine if a date should follow end-of-month pattern
    function shouldFollowEndOfMonth(startDate: Date): boolean {
      const nextMonth = addMonths(startDate, 1);
      return (
        isLastDayOfMonth(startDate) &&
        startDate.getDate() > getDaysInMonth(nextMonth)
      );
    }

    // Helper function to predict next reset date based on our business rules
    function predictNextResetDate(startDate: Date, targetMonth: Date): Date {
      const startDay = startDate.getDate();

      // If it's an end-of-month subscription (like Jan 31)
      if (shouldFollowEndOfMonth(startDate)) {
        return new Date(
          targetMonth.getFullYear(),
          targetMonth.getMonth(),
          getDaysInMonth(targetMonth),
        );
      }

      // Otherwise, try to maintain the same day, falling back to last day if needed
      const targetDay = Math.min(startDay, getDaysInMonth(targetMonth));
      return new Date(
        targetMonth.getFullYear(),
        targetMonth.getMonth(),
        targetDay,
      );
    }

    // Generate test scenarios
    const scenarios: Array<{
      startDate: Date;
      sequence: Date[];
      description: string;
    }> = [];

    // Generate start dates covering different patterns
    const startYears = [2023, 2024, 2025]; // Cover pre-leap, leap, and post-leap years
    startYears.forEach((year) => {
      for (let month = 0; month < 12; month++) {
        // Get last day of current month for end-of-month cases
        const lastDay = getDaysInMonth(new Date(year, month));

        // Generate scenarios for different days of month
        const daysToTest = [
          1, // Beginning of month
          14, // Mid month
          28, // Exists in all months
          lastDay, // End of month
          ...(lastDay >= 29 ? [29] : []), // Special case for February
          ...(lastDay >= 30 ? [30] : []), // Special case for short months
          ...(lastDay === 31 ? [31] : []), // Special case for long months
        ];

        daysToTest.forEach((day) => {
          const startDate = new Date(year, month, day);
          const sequence: Date[] = [];
          let current = startDate;

          // Generate 12 reset dates for each start date
          for (let i = 0; i < 12; i++) {
            const nextMonth = addMonths(current, 1);
            const nextReset = predictNextResetDate(startDate, nextMonth);
            sequence.push(nextReset);
            current = nextReset;
          }

          scenarios.push({
            startDate,
            sequence,
            description: `Starting ${format(startDate, 'yyyy-MM-dd')} (${
              isLastDayOfMonth(startDate) ? 'Month End' : 'Regular'
            })`,
          });
        });
      }
    });

    // Verify each scenario
    let totalTests = 0;
    scenarios.forEach(({ startDate, sequence, description }) => {
      let lastReset = null;

      sequence.forEach((expectedReset, index) => {
        // Test the day before (should be false)
        const dayBefore = new Date(expectedReset);
        dayBefore.setDate(dayBefore.getDate() - 1);
        expect(
          calculator.shouldResetUsage(startDate, dayBefore, lastReset),
        ).toBe(false);

        // Test the reset day (should be true)
        expect(
          calculator.shouldResetUsage(startDate, expectedReset, lastReset),
        ).toBe(true);

        // Test the day after (should be false)
        const dayAfter = new Date(expectedReset);
        dayAfter.setDate(dayAfter.getDate() + 1);
        expect(
          calculator.shouldResetUsage(startDate, dayAfter, expectedReset),
        ).toBe(false);

        lastReset = expectedReset;
        totalTests += 3; // Counting each day before, day of, and day after as separate tests
      });
    });

    // Log summary for visibility
    console.log(
      `Completed ${totalTests} test cases across ${scenarios.length} different subscription patterns`,
    );

    // Log some interesting patterns for manual verification
    const interestingPatterns = scenarios
      .filter(
        (s) =>
          isLastDayOfMonth(s.startDate) ||
          s.startDate.getDate() === 29 ||
          s.startDate.getDate() === 30 ||
          s.startDate.getDate() === 31,
      )
      .slice(0, 5);

    console.log('\nSample of interesting patterns:');
    interestingPatterns.forEach(({ startDate, sequence }) => {
      console.log(`\nStart: ${format(startDate, 'yyyy-MM-dd')}`);
      console.log(
        'Resets:',
        sequence.map((d) => format(d, 'yyyy-MM-dd')).join(' → '),
      );
    });
  });
});
