export const parseDDMMYYYY = (str) => {
    const [day, month, year] = str.split('/').map(Number);
    return new Date(year, month - 1, day);
};

export const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

const pad = (n) => String(n).padStart(2, '0');

export const formatDDMMYYYY = (date) =>
    `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;

// Semana de visionamento: comeca em `startDateStr` (DD/MM/YYYY) e dura 7 dias (domingo-sabado).
export const weekRange = (startDateStr) => {
    const start = parseDDMMYYYY(startDateStr);
    const end = addDays(start, 6);
    return { start: formatDDMMYYYY(start), end: formatDDMMYYYY(end) };
};

export const compareDatesDesc = (dateStrA, dateStrB) =>
    parseDDMMYYYY(dateStrB) - parseDDMMYYYY(dateStrA);

export const compareDatesAsc = (dateStrA, dateStrB) =>
    parseDDMMYYYY(dateStrA) - parseDDMMYYYY(dateStrB);

// Os filmes do mes sao escolhidos todos de uma vez, portanto ha filmes com
// semana marcada para o futuro. Um filme so "chegou" quando a sua semana ja
// comecou -- ate la nao conta para nada no site.
export const hasArrived = (dateStr, now = new Date()) => {
    if (!dateStr) return true; // sem data: comportamento de sempre (conta)
    const start = parseDDMMYYYY(dateStr);
    if (Number.isNaN(start.getTime())) return true;
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return start <= today;
};

// A semana de um filme so esta fechada quando o seu ultimo dia ja passou.
// Enquanto isso nao acontece o filme ainda esta a ser visto, portanto nao deve
// penalizar quem ainda nao chegou a ele (streak, membro ativo, etc).
export const hasWeekEnded = (dateStr, now = new Date()) => {
    if (!dateStr) return true;
    const start = parseDDMMYYYY(dateStr);
    if (Number.isNaN(start.getTime())) return true;
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return addDays(start, 6) < today;
};
