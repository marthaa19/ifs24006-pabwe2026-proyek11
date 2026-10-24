import { describe, test, expect } from 'vitest';
import { hashUntukPath } from '../authPath.js';

describe('hashUntukPath', () => {
  test('/auth/login tanpa hash diarahkan ke #/masuk', () => {
    expect(hashUntukPath('/auth/login', '')).toBe('#/masuk');
  });
  test('/auth/register tanpa hash diarahkan ke #/daftar', () => {
    expect(hashUntukPath('/auth/register', '')).toBe('#/daftar');
  });
  test('garis miring di akhir diabaikan', () => {
    expect(hashUntukPath('/auth/login/', '')).toBe('#/masuk');
  });
  test('hash rute yang sudah ada tidak ditimpa', () => {
    expect(hashUntukPath('/auth/login', '#/')).toBeNull();
    expect(hashUntukPath('/auth/login', '#/tersimpan')).toBeNull();
  });
  test('path lain tidak diubah', () => {
    expect(hashUntukPath('/', '')).toBeNull();
    expect(hashUntukPath('/lomba/1', '')).toBeNull();
    expect(hashUntukPath(undefined, undefined)).toBeNull();
  });
});
