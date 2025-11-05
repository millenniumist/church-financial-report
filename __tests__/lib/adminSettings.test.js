import { mergeSettings } from '@/lib/adminSettings';

describe('mergeSettings', () => {
  it('prefers saved visibility and aggregation over detected defaults', () => {
    const detectedCategories = {
      incomeCategories: [
        { id: 'tithes', name: 'Tithes', visible: true },
        { id: 'offerings', name: 'Offerings', visible: true },
      ],
      expenseCategories: [
        { id: 'rent', name: 'Rent', visible: true },
        { id: 'utilities', name: 'Utilities', visible: true },
      ],
    };

    const savedSettings = {
      incomeRows: [
        { id: 'tithes', name: 'Tithes', visible: false },
        { id: 'offerings', name: 'Offerings', visible: true, aggregateInto: 'General' },
      ],
      expenseRows: [
        { id: 'rent', name: 'Rent', visible: true },
      ],
    };

    const result = mergeSettings(detectedCategories, savedSettings);

    expect(result.incomeRows).toEqual([
      { id: 'tithes', name: 'Tithes', visible: false },
      { id: 'offerings', name: 'Offerings', visible: true, aggregateInto: 'General' },
    ]);

    expect(result.expenseRows).toEqual([
      { id: 'rent', name: 'Rent', visible: true },
      { id: 'utilities', name: 'Utilities', visible: true },
    ]);
  });

  it('falls back to detected categories when no saved settings exist', () => {
    const detectedCategories = {
      incomeCategories: [{ id: 'tithes', name: 'Tithes', visible: true }],
      expenseCategories: [{ id: 'rent', name: 'Rent', visible: true }],
    };

    const result = mergeSettings(detectedCategories, undefined);

    expect(result).toEqual({
      incomeRows: detectedCategories.incomeCategories,
      expenseRows: detectedCategories.expenseCategories,
    });
  });
});
