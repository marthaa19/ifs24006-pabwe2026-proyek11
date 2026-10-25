import { describe, test, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAsync } from '../hooks/useAsync.js';
import { useDebounced } from '../hooks/useDebounced.js';
import { useForm } from '../hooks/useForm.js';
import { useGuard } from '../hooks/useGuard.js';
import { useSubmit } from '../hooks/useSubmit.js';

describe('useAsync', () => {
  test('mengisi data setelah berhasil dan loading selesai', async () => {
    const { result } = renderHook(() => useAsync(() => Promise.resolve('isi'), []));
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBe('isi');
    expect(result.current.error).toBe('');
  });

  test('mengisi error saat permintaan gagal', async () => {
    const { result } = renderHook(() => useAsync(() => Promise.reject(new Error('gagal')), [], []));
    await waitFor(() => expect(result.current.error).toBe('gagal'));
    expect(result.current.data).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  test('hasil permintaan lama diabaikan setelah deps berubah', async () => {
    let selesaikanLambat;
    const lambat = new Promise((r) => {
      selesaikanLambat = r;
    });
    const ambil = (x) => (x === 1 ? lambat : Promise.resolve('dua'));
    const { result, rerender } = renderHook(({ x }) => useAsync(() => ambil(x), [x]), { initialProps: { x: 1 } });
    rerender({ x: 2 });
    await waitFor(() => expect(result.current.data).toBe('dua'));
    await act(async () => {
      selesaikanLambat('satu');
    });
    expect(result.current.data).toBe('dua');
  });
});

describe('useGuard', () => {
  test('mengembalikan true jika aksi berhasil', async () => {
    const setError = vi.fn();
    const { result } = renderHook(() => useGuard(setError));
    expect(await result.current(() => Promise.resolve())).toBe(true);
    expect(setError).not.toHaveBeenCalled();
  });

  test('mengembalikan false dan mengirim pesan error jika aksi gagal', async () => {
    const setError = vi.fn();
    const { result } = renderHook(() => useGuard(setError));
    expect(await result.current(() => Promise.reject(new Error('ditolak')))).toBe(false);
    expect(setError).toHaveBeenCalledWith('ditolak');
  });
});

describe('useForm', () => {
  test('bind memperbarui satu kolom tanpa mengubah kolom lain', () => {
    const { result } = renderHook(() => useForm({ a: '1', b: '2' }));
    act(() => result.current.bind('a').onChange({ target: { value: 'baru' } }));
    expect(result.current.values).toEqual({ a: 'baru', b: '2' });
    expect(result.current.bind('b').value).toBe('2');
  });
});

describe('useDebounced', () => {
  test('nilai baru berlaku setelah jeda', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ v }) => useDebounced(v, 300), { initialProps: { v: 'a' } });
    rerender({ v: 'ab' });
    expect(result.current).toBe('a');
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe('ab');
  });
});

describe('useSubmit', () => {
  test('mencegah submit bawaan dan menampilkan error dari aksi', async () => {
    const aksi = vi.fn().mockRejectedValue(new Error('gagal kirim'));
    const { result } = renderHook(() => useSubmit(aksi));
    const e = { preventDefault: vi.fn() };
    await act(async () => {
      await result.current.onSubmit(e);
    });
    expect(e.preventDefault).toHaveBeenCalled();
    expect(result.current.error).toBe('gagal kirim');
    expect(result.current.loading).toBe(false);
  });

  test('aksi berhasil tidak menyisakan error', async () => {
    const aksi = vi.fn().mockResolvedValue();
    const { result } = renderHook(() => useSubmit(aksi));
    await act(async () => {
      await result.current.onSubmit({ preventDefault: vi.fn() });
    });
    expect(aksi).toHaveBeenCalledTimes(1);
    expect(result.current.error).toBe('');
  });
});
