// Verifies request-body redaction before anything reaches the log stream.
const { redactBody, bodyKeys, isSensitiveKey } = require('../utils/safeLog');

describe('redactBody', () => {
  test('redacts passwords, tokens and OTPs', () => {
    const out = redactBody({
      email: 'a@b.com', password: 'hunter2',
      newPassword: 'x', confirmPassword: 'x',
      token: 'ey.jwt', otp: '123456',
    });
    expect(out.password).toBe('[REDACTED]');
    expect(out.newPassword).toBe('[REDACTED]');
    expect(out.confirmPassword).toBe('[REDACTED]');
    expect(out.token).toBe('[REDACTED]');
    expect(out.otp).toBe('[REDACTED]');
    expect(out.email).toBe('a@b.com'); // non-sensitive preserved
  });

  test('redacts payment card fields', () => {
    const out = redactBody({ cardNumber: '4111111111111111', cvv: '123', amount: 500 });
    expect(out.cardNumber).toBe('[REDACTED]');
    expect(out.cvv).toBe('[REDACTED]');
    expect(out.amount).toBe(500);
  });

  test('redacts nested values', () => {
    const out = redactBody({ user: { profile: { password: 'secret', name: 'Ana' } } });
    expect(out.user.profile.password).toBe('[REDACTED]');
    expect(out.user.profile.name).toBe('Ana');
  });

  test('redacts inside arrays (passenger lists)', () => {
    const out = redactBody({ passengers: [{ name: 'A', passportNumber: 'P123' }] });
    expect(out.passengers[0].passportNumber).toBe('[REDACTED]');
    expect(out.passengers[0].name).toBe('A');
  });

  test('caps long arrays', () => {
    const out = redactBody({ items: Array.from({ length: 30 }, (_, i) => i) });
    expect(out.items.length).toBe(21);
    expect(out.items[20]).toBe('[+10 more]');
  });

  test('survives circular references without hanging', () => {
    const a = { name: 'x' };
    a.self = a;
    expect(() => redactBody(a)).not.toThrow();
    expect(redactBody(a).self).toBe('[CIRCULAR]');
  });

  test('truncates beyond max depth', () => {
    let deep = { v: 1 };
    for (let i = 0; i < 12; i++) deep = { nested: deep };
    expect(JSON.stringify(redactBody(deep))).toContain('[TRUNCATED]');
  });

  test('passes through primitives and null', () => {
    expect(redactBody(null)).toBeNull();
    expect(redactBody('str')).toBe('str');
    expect(redactBody(42)).toBe(42);
  });

  test('no raw secret value survives serialization', () => {
    const raw = JSON.stringify(redactBody({
      password: 'hunter2', nested: { authorization: 'Bearer abc' },
    }));
    expect(raw).not.toContain('hunter2');
    expect(raw).not.toContain('Bearer abc');
  });
});

describe('isSensitiveKey / bodyKeys', () => {
  test('matches case-insensitively as substring', () => {
    expect(isSensitiveKey('Password')).toBe(true);
    expect(isSensitiveKey('api_key')).toBe(true);
    expect(isSensitiveKey('destination')).toBe(false);
  });

  test('bodyKeys handles non-objects safely', () => {
    expect(bodyKeys(null)).toEqual([]);
    expect(bodyKeys({ a: 1, b: 2 })).toEqual(['a', 'b']);
  });
});
