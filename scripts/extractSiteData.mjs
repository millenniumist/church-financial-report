#!/usr/bin/env node

/**
 * Fetches public content from http://www.chonburichurch.com and writes a JSON snapshot
 * that can be used for database seeding or local content rendering.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import * as url from 'node:url';
import * as cheerio from 'cheerio';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const BASE_URL = 'http://www.chonburichurch.com';
const OUTPUT_PATH = resolve(__dirname, '../content/site-data.json');
const OUTPUT_DIR = resolve(__dirname, '../content');

async function fetchHtml(pathname = '/') {
  const response = await fetch(`${BASE_URL}${pathname}`, {
    headers: {
      'User-Agent': 'cc-financial-scraper/1.0 (+https://www.chonburichurch.com/)',
      Accept: 'text/html',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${pathname}: ${response.status} ${response.statusText}`);
  }

  return await response.text();
}

function textContent(node) {
  return node.text().replace(/\s+/g, ' ').trim();
}

function parseRecurringMinistries($) {
  return $('.listing.events-listing li.item.event-item')
    .map((_, el) => {
      const $el = $(el);
      const title = textContent($el.find('.event-detail h4'));
      const schedule = textContent($el.find('.event-dayntime'));
      return title ? { title, schedule } : null;
    })
    .get()
    .filter(Boolean);
}

function parseLatestNews($) {
  return $('.listing.post-listing li.item.post')
    .map((_, el) => {
      const $el = $(el);
      const title = textContent($el.find('.post-title h2, .post-title h4'));
      const meta = textContent($el.find('.post-title .meta-data'));
      const description = textContent($el.find('p').first());
      const image = $el.find('img').attr('src') || null;
      return title
        ? {
            title,
            meta,
            description,
            image: image ? new URL(image, `${BASE_URL}/`).href : null,
          }
        : null;
    })
    .get()
    .filter(Boolean);
}

function parseSermons($) {
  return $('.listing.sermons-listing li.item.sermon')
    .map((_, el) => {
      const $el = $(el);
      const title = textContent($el.find('h4, .sermon-title a').first());
      const directText = $el
        .contents()
        .filter((_, node) => node.type === 'text' && node.nodeValue.trim())
        .map((_, node) => node.nodeValue.trim())
        .get()
        .join(' ');
      const date = directText || textContent($el.find('.date, .meta-data').first());
      const description = textContent($el.find('p').first());
      const videoUrl = $el.find('iframe').attr('src') || null;
      return title
        ? {
            title,
            date,
            description,
            videoUrl,
          }
        : null;
    })
    .get()
    .filter(Boolean);
}

function parseUpcomingEvents($) {
  return $('.listing.events-listing li.item.event-item')
    .map((_, el) => {
      const $el = $(el);
      const date = textContent($el.find('.event-date'));
      const title = textContent($el.find('.event-detail h4'));
      const schedule = textContent($el.find('.event-dayntime'));
      return title
        ? {
            title,
            schedule,
            date,
          }
        : null;
    })
    .get()
    .filter(Boolean);
}

function parseFooterContact($) {
  const contactWidget = $('footer .footer-widget').filter((_, el) => {
    return /ติดต่อเรา/gi.test($(el).find('.footer-widget-title').text());
  });

  const contactText = textContent(contactWidget.find('p'));
  const phoneMatch = contactText.match(/โทร\.\s*([0-9,\s\-]+)/);

  const aboutWidget = $('footer .footer-widget').filter((_, el) => {
    return /เกี่ยวกับคริสตจักรชลบุรี/gi.test($(el).find('.footer-widget-title').text());
  });

  const addressLines = [];
  aboutWidget
    .find('p')
    .contents()
    .each((_, node) => {
      if (node.type === 'text') {
        const value = node.nodeValue.trim();
        if (value) addressLines.push(value);
      }
    });

  let phone = phoneMatch ? phoneMatch[1].replace(/\s+/g, ' ').trim() : null;
  if (!phone) {
    const explicitPhoneLine = addressLines.find((line) => /โทร/.test(line));
    if (explicitPhoneLine) {
      phone = explicitPhoneLine.replace(/.*โทร[.:]?\s*/i, '').replace(/\s+/g, ' ').trim();
    }
  }

  const addressWithoutPhone = addressLines.filter(
    (line) => !/^คริสตจักร|^ที่อยู่/.test(line) && !/โทร/.test(line)
  );

  return {
    address: addressWithoutPhone,
    phone: phone || null,
  };
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });

  const [homeHtml, eventsHtml] = await Promise.all([
    fetchHtml('/index.html'),
    fetchHtml('/events.html'),
  ]);

  const home$ = cheerio.load(homeHtml);
  const events$ = cheerio.load(eventsHtml);

  const data = {
    extractedAt: new Date().toISOString(),
    ministries: parseRecurringMinistries(home$),
    news: parseLatestNews(home$),
    sermons: parseSermons(home$),
    upcomingEvents: parseUpcomingEvents(events$),
    contact: parseFooterContact(home$),
  };

  await writeFile(OUTPUT_PATH, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Site content written to ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error('Failed to extract site data:', error);
  process.exitCode = 1;
});
