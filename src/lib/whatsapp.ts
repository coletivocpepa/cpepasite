export function normalizarWhatsapp(valor: string): string {
  const digitos = valor.replace(/\D/g, "");
  if (digitos.length === 10 || digitos.length === 11) {
    return `55${digitos}`;
  }
  return digitos;
}

export function whatsappValido(valor: string): boolean {
  return /^55[1-9][0-9]{9,10}$/.test(normalizarWhatsapp(valor));
}
