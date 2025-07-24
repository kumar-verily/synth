import sqlite3
import json
import pandas as pd # Using pandas for clean table formatting

# --- Configuration ---
# This should match the DB_FILE in your database.py
DB_FILE = "cliniverse_synth.db"

def probe_schema(con: sqlite3.Connection):
    """Prints the table schema."""
    print("--- 1. Database Schema ---")
    try:
        cur = con.cursor()
        cur.execute("SELECT name, sql FROM sqlite_master WHERE type='table' AND name='patients'")
        schema = cur.fetchone()
        if schema:
            print(f"Table Name: {schema[0]}")
            print(f"Schema SQL:\n{schema[1]}")
        else:
            print("Table 'patients' not found.")
    except Exception as e:
        print(f"An error occurred while probing schema: {e}")
    print("-" * 28 + "\n")


def show_summary(con: sqlite3.Connection):
    """Shows a summary of all patients using pandas for nice formatting."""
    print("--- 2. Patient Summary ---")
    try:
        # FIX: Only select the columns that exist in the simplified schema.
        df = pd.read_sql_query("SELECT id, name FROM patients", con)
        if df.empty:
            print("No patients found in the database.")
        else:
            print(df.to_string(index=False))
    except Exception as e:
        print(f"An error occurred while fetching summary: {e}")
    print("-" * 26 + "\n")


def show_detailed_record(con: sqlite3.Connection):
    """Fetches the first patient and displays their full JSON data."""
    print("--- 3. Detailed View of First Patient ---")
    try:
        cur = con.cursor()
        cur.execute("SELECT data FROM patients LIMIT 1")
        row = cur.fetchone()
        
        if row:
            patient_data = json.loads(row[0])
            print(json.dumps(patient_data, indent=2))
        else:
            print("No patient record found to display details for.")
    except Exception as e:
        print(f"An error occurred while fetching detailed record: {e}")
    print("-" * 40 + "\n")


def main():
    """Main function to run all inspection steps."""
    print(f"Inspecting SQLite database: '{DB_FILE}'\n")
    try:
        with sqlite3.connect(DB_FILE) as con:
            probe_schema(con)
            show_summary(con)
            show_detailed_record(con)
    except sqlite3.OperationalError:
        print(f"Error: Database file '{DB_FILE}' not found.")
        print("Please ensure the FastAPI server has been run at least once to create the database.")
    except Exception as e:
        print(f"A critical error occurred: {e}")


if __name__ == "__main__":
    main()
