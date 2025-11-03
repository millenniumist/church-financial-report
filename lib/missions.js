import { prisma } from './prisma';

export const DEFAULT_LOCALE = 'th';

function pickLocalized(value, locale = DEFAULT_LOCALE) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value;

  if (typeof value === 'object') {
    const localizedValue = value[locale];
    if (localizedValue) return localizedValue;

    const fallback = value.th ?? value.en;
    if (fallback) return fallback;

    const first = Object.values(value).find((entry) => typeof entry === 'string' && entry.length > 0);
    return first ?? null;
  }

  return null;
}

function pickList(value, locale = DEFAULT_LOCALE) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'object') {
    const localized = value[locale];
    if (Array.isArray(localized)) return localized;

    const fallback = value.th ?? value.en;
    if (Array.isArray(fallback)) return fallback;

    const firstArray = Object.values(value).find((entry) => Array.isArray(entry));
    if (Array.isArray(firstArray)) return firstArray;
  }

  return [];
}

function normalizeScripture(scripture, locale = DEFAULT_LOCALE) {
  if (!scripture || typeof scripture !== 'object') {
    return {
      reference: null,
      text: null,
    };
  }

  const reference = pickLocalized(scripture.reference, locale);
  const text = pickLocalized(scripture.text, locale);

  return { reference, text };
}

export function normalizeMission(record, locale = DEFAULT_LOCALE) {
  return {
    id: record.slug,
    slug: record.slug,
    title: pickLocalized(record.title, locale),
    theme: pickLocalized(record.theme, locale),
    summary: pickLocalized(record.summary, locale),
    description: pickLocalized(record.description, locale),
    focusAreas: pickList(record.focusAreas, locale),
    scripture: normalizeScripture(record.scripture, locale),
    nextSteps: pickList(record.nextSteps, locale),
    pinned: record.pinned,
    heroImageUrl: record.heroImageUrl,
    startDate: record.startDate,
    endDate: record.endDate,
    updatedAt: record.updatedAt,
    createdAt: record.createdAt,
    translations: {
      title: record.title,
      theme: record.theme,
      summary: record.summary,
      description: record.description,
      focusAreas: record.focusAreas,
      scripture: record.scripture,
      nextSteps: record.nextSteps,
    },
  };
}

export async function getMissions({ page = 1, pageSize = 6, locale = DEFAULT_LOCALE } = {}) {
  const safePageSize = Math.max(1, pageSize);
  const pinnedRecords = await prisma.mission.findMany({
    where: { pinned: true },
    orderBy: { updatedAt: 'desc' },
  });

  const totalItems = await prisma.mission.count({
    where: { pinned: false },
  });

  const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);

  const missions = await prisma.mission.findMany({
    where: { pinned: false },
    orderBy: { updatedAt: 'desc' },
    skip: (safePage - 1) * safePageSize,
    take: safePageSize,
  });

  return {
    pinned: pinnedRecords.map((mission) => normalizeMission(mission, locale)),
    missions: missions.map((mission) => normalizeMission(mission, locale)),
    pagination: {
      page: safePage,
      pageSize: safePageSize,
      totalItems,
      totalPages,
      hasNextPage: safePage < totalPages,
      hasPreviousPage: safePage > 1,
    },
  };
}

export async function getAllMissions({ locale = DEFAULT_LOCALE } = {}) {
  const records = await prisma.mission.findMany({
    orderBy: [{ pinned: 'desc' }, { updatedAt: 'desc' }],
  });
  return records.map((mission) => normalizeMission(mission, locale));
}
