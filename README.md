# RollVault

RollVault is a beautiful, minimalist digital archive for analog photographers. Organize your developed film rolls, group them into archives, and share your photography portfolio through a cinematic horizontal film-strip interface — all in one place.

> **RollVault is a free public service.** Sign up and start sharing your film photography today. The source code is open for transparency and community contributions.

## Features

*   **Cinematic Roll View:** A horizontally scrolling, photorealistic film-strip viewer for showcasing your frames.
*   **Public Profiles:** A sleek public profile page where you can share your entire portfolio (`rollvault.app/username`).
*   **Archives:** Organize your rolls into thematic collections (e.g., "Summer '23", "Portraits").
*   **Drag & Drop Uploading:** Easily batch upload your high-res film scans into a roll.
*   **Cover Customization:** Set custom cover images or let RollVault automatically select the first frame.
*   **Live Vault Metrics:** Keep track of your total frames, rolls, and archives.
*   **Account Security:** Email verification, optional authenticator app MFA (TOTP), password reset, and login via email or username.

## Tech Stack

*   **Framework:** [Next.js](https://nextjs.org/) (App Router)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS + custom CSS animations
*   **Database:** SQLite / Prisma ORM
*   **Authentication:** NextAuth.js (Credentials Provider)
*   **Icons:** Lucide React

## Contributing

RollVault's source is open so the community can follow along, report bugs, and contribute improvements. If you'd like to run a local development environment to contribute:

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/rollvault.git
    cd rollvault
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Set up environment variables**
    Create a `.env` file in the root directory:
    ```env
    DATABASE_URL="file:./dev.db"
    NEXTAUTH_SECRET="generate-a-random-32-char-string-here"
    NEXTAUTH_URL="http://localhost:3012"
    APP_NAME="RollVault"
    APP_BASE_URL="http://localhost:3012"

    # Email delivery (Resend)
    RESEND_API_KEY="re_xxx"
    EMAIL_FROM="RollVault <no-reply@yourdomain.com>"
    EMAIL_REPLY_TO="support@yourdomain.com"
    ```

4.  **Initialize the database**
    ```bash
    npx prisma db push
    ```

5.  **Run the development server**
    ```bash
    npm run dev
    ```

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
