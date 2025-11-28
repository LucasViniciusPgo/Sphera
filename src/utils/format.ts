export function formatCNPJ(value: string | null | undefined): string {
    if (!value) return "";

    const digits = value.replace(/\D/g, "").slice(0, 14);

    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return digits.replace(/^(\d{2})(\d{0,3})/, "$1.$2");
    if (digits.length <= 8) return digits.replace(/^(\d{2})(\d{3})(\d{0,3})/, "$1.$2.$3");
    if (digits.length <= 12)
        return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{0,4})/, "$1.$2.$3/$4");

    return digits.replace(
        /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2}).*/,
        "$1.$2.$3/$4-$5"
    );
}

export function cleanCNPJ(value?: string | null): string | null {
    if (!value) return null;
    const digits = value.replace(/\D/g, "");
    return digits.length > 0 ? digits : null;
}

export function formatPhone(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (!digits) return '';
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0,2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0,2)}) ${digits.slice(2,6)}-${digits.slice(6)}`;
    return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7,11)}`;
}


export function cleanPhone(value?: string | null): string | null {
    if (!value) return null;
    const digits = value.replace(/\D/g, "");
    return digits.length > 0 ? digits : null;
}

export function formatCEP(value: string): string {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 5) return digits;
    return digits.replace(/^(\d{5})(\d{3})$/, "$1-$2");
}

export function cleanCEP(value?: string | null): string | null {
    if (!value) return null;
    const digits = value.replace(/\D/g, "");
    return digits.length > 0 ? digits : null;
}