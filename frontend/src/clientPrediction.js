import modelData from './model_weights.json';

export function predictClientSide(transaction, threshold = 0.70) {
  const amount = parseFloat(transaction.Amount) || 0.0;
  const time = parseFloat(transaction.Time) || 0.0;
  const secondsInDay = 86400;

  const timeSin = Math.sin((2 * Math.PI * (time % secondsInDay)) / secondsInDay);
  const timeCos = Math.cos((2 * Math.PI * (time % secondsInDay)) / secondsInDay);
  const scaledAmount = (amount - modelData.median) / modelData.iqr;

  const featureVector = [];
  modelData.feature_columns.forEach((col) => {
    if (col === 'scaled_amount') {
      featureVector.push(scaledAmount);
    } else if (col === 'time_sin') {
      featureVector.push(timeSin);
    } else if (col === 'time_cos') {
      featureVector.push(timeCos);
    } else {
      featureVector.push(parseFloat(transaction[col]) || 0.0);
    }
  });

  let linearModel = modelData.bias;
  const contributions = [];
  for (let i = 0; i < featureVector.length; i++) {
    const term = featureVector[i] * modelData.weights[i];
    linearModel += term;
    contributions.push({
      feature: modelData.feature_columns[i],
      impact: Math.round(term * 1000) / 1000,
      direction: term > 0 ? 'Elevates Risk' : 'Protects Transaction',
      absImpact: Math.abs(term)
    });
  }

  const clippedZ = Math.max(-30, Math.min(30, linearModel));
  const fraudProb = 1.0 / (1.0 + Math.exp(-clippedZ));

  const T = Math.min(0.95, Math.max(0.05, threshold));
  const lowCutoff = Math.min(0.30, T * 0.5);

  let riskLevel = 'LOW';
  let prediction = 'LEGITIMATE';
  let recommendedAction = 'Approve Automatically';

  if (fraudProb < lowCutoff) {
    riskLevel = 'LOW';
    prediction = 'LEGITIMATE';
    recommendedAction = 'Approve Automatically';
  } else if (fraudProb < T) {
    riskLevel = 'MEDIUM';
    prediction = 'REVIEW';
    recommendedAction = 'Step-up 2FA Challenge';
  } else {
    riskLevel = 'HIGH';
    prediction = 'FRAUD';
    recommendedAction = 'Decline & Flag Transaction';
  }

  contributions.sort((a, b) => b.absImpact - a.absImpact);
  const topFactors = contributions.slice(0, 4).map(({ absImpact, ...rest }) => rest);

  return {
    prediction,
    fraud_probability: Math.round(fraudProb * 10000) / 10000,
    risk_level: riskLevel,
    recommended_action: recommendedAction,
    threshold_used: Math.round(T * 100) / 100,
    model_used: 'Balanced Logistic Regression (Genuine ML)',
    top_factors: topFactors,
    transaction_details: {
      amount,
      scaled_amount: Math.round(scaledAmount * 1000) / 1000,
      hour_of_day: Math.round(((time % secondsInDay) / 3600.0) * 10) / 10
    },
    authenticated: true,
    analyst: 'Security Analyst'
  };
}

export function batchPredictClientSide(transactions, threshold = 0.70) {
  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;
  let totalAmount = 0.0;

  const results = transactions.map((t, idx) => {
    const res = predictClientSide(t, threshold);
    totalAmount += parseFloat(t.Amount) || 0;
    if (res.risk_level === 'HIGH') highCount++;
    else if (res.risk_level === 'MEDIUM') mediumCount++;
    else lowCount++;

    return {
      id: idx + 1,
      amount: parseFloat(t.Amount) || 0,
      prediction: res.prediction,
      fraud_probability: res.fraud_probability,
      risk_level: res.risk_level,
      recommended_action: res.recommended_action,
      top_factor: res.top_factors && res.top_factors[0] ? res.top_factors[0].feature : 'V14'
    };
  });

  return {
    total_scanned: results.length,
    fraud_count: highCount,
    review_count: mediumCount,
    legitimate_count: lowCount,
    total_volume: Math.round(totalAmount * 100) / 100,
    threshold_applied: threshold,
    results,
    analyst: 'Security Analyst'
  };
}
