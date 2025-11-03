import { prisma } from './prisma';

const DEFAULT_LOCALE = 'th';

function pickLabel(label, locale = DEFAULT_LOCALE) {
  if (!label) return null;
  if (typeof label === 'string') return label;
  return label[locale] ?? label.th ?? label.en ?? null;
}

export async function getNavigationItems({ locale = DEFAULT_LOCALE, includeInactive = false } = {}) {
  const items = await prisma.navigationItem.findMany({
    where: includeInactive
      ? undefined
      : {
          active: true,
        },
    orderBy: { order: 'asc' },
  });

  return items.map((item) => ({
    id: item.id,
    href: item.href,
    order: item.order,
    active: item.active,
    label: pickLabel(item.label, locale),
    translations: item.label,
  }));
}
