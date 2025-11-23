/* assets/main.js
   Landing and global behaviors (mobile friendly, minimal)
*/

(function () {
  // Simple progressive enhancement for landing page interactions
  document.addEventListener("DOMContentLoaded", () => {
    // Add subtle float animation to realm cards
    const cards = document.querySelectorAll(".realm-card");
    cards.forEach((c, i) => {
      c.style.transitionDelay = `${i * 40}ms`;
      c.addEventListener("mouseover", () => c.classList.add("hover"));
      c.addEventListener("mouseout", () => c.classList.remove("hover"));
    });

    // Smooth scroll for internal links (if used)
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute("href"));
        if (target) target.scrollIntoView({ behavior: "smooth" });
      });
    });

    // Tiny viewport fix for iOS address bar
    const setVh = () => {
      document.documentElement.style.setProperty("--vh", `${window.innerHeight * 0.01}px`);
    };
    setVh();
    window.addEventListener("resize", setVh);
  });
})();
