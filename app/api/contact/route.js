import { NextResponse } from 'next/server';
import { getContactInfo, getContactInfoTranslations } from '@/lib/contact-info';
import { prisma } from '@/lib/prisma';

const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
};

function authorize(request) {
  const expectedKey = process.env.CONTENT_API_KEY ?? process.env.SYNC_API_KEY;
  if (!expectedKey) return true;

  const apiKey = request.headers.get('x-api-key');
  const bearer = request.headers.get('authorization');

  if (apiKey && apiKey === expectedKey) return true;
  if (bearer && bearer === `Bearer ${expectedKey}`) return true;

  return false;
}

function ensureLocalized(value, locale = 'th') {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') {
    return { [locale]: value };
  }
  if (typeof value === 'object') {
    return value;
  }
  return null;
}

function ensureLocalizedArray(value, locale = 'th') {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((entry) => ({
      day: ensureLocalized(entry.day, locale) ?? ensureLocalized(entry.dayText, locale),
      event: ensureLocalized(entry.event, locale) ?? ensureLocalized(entry.eventText, locale),
      time: entry.time ?? null,
    }));
  }
  return value;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get('locale') || 'th';

  try {
    const info = await getContactInfo(locale);
    if (!info) {
      return NextResponse.json(
        { error: 'Contact information not configured' },
        {
          status: 404,
          headers: CACHE_HEADERS,
        }
      );
    }
    return NextResponse.json(info, {
      headers: CACHE_HEADERS,
    });
  } catch (error) {
    console.error('Failed to fetch contact info', error);
    return NextResponse.json(
      { error: 'Unable to load contact info' },
      {
        status: 500,
        headers: CACHE_HEADERS,
      }
    );
  }
}

export async function PUT(request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const locale = body.locale || 'th';

  try {
    const existing = await getContactInfoTranslations();

    const data = {
      name: ensureLocalized(body.name ?? existing?.name, locale),
      phone: body.phone ?? existing?.phone ?? null,
      email: body.email ?? existing?.email ?? null,
      address: ensureLocalized(body.address ?? existing?.address, locale),
      social: body.social ?? existing?.social ?? {},
      mapEmbedUrl: body.mapEmbedUrl ?? existing?.mapEmbedUrl ?? null,
      coordinates: body.coordinates ?? existing?.coordinates ?? null,
      worshipTimes: ensureLocalizedArray(body.worshipTimes ?? existing?.worshipTimes, locale),
    };

    const record = await prisma.contactInfo.upsert({
      where: { id: 1 },
      update: data,
      create: { id: 1, ...data },
    });

    return NextResponse.json({ success: true, record });
  } catch (error) {
    console.error('Failed to update contact info', error);
    return NextResponse.json({ error: 'Unable to update contact info' }, { status: 500 });
  }
}
