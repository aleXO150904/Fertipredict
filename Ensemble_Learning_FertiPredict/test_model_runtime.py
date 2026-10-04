import unittest
import numpy as np
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV
from sklearn.tree import DecisionTreeClassifier
from model_runtime import ModelRuntime, ordered_input


class RuntimeTests(unittest.TestCase):
    def test_calibrated_contract_and_aliases(self):
        random = np.random.RandomState(0)
        frame = pd.DataFrame(random.normal(size=(60, 3)), columns=["Edad_Masculino", "Hormona Antimulleriana (amh)", "hormona foliculoestimulante (fsh)"])
        model = CalibratedClassifierCV(DecisionTreeClassifier(max_depth=2, random_state=0), cv=3).fit(frame, np.tile([0, 1, 2], 20))
        runtime = ModelRuntime(model, frame.iloc[:3])
        inputs = {"hormona_foliculoestimulante_(fsh)": 0.5, "Edad_Masculino": 0.1, "Hormona_Antimulleriana_(amh)": 0.2}
        output = runtime.predict(inputs)
        expected = model.predict_proba(ordered_input(model, inputs))[0]
        self.assertEqual(set(output), {"riskLevel", "probability", "explanation"})
        self.assertAlmostEqual(output["probability"], round(expected[2] * 100, 2))
        self.assertEqual(len(output["explanation"]), 3)
        self.assertTrue(all(np.isfinite(list(output["explanation"].values()))))
        self.assertIn(output["riskLevel"], {"LOW", "MODERATE", "HIGH"})

    def test_missing_features_are_rejected(self):
        class Schema:
            feature_names_in_ = ["missing"]
        with self.assertRaises(ValueError):
            ordered_input(Schema(), {"Edad_Masculino": 30})


if __name__ == "__main__":
    unittest.main()
