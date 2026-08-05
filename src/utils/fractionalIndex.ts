import { generateKeyBetween } from 'fractional-indexing';

export function positionBetween(before: string | null | undefined, after: string | null | undefined): string {
  return generateKeyBetween(before ?? null, after ?? null);
}

export function initialPosition(): string {
  return generateKeyBetween(null, null);
}

export function positionAfter(last: string | null | undefined): string {
  return generateKeyBetween(last ?? null, null);
}

export function positionBefore(first: string | null | undefined): string {
  return generateKeyBetween(null, first ?? null);
}
