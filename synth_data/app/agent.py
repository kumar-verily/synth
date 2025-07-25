import os
import uuid
import re
import json
from typing import TypedDict, List, Dict, Optional
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from pydantic import Field
from langgraph.graph import StateGraph, END

# FIX is here: CareProtocolStep is now imported from app.tools
from app.tools import (
    generate_clinical_profile, get_care_pathway, 
    simulate_patient_journey_realistic, behavioral_tool, load_care_protocol,
    CareProtocolStep 
)
# Import ALL the other models we'll need from models.py
from app.models import (
    PatientPersona as PydanticPatientPersona, 
    CliniversePatient
)
from app.database import add_patient_to_db

# --- Agent State ---
class AgentState(TypedDict):
    # Raw data generated by initial nodes
    patient_id: str
    care_pathway: str
    clinical_profile: dict
    persona: dict
    journey_log: List[dict]
    # Final, formatted data
    cliniverse_patient: Dict
    profile_name: Optional[str] 

# --- LLM and Tools Setup ---
from dotenv import load_dotenv
load_dotenv()
llm = ChatOpenAI(model="gpt-4o", temperature=0.7)

# --- Agent Nodes ---

def profiler_agent(state: AgentState):
    """Node 1: Generates baseline clinical profile."""
    print("--- 1. PROFILER AGENT ---")
    pathway = get_care_pathway.invoke({})
    profile = generate_clinical_profile.invoke({"condition": pathway})
    return {
        "patient_id": f"SYN_{uuid.uuid4().hex[:8].upper()}",
        "care_pathway": pathway,
        "clinical_profile": profile,
    }

def persona_agent(state: AgentState):
    """Node 2: Generates a detailed persona."""
    print("--- 2. PERSONA AGENT ---")
    profile = state["clinical_profile"]
    pathway = state["care_pathway"]
    class InitialPersona(PydanticPatientPersona):
        identified_barriers: List[str] = Field(default=[], description="Placeholder for barriers.")
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Generate a compelling and believable patient persona based on the clinical data. Provide a common American name, age, gender, and a caregiver if appropriate (e.g., for a pediatric patient)."),
        ("human", f"Generate a persona for a patient with this profile:\n- Care Pathway: {pathway}\n- Baseline A1c: {profile['baseline_a1c']}\n- Baseline Weight: {profile['baseline_weight']} lbs")
    ]).format_prompt()
    persona = llm.with_structured_output(InitialPersona).invoke(prompt)
    return {"persona": persona.model_dump()}

def journey_simulator_agent(state: AgentState):
    """Node 3: Simulates the 12-month care journey."""
    print("--- 3. JOURNEY SIMULATOR ---")
    protocol = load_care_protocol.invoke({})
    log = simulate_patient_journey_realistic.invoke({
        "pathway": state["care_pathway"],
        "baseline_a1c": state['clinical_profile']['baseline_a1c'],
        "baseline_weight": state['clinical_profile']['baseline_weight'],
        "care_protocol": protocol
    })
    return {"journey_log": log}

def formatter_agent(state: AgentState):
    """
    Node 4: Transforms raw data into the detailed Cliniverse UI format.
    This node generates all the missing pieces of data.
    """
    print("--- 4. UI FORMATTER AGENT ---")
    
    if state.get("profile_name"):
        print(f"Using profile name: {state['profile_name']}")
        profile_json["profile_name"] = state.get("profile_name")

    context = f"""
    Raw Patient Data:
    - Patient ID: {state['patient_id']}
    - Care Pathway: {state['care_pathway']}
    - Persona: {state['persona']}
    - Initial Clinical Profile: {state['clinical_profile']}
    - Simulated Journey Log: {state['journey_log']}
    """

    formatter_llm = llm.with_structured_output(CliniversePatient)
    
    prompt = f"""
    You are a data transformation and enrichment agent. Your task is to convert the provided raw patient data into a complete, detailed JSON object that matches the `CliniversePatient` schema for a clinical UI.

    Instructions:
    1.  **Map Existing Data**: Use the raw data to populate the new structure. For example, `persona.name` becomes `name`.
    2.  **Generate Missing Data**: Create realistic data for fields that don't exist in the raw data. This includes `additionalDetails`, `carePlan` (fully populated), `toDo` list, `notes` (in SOAP format), and `careTeam`. All generated data must be medically and contextually consistent with the raw data.
    3.  **Generate Messages**: The `messages` list should contain sample messages to simulate a conversation between a Patient and the Health care professional (Health Coach, Dietician, Nutritionist, Pharmacist, Nurse, Physician, Endocrinologist). The messages should be contextually relevant. For example, a message from a the Health care professional asking a question about a new device, or a follow up on an appointment, and a response back from the patient. It should be real back and forth conversation.
    4.  **Transform Data**: Convert the `journey_log` into the `a1cData` array. Each entry in the log that mentions an A1c value should become a data point. The 'name' of the data point should be a short date like 'Month 1', 'Month 4', etc.
    5.  **Create Summaries**: The top-level `details` field should be a concise summary string (e.g., "Pediatric • 14 yo, Female").
    6.  **Ensure IDs Match**: The top-level `id` must be identical to `additionalDetails.participantId`.

    {context}

    Now, generate the complete `CliniversePatient` JSON object, including the `messages` field.
    """
    
    cliniverse_profile = formatter_llm.invoke(prompt)
    profile_json_str = cliniverse_profile.model_dump_json(by_alias=True)
    profile_json = json.loads(profile_json_str)
    return {
        "cliniverse_patient": profile_json
    }
    # return {"cliniverse_patient": cliniverse_profile.model_dump(by_alias=True)}


def save_to_database_node(state: AgentState):
    """Node 5: Saves the final, formatted patient profile to the SQLite database."""
    print("--- 5. SAVING TO DATABASE ---")
    formatted_profile = state.get("cliniverse_patient")
    if not formatted_profile:
        print("ERROR: No formatted patient profile found to save.")
        return {}
        
    add_patient_to_db(formatted_profile)
    return {}

# --- Graph Definition ---
workflow = StateGraph(AgentState)
workflow.add_node("profiler", profiler_agent)
workflow.add_node("persona_generator", persona_agent)
workflow.add_node("journey_simulator", journey_simulator_agent)
workflow.add_node("formatter", formatter_agent)
workflow.add_node("save_to_db", save_to_database_node)

workflow.set_entry_point("profiler")
workflow.add_edge("profiler", "persona_generator")
workflow.add_edge("persona_generator", "journey_simulator")
workflow.add_edge("journey_simulator", "formatter")
workflow.add_edge("formatter", "save_to_db")
workflow.add_edge("save_to_db", END)

app_graph = workflow.compile()
print("LangGraph agent compiled with UI Formatter and SQLite saving.")
