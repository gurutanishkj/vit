import lightgbm as lgb
import numpy as np

X = np.random.randn(100, 5)
y = np.random.randint(0, 2, 100)

ds = lgb.Dataset(X, label=y)
params = {
    'objective': 'binary',
    'verbose': -1
}

model = lgb.train(params, ds, num_boost_round=10)
preds = model.predict(X[:5])
print("NATIVE LIGHTGBM SUCCESS! Sample probabilities:", preds, flush=True)
