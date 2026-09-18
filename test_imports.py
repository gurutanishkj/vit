import sys
print(f"Python: {sys.version}", flush=True)

import numpy as np
print(f"NumPy: {np.__version__}", flush=True)

import pandas as pd
print(f"Pandas: {pd.__version__}", flush=True)

import scipy
print(f"SciPy: {scipy.__version__}", flush=True)

import sklearn
print(f"Scikit-Learn: {sklearn.__version__}", flush=True)

import fastapi
print(f"FastAPI: {fastapi.__version__}", flush=True)

print("ALL_IMPORTS_SUCCESSFUL", flush=True)
