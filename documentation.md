Synthetic Patient Generation: Control Flow Documentation
This document outlines the end-to-end process of generating a synthetic patient, starting from a user click in the React UI to the data being created by the LangGraph agent and stored in the SQLite database.

High-Level Overview
The process can be broken down into six main stages:

Frontend Trigger: The user initiates the process in the React application.

API Request: The frontend sends a request to the FastAPI backend.

Agent Execution: The backend invokes the LangGraph agent, which runs a sequence of steps.

Data Transformation: A dedicated agent node transforms the raw simulated data into a detailed, UI-ready format.

Database Persistence: The final, formatted data is saved to the local SQLite database.

UI Refresh: The frontend receives confirmation and refreshes its view to display the new data.

Detailed Step-by-Step Breakdown
Step 1: User Interaction (Frontend)
File: cliniverse-app/src/App.js

Function: handleGenerateClick()

The flow begins when the user clicks the "Generate New" button in the React UI.

The onClick event on the button calls the handleGenerateClick function.

This function sets the UI status to "Generating..." to provide user feedback.

It then uses the fetch API to make an asynchronous POST request to the http://127.0.0.1:8000/generate-patients/ endpoint on the FastAPI server.

Step 2: API Request Handling (Backend)
File: synth_data/app/main.py

Function: generate_patients_endpoint()

The FastAPI server receives the incoming request.

The request is routed to the generate_patients_endpoint function.

This function invokes the compiled LangGraph agent by calling app_graph.ainvoke({}). It runs the agent asynchronously.

Step 3: LangGraph Agent Execution (Backend)
File: synth_data/app/agent.py

Graph: app_graph

The agent begins executing its defined sequence of nodes. The AgentState object is passed from one node to the next, accumulating data at each step.

profiler_agent (Node 1)

Code Touched: tools.py

Action: This node determines the patient's high-level clinical starting point. It calls the get_care_pathway() and generate_clinical_profile() tools to get a condition (e.g., 'T2D_HighRisk') and baseline metrics (A1c, weight).

Output: Adds patient_id, care_pathway, and clinical_profile to the agent's state.

persona_agent (Node 2)

Code Touched: models.py

Action: This node creates the human element. It uses the clinical profile from the previous step to create a detailed prompt for the OpenAI LLM (gpt-4o). The LLM is instructed to return a structured response that matches the PatientPersona Pydantic model.

Output: Adds the persona dictionary to the agent's state.

journey_simulator_agent (Node 3)

Code Touched: tools.py

Action: This node simulates the patient's progression over time. It calls the simulate_patient_journey_realistic() tool, which uses the patient's profile and a predefined care protocol to generate a 12-month event log.

Output: Adds the journey_log list to the agent's state.

Step 4: Data Transformation & Enrichment (Backend)
File: synth_data/app/agent.py

Function: formatter_agent() (Node 4)

This is the most critical step for bridging the gap between the raw simulation and the detailed UI.

Action: The formatter_agent consolidates all the data generated so far (persona, journey_log, etc.) into a single large context.

It then sends this context to the OpenAI LLM (gpt-4o) with a detailed prompt. This prompt instructs the LLM to act as a "transformation agent."

The LLM's task is to generate a complete JSON object that strictly adheres to the CliniversePatient model defined in models.py. It maps existing data (like the patient's name) and generates all the missing UI-specific data, including:

additionalDetails (email, phone, etc.)

A complete carePlan

A toDo list for the care team

Clinical notes in SOAP format

A careTeam list

A conversational messages history

Output: Adds the final, UI-ready cliniverse_patient dictionary to the agent's state.

Step 5: Database Persistence (Backend)
File: synth_data/app/agent.py -> synth_data/app/database.py

Functions: save_to_database_node() -> add_patient_to_db()

The final agent node saves the result.

The save_to_database_node takes the cliniverse_patient dictionary from the state.

It calls the add_patient_to_db function from the database.py module.

This function connects to the cliniverse_synth.db file, converts the dictionary to a JSON string, and executes an INSERT OR REPLACE SQL statement to persist the data.

Step 6: API Response and UI Refresh (Frontend)
File: synth_data/app/main.py -> cliniverse-app/src/App.js

The control flow returns to the API and then to the frontend.

After the agent graph finishes, the generate_patients_endpoint in main.py receives the final state and returns the cliniverse_patient data in its HTTP response.

Back in App.js, the fetch call in handleGenerateClick completes successfully.

The function updates the React state by adding the new patient to the patientList and setting the currentPatientId to the newly generated ID.

This state change triggers a re-render of the React component. The sidebar now shows the new patient's name, and the main content area automatically fetches and displays their full, detailed dashboard.