export function validateCNPJ(cnpj: string): boolean {
    const raw = cnpj.replace(/[^\d]+/g, '');

    if (raw.length !== 14) return false;

    // Eliminate invalid known CNPJs
    if (/^(\d)\1+$/.test(raw)) return false;

    let length = raw.length - 2;
    let numbers = raw.substring(0, length);
    const digits = raw.substring(length);
    let sum = 0;
    let pos = length - 7;

    for (let i = length; i >= 1; i--) {
        sum += parseInt(numbers.charAt(length - i)) * pos--;
        if (pos < 2) pos = 9;
    }

    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0))) return false;

    length = length + 1;
    numbers = raw.substring(0, length);
    sum = 0;
    pos = length - 7;

    for (let i = length; i >= 1; i--) {
        sum += parseInt(numbers.charAt(length - i)) * pos--;
        if (pos < 2) pos = 9;
    }

    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    return result === parseInt(digits.charAt(1));
}
