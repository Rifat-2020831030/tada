import { positionBetween, initialPosition, positionAfter, positionBefore } from '../fractionalIndex';

describe('fractionalIndex utilities', () => {
  it('should generate an initial position', () => {
    const pos = initialPosition();
    expect(pos).toBeDefined();
    expect(typeof pos).toBe('string');
  });

  it('should generate a position after the given one', () => {
    const start = initialPosition();
    const after = positionAfter(start);
    expect(after).toBeDefined();
    expect(after > start).toBe(true);
  });

  it('should generate a position before the given one', () => {
    const start = initialPosition();
    const before = positionBefore(start);
    expect(before).toBeDefined();
    expect(before < start).toBe(true);
  });

  it('should generate a position between two given positions', () => {
    const first = initialPosition();
    const last = positionAfter(first);
    const middle = positionBetween(first, last);

    expect(middle).toBeDefined();
    expect(middle > first).toBe(true);
    expect(middle < last).toBe(true);
  });

  it('should handle null/undefined gracefully in positionBetween', () => {
    const pos1 = positionBetween(null, null);
    const pos2 = initialPosition();
    expect(pos1).toBe(pos2);
  });
});
