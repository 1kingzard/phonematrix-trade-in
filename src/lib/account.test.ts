import { describe, expect, it } from 'vitest';
import { accountDestination, passwordError } from './account';
describe('account security', () => {
  it('rejects external destinations', () => {
    expect(accountDestination('//example.com')).toBe('/account');
    expect(accountDestination('https://example.com')).toBe('/account');
    expect(accountDestination('/\\example.com')).toBe('/account');
    expect(accountDestination('/checkout?kind=wallet')).toBe('/checkout?kind=wallet');
  });
  it('requires matching passwords', () => {
    expect(passwordError('abcdef', 'abcdeg')).toBe('Passwords do not match.');
    expect(passwordError('abcdef', 'abcdef')).toBeNull();
  });
});