


const { categories, getMainCategories } = require('../categories');



// Import the necessary functions from the module
describe('getMainCategories() getMainCategories method', () => {
  // Happy Path Tests
  test('should return an array of main categories with correct structure', () => {
    // Arrange & Act
    const result = getMainCategories();

    // Assert
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    result.forEach(category => {
      expect(category).toHaveProperty('id');
      expect(category).toHaveProperty('name');
      expect(category).toHaveProperty('icon');
      expect(category).toHaveProperty('description');
      expect(category).toHaveProperty('subcategoryCount');
      expect(typeof category.id).toBe('string');
      expect(typeof category.name).toBe('string');
      expect(typeof category.icon).toBe('string');
      expect(typeof category.description).toBe('string');
      expect(typeof category.subcategoryCount).toBe('number');
    });
  });

  test('should correctly count the number of subcategories for each main category', () => {
    // Arrange & Act
    const result = getMainCategories();

    // Assert
    result.forEach(category => {
      const originalCategory = categories.find(cat => cat.id === category.id);
      expect(category.subcategoryCount).toBe(originalCategory.subcategories.length);
    });
  });

  // Edge Case Tests
  test('should handle an empty categories array gracefully', () => {
    // Arrange
    const originalCategories = categories;
    categories = []; // Temporarily set categories to an empty array

    // Act
    const result = getMainCategories();

    // Assert
    expect(result).toEqual([]);

    // Cleanup
    categories = originalCategories; // Restore original categories
  });

  test('should handle categories with no subcategories', () => {
    // Arrange
    const originalCategories = categories;
    categories = [
      {
        id: 'empty-category',
        name: 'Empty Category',
        icon: '❓',
        description: 'A category with no subcategories',
        subcategories: []
      }
    ];

    // Act
    const result = getMainCategories();

    // Assert
    expect(result).toEqual([
      {
        id: 'empty-category',
        name: 'Empty Category',
        icon: '❓',
        description: 'A category with no subcategories',
        subcategoryCount: 0
      }
    ]);

    // Cleanup
    categories = originalCategories; // Restore original categories
  });
});