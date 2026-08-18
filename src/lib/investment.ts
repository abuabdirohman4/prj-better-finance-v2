// Grup investasi. Sumber kebenaran = kolom accounts.investment_group;
// nama akun ("<Grup> : <Produk>") hanya dipakai sebagai default saat kolom kosong.

const RD_PREFIX = /^RD(PU|PT|S|O|C)?$/i;

/** "RDPU : Trimegah" → "Reksadana" · "Emas : Antam 1g" → "Emas" · "Jago" → null */
export function deriveInvestmentGroup(name: string): string | null {
  const idx = name.indexOf(":");
  if (idx < 0) return null;
  const prefix = name.slice(0, idx).trim();
  if (!prefix) return null;
  return RD_PREFIX.test(prefix) ? "Reksadana" : prefix;
}

/** "Emas : Antam 1g" → "Antam 1g" (label produk tanpa prefix grup). */
export function productLabel(name: string): string {
  const idx = name.indexOf(":");
  if (idx < 0) return name;
  return name.slice(idx + 1).trim() || name;
}
