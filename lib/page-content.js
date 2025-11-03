import { prisma } from './prisma';

export const DEFAULT_LOCALE = 'th';
const LOCALE_KEYS = new Set(['th', 'en', 'th-TH', 'en-US']);

function pickLocalized(value, locale = DEFAULT_LOCALE) {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    return value[locale] ?? value.th ?? value.en ?? null;
  }
  return null;
}

function isLocalizedObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const keys = Object.keys(value);
  return keys.length > 0 && keys.every((key) => LOCALE_KEYS.has(key));
}

function resolveValue(value, locale = DEFAULT_LOCALE) {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) {
    return value.map((entry) => resolveValue(entry, locale));
  }
  if (isLocalizedObject(value)) {
    const localized = value[locale] ?? value.th ?? value.en ?? Object.values(value)[0];
    return resolveValue(localized, locale);
  }
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => [key, resolveValue(val, locale)])
    );
  }
  return value;
}

export function normalizeContent(record, locale = DEFAULT_LOCALE) {
  return {
    id: record.id,
    page: record.page,
    section: record.section,
    title: pickLocalized(record.title, locale),
    subtitle: pickLocalized(record.subtitle, locale),
    description: pickLocalized(record.description, locale),
    body: resolveValue(record.body, locale),
    metadata: record.metadata ?? null,
    translations: {
      title: record.title,
      subtitle: record.subtitle,
      description: record.description,
      body: record.body,
    },
    updatedAt: record.updatedAt,
    createdAt: record.createdAt,
  };
}

export async function getPageContent({ page, sections, locale = DEFAULT_LOCALE } = {}) {
  if (!page) {
    throw new Error('Page identifier is required to retrieve content.');
  }

  const where = {
    page,
    ...(sections
      ? {
          section: Array.isArray(sections) ? { in: sections } : sections,
        }
      : undefined),
  };

  const records = await prisma.pageContent.findMany({
    where,
    orderBy: { section: 'asc' },
  });

  return records.map((record) => normalizeContent(record, locale));
}

export async function getPageSection(page, section, locale = DEFAULT_LOCALE) {
  const record = await prisma.pageContent.findFirst({
    where: { page, section },
  });

  if (!record) return null;
  return normalizeContent(record, locale);
}
