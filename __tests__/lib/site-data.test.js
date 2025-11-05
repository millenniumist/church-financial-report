import {
  loadSiteData,
  getMinistriesData,
  getUpcomingEventsData,
  getNewsData,
  getSermonsData,
  getContactSnapshot,
} from '@/lib/site-data';

describe('site-data loader', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('loads the site snapshot from disk', async () => {
    const data = await loadSiteData();
    expect(data).toBeTruthy();
    expect(data).toHaveProperty('ministries');
    expect(data).toHaveProperty('news');
    expect(data).toHaveProperty('upcomingEvents');
  });

  it('returns ministries extracted from the snapshot', async () => {
    const ministries = await getMinistriesData();
    expect(Array.isArray(ministries)).toBe(true);
    if (ministries.length > 0) {
      expect(ministries[0]).toHaveProperty('title');
    }
  });

  it('returns upcoming events extracted from the snapshot', async () => {
    const events = await getUpcomingEventsData();
    expect(Array.isArray(events)).toBe(true);
    if (events.length > 0) {
      expect(events[0]).toHaveProperty('title');
    }
  });

  it('returns news and sermons data', async () => {
    const [news, sermons] = await Promise.all([getNewsData(), getSermonsData()]);
    expect(Array.isArray(news)).toBe(true);
    expect(Array.isArray(sermons)).toBe(true);
  });

  it('exposes contact snapshot details', async () => {
    const contact = await getContactSnapshot();
    expect(contact).toBeTruthy();
    expect(contact).toHaveProperty('address');
  });
});
