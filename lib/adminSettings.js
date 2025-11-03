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

// Get settings from API (client-side only)
export async function getAdminSettings(year = new Date().getFullYear()) {
  if (typeof window === 'undefined') {
    return {
      incomeRows: [],
      expenseRows: []
    };
  }

  try {
    const response = await fetch(`/api/categories/settings?year=${year}`);
    if (!response.ok) {
      throw new Error('Failed to fetch settings');
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading admin settings:', error);
    return {
      incomeRows: [],
      expenseRows: []
    };
  }
}

// Save settings to database via API
export async function saveAdminSettings(settings, year = new Date().getFullYear()) {
  if (typeof window === 'undefined') return { success: false };

  try {
    const response = await fetch('/api/categories/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ settings, year }),
    });

    if (!response.ok) {
      throw new Error('Failed to save settings');
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving admin settings:', error);
    return { success: false, error: error.message };
  }
}

// Reset to default settings
export async function resetAdminSettings(year = new Date().getFullYear()) {
  if (typeof window === 'undefined') return { success: false };

  try {
    const response = await fetch(`/api/categories/settings?year=${year}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to reset settings');
    }

    return await response.json();
  } catch (error) {
    console.error('Error resetting admin settings:', error);
    return { success: false, error: error.message };
  }
}

// Update a single category's visibility or aggregation
export async function updateCategory(code, updates) {
  if (typeof window === 'undefined') return { success: false };

  try {
    const response = await fetch('/api/categories/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code, ...updates }),
    });

    if (!response.ok) {
      throw new Error('Failed to update category');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating category:', error);
    return { success: false, error: error.message };
  }
}
