import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Field from '../components/Field.jsx';
import { Galat, Memuat } from '../components/Status.jsx';

describe('Field', () => {
  test('input terhubung ke label lewat id', () => {
    render(<Field id="judul" label="Judul" value="x" onChange={() => {}} />);
    expect(screen.getByLabelText('Judul')).toHaveValue('x');
  });

  test('textarea', () => {
    render(<Field id="isi" label="Isi" as="textarea" rows="3" value="" onChange={() => {}} />);
    expect(screen.getByLabelText('Isi').tagName).toBe('TEXTAREA');
  });

  test('select memuat opsi kosong dan daftar opsi', () => {
    const opsi = [{ value: 1, label: 'Satu' }, { value: 2, label: 'Dua' }];
    render(<Field id="pil" label="Pilihan" as="select" kosong="Pilih" options={opsi} value="" onChange={() => {}} />);
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Pilih', 'Satu', 'Dua']);
  });
});

describe('Status', () => {
  test('Galat tidak menampilkan apa pun tanpa pesan', () => {
    const { container } = render(<Galat pesan="" />);
    expect(container).toBeEmptyDOMElement();
  });

  test('Galat menampilkan pesan sebagai alert', () => {
    render(<Galat pesan="Gagal" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Gagal');
  });

  test('Memuat menyediakan judul tersembunyi dan teks', () => {
    render(<Memuat judul="Memuat X" teks="Tunggu…" />);
    expect(screen.getByRole('heading', { name: 'Memuat X' })).toBeInTheDocument();
    expect(screen.getByText('Tunggu…')).toBeInTheDocument();
  });
});
