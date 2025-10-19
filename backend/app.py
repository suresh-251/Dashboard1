from flask import Flask, jsonify, send_from_directory
from google.oauth2 import service_account
from googleapiclient.discovery import build
import os, time, json, logging

app = Flask(__name__, static_folder="../frontend/build")

# Enable logging
logging.basicConfig(level=logging.INFO)

# Google Sheets config
SPREADSHEET_ID = "1TggXSG9WbKut8PSD8f6_c3KNtFyFt49CSpnwIis_pBA"
ENROLLMENT = 'Enrollment Data!A1:Z1000'
RENEWAL = 'Renewal Data!A1:Z1000'

# Authentication
if os.getenv("GOOGLE_SERVICE_ACCOUNT"):
    logging.info("Using service account from environment variable")
    service_account_info = json.loads(os.getenv("GOOGLE_SERVICE_ACCOUNT"))
    creds = service_account.Credentials.from_service_account_info(
        service_account_info,
        scopes=["https://www.googleapis.com/auth/spreadsheets.readonly"]
    )
else:
    logging.info("Using local service_account.json")
    SERVICE_ACCOUNT_FILE = os.path.join(os.path.dirname(__file__), 'service_account.json')
    creds = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE,
        scopes=["https://www.googleapis.com/auth/spreadsheets.readonly"]
    )

service = build('sheets', 'v4', credentials=creds, cache_discovery=False)

# Simple cache
cache = {"enrollments": None, "renewals": None, "last_update": 0}
CACHE_TTL = 300  # 5 minutes

def fetch_sheet_data(sheet_range):
    """Fetch data from Google Sheet and return as list of dicts."""
    sheet = service.spreadsheets()
    result = sheet.values().get(spreadsheetId=SPREADSHEET_ID, range=sheet_range).execute()
    values = result.get('values', [])
    if not values:
        return []
    headers = values[0]
    return [dict(zip(headers, row)) for row in values[1:]]

# API routes
@app.route("/api/enroll")
def get_enrollments():
    if cache.get("enrollments") and time.time() - cache["last_update"] < CACHE_TTL:
        return jsonify(cache["enrollments"])
    data = fetch_sheet_data(ENROLLMENT)
    cache["enrollments"] = data
    cache["last_update"] = time.time()
    return jsonify(data)

@app.route("/api/renewals")
def get_renewals():
    if cache.get("renewals") and time.time() - cache["last_update"] < CACHE_TTL:
        return jsonify(cache["renewals"])
    data = fetch_sheet_data(RENEWAL)
    renewals = [
        d for d in data
        if d.get("Due Date") or (d.get("Fees  Remaining Amount ") and float(d.get("Fees  Remaining Amount ") or 0) > 0)
    ]
    cache["renewals"] = renewals
    cache["last_update"] = time.time()
    return jsonify(renewals)

# Serve React frontend
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, "index.html")

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
