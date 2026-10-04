"""Compatibility boundary between exported models and the existing REST contract."""
import numpy as np
import pandas as pd
import shap


def canonical_name(name):
    return str(name).replace(" ", "_")


def ordered_input(model, values):
    names = list(model.feature_names_in_)
    normalized = {canonical_name(key): value for key, value in values.items()}
    missing = [str(name) for name in names if canonical_name(name) not in normalized]
    if missing:
        raise ValueError(f"Model requires unsupported features: {missing}")
    return pd.DataFrame([[normalized[canonical_name(name)] for name in names]], columns=names)


class ModelRuntime:
    def __init__(self, model, background):
        self.model = model
        self.calibrated = hasattr(model, "calibrated_classifiers_")
        self.classes = list(model.classes_)
        if set(self.classes) != {0, 1, 2}:
            raise ValueError("Expected risk classes 0, 1, 2")
        self.names = list(model.feature_names_in_)
        if len(set(map(canonical_name, self.names))) != len(self.names):
            raise ValueError("Ambiguous model feature names")
        if self.calibrated:
            if not isinstance(background, pd.DataFrame):
                raise ValueError("Calibrated SHAP requires a reference DataFrame with named columns")
            # Match the trained column order without resampling at inference time.
            background = background.rename(columns={name: canonical_name(name) for name in background.columns})
            background = background[[canonical_name(name) for name in self.names]].iloc[:20].copy()
            background.columns = self.names
            if background.empty or not np.isfinite(background.to_numpy(dtype=float)).all():
                raise ValueError("Invalid explanation reference")
            self.explainer = shap.PermutationExplainer(self.probabilities, background, seed=0)
        else:
            # Preserve the original API explanation for existing VotingClassifier exports.
            self.explainer = shap.TreeExplainer(model.estimators_[0])

    def probabilities(self, values):
        frame = pd.DataFrame(np.asarray(values), columns=self.names)
        return self.model.predict_proba(frame)

    def predict(self, values):
        frame = ordered_input(self.model, values)
        inputs = frame if self.calibrated else frame.to_numpy()
        predicted = int(self.model.predict(inputs)[0])
        probabilities = np.asarray(self.model.predict_proba(inputs)[0], dtype=float)
        if probabilities.shape != (3,) or not np.isfinite(probabilities).all() or (probabilities < 0).any() or (probabilities > 1).any() or not np.isclose(probabilities.sum(), 1):
            raise ValueError("Invalid model probability output")
        class_index = self.classes.index(predicted)
        if self.calibrated:
            values = self.explainer(frame, max_evals=2 * len(self.names) + 1).values
        else:
            values = self.explainer.shap_values(inputs)
        if isinstance(values, list):
            explanation = values[class_index][0]
        elif values.ndim == 3:
            explanation = values[0, :, class_index]
        else:
            explanation = values[0]
        if len(explanation) != len(self.names) or not np.isfinite(explanation).all():
            raise ValueError("Invalid SHAP output")
        return {
            "riskLevel": {0: "LOW", 1: "MODERATE", 2: "HIGH"}[predicted],
            "probability": round(float(probabilities[self.classes.index(2)]) * 100, 2),
            "explanation": {canonical_name(name): round(float(value), 4) for name, value in zip(self.names, explanation)},
        }
