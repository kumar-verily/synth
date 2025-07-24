import sqlite3
import json
from typing import List, Dict, Optional

DB_FILE = "cliniverse_synth.db"

def init_db():
    """Initializes the SQLite database and creates the patients table."""
    with sqlite3.connect(DB_FILE) as con:
        cur = con.cursor()
        cur.execute('''
            CREATE TABLE IF NOT EXISTS patients (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                data TEXT NOT NULL
            )
        ''')
    print(f"Database '{DB_FILE}' is ready.")

def add_patient_to_db(patient_data: Dict):
    """Adds or replaces a patient record in the database."""
    patient_json = json.dumps(patient_data)
    with sqlite3.connect(DB_FILE) as con:
        cur = con.cursor()
        cur.execute(
            "INSERT OR REPLACE INTO patients (id, name, data) VALUES (?, ?, ?)",
            (
                patient_data['id'],
                patient_data['name'],
                patient_json
            )
        )
    print(f"Saved patient {patient_data['name']} to DB.")

def update_patient_in_db(patient_id: str, patient_data: Dict):
    """Updates an existing patient record in the database."""
    patient_json = json.dumps(patient_data)
    with sqlite3.connect(DB_FILE) as con:
        cur = con.cursor()
        cur.execute(
            "UPDATE patients SET name = ?, data = ? WHERE id = ?",
            (
                patient_data.get('name', 'Unknown'), # Update name as well
                patient_json,
                patient_id
            )
        )
    print(f"Updated patient {patient_id} in DB.")


def get_all_patients_from_db() -> List[Dict]:
    """Retrieves a summary of all patients from the database."""
    with sqlite3.connect(DB_FILE) as con:
        con.row_factory = sqlite3.Row
        cur = con.cursor()
        cur.execute("SELECT id, name FROM patients")
        patients = [dict(row) for row in cur.fetchall()]
    return patients

def get_patient_details_from_db(patient_id: str) -> Optional[Dict]:
    """Retrieves the full JSON data for a single patient."""
    with sqlite3.connect(DB_FILE) as con:
        cur = con.cursor()
        cur.execute("SELECT data FROM patients WHERE id = ?", (patient_id,))
        row = cur.fetchone()
        return json.loads(row[0]) if row else None
