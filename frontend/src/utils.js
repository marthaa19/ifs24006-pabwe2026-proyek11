function parseTanggal(str) {
  const [y, m, d] = String(str).split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatTanggal(str) {
  if (!str) return '-';
  return parseTanggal(str).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// Selisih hari dari hari ini ke deadline (negatif jika sudah lewat)
export function hariTersisa(deadline) {
  const now = new Date();
  const hariIni = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((parseTanggal(deadline) - hariIni) / 86400000);
}

export function infoDeadline(deadline) {
  const sisa = hariTersisa(deadline);
  if (sisa < 0) return { sisa, angka: 'Lewat', label: `${-sisa} hari lalu`, tone: 'past' };
  if (sisa === 0) return { sisa, angka: 'Hari ini', label: 'batas akhir', tone: 'urgent' };
  const tone = sisa <= 7 ? 'urgent' : sisa <= 14 ? 'soon' : 'calm';
  return { sisa, angka: String(sisa), label: 'hari lagi', tone };
}
