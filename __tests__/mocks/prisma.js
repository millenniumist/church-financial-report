/**
 * Prisma Mock
 * Mock Prisma client for testing database operations
 */

import { mockDeep, mockReset } from 'jest-mock-extended';

// Create a deep mock of PrismaClient
export const prismaMock = mockDeep();

// Reset before each test
beforeEach(() => {
  mockReset(prismaMock);
});

/**
 * Mock Prisma responses for common operations
 */
export const mockPrismaResponses = {
  // Mission mocks
  missions: {
    findMany: (data = []) => {
      prismaMock.mission.findMany.mockResolvedValue(data);
    },
    findUnique: (data) => {
      prismaMock.mission.findUnique.mockResolvedValue(data);
    },
    create: (data) => {
      prismaMock.mission.create.mockResolvedValue(data);
    },
    update: (data) => {
      prismaMock.mission.update.mockResolvedValue(data);
    },
    delete: (data) => {
      prismaMock.mission.delete.mockResolvedValue(data);
    },
  },

  // Project mocks
  projects: {
    findMany: (data = []) => {
      prismaMock.futureProject.findMany.mockResolvedValue(data);
    },
    findUnique: (data) => {
      prismaMock.futureProject.findUnique.mockResolvedValue(data);
    },
    create: (data) => {
      prismaMock.futureProject.create.mockResolvedValue(data);
    },
    update: (data) => {
      prismaMock.futureProject.update.mockResolvedValue(data);
    },
    delete: (data) => {
      prismaMock.futureProject.delete.mockResolvedValue(data);
    },
  },

  // Financial Record mocks
  financialRecords: {
    findMany: (data = []) => {
      prismaMock.financialRecord.findMany.mockResolvedValue(data);
    },
    findUnique: (data) => {
      prismaMock.financialRecord.findUnique.mockResolvedValue(data);
    },
    create: (data) => {
      prismaMock.financialRecord.create.mockResolvedValue(data);
    },
    update: (data) => {
      prismaMock.financialRecord.update.mockResolvedValue(data);
    },
    delete: (data) => {
      prismaMock.financialRecord.delete.mockResolvedValue(data);
    },
  },
};

export default prismaMock;
