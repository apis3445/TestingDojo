// Throwaway file to verify claude-review catches a real bug in a PR. Delete after the test run.

export function isDiscountEligible(orderTotal: number, minimumForDiscount: number): boolean {
  // Bug: orders exactly at the threshold are wrongly excluded (should be >=)
  return orderTotal > minimumForDiscount;
}

export async function fetchWithRetry(url: string, maxRetries: number): Promise<Response> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await fetch(url);
    } catch (err) {
      // Bug: attempt is never incremented, so this loops forever on a persistent failure
    }
  }
  throw new Error(`Failed after ${maxRetries} retries`);
}
