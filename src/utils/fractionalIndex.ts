import { generateKeyBetween } from 'fractional-indexing';

export function positionBetween(before: string | null | undefined, after: string | null | undefined): string {
  try {
    const a = before ?? null;
    const b = after ?? null;
    if (a && b && a >= b) {
      return generateKeyBetween(a, null);
    }
    return generateKeyBetween(a, b);
  } catch (e) {
    return generateKeyBetween(before ?? null, null);
  }
}

export function initialPosition(): string {
  try {
    return generateKeyBetween(null, null);
  } catch {
    return 'a0';
  }
}

export function positionAfter(last: string | null | undefined): string {
  try {
    return generateKeyBetween(last ?? null, null);
  } catch {
    return 'a0';
  }
}

export function positionBefore(first: string | null | undefined): string {
  try {
    return generateKeyBetween(null, first ?? null);
  } catch {
    return 'a0';
  }
}
