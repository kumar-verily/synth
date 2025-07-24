import random
import os
import json
import numpy as np
from typing import Type, List
from pydantic import BaseModel, Field
from langchain_core.tools import tool, BaseTool
from langchain_openai import ChatOpenAI

# --- Existing Tools ---

@tool
def generate_clinical_profile(condition: str) -> dict:
    """
    Generates baseline clinical data for a patient based on their condition.
    Args:
        condition: The patient's condition ('T2D_HighRisk', 'T2D_ModerateRisk', or 'Obesity').
    Returns:
        A dictionary with baseline A1c and weight.
    """
    if condition == 'T2D_HighRisk':
        baseline_a1c = random.uniform(10.0, 12.5)
        baseline_weight = random.uniform(180, 350)
    elif condition == 'T2D_ModerateRisk':
        baseline_a1c = random.uniform(8.0, 9.9)
        baseline_weight = random.uniform(180, 350)
    else:  # Obesity
        baseline_a1c = random.uniform(5.7, 6.4) # Pre-diabetic range for context
        baseline_weight = random.uniform(250, 400)
        
    return {
        "baseline_a1c": round(baseline_a1c, 2),
        "baseline_weight": round(baseline_weight, 1)
    }

@tool
def get_care_pathway() -> str:
    """
    Determines the care pathway for a new patient.
    Returns:
        A string representing the chosen pathway.
    """
    rand = random.random()
    if rand < 0.35:
        return 'T2D_HighRisk'
    elif rand < 0.7:
        return 'T2D_ModerateRisk'
    else:
        return 'Obesity'

CARE_PATHWAY_LOGIC = {
    'T2D_HighRisk': [
        {'month': 1, 'event': 'Initial RN Appointment', 'a1c_change': -0.5, 'weight_change': -2},
        {'month': 4, 'event': 'PC Follow-up, Meds Adjusted', 'a1c_change': -0.6, 'weight_change': -3},
        {'month': 8, 'event': 'Coach Appointment', 'a1c_change': -0.2, 'weight_change': -1},
        {'month': 12, 'event': 'Final Coach Appointment', 'a1c_change': -0.1, 'weight_change': -1},
    ],
    'T2D_ModerateRisk': [
        {'month': 1, 'event': 'Initial Coach Appointment', 'a1c_change': -0.4, 'weight_change': -3},
        {'month': 4, 'event': 'PC Follow-up', 'a1c_change': -0.3, 'weight_change': -2},
        {'month': 8, 'event': 'Coach Appointment', 'a1c_change': -0.2, 'weight_change': -2},
        {'month': 12, 'event': 'Final Coach Appointment', 'a1c_change': -0.1, 'weight_change': -1},
    ],
    'Obesity': [
        {'month': 1, 'event': 'Step Therapy Start', 'a1c_change': -0.1, 'weight_change': -5},
        {'month': 3, 'event': 'AOM Titration', 'a1c_change': -0.1, 'weight_change': -8},
        {'month': 6, 'event': 'Quarterly Telehealth Visit', 'a1c_change': 0, 'weight_change': -6},
        {'month': 12, 'event': 'Final Evaluation', 'a1c_change': 0, 'weight_change': -4},
    ]
}

@tool
def simulate_patient_journey(pathway: str, baseline_a1c: float, baseline_weight: float) -> list:
    """
    Simulates a 12-month journey for a patient based on their care pathway.
    Adds stochastic jitter to outcomes.
    """
    journey_log = [{"month": 0, "event": "Enrollment", "details": f"Enrolled in {pathway} pathway."}]
    events = CARE_PATHWAY_LOGIC.get(pathway, [])
    for event in events:
        a1c_jitter = random.uniform(-0.1, 0.1)
        weight_jitter = random.uniform(-2, 2)
        current_a1c = baseline_a1c + event['a1c_change'] + a1c_jitter
        current_weight = baseline_weight + event['weight_change'] + weight_jitter
        journey_log.append({
            "month": event['month'],
            "event": event['event'],
            "details": f"A1c changed to {current_a1c:.2f}, Weight changed to {current_weight:.1f} lbs."
        })
        baseline_a1c = current_a1c
        baseline_weight = current_weight
    return journey_log

# --- Modified Behavioral Analysis Tool (Now using OpenAI) ---

class AnalysisInput(BaseModel):
    """Input model for the BehavioralAnalysisTool."""
    text: str = Field(description="The user's text, conversation, or question to be analyzed for behavioral barriers.")

class Suggestion(BaseModel):
    """The data model for a single AI-generated suggestion."""
    advice: str
    identified_barrier: str
    applied_strategy: str
    applied_tactic: str

class AnalysisOutput(BaseModel):
    """Output model for the BehavioralAnalysisTool, containing a list of suggestions."""
    suggestions: List[Suggestion]

FRAMEWORK_DATA = [
    {"barrier": "Poor self-efficacy", "strategies": ["Self talk", "Future focus priming", "Anchoring", "Increase self efficacy"], "tactics": ["Positive Self talk", "Mental rehearsal of successful performance", "Future self", "Anchor in past success"]},
    {"barrier": "Present bias", "strategies": ["Natural consequences", "Values reflection", "Future focus priming", "Cognitive re-structuring", "Framing"], "tactics": ["Offer the user info about health consequences", "Offer the user info about emotional and physical consequences", "Implementation intentions", "Distraction", "Big picture connection + positive self talk"]},
    {"barrier": "Don't know the basics", "strategies": ["Learning support", "Heuristics", "Goals and planning"], "tactics": ["Learning support", "Rules of thumb", "Implementation intentions"]},
]

class BehavioralAnalysisTool(BaseTool):
    """
    A tool for analyzing text to identify behavioral barriers and suggest
    strategies and tactics based on the BeST framework using an OpenAI model.
    """
    name: str = "behavioral_analysis_tool"
    description: str = (
        "Useful for when you need to analyze a user's text to understand their "
        "behavioral challenges. It provides actionable advice based on a "
        "pre-defined framework of barriers, strategies, and tactics."
    )
    # *** THE FIX IS HERE ***
    # The `args_schema` must be explicitly defined as a Type for BaseTool.
    args_schema: Type[BaseModel] = AnalysisInput
    return_direct: bool = False

    def _run(self, text: str) -> dict:
        """Use the tool."""
        try:
            llm = ChatOpenAI(model="gpt-4o", temperature=0.5)
            framework_str = "\n".join([
                f"- Barrier: {item['barrier']}, Strategies: {', '.join(item['strategies'])}, Tactics: {', '.join(item['tactics'])}"
                for item in FRAMEWORK_DATA
            ])
            prompt = f"""
            You are a behavioral change expert. Analyze the following user's text and identify the top 3 most likely behavioral barriers they are facing, based *only* on the provided BeST framework data.
            For each identified barrier, select the most relevant strategy and tactic from the framework data and formulate a single, actionable piece of advice for the user.
            User's Text: "{text}"
            BeST Framework Data:
            {framework_str}
            Structure your output as a Pydantic model with the key "suggestions".
            """
            structured_llm = llm.with_structured_output(AnalysisOutput)
            validated_output = structured_llm.invoke(prompt)
            return validated_output.model_dump()
        except Exception as e:
            return {"error": f"An error occurred in the BehavioralAnalysisTool: {str(e)}"}

behavioral_tool = BehavioralAnalysisTool()


from pydantic import BaseModel
import numpy as np
from langchain_core.tools import BaseTool
from typing import Type

class RMABInput(BaseModel):
    """
    Parameters for simulating RMAB decisions.
    """
    num_patients: int = Field(..., description="Total number of patients (arms).")
    horizon: int = Field(..., description="Total number of decision steps (e.g., months).")
    budget: int = Field(..., description="Number of patients that can be treated per step.")
    decay: float = Field(0.95, description="Decay factor for unobserved patient states.")
    noise: float = Field(0.1, description="Stochastic noise in state transition.")

class RMABTool(BaseTool):
    """
    A simple simulation-based Restless Multi-Armed Bandit (RMAB) tool.
    Selects top-K patients to intervene with over time under budget constraints.
    """
    name: str = "rmab_tool"
    description: str = (
        "Simulates a restless multi-armed bandit process for allocating care resources over time. "
        "Useful for modeling dynamic patient prioritization in chronic care management."
    )
    args_schema: Type[BaseModel] = RMABInput
    return_direct: bool = False

    def _run(self, num_patients: int, horizon: int, budget: int, decay: float, noise: float) -> dict:
        np.random.seed(42)  # Reproducibility

        # Initialize patient states between [0, 1], where 1 = worst
        states = np.random.rand(num_patients)
        logs = []

        for t in range(horizon):
            # Compute priority score = current state + noise
            scores = states + np.random.normal(0, noise, size=num_patients)
            selected_indices = np.argsort(scores)[-budget:]  # Select top-K

            # Apply "intervention" to selected arms (simulate improvement)
            states[selected_indices] *= 0.7  # Treatment improves state

            # Rest decay for unselected arms
            unselected = list(set(range(num_patients)) - set(selected_indices))
            states[unselected] *= decay  # Passive evolution worsens or improves slightly

            logs.append({
                "step": t + 1,
                "treated_patients": selected_indices.tolist(),
                "mean_state": float(np.mean(states))
            })

        return {"final_states": states.tolist(), "log": logs}
rmab_tool = RMABTool()

import pandas as pd
from pydantic import BaseModel

class CareProtocolStep(BaseModel):
    pathway: str
    sub_pathway: str
    trigger: str
    task: str
    persona: str

@tool
def load_care_protocol() -> List[CareProtocolStep]:
    """
    Loads the care protocol from CSV and returns a list of structured care steps.
    """
    path = os.path.join(os.path.dirname(__file__), "carepathways_sample.csv")
    df = pd.read_csv(path)
    steps = [
        CareProtocolStep(
            pathway=row["Care Pathway"],
            sub_pathway=row["Sub-Pathway"],
            trigger=row["Trigger(s)"],
            task=row["Task / Interaction"],
            persona=row["Primary Persona(s)"]
        )
        for _, row in df.iterrows()
    ]
    return steps

@tool
def simulate_patient_journey_realistic(
    pathway: str,
    baseline_a1c: float,
    baseline_weight: float,
    care_protocol: List[CareProtocolStep]
) -> list:
    """
    Simulates a journey based on care protocol steps.
    Each log entry must include month, event, details.
    """
    journey_log = []
    # filtered = [step for step in care_protocol if pathway.lower() in step.pathway.lower()]
    # filtered = care_protocol[:30]  # Simulate a subset for demonstration; in practice, filter by pathway
    filtered = random.sample(care_protocol, 12)

    for i, step in enumerate(filtered):
        month = (i + 1) * 1  # Simulate monthly steps, incrementally
        a1c_jitter = random.uniform(-0.2, 0.1)
        weight_jitter = random.uniform(-3, 1)
        baseline_a1c += a1c_jitter
        baseline_weight += weight_jitter

        # journey_log.append({
        #     "month": month,
        #     "event": step.task,  # or use step.sub_pathway + ": " + step.task
        #     "details": (
        #         f"Trigger: {step.trigger}. "
        #         f"A1c now {baseline_a1c:.2f}, Weight now {baseline_weight:.1f} lbs."
        #     )
        # })
        journey_log.append({
            "month": i + 1,
            "event": step.task,
            "details": f"Triggered by: {step.trigger}. A1c: {baseline_a1c:.2f}, Weight: {baseline_weight:.1f} lbs."
        })
        print(journey_log)

    return journey_log



