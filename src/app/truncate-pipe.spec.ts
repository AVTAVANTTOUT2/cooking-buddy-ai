import { TruncatePipe } from './truncate-pipe';

describe('TruncatePipe', () => {
  const pipe = new TruncatePipe();

  it('keeps names of 20 characters or less', () => {
    expect(pipe.transform('Beef Bourguignon')).toBe('Beef Bourguignon');
    expect(pipe.transform('12345678901234567890')).toBe('12345678901234567890');
  });

  it('cuts names longer than 20 characters and adds an ellipsis', () => {
    expect(pipe.transform('Chicken Enchilada Casserole')).toBe('Chicken Enchilada Ca…');
  });

  it('accepts a custom limit', () => {
    expect(pipe.transform('Tarte Tatin', 5)).toBe('Tarte…');
  });
});
