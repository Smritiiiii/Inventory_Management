import { fetchAllPages } from "./paginated";

/**
 * Fetches unique categories from ItemType objects
 * ItemType has a category field with fixed choices: "cylinder" and "accessory"
 * This function extracts those unique values and returns them as category objects
 */
export const fetchCategoriesFromItemTypes = async () => {
  try {
    const itemTypes = await fetchAllPages("/api/item-types/");
    
    // Extract unique categories from item types
    const uniqueCategories = new Set();
    itemTypes.forEach(item => {
      if (item.category) {
        uniqueCategories.add(item.category);
      }
    });
    
    // Convert to array of objects with id and name
    const categories = Array.from(uniqueCategories).map((cat, index) => ({
      id: cat,
      name: cat.charAt(0).toUpperCase() + cat.slice(1), // Capitalize first letter
    }));
    
    return categories;
  } catch (error) {
    console.error("Error fetching categories from item types:", error);
    return [];
  }
};
