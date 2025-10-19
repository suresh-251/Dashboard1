# Enrollment & Renewal Dashboard

A Flask + React application to manage and display enrollment and renewal data from Google Sheets. The backend is in Flask and serves both API endpoints and the React frontend build.

## Project Structure

/backend      - Flask backend with APIs and static folder for React build
/frontend     - React frontend

APIs provided by backend: `/api/enroll` for enrollment data, `/api/renewals` for renewal data. React frontend fetches and displays these APIs.

## Prerequisites

* Python 3.10+
* Node.js 18+ / npm 9+
* Google account with access to Sheets

## Google Service Account Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a project.
3. Enable **Google Sheets API**.
4. Create a **Service Account** under IAM & Admin → Service Accounts → + Create.
5. Assign role: **Project → Viewer** or **Sheets → Viewer**.
6. Create a **JSON key** and download it.
7. Share your Google Sheet with the service account email (`client_email`) with Viewer access.
8. Place the downloaded `service_account.json` inside the `backend/` folder.

> Do **not** commit `service_account.json` to GitHub. Treat it as a secret.

## Configure Spreadsheet ID

In `backend/app.py`, replace `SPREADSHEET_ID` with your Google Sheet ID:

```python
SPREADSHEET_ID = "your_google_sheet_id_here"
```

## Install Dependencies

### Backend

```
cd backend
pip install -r requirements.txt
```

### Frontend

```
cd frontend
npm install
npm run build
```

React build will be placed in `frontend/build` and served by Flask.

## Run Locally

From the `backend` folder:

```
python app.py
```

* App runs on `http://localhost:5000`.
* API endpoints: `/api/enroll` and `/api/renewals`.
* React frontend served at `/`.

## Notes

* Flask caches Google Sheet data for 5 minutes to reduce API calls.
* App reads credentials directly from `service_account.json`.
* Sheet headers must match expected columns for enrollment and renewal.

## Folder Overview

```
backend/
    app.py
    requirements.txt
    service_account.json 
frontend/
    package.json
    src/
    build/ (after npm run build)
```

## Security

* Never commit `service_account.json` to GitHub.
* Keep it in `backend/` and ensure it is ignored by `.gitignore` if pushing to a public repo.
