# Daily Effectiveness Logger

**A client-side web application for quantifying your daily productivity, identifying patterns, and building better habits. All your data stays on your device.**

---

![Daily Effectiveness Logger Screenshot]!(https://github.com/user-attachments/assets/5ae83ebe-9a93-4e46-a1b3-a057c78b3dfc)

### The Problem with "Busy"
Many of us fall into the "busy but not productive" trap. We finish a day full of tasks but feel no closer to our most important goals. It's hard to know where our time and energy truly go, making it difficult to improve.

The **Daily Effectiveness Logger** solves this by providing a private, data-driven mirror for your daily efforts. It moves beyond simple to-do lists to help you understand the *quality* and *impact* of your work.

### Core Features

* **📈 Quantitative Daily Score:** Log your activities against value-based categories (e.g., Deep Work, Shallow Work, Learning) to get an objective score for your day.
* **📊 Advanced Ratios:** Instantly see your **Focus Ratio**, **Distraction Ratio**, and **Productivity Throughput** to understand your effectiveness at a glance.
* **🎮 Gamification Engine:** Stay motivated by earning XP, leveling up, and building daily logging streaks.
* **🗓️ Visual Analytics:** Use the **Weekly Timetable** and **Monthly Overview** to visualize your work patterns, identify your peak energy hours, and track trends over time.
* **🔒 100% Private & Offline:** All data is stored exclusively in your browser's **IndexedDB**. Nothing is ever sent to a server. The app works perfectly offline after the initial load.
* **💼 Data Portability:** You have full control. Export your entire data history to a JSON file for backup or import it to a new device.

---

### Development Roadmap

This project is being built in stages. Here is the current development plan:

* [✅] **Milestone 1: MVP - Core Logging & Scoring Engine**
    * Log activities with categories, time, and energy levels.
    * Calculate a basic daily score.
    * Store all data in IndexedDB.

* [✅] **Milestone 2: The Dashboard & Key Ratios**
    * Build the main dashboard UI.
    * Display KPI cards for Focus Ratio, Distraction Ratio, etc.

* [✅] 

* [▶️] **Milestone 3: Advanced Weekly Analytics** (In Progress)
    * Build the grid-based Weekly Timetable view.
    * Visualize activities as colored blocks.

* [⬜] **Milestone 4: Long-Term Trend Analysis**
    * Create the Monthly Overview calendar.
    * Develop charts for tracking key metrics over time.

* [⬜] **Milestone 5: Data Portability & Housekeeping**
    * Implement JSON data export and import.
    * Add a "delete all data" function.
* [⬜] **Milestone 6: Gamification & Habit Formation**
    * Implement XP, levels, and daily streaks.
    * Add Vitality Bonuses for daily habits (sleep, exercise).
---

### Technology Stack

* **Frontend:** HTML5, CSS3, JavaScript (ES6+)
* **Storage:** IndexedDB API (for client-side storage)
* **No Frameworks:** Built with vanilla JavaScript to stay lightweight and fast.

---

### Getting Started

Since this is a purely client-side application, there's no build process required.

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/your-username/daily-effectiveness-logger.git](https://github.com/your-username/daily-effectiveness-logger.git)
    ```
2.  **Navigate to the directory:**
    ```bash
    cd daily-effectiveness-logger
    ```
3.  **Open the `index.html` file in your browser.**
    That's it! The application is ready to use.

---

### How to Contribute

Contributions are welcome and appreciated! Whether you want to fix a bug, add a feature, or improve documentation, your help is valuable.

1.  **Fork the repository.**
2.  **Create a new branch** for your feature or fix (`git checkout -b feature/your-feature-name`).
3.  **Make your changes.**
4.  **Commit your changes** (`git commit -m 'Add some amazing feature'`).
5.  **Push to the branch** (`git push origin feature/your-feature-name`).
6.  **Open a Pull Request.**

Please check the **Issues** tab to see if there are tasks you can help with.

---

### License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

# This app is built by Lovable and Gemini
## Project info

**URL**: https://lovable.dev/projects/b2df0b46-132a-4797-99c4-a665e8bd6e60

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/b2df0b46-132a-4797-99c4-a665e8bd6e60) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/b2df0b46-132a-4797-99c4-a665e8bd6e60) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
