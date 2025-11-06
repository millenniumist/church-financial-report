/**
 * @jest-environment node
 */

import { getNavigationItems } from '@/lib/navigation';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    navigationItem: {
      findMany: jest.fn(),
    },
  },
}));

describe('navigation.js', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getNavigationItems', () => {
    const mockNavItems = [
      {
        id: '1',
        href: '/',
        order: 1,
        active: true,
        label: { th: 'หน้าแรก', en: 'Home' },
      },
      {
        id: '2',
        href: '/about',
        order: 2,
        active: true,
        label: { th: 'เกี่ยวกับเรา', en: 'About' },
      },
      {
        id: '3',
        href: '/contact',
        order: 3,
        active: false,
        label: { th: 'ติดต่อเรา', en: 'Contact' },
      },
    ];

    it('should return navigation items with Thai locale', async () => {
      prisma.navigationItem.findMany.mockResolvedValue(mockNavItems.filter(item => item.active));

      const result = await getNavigationItems({ locale: 'th' });

      expect(result).toHaveLength(2);
      expect(result[0].label).toBe('หน้าแรก');
      expect(result[0].href).toBe('/');
      expect(result[1].label).toBe('เกี่ยวกับเรา');
    });

    it('should return navigation items with English locale', async () => {
      prisma.navigationItem.findMany.mockResolvedValue(mockNavItems.filter(item => item.active));

      const result = await getNavigationItems({ locale: 'en' });

      expect(result).toHaveLength(2);
      expect(result[0].label).toBe('Home');
      expect(result[1].label).toBe('About');
    });

    it('should only return active items by default', async () => {
      const activeItems = mockNavItems.filter(item => item.active);
      prisma.navigationItem.findMany.mockResolvedValue(activeItems);

      const result = await getNavigationItems();

      expect(result).toHaveLength(2);
      expect(prisma.navigationItem.findMany).toHaveBeenCalledWith({
        where: { active: true },
        orderBy: { order: 'asc' },
      });
    });

    it('should return all items when includeInactive is true', async () => {
      prisma.navigationItem.findMany.mockResolvedValue(mockNavItems);

      const result = await getNavigationItems({ includeInactive: true });

      expect(result).toHaveLength(3);
      expect(prisma.navigationItem.findMany).toHaveBeenCalledWith({
        where: undefined,
        orderBy: { order: 'asc' },
      });
    });

    it('should handle string labels (legacy format)', async () => {
      const legacyItems = [
        {
          id: '1',
          href: '/',
          order: 1,
          active: true,
          label: 'Home', // String instead of object
        },
      ];

      prisma.navigationItem.findMany.mockResolvedValue(legacyItems);

      const result = await getNavigationItems();

      expect(result[0].label).toBe('Home');
    });

    it('should fallback to Thai when locale is missing', async () => {
      const itemWithOnlyThai = [
        {
          id: '1',
          href: '/',
          order: 1,
          active: true,
          label: { th: 'หน้าแรก' }, // Missing 'en'
        },
      ];

      prisma.navigationItem.findMany.mockResolvedValue(itemWithOnlyThai);

      const result = await getNavigationItems({ locale: 'en' });

      expect(result[0].label).toBe('หน้าแรก'); // Falls back to Thai
    });

    it('should fallback to English when Thai is missing', async () => {
      const itemWithOnlyEnglish = [
        {
          id: '1',
          href: '/',
          order: 1,
          active: true,
          label: { en: 'Home' }, // Missing 'th'
        },
      ];

      prisma.navigationItem.findMany.mockResolvedValue(itemWithOnlyEnglish);

      const result = await getNavigationItems({ locale: 'th' });

      expect(result[0].label).toBe('Home'); // Falls back to English
    });

    it('should handle null labels gracefully', async () => {
      const itemWithNullLabel = [
        {
          id: '1',
          href: '/',
          order: 1,
          active: true,
          label: null,
        },
      ];

      prisma.navigationItem.findMany.mockResolvedValue(itemWithNullLabel);

      const result = await getNavigationItems();

      expect(result[0].label).toBeNull();
    });

    it('should include translations object', async () => {
      prisma.navigationItem.findMany.mockResolvedValue([mockNavItems[0]]);

      const result = await getNavigationItems();

      expect(result[0].translations).toEqual({ th: 'หน้าแรก', en: 'Home' });
    });

    it('should handle empty database', async () => {
      prisma.navigationItem.findMany.mockResolvedValue([]);

      const result = await getNavigationItems();

      expect(result).toEqual([]);
    });

    it('should use default locale (th) when not specified', async () => {
      prisma.navigationItem.findMany.mockResolvedValue([mockNavItems[0]]);

      const result = await getNavigationItems();

      expect(result[0].label).toBe('หน้าแรก');
    });

    it('should order items by order field ascending', async () => {
      const unorderedItems = [
        { ...mockNavItems[1], order: 3 },
        { ...mockNavItems[0], order: 1 },
      ];

      prisma.navigationItem.findMany.mockResolvedValue(unorderedItems);

      await getNavigationItems();

      expect(prisma.navigationItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { order: 'asc' },
        })
      );
    });

    it('should handle database errors gracefully', async () => {
      prisma.navigationItem.findMany.mockRejectedValue(new Error('Database error'));

      await expect(getNavigationItems()).rejects.toThrow('Database error');
    });

    it('should return all expected fields', async () => {
      prisma.navigationItem.findMany.mockResolvedValue([mockNavItems[0]]);

      const result = await getNavigationItems();

      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('href');
      expect(result[0]).toHaveProperty('order');
      expect(result[0]).toHaveProperty('active');
      expect(result[0]).toHaveProperty('label');
      expect(result[0]).toHaveProperty('translations');
    });
  });
});
