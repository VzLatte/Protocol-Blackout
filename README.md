# PROTOCOL: BLACKOUT (v1.2.0-ALPHA)
### [ NEURAL_STRIKE_TERMINAL ]

**PROTOCOL: BLACKOUT** is a high-stakes, "Pass-the-Phone" psychological strategy engine. Designed for mobile-first tactical play, it blends the tension of hidden-information card games with a cold, minimalist "Tactical Noir" aesthetic. 

In the Blackout, vision is a luxury. Information is the only currency.

---

## 👁️ Core Concept: The Shadow Campaign
Unlike traditional strategy games, **PROTOCOL: BLACKOUT** focuses on the friction of human intuition. 
* **Hidden Allocation:** Players secretly allocate Action Points (AP) and movement.
* **The Blackout:** Once turns are submitted, the screen goes dark. Actions resolve simultaneously in the **Resolution Terminal**.
* **Pass-the-Phone Ergonomics:** Built specifically as a Progressive Web App (PWA) to be played on a single device between two operators.

---

## 🛠️ Technical Architecture
The project is engineered for speed, offline reliability, and low-latency feedback.

* **Frontend:** React 18 + TypeScript + Vite
* **Styling:** TailwindCSS (Tactical Noir color palette: `#020617`, `#14b8a6`, `#ef4444`)
* **Engine:** Custom `useGameState` hook for complex state management and simultaneous resolution logic.
* **PWA:** Service Worker integration via `vite-plugin-pwa` for offline tactical readiness.
* **Icons:** Lucide-React for minimalist system telemetry visuals.

---

