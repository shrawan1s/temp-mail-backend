export function toNumber(value: string | undefined, fallback: number) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

export function toStringArray(value: string | undefined): string[] {
    if (!value) return [];
    return value.split(',').map(s => s.trim()).filter(Boolean);
}
