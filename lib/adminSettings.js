// Merge detected categories with saved settings
export function mergeSettings(detectedCategories, savedSettings) {
  const result = {
    incomeRows: [],
    expenseRows: []
  };

  // Merge income categories
  if (detectedCategories.incomeCategories) {
    result.incomeRows = detectedCategories.incomeCategories.map(detected => {
      const saved = savedSettings?.incomeRows?.find(s => s.id === detected.id);
      return saved || detected;
    });
  }

  // Merge expense categories
  if (detectedCategories.expenseCategories) {
    result.expenseRows = detectedCategories.expenseCategories.map(detected => {
      const saved = savedSettings?.expenseRows?.find(s => s.id === detected.id);
      return saved || detected;
    });
  }

  return result;
}

// Get settings from localStorage (client-side only)
export function getAdminSettings() {
  if (typeof window === 'undefined') {
    return {
      incomeRows: [],
      expenseRows: []
    };
  }

  const stored = localStorage.getItem('financialAdminSettings');
  if (!stored) return null;

  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

// Save settings to localStorage
export function saveAdminSettings(settings) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('financialAdminSettings', JSON.stringify(settings));
}

// Reset to default settings
export function resetAdminSettings() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('financialAdminSettings');
}
