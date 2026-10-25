import { createRequire } from 'node:module';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { auth, db } from '../test-utils.js';

const require = createRequire(import.meta.url);

// seed.js bekerja saat dimuat, jadi cache require dibersihkan sebelum tiap pemanggilan.
function jalankanSeed() {
  delete require.cache[require.resolve('../seed.js')];
  require('../seed.js');
}

const hitung = (tabel) => db.prepare(`SELECT COUNT(*) AS n FROM ${tabel}`).get().n;
const cariUser = (email) => db.prepare('SELECT * FROM users WHERE email = ?').get(email);

describe('seed.js', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('membatalkan seluruh pengisian jika terjadi kegagalan di tengah jalan', () => {
    vi.stubEnv('ADMIN_EMAIL', 'rollback@uji.id');
    db.exec("CREATE TRIGGER gagal_uji BEFORE INSERT ON lomba BEGIN SELECT RAISE(ABORT, 'gagal uji'); END;");
    expect(() => jalankanSeed()).toThrow(/gagal uji/);
    db.exec('DROP TRIGGER gagal_uji');
    expect(hitung('kategori')).toBe(0); // kategori yang sempat dimasukkan ikut dibatalkan
    expect(hitung('lomba')).toBe(0);
  });

  it('mengisi kategori, lomba contoh, dan membuat akun admin dari environment', () => {
    vi.stubEnv('ADMIN_EMAIL', '  Admin@Uji.ID ');
    vi.stubEnv('ADMIN_PASSWORD', 'sandi-uji-123');
    jalankanSeed();
    expect(hitung('kategori')).toBe(5);
    expect(hitung('lomba')).toBe(15);
    const admin = cariUser('admin@uji.id');
    expect(admin.role).toBe('admin');
    expect(auth.verifyPassword('sandi-uji-123', admin.password_hash)).toBe(true);
  });

  it('melewati pengisian lomba jika sudah ada, dan menjadikan akun yang ada sebagai admin', () => {
    db.prepare("INSERT INTO users (nama, email, password_hash, role) VALUES ('Biasa', 'biasa@uji.id', 'x:y', 'mahasiswa')").run();
    vi.stubEnv('ADMIN_EMAIL', 'biasa@uji.id');
    jalankanSeed();
    expect(hitung('lomba')).toBe(15); // tidak bertambah
    expect(cariUser('biasa@uji.id').role).toBe('admin');
  });

  it('memakai akun admin bawaan jika environment tidak diatur', () => {
    vi.stubEnv('ADMIN_EMAIL', undefined);
    vi.stubEnv('ADMIN_PASSWORD', undefined);
    jalankanSeed();
    const admin = cariUser('admin@lombaradar.id');
    expect(admin.role).toBe('admin');
    expect(auth.verifyPassword('admin123', admin.password_hash)).toBe(true);
  });

  it('server.js menjalankan seed otomatis saat AUTO_SEED=true', () => {
    vi.stubEnv('AUTO_SEED', 'true');
    vi.stubEnv('ADMIN_EMAIL', 'otomatis@uji.id');
    delete require.cache[require.resolve('../seed.js')];
    delete require.cache[require.resolve('../server.js')];
    require('../server.js');
    expect(cariUser('otomatis@uji.id').role).toBe('admin');
  });
});
