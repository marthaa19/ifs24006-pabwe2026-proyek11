import { describe, test, expect, beforeEach } from 'vitest';
import { formatTanggal, hariTersisa, infoDeadline } from '../utils.js';
import { bekukanTanggal } from '../test-utils.jsx';

beforeEach(bekukanTanggal); // hari ini = 24 Oktober 2026

describe('formatTanggal', () => {
  test('memformat YYYY-MM-DD ke bahasa Indonesia', () => {
    expect(formatTanggal('2026-10-24')).toMatch(/24 Oktober 2026/);
    expect(formatTanggal('2026-01-05')).toMatch(/5 Januari 2026/);
  });

  test('nilai kosong menghasilkan tanda "-"', () => {
    expect(formatTanggal('')).toBe('-');
    expect(formatTanggal(null)).toBe('-');
    expect(formatTanggal(undefined)).toBe('-');
  });
});

describe('hariTersisa', () => {
  test('hari ini = 0', () => expect(hariTersisa('2026-10-24')).toBe(0));
  test('besok = 1', () => expect(hariTersisa('2026-10-25')).toBe(1));
  test('3 hari lagi', () => expect(hariTersisa('2026-10-27')).toBe(3));
  test('kemarin = -1', () => expect(hariTersisa('2026-10-23')).toBe(-1));
  test('lewat 4 hari = -4', () => expect(hariTersisa('2026-10-20')).toBe(-4));
  test('melintasi pergantian bulan', () => expect(hariTersisa('2026-11-03')).toBe(10));
});

describe('infoDeadline', () => {
  test('sudah lewat: tone past, angka "Lewat"', () => {
    expect(infoDeadline('2026-10-21')).toEqual({ sisa: -3, angka: 'Lewat', label: '3 hari lalu', tone: 'past' });
  });

  test('hari ini: tone urgent', () => {
    expect(infoDeadline('2026-10-24')).toEqual({ sisa: 0, angka: 'Hari ini', label: 'batas akhir', tone: 'urgent' });
  });

  test('1 sampai 7 hari: urgent', () => {
    expect(infoDeadline('2026-10-25')).toMatchObject({ angka: '1', label: 'hari lagi', tone: 'urgent' });
    expect(infoDeadline('2026-10-31')).toMatchObject({ sisa: 7, tone: 'urgent' });
  });

  test('8 sampai 14 hari: soon', () => {
    expect(infoDeadline('2026-11-01')).toMatchObject({ sisa: 8, tone: 'soon' });
    expect(infoDeadline('2026-11-07')).toMatchObject({ sisa: 14, tone: 'soon' });
  });

  test('lebih dari 14 hari: calm', () => {
    expect(infoDeadline('2026-11-08')).toMatchObject({ sisa: 15, angka: '15', tone: 'calm' });
  });
});
