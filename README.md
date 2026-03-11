# RollVault 🎞️

RollVault is a beautiful, minimalist digital archive for analog photographers. It allows you to organize your developed film rolls, group them into archives, and share your photography portfolio through a stunning, cinematic horizontal film-strip interface.

## ✨ Features

*   **Cinematic Roll View:** A horizontally scrolling, photorealistic film-strip viewer for showcasing your frames.
*   **Public Profiles:** A sleek "Linktree-style" public profile page where you can share your entire portfolio (`yourdomain.com/username`).
*   **Archives:** Organize your rolls into thematic collections (e.g., "Summer '23", "Portraits").
*   **Drag & Drop Uploading:** Easily batch upload your high-res film scans into a roll.
*   **Cover Customization:** Set custom cover images or let RollVault automatically select the first frame.
*   **Live Vault metrics:** Keep track of your total frames, rolls, and archives.
*   **Account Security:** Email verification gate on login, optional authenticator app MFA (TOTP), password reset, login via email/username, pending email-change confirmation flow, and automatic purge of unverified accounts older than 24 hours.

## 🛠 Tech Stack

RollVault is built with modern, high-performance web technologies:

*   **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS + custom CSS animations
*   **Database:** SQLite (Default, local-first)
*   **ORM:** [Prisma](https://www.prisma.io/)
*   **Authentication:** NextAuth.js (Credentials Provider)
*   **Icons:** Lucide React

## 🚀 Getting Started

RollVault is designed to be self-hosted. By default, it uses a local SQLite database and saves uploads directly to the local filesystem, making it incredibly easy to spin up on a small VPS or Raspberry Pi.

### Prerequisites
*   Node.js (v18 or newer)
*   npm or pnpm

### Installation

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
    *Note: You can generate a NextAuth secret using `openssl rand -base64 32`.*

4.  **Initialize the database**
    Push the Prisma schema to generate your SQLite database file:
    ```bash
    npx prisma db push
    ```

5.  **Run the development server**
    ```bash
    npm run dev
    ```

6.  **Create your account**
    Open `http://localhost:3012` in your browser, hit the register button, and create your first photographer account!

## 🔐 Privacy & Storage

Out of the box, RollVault is local-first.
- All user accounts, rolls, and metadata are stored in `prisma/dev.db`.
- All uploaded film scans are stored in `public/uploads/`.
- Neither of these paths are tracked by Git, keeping your portfolio completely private even if you fork or push this repository string. 

If you plan to scale RollVault or deploy to a serverless platform (like Vercel), you will need to swap the SQLite provider to PostgreSQL in `schema.prisma` and implement an external S3-compatible storage provider (like AWS S3 or Cloudflare R2).

## 📬 Verification Delivery Setup

To make verification and password reset delivery reliable in production:

1. **Resend (Email)**
   - Verify your sending domain in Resend.
   - Add required DNS records (SPF + DKIM) in your DNS provider.
   - Use a verified `EMAIL_FROM` address.

2. **App URL**
   - Set `APP_BASE_URL` to your public app URL so password reset links are valid in email.

3. **Unverified account expiration**
   - Accounts that are still unverified after 24 hours are deleted automatically during authentication flows (register/login checks).

4. **Production checklist**
   - `NODE_ENV=production`
   - All email env vars are set (`RESEND_API_KEY`, `EMAIL_FROM`, optional `EMAIL_REPLY_TO`)
   - Domain DNS fully propagated
   - Test before launch:
     - registration (email verification)
     - profile resend verification
     - forgot password reset link
     - email change confirmation link
     - login with optional authenticator app MFA

## 📄 License
This project is open source and available under the [MIT License](LICENSE).
