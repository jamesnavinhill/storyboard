# Vercel Demo Implementation Plan

This document provides a detailed, step-by-step plan for adapting the Storyboard application for a live demo deployment on Vercel. It follows the strategy of using environment variables to ensure no breaking changes are made to the local development environment.

---

## Phase 1: Project Setup and Vercel Configuration

**Goal**: Prepare the local project for Vercel and configure Vercel's environment.

*   **Task 1.1: Install Vercel CLI**
    *   Action: Run `npm install -g vercel`.
    *   Purpose: Allows for local testing of the Vercel environment and deploying from the command line.

*   **Task 1.2: Create `vercel.json`**
    *   Action: Create a `vercel.json` file in the project root.
    *   Purpose: To instruct Vercel on how to build the frontend, handle the backend server, and manage routing.
    *   **Code:**
        ```json
        {
          "version": 2,
          "builds": [
            {
              "src": "vite.config.ts",
              "use": "@vercel/vite"
            },
            {
              "src": "server/index.ts",
              "use": "@vercel/node"
            }
          ],
          "rewrites": [
            {
              "source": "/api/(.*)",
              "destination": "/server/index.ts"
            },
            {
              "source": "/(.*)",
              "destination": "/index.html"
            }
          ]
        }
        ```

*   **Task 1.3: Set up Vercel Project**
    *   Action: Create a new project on the Vercel dashboard and link it to your Git repository. In the project settings, provision a **Vercel Blob** store and a **Vercel Postgres** database.
    *   Purpose: To get the necessary credentials and infrastructure for the cloud services.

*   **Task 1.4: Configure Vercel Environment Variables**
    *   Action: In your Vercel project settings, add the following environment variables:
        *   `DATABASE_URL`: The connection string provided by Vercel Postgres.
        *   `BLOB_READ_WRITE_TOKEN`: The token provided by Vercel Blob.
        *   `GEMINI_API_KEY`: Your own Gemini API key, to be used as a fallback on the server.
    *   Purpose: To securely provide secrets to your application in the cloud.

---

## Phase 2: Abstracting File Storage

**Goal**: Refactor the file storage logic to support both the local filesystem and Vercel Blob.

*   **Task 2.1: Define a Storage Service Interface**
    *   Action: Create a new file `server/services/storageService.ts`. Define a `StorageService` interface that outlines the necessary methods, like `persistFile`.
    *   Purpose: To establish a contract for all storage implementations.

*   **Task 2.2: Implement `LocalStorageService`**
    *   Action: Create `server/services/localStorage.ts`. Move the existing file-saving logic from `server/services/fileUploadService.ts` into a `LocalStorageService` class that implements the `StorageService` interface.
    *   Purpose: To encapsulate the local development behavior.

*   **Task 2.3: Implement `VercelBlobStorageService`**
    *   Action: Install the SDK with `npm install @vercel/blob`. Create `server/services/vercelBlobStorage.ts`. Implement a `VercelBlobStorageService` class that uses the `put` function from `@vercel/blob` to upload files.
    *   Purpose: To encapsulate the Vercel-specific file handling.

*   **Task 2.4: Create the Storage Service Factory**
    *   Action: In `server/services/storageService.ts`, add logic that checks for `process.env.VERCEL_ENV`. If it's present, export an instance of `VercelBlobStorageService`; otherwise, export `LocalStorageService`.
    *   Purpose: To automatically provide the correct service for the environment.

*   **Task 2.5: Update File Upload Logic**
    *   Action: Refactor `server/services/fileUploadService.ts` and the `multer` configuration in `server/routes/files.ts`. Instead of writing to disk directly, they should now import and use the abstract `storageService` from `server/services/storageService.ts`.
    *   Purpose: To decouple the application logic from the storage implementation.

---

## Phase 3: Abstracting the Database

**Goal**: Refactor the data access layer to support both SQLite and PostgreSQL.

*   **Task 3.1: Install PostgreSQL Driver**
    *   Action: Run `npm install pg`.
    *   Purpose: To add the necessary driver for connecting to Vercel Postgres.

*   **Task 3.2: Refactor Database Access**
    *   Action: Modify `server/db.ts`. Instead of creating and exporting a `better-sqlite3` instance directly, create a "Database" class or object that holds the DB connection.
    *   Purpose: To prepare for a dual-database system.

*   **Task 3.3: Implement Conditional DB Connection**
    *   Action: In `server/db.ts`, add a check for `process.env.VERCEL_ENV`.
        *   If `true`, use `pg` to create a connection pool using `process.env.DATABASE_URL`.
        *   If `false`, use `better-sqlite3` as it is currently.
    *   **Crucially**, the exported database object must expose a unified query method (e.g., `db.query()`) that works for both drivers, translating the query syntax if necessary (SQLite uses `?`, `pg` uses `$1, $2, ...`).
    *   Purpose: To create a single point of access for whichever database is active.

*   **Task 3.4: Run Vercel Postgres Migrations**
    *   Action: The `.sql` files in `server/migrations` should be compatible with Postgres. You will need to connect a database client to your Vercel Postgres instance and run these SQL scripts manually or via a script.
    *   Purpose: To set up the required tables and constraints in the production database.

*   **Task 3.5: Update Data Stores**
    *   Action: Review all files in `server/stores` (`projectStore.ts`, `sceneStore.ts`, etc.). Ensure they all use the newly abstracted `db.query()` method from `server/db.ts`.
    *   Purpose: To ensure all parts of the app communicate with the database abstraction layer, not a specific driver.

---

## Phase 4: Implementing User-Provided API Keys

**Goal**: Allow demo users to securely use their own Gemini API key.

*   **Task 4.1: Create Frontend UI**
    *   Action: In the React frontend, add a new component (e.g., in a settings panel or a startup modal) with an input field for the user's Gemini API key.
    *   Purpose: To provide a user-facing way to enter the key.

*   **Task 4.2: Manage Key on the Client**
    *   Action: When the user enters a key, store it in a client-side state management solution (e.g., Zustand, React Context). **Do not use `localStorage` for storing secrets.**
    *   Purpose: To hold the key securely for the duration of the user's session.

*   **Task 4.3: Modify Frontend API Calls**
    *   Action: Update the frontend service responsible for making API calls (e.g., in `src/services/gemini/`). Before sending a request to your backend's AI endpoints (`/api/ai/...`), retrieve the key from the state and add it to the request headers: `Authorization: Bearer YOUR_API_KEY`.
    *   Purpose: To send the key to the backend for single-use processing.

*   **Task 4.4: Update Backend AI Route**
    *   Action: In `server/routes/ai.ts` (or wherever the Gemini client is used), modify the logic to check for an `Authorization` header on incoming requests. If the header is present, extract the token and use it to initialize the Gemini client for that specific request. If not, fall back to using the key from `process.env.GEMINI_API_KEY`.
    *   Purpose: To enable the backend to prioritize the user's key over the server's default key.

---

## Phase 5: Final Deployment and Testing

**Goal**: Push the application to Vercel and verify all functionality.

*   **Task 5.1: Deploy to Vercel**
    *   Action: Commit all changes and push to your Git repository linked to Vercel. Vercel will automatically trigger a new deployment.
    *   Purpose: To build and launch the application in the cloud.

*   **Task 5.2: End-to-End Testing**
    *   Action: Thoroughly test the deployed demo application.
    *   **Test Cases**:
        1.  Can a new project be created? (Tests DB write).
        2.  Can an image be uploaded? (Tests Vercel Blob write).
        3.  Is the uploaded image visible? (Tests Vercel Blob read).
        4.  Does the AI generation work when providing a key on the frontend?
        5.  Does refreshing the page preserve the project data? (Tests DB persistence).
        6.  Does the app still run correctly on your local machine? (Tests that no breaking changes were made).
