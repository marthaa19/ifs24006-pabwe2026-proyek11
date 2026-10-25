import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buatKlien, mulaiServer, tutupServer } from '../test-utils.js';

describe('server', () => {
  let server;
  let panggil;

  beforeAll(async () => {
    const s = await mulaiServer();
    server = s.server;
    panggil = buatKlien(s.base);
  });
  afterAll(() => tutupServer(server));

  it('GET /api mengembalikan status ok', async () => {
    const r = await panggil('GET', '');
    expect(r.status).toBe(200);
    expect(r.data).toEqual({ nama: 'LombaRadar API', status: 'ok' });
  });

  it('endpoint yang tidak ada mengembalikan 404 berformat JSON', async () => {
    const r = await panggil('GET', '/tidak-ada');
    expect(r.status).toBe(404);
    expect(r.data.error).toMatch(/tidak ditemukan/i);
  });
});
