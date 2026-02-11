// Quick fix: Clear old event creation draft from sessionStorage
// Run this in your browser console to clear the old draft

console.log('Clearing old event creation draft...');
sessionStorage.removeItem('createEventWizard');
console.log('✅ Old draft cleared! Please refresh the page.');
