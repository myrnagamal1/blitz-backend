# Blitz Generator Backend — Setup Guide

This guide walks you through setting up the Google Cloud service account and deploying the backend to SAP BTP Cloud Foundry.

## Prerequisites

- Google account with access to Google Cloud Console
- SAP BTP account with Cloud Foundry access to the EU10 region
- GitHub account with personal access token (PAT) for `myrnagamal1`
- Cloud Foundry CLI (`cf`) installed locally
- Node.js 18+ installed

## Part 1: Google Cloud Service Account Setup

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click the project dropdown at the top
3. Click **New Project**
4. Name: `Blitz Generator`
5. Click **Create**
6. Wait for the project to initialize

### Step 2: Enable Required APIs

1. In your `Blitz Generator` project, go to **APIs & Services** > **Library**
2. Search for and enable each of these APIs:
   - **Google Sheets API** — allows reading/writing spreadsheets
   - **Google Drive API** — allows creating and managing files
   - **Apps Script API** — allows script execution and management

To enable an API:
- Search for it in the Library
- Click on it
- Click **Enable**

### Step 3: Create a Service Account

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **Service Account**
3. Fill in:
   - **Service account name:** `blitz-generator`
   - **Service account ID:** (auto-filled, leave as is)
   - **Description:** (optional) "Service account for Blitz Generator backend"
4. Click **Create and Continue**
5. Under "Grant this service account access to project":
   - **Role:** Select **Editor** (provides full access to create and manage Drive files)
6. Click **Continue**
7. Click **Done**

### Step 4: Download the Service Account JSON Key

1. Go to **APIs & Services** > **Credentials**
2. Under "Service Accounts," click on `blitz-generator`
3. Go to the **Keys** tab
4. Click **Add Key** > **Create new key**
5. Choose **JSON** format
6. Click **Create**
7. A JSON file will download automatically
8. Rename it to `service-account.json` and place it in the root of the `blitz-backend` directory

**IMPORTANT:** Never commit this file to Git. It contains credentials. It is already listed in `.gitignore`.

### Step 5: Verify Apps Script API is Enabled

1. Go to **APIs & Services** > **Enabled APIs & services**
2. Confirm **Apps Script API** appears in the list and shows "Enabled"

If not enabled, go to **APIs & Services** > **Library**, search for "Apps Script API," and click **Enable**.

## Part 2: Set Up Git Ignore

The file `.gitignore` should already exist in `blitz-backend/`. Verify it contains:

```
service-account.json
node_modules/
.DS_Store
dist/
build/
```

If you created this file manually, ensure `service-account.json` is in it so you never accidentally commit your credentials.

## Part 3: Deploy to SAP BTP Cloud Foundry

### Step 1: Set Environment Variables Locally (Optional, for local testing)

If you want to test the backend locally before deploying:

1. In `blitz-backend/`, create a file named `.env`:

```
GITHUB_TOKEN=ghp_your_personal_access_token_here
GOOGLE_SERVICE_ACCOUNT_JSON=$(cat service-account.json)
WIZARD_ORIGIN=https://myrnagamal1.github.io/blitz-generator
```

2. Replace `ghp_your_personal_access_token_here` with your actual GitHub personal access token from `myrnagamal1`'s account.

3. To load and test locally:
   ```bash
   npm install
   npm start
   ```

### Step 2: Deploy to BTP Cloud Foundry

1. **Log in to Cloud Foundry:**
   ```bash
   cf login -a https://api.cf.eu10.hana.ondemand.com
   ```
   - Select your organization and space when prompted

2. **Navigate to the backend directory and deploy:**
   ```bash
   cd blitz-backend
   cf push
   ```
   - This reads the `manifest.yml` file and deploys the app

3. **Set environment variables on the deployed app:**
   ```bash
   cf set-env blitz-backend GITHUB_TOKEN "ghp_your_personal_access_token_here"
   ```
   Replace with the actual GitHub token.

   ```bash
   cf set-env blitz-backend GOOGLE_SERVICE_ACCOUNT_JSON "$(cat service-account.json)"
   ```
   This injects the entire service account key as an environment variable.

   ```bash
   cf set-env blitz-backend WIZARD_ORIGIN "https://myrnagamal1.github.io/blitz-generator"
   ```

4. **Restage the application to apply the environment variables:**
   ```bash
   cf restage blitz-backend
   ```
   - This restarts the app with the new variables loaded

5. **Check the app is running:**
   ```bash
   cf logs blitz-backend --recent
   ```
   or
   ```bash
   cf apps
   ```

### Step 3: Get the Backend URL

After deployment, the app will be assigned a URL. Find it with:

```bash
cf app blitz-backend
```

Look for the **routes** field. It will look something like:
```
https://blitz-backend-xxxx.cfapps.eu10.hana.ondemand.com
```

## Part 4: Update the Wizard Frontend

Once the backend is deployed and you have its URL:

1. Open `blitz-generator/index.html` in your editor
2. Find the line that sets `BACKEND_URL` (usually near the top in a `<script>` tag)
3. Update it to the actual deployed backend URL:
   ```javascript
   const BACKEND_URL = "https://blitz-backend-xxxx.cfapps.eu10.hana.ondemand.com";
   ```
4. Save and commit the change:
   ```bash
   git add blitz-generator/index.html
   git commit -m "chore: update BACKEND_URL to deployed BTP instance"
   git push origin main
   ```

5. **Enable GitHub Pages** (if not already enabled):
   - Go to the repo on GitHub
   - Settings > Pages
   - Source: Deploy from a branch
   - Branch: `main` (or your deployment branch)
   - Folder: `/(root)` or `/docs` depending on your setup
   - Save

The wizard will then be live at `https://myrnagamal1.github.io/blitz-generator`

## Troubleshooting

### Service account credentials not working
- Verify the JSON file is valid (open it and check the structure)
- Ensure all three APIs (Sheets, Drive, Apps Script) are enabled
- Check that the service account has Editor role

### Backend deployment fails
- Check logs: `cf logs blitz-backend --recent`
- Ensure Node version matches in `package.json`
- Verify `manifest.yml` has correct entry point

### Environment variables not loading
- After `cf set-env`, always run `cf restage` to apply changes
- Verify variables are set: `cf env blitz-backend`

### CORS or wizard connection errors
- Ensure `WIZARD_ORIGIN` matches the exact URL of the wizard (with https://)
- Check the backend logs for specific error messages

## Next Steps

Once deployed and verified working:
- Proceed with Task 3: Sheets integration
- Proceed with Task 4: Apps Script integration
- Monitor backend logs regularly for errors

For more information, see the main [README](../docs/README.md) in the Blitz Generator repository.
