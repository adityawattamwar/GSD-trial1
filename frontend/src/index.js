import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Green practice: Use strict mode to catch potential problems early
// This reduces the need for multiple renders and reloads in production
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Green practice: Use passive event listeners to improve scrolling performance
document.addEventListener('touchstart', function() {}, { passive: true });

// Green practice: Monitor and log cumulative layout shifts (CLS) to optimize rendering
// This reduces unnecessary repaints and reflows
let cls = 0;
new PerformanceObserver((entryList) => {
  for (const entry of entryList.getEntries()) {
    if (!entry.hadRecentInput) {
      cls += entry.value;
      console.log(`Current CLS: ${cls}`);
    }
  }
}).observe({ type: 'layout-shift', buffered: true });

// Green practice: Use intersection observer to detect element visibility
// This allows for more efficient event handling and rendering
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    // Add a data attribute that can be used in CSS to prevent animations for off-screen elements
    if (entry.target.classList.contains('animate-on-visible')) {
      if (entry.isIntersecting) {
        entry.target.setAttribute('data-visible', 'true');
      }
    }
  });
}, { threshold: 0.1 });

// Apply observer once DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.animate-on-visible').forEach(el => {
    observer.observe(el);
  });
});

// Green practice: Use connection-aware loading
if ('connection' in navigator) {
  const connection = navigator.connection;
  
  // If on slow connection or data-saver is enabled, load fewer resources
  if (connection.saveData || connection.effectiveType.includes('2g')) {
    document.body.classList.add('data-saving-mode');
    console.log('Data saving mode activated');
  }
}