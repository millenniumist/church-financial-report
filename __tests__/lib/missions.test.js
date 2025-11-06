/**
 * @jest-environment node
 */

import { prisma } from '@/lib/prisma';
import { normalizeMission, getMissions, getAllMissions, DEFAULT_LOCALE } from '@/lib/missions';
import { factories } from '../utils/test-helpers';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    mission: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe('missions.js', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('normalizeMission', () => {
    it('should normalize mission with Thai locale', () => {
      const rawMission = {
        slug: 'test-mission',
        title: { th: 'ทดสอบ', en: 'Test' },
        theme: { th: 'ธีม', en: 'Theme' },
        summary: { th: 'สรุป', en: 'Summary' },
        description: { th: 'รายละเอียด', en: 'Description' },
        focusAreas: { th: ['พื้นที่ 1', 'พื้นที่ 2'], en: ['Area 1', 'Area 2'] },
        scripture: {
          reference: { th: 'มัทธิว 5:16', en: 'Matthew 5:16' },
          text: { th: 'ข้อความไทย', en: 'English text' },
        },
        nextSteps: { th: ['ขั้นตอน 1', 'ขั้นตอน 2'], en: ['Step 1', 'Step 2'] },
        pinned: true,
        heroImageUrl: 'https://example.com/image.jpg',
        images: ['img1.jpg', 'img2.jpg'],
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        updatedAt: new Date('2024-01-15'),
        createdAt: new Date('2024-01-01'),
      };

      const normalized = normalizeMission(rawMission, 'th');

      expect(normalized).toMatchObject({
        id: 'test-mission',
        slug: 'test-mission',
        title: 'ทดสอบ',
        theme: 'ธีม',
        summary: 'สรุป',
        description: 'รายละเอียด',
        focusAreas: ['พื้นที่ 1', 'พื้นที่ 2'],
        scripture: {
          reference: 'มัทธิว 5:16',
          text: 'ข้อความไทย',
        },
        nextSteps: ['ขั้นตอน 1', 'ขั้นตอน 2'],
        pinned: true,
        heroImageUrl: 'https://example.com/image.jpg',
        images: ['img1.jpg', 'img2.jpg'],
      });
    });

    it('should normalize mission with English locale', () => {
      const rawMission = {
        slug: 'test-mission',
        title: { th: 'ทดสอบ', en: 'Test' },
        theme: { th: 'ธีม', en: 'Theme' },
        summary: { th: 'สรุป', en: 'Summary' },
        description: { th: 'รายละเอียด', en: 'Description' },
        focusAreas: { th: ['พื้นที่ 1'], en: ['Area 1'] },
        scripture: {
          reference: { th: 'มัทธิว 5:16', en: 'Matthew 5:16' },
          text: { th: 'ข้อความไทย', en: 'English text' },
        },
        nextSteps: { th: ['ขั้นตอน 1'], en: ['Step 1'] },
        pinned: false,
        heroImageUrl: null,
        images: [],
        startDate: null,
        endDate: null,
        updatedAt: new Date(),
        createdAt: new Date(),
      };

      const normalized = normalizeMission(rawMission, 'en');

      expect(normalized.title).toBe('Test');
      expect(normalized.theme).toBe('Theme');
      expect(normalized.summary).toBe('Summary');
      expect(normalized.description).toBe('Description');
      expect(normalized.focusAreas).toEqual(['Area 1']);
      expect(normalized.scripture.reference).toBe('Matthew 5:16');
      expect(normalized.scripture.text).toBe('English text');
      expect(normalized.nextSteps).toEqual(['Step 1']);
    });

    it('should handle string values (legacy format)', () => {
      const rawMission = {
        slug: 'legacy-mission',
        title: 'Legacy Title',
        theme: 'Legacy Theme',
        summary: 'Legacy Summary',
        description: 'Legacy Description',
        focusAreas: ['Focus 1', 'Focus 2'],
        scripture: {
          reference: 'John 3:16',
          text: 'For God so loved the world',
        },
        nextSteps: ['Step 1', 'Step 2'],
        pinned: false,
        heroImageUrl: null,
        images: [],
        startDate: null,
        endDate: null,
        updatedAt: new Date(),
        createdAt: new Date(),
      };

      const normalized = normalizeMission(rawMission);

      expect(normalized.title).toBe('Legacy Title');
      expect(normalized.theme).toBe('Legacy Theme');
      expect(normalized.focusAreas).toEqual(['Focus 1', 'Focus 2']);
      expect(normalized.scripture.reference).toBe('John 3:16');
    });

    it('should handle null/undefined values gracefully', () => {
      const rawMission = {
        slug: 'minimal-mission',
        title: null,
        theme: undefined,
        summary: null,
        description: null,
        focusAreas: null,
        scripture: null,
        nextSteps: null,
        pinned: false,
        heroImageUrl: null,
        images: null,
        startDate: null,
        endDate: null,
        updatedAt: new Date(),
        createdAt: new Date(),
      };

      const normalized = normalizeMission(rawMission);

      expect(normalized.title).toBeNull();
      expect(normalized.theme).toBeNull();
      expect(normalized.focusAreas).toEqual([]);
      expect(normalized.scripture).toEqual({ reference: null, text: null });
      expect(normalized.nextSteps).toEqual([]);
      expect(normalized.images).toEqual([]);
    });

    it('should fallback to Thai when requested locale is missing', () => {
      const rawMission = {
        slug: 'test-mission',
        title: { th: 'ทดสอบ' }, // Missing 'en'
        theme: { th: 'ธีม' },
        summary: { th: 'สรุป' },
        description: { th: 'รายละเอียด' },
        focusAreas: { th: ['พื้นที่ 1'] },
        scripture: null,
        nextSteps: { th: ['ขั้นตอน 1'] },
        pinned: false,
        heroImageUrl: null,
        images: [],
        startDate: null,
        endDate: null,
        updatedAt: new Date(),
        createdAt: new Date(),
      };

      const normalized = normalizeMission(rawMission, 'en');

      // Should fallback to Thai
      expect(normalized.title).toBe('ทดสอบ');
      expect(normalized.theme).toBe('ธีม');
    });

    it('should include all translations in the translations object', () => {
      const rawMission = factories.mission();
      const normalized = normalizeMission(rawMission);

      expect(normalized.translations).toBeDefined();
      expect(normalized.translations.title).toEqual(rawMission.title);
      expect(normalized.translations.theme).toEqual(rawMission.theme);
      expect(normalized.translations.summary).toEqual(rawMission.summary);
    });
  });

  describe('getMissions', () => {
    it('should return paginated missions with pinned missions', async () => {
      const pinnedMissions = [
        factories.mission({ slug: 'pinned-1', pinned: true }),
        factories.mission({ slug: 'pinned-2', pinned: true }),
      ];
      const regularMissions = [
        factories.mission({ slug: 'regular-1', pinned: false }),
        factories.mission({ slug: 'regular-2', pinned: false }),
      ];

      prisma.mission.findMany.mockImplementation(({ where }) => {
        if (where.pinned === true) return Promise.resolve(pinnedMissions);
        if (where.pinned === false) return Promise.resolve(regularMissions);
        return Promise.resolve([]);
      });

      prisma.mission.count.mockResolvedValue(10);

      const result = await getMissions({ page: 1, pageSize: 6, locale: 'th' });

      expect(result.pinned).toHaveLength(2);
      expect(result.missions).toHaveLength(2);
      expect(result.pagination).toEqual({
        page: 1,
        pageSize: 6,
        totalItems: 10,
        totalPages: 2,
        hasNextPage: true,
        hasPreviousPage: false,
      });
    });

    it('should handle pagination correctly', async () => {
      prisma.mission.findMany.mockResolvedValue([]);
      prisma.mission.count.mockResolvedValue(20);

      const result = await getMissions({ page: 2, pageSize: 5 });

      expect(result.pagination).toEqual({
        page: 2,
        pageSize: 5,
        totalItems: 20,
        totalPages: 4,
        hasNextPage: true,
        hasPreviousPage: true,
      });

      // Verify skip and take are correct
      expect(prisma.mission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5, // (page 2 - 1) * pageSize 5
          take: 5,
        })
      );
    });

    it('should handle page out of bounds (too high)', async () => {
      prisma.mission.findMany.mockResolvedValue([]);
      prisma.mission.count.mockResolvedValue(10);

      const result = await getMissions({ page: 100, pageSize: 5 });

      // Should clamp to max page
      expect(result.pagination.page).toBe(2); // 10 items / 5 per page = 2 pages
      expect(result.pagination.hasNextPage).toBe(false);
    });

    it('should handle page less than 1', async () => {
      prisma.mission.findMany.mockResolvedValue([]);
      prisma.mission.count.mockResolvedValue(10);

      const result = await getMissions({ page: 0, pageSize: 5 });

      // Should clamp to min page (1)
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.hasPreviousPage).toBe(false);
    });

    it('should handle zero or negative pageSize', async () => {
      prisma.mission.findMany.mockResolvedValue([]);
      prisma.mission.count.mockResolvedValue(10);

      const result = await getMissions({ page: 1, pageSize: 0 });

      // Should use safe minimum of 1
      expect(result.pagination.pageSize).toBe(1);
    });

    it('should use default values when no params provided', async () => {
      prisma.mission.findMany.mockResolvedValue([]);
      prisma.mission.count.mockResolvedValue(0);

      const result = await getMissions();

      expect(result.pagination.page).toBe(1);
      expect(result.pagination.pageSize).toBe(6);
    });

    it('should normalize all missions with correct locale', async () => {
      const mockMission = factories.mission({
        title: { th: 'ทดสอบ', en: 'Test' },
      });

      prisma.mission.findMany.mockResolvedValue([mockMission]);
      prisma.mission.count.mockResolvedValue(1);

      const result = await getMissions({ locale: 'en' });

      expect(result.missions[0].title).toBe('Test');
    });

    it('should handle empty database', async () => {
      prisma.mission.findMany.mockResolvedValue([]);
      prisma.mission.count.mockResolvedValue(0);

      const result = await getMissions();

      expect(result.pinned).toEqual([]);
      expect(result.missions).toEqual([]);
      expect(result.pagination.totalPages).toBe(1);
      expect(result.pagination.totalItems).toBe(0);
    });
  });

  describe('getAllMissions', () => {
    it('should return all missions ordered by pinned then updatedAt', async () => {
      const missions = [
        factories.mission({ slug: 'pinned-1', pinned: true, updatedAt: new Date('2024-01-15') }),
        factories.mission({ slug: 'pinned-2', pinned: true, updatedAt: new Date('2024-01-10') }),
        factories.mission({ slug: 'regular-1', pinned: false, updatedAt: new Date('2024-01-20') }),
        factories.mission({ slug: 'regular-2', pinned: false, updatedAt: new Date('2024-01-05') }),
      ];

      prisma.mission.findMany.mockResolvedValue(missions);

      const result = await getAllMissions();

      expect(result).toHaveLength(4);
      expect(prisma.mission.findMany).toHaveBeenCalledWith({
        orderBy: [{ pinned: 'desc' }, { updatedAt: 'desc' }],
      });
    });

    it('should normalize all missions with correct locale', async () => {
      const mockMissions = [
        factories.mission({ title: { th: 'ทดสอบ 1', en: 'Test 1' } }),
        factories.mission({ title: { th: 'ทดสอบ 2', en: 'Test 2' } }),
      ];

      prisma.mission.findMany.mockResolvedValue(mockMissions);

      const result = await getAllMissions({ locale: 'en' });

      expect(result[0].title).toBe('Test 1');
      expect(result[1].title).toBe('Test 2');
    });

    it('should use default locale when not specified', async () => {
      const mockMission = factories.mission({
        title: { th: 'ทดสอบ', en: 'Test' },
      });

      prisma.mission.findMany.mockResolvedValue([mockMission]);

      const result = await getAllMissions();

      // Default locale is 'th'
      expect(result[0].title).toBe('ทดสอบ');
    });

    it('should handle empty database', async () => {
      prisma.mission.findMany.mockResolvedValue([]);

      const result = await getAllMissions();

      expect(result).toEqual([]);
    });

    it('should return all fields including translations', async () => {
      const mockMission = factories.mission();
      prisma.mission.findMany.mockResolvedValue([mockMission]);

      const result = await getAllMissions();

      expect(result[0]).toHaveProperty('translations');
      expect(result[0].translations).toHaveProperty('title');
      expect(result[0].translations).toHaveProperty('theme');
      expect(result[0].translations).toHaveProperty('summary');
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle database errors gracefully in getMissions', async () => {
      prisma.mission.findMany.mockRejectedValue(new Error('Database connection failed'));

      await expect(getMissions()).rejects.toThrow('Database connection failed');
    });

    it('should handle database errors gracefully in getAllMissions', async () => {
      prisma.mission.findMany.mockRejectedValue(new Error('Database connection failed'));

      await expect(getAllMissions()).rejects.toThrow('Database connection failed');
    });
  });
});
