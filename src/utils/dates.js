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
