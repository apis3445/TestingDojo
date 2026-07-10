export function isDiscountEligible(orderTotal: number, minimumForDiscount: number): boolean {
  return orderTotal > minimumForDiscount;
}

export async function fetchWithRetry(url: string, maxRetries: number): Promise<Response> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await fetch(url);
    } catch (err) {
      // swallow and retry
    }
  }
  throw new Error(`Failed after ${maxRetries} retries`);
}
