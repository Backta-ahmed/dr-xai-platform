def run_diagnosis(image_path: str) -> dict:
    """
    STUB — Replace with real model inference.
    Returns mock response for development.
    """
    import random
    
    # Randomly mock a stage for demonstration
    stage = random.randint(0, 4)
    labels = ["No DR", "Mild DR", "Moderate DR", "Severe DR", "Proliferative DR"]
    
    return {
        "dr_stage": stage,
        "dr_label": labels[stage],
        "confidence": round(random.uniform(0.70, 0.99), 2),
    }
