import { readFile } from 'node:fs/promises';
import path from 'node:path';

let cache = null;

function getSiteDataPath() {
  return path.join(process.cwd(), 'content', 'site-data.json');
}

export async function loadSiteData() {
  if (cache) {
    return cache;
  }

  const filePath = getSiteDataPath();
  const content = await readFile(filePath, 'utf8');
  cache = JSON.parse(content);
  return cache;
}

export async function getMinistriesData() {
  const data = await loadSiteData();
  return data.ministries ?? [];
}

export async function getUpcomingEventsData() {
  const data = await loadSiteData();
  return data.upcomingEvents ?? [];
}

export async function getNewsData() {
  const data = await loadSiteData();
  return data.news ?? [];
}

export async function getSermonsData() {
  const data = await loadSiteData();
  return data.sermons ?? [];
}

export async function getContactSnapshot() {
  const data = await loadSiteData();
  return data.contact ?? {};
}
