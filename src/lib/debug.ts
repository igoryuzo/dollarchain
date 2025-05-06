'use client';

// Function to check if the app is running in an iframe
export function isInIframe() {
  if (typeof window === 'undefined') return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

// Function to check if the browser supports local storage
export async function checkLocalStorageAccess() {
  if (typeof window === 'undefined') return false;
  
  try {
    // Try to set and get a test item
    const testKey = '_test_storage_access';
    localStorage.setItem(testKey, 'test');
    const value = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);
    
    return value === 'test';
  } catch (error) {
    console.error('Local storage access error:', error);
    return false;
  }
}

// Function to request storage access if needed
export async function requestStorageAccess() {
  if (typeof window === 'undefined') return false;
  
  if (!isInIframe()) return true; // Not in iframe, no need for special permissions
  
  try {
    // Check if the Document.requestStorageAccess API is available
    if ('requestStorageAccess' in document) {
      // Request storage access
      await document.requestStorageAccess();
      return true;
    } else {
      console.warn('requestStorageAccess API not available in this browser');
      return false;
    }
  } catch (error) {
    console.error('Error requesting storage access:', error);
    return false;
  }
} 