/**
 * Utility functions for Chrome storage operations
 */

// Types for storage
export interface StorageData {
  openAIKey?: string;
  lastUsedTone?: 'casual' | 'professional' | 'friendly' | 'concise';
  promptHistory?: string[];
}

/**
 * Get data from Chrome storage
 * @param keys Array of keys to retrieve
 * @returns Promise with the retrieved data
 */
export function getFromStorage<T extends keyof StorageData>(
  keys: T[]
): Promise<Pick<StorageData, T>> {
  return new Promise((resolve) => {
    chrome.storage.local.get(keys, (result) => {
      resolve(result as Pick<StorageData, T>);
    });
  });
}

/**
 * Save data to Chrome storage
 * @param data Object with data to save
 * @returns Promise that resolves when data is saved
 */
export function saveToStorage(data: Partial<StorageData>): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set(data, () => {
      resolve();
    });
  });
}

/**
 * Clear specific keys from Chrome storage
 * @param keys Array of keys to clear
 * @returns Promise that resolves when data is cleared
 */
export function clearFromStorage(keys: (keyof StorageData)[]): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.remove(keys, () => {
      resolve();
    });
  });
}

/**
 * Add a prompt to the history
 * @param prompt The prompt to add
 * @param maxHistory Maximum number of prompts to keep in history
 * @returns Promise that resolves when history is updated
 */
export async function addPromptToHistory(
  prompt: string,
  maxHistory: number = 10
): Promise<void> {
  const { promptHistory = [] } = await getFromStorage(['promptHistory']);
  
  // Add new prompt to the beginning of the array
  const newHistory = [prompt, ...promptHistory.filter(p => p !== prompt)];
  
  // Limit the history size
  const limitedHistory = newHistory.slice(0, maxHistory);
  
  // Save the updated history
  await saveToStorage({ promptHistory: limitedHistory });
}
