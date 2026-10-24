import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../AuthContext.jsx';
import { Masuk, Daftar } from '../pages/Auth.jsx';
import { api, setToken } from '../api.js';

vi.mock('../api.js', () => ({
  api: { login: vi.fn(), register: vi.fn(), me: vi.fn() },
  getToken: vi.fn(() => null),
  setToken: vi.fn(),
}));

const USER = { id: 1, nama: 'Andi', email: 'andi@uji.id', role: 'mahasiswa' };

function tampil(awal) {
  return render(
    <MemoryRouter initialEntries={[awal]}>
      <AuthProvider>
        <Routes>
          <Route path="/masuk" element={<Masuk />} />
          <Route path="/daftar" element={<Daftar />} />
          <Route path="/" element={<p>Halaman Beranda</p>} />
          <Route path="/tersimpan" element={<p>Halaman Tersimpan</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  api.login.mockReset();
  api.register.mockReset();
  setToken.mockClear();
});

describe('halaman Masuk', () => {
  test('menampilkan form email dan kata sandi tanpa kolom nama', () => {
    tampil('/masuk');
    expect(screen.getByRole('heading', { name: 'Masuk' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Kata sandi')).toBeInTheDocument();
    expect(screen.queryByLabelText('Nama')).not.toBeInTheDocument();
  });

  test('login berhasil: memanggil API, menyimpan token, pindah ke beranda', async () => {
    api.login.mockResolvedValue({ token: 'tok', user: USER });
    const user = userEvent.setup();
    tampil('/masuk');
    await user.type(screen.getByLabelText('Email'), 'andi@uji.id');
    await user.type(screen.getByLabelText('Kata sandi'), 'andi123');
    await user.click(screen.getByRole('button', { name: 'Masuk' }));

    await waitFor(() => expect(screen.getByText('Halaman Beranda')).toBeInTheDocument());
    expect(api.login).toHaveBeenCalledWith({ email: 'andi@uji.id', password: 'andi123' });
    expect(setToken).toHaveBeenCalledWith('tok');
  });

  test('login gagal: pesan error tampil dan tetap di halaman', async () => {
    api.login.mockRejectedValue(new Error('Email atau kata sandi salah'));
    const user = userEvent.setup();
    tampil('/masuk');
    await user.type(screen.getByLabelText('Email'), 'andi@uji.id');
    await user.type(screen.getByLabelText('Kata sandi'), 'salah');
    await user.click(screen.getByRole('button', { name: 'Masuk' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Email atau kata sandi salah');
    expect(screen.queryByText('Halaman Beranda')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Masuk' })).toBeEnabled();
  });

  test('elemen form memakai id #username, #password, dan #btn-submit', () => {
    const { container } = tampil('/masuk');
    expect(container.querySelector('#username')).toBe(screen.getByLabelText('Email'));
    expect(container.querySelector('#password')).toBe(screen.getByLabelText('Kata sandi'));
    expect(container.querySelector('#btn-submit')).toBe(screen.getByRole('button', { name: 'Masuk' }));
  });

  test('ada tautan ke halaman Daftar', () => {
    tampil('/masuk');
    expect(screen.getByRole('link', { name: 'Daftar' })).toHaveAttribute('href', '/daftar');
  });

  test('setelah login kembali ke halaman asal (state.dari)', async () => {
    api.login.mockResolvedValue({ token: 'tok', user: USER });
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={[{ pathname: '/masuk', state: { dari: '/tersimpan' } }]}>
        <AuthProvider>
          <Routes>
            <Route path="/masuk" element={<Masuk />} />
            <Route path="/tersimpan" element={<p>Halaman Tersimpan</p>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );
    await user.type(screen.getByLabelText('Email'), 'andi@uji.id');
    await user.type(screen.getByLabelText('Kata sandi'), 'andi123');
    await user.click(screen.getByRole('button', { name: 'Masuk' }));
    expect(await screen.findByText('Halaman Tersimpan')).toBeInTheDocument();
  });
});

describe('halaman Daftar', () => {
  test('menampilkan kolom nama, email, dan kata sandi', () => {
    tampil('/daftar');
    expect(screen.getByRole('heading', { name: 'Buat akun' })).toBeInTheDocument();
    expect(screen.getByLabelText('Nama')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Kata sandi')).toBeInTheDocument();
  });

  test('daftar berhasil: memanggil register dengan semua field', async () => {
    api.register.mockResolvedValue({ token: 'tok2', user: USER });
    const user = userEvent.setup();
    tampil('/daftar');
    await user.type(screen.getByLabelText('Nama'), 'Andi');
    await user.type(screen.getByLabelText('Email'), 'andi@uji.id');
    await user.type(screen.getByLabelText('Kata sandi'), 'andi123');
    await user.click(screen.getByRole('button', { name: 'Buat akun' }));

    await waitFor(() => expect(screen.getByText('Halaman Beranda')).toBeInTheDocument());
    expect(api.register).toHaveBeenCalledWith({ nama: 'Andi', email: 'andi@uji.id', password: 'andi123' });
    expect(setToken).toHaveBeenCalledWith('tok2');
  });

  test('daftar gagal (email sudah terdaftar) menampilkan pesan error', async () => {
    api.register.mockRejectedValue(new Error('Email sudah terdaftar'));
    const user = userEvent.setup();
    tampil('/daftar');
    await user.type(screen.getByLabelText('Nama'), 'Andi');
    await user.type(screen.getByLabelText('Email'), 'andi@uji.id');
    await user.type(screen.getByLabelText('Kata sandi'), 'andi123');
    await user.click(screen.getByRole('button', { name: 'Buat akun' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Email sudah terdaftar');
  });
});
