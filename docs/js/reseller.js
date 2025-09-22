// File: reseller.js
document.addEventListener("DOMContentLoaded", () => {
  console.log("Reseller profile loaded");

  // Simple badge pulse on load
  const badge = document.querySelector(".badge-reseller");
  if (badge) {
    badge.style.transition = "transform 0.45s ease";
    setTimeout(() => badge.style.transform = "scale(1.08)", 250);
    setTimeout(() => badge.style.transform = "scale(1)", 700);
  }

  // Optional: smooth focus for contact phone links on click (tiny UX nicety)
  const phoneLinks = document.querySelectorAll('a[href^="tel:"]');
  phoneLinks.forEach(a => {
    a.addEventListener('click', () => {
      a.style.opacity = '0.6';
      setTimeout(() => a.style.opacity = '', 200);
    });
  });
});
