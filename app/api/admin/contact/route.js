import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminAuth } from '@/lib/auth';
import { withLogging, logError } from '@/lib/logger';

function toAdminShape(record) {
  if (!record) {
    return null;
  }

  const getLocale = (value = {}, locale) =>
    typeof value === 'object' && value !== null ? value[locale] ?? '' : '';

  const toLocalized = (value = {}) => ({
    th: getLocale(value, 'th'),
    en: getLocale(value, 'en'),
  });

  const toLocalizedEntry = (entry = {}) => ({
    day: toLocalized(entry.day),
    event: toLocalized(entry.event),
    time: entry.time ?? '',
  });

  const social = record.social ?? {};

  return {
    id: record.id,
    name: toLocalized(record.name),
    phone: record.phone ?? '',
    email: record.email ?? '',
    address: toLocalized(record.address),
    social: {
      facebook: social.facebook ?? '',
      facebookLive: social.facebookLive ?? '',
      youtube: social.youtube ?? '',
      line: social.line ?? '',
      instagram: social.instagram ?? '',
      website: social.website ?? '',
    },
    mapEmbedUrl: record.mapEmbedUrl ?? '',
    coordinates: {
      latitude: record.coordinates?.latitude ?? '',
      longitude: record.coordinates?.longitude ?? '',
    },
    worshipTimes: Array.isArray(record.worshipTimes)
      ? record.worshipTimes.map(toLocalizedEntry)
      : [],
    updatedAt: record.updatedAt,
    createdAt: record.createdAt,
  };
}

function toNumberOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function toPersistenceShape(body) {
  const normalizeLocalized = (value) => {
    if (!value) return {};
    return {
      th: value.th?.toString().trim() ?? '',
      en: value.en?.toString().trim() ?? '',
    };
  };

  const normalizeWorshipTimes = (entries) => {
    if (!Array.isArray(entries)) return [];
    return entries
      .map((entry) => ({
        day: normalizeLocalized(entry.day),
        event: normalizeLocalized(entry.event),
        time: entry.time?.toString().trim() ?? '',
      }))
      .filter(
        (entry) =>
          entry.day.th ||
          entry.day.en ||
          entry.event.th ||
          entry.event.en ||
          entry.time
      );
  };

  const social = body.social ?? {};

  const coordinates = body.coordinates ?? {};
  const latitude = toNumberOrNull(coordinates.latitude);
  const longitude = toNumberOrNull(coordinates.longitude);

  return {
    name: normalizeLocalized(body.name),
    phone: body.phone?.toString().trim() || null,
    email: body.email?.toString().trim() || null,
    address: normalizeLocalized(body.address),
    social: {
      facebook: social.facebook?.toString().trim() ?? '',
      facebookLive: social.facebookLive?.toString().trim() ?? '',
      youtube: social.youtube?.toString().trim() ?? '',
      line: social.line?.toString().trim() ?? '',
      instagram: social.instagram?.toString().trim() ?? '',
      website: social.website?.toString().trim() ?? '',
    },
    mapEmbedUrl: body.mapEmbedUrl?.toString().trim() || null,
    coordinates:
      latitude !== null || longitude !== null
        ? {
            latitude,
            longitude,
          }
        : null,
    worshipTimes: normalizeWorshipTimes(body.worshipTimes),
  };
}

async function getHandler() {
  if (!(await verifyAdminAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const record = await prisma.contactInfo.findFirst();
    return NextResponse.json({ contact: toAdminShape(record) });
  } catch (error) {
    logError(request, error, { operation: 'admin_get_contact' });
    return NextResponse.json({ error: 'Failed to fetch contact info' }, { status: 500 });
  }
}

async function patchHandler(request) {
  if (!(await verifyAdminAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const data = toPersistenceShape(body);

  try {
    const record = await prisma.contactInfo.upsert({
      where: { id: 1 },
      update: data,
      create: { id: 1, ...data },
    });

    return NextResponse.json({
      success: true,
      contact: toAdminShape(record),
    });
  } catch (error) {
    logError(request, error, { operation: 'admin_update_contact' });
    return NextResponse.json(
      { error: 'Failed to update contact info' },
      { status: 500 }
    );
  }
}

export const GET = withLogging(getHandler);
export const PATCH = withLogging(patchHandler);
