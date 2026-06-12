// Mock LLM to simulate AI responses based on input context

function parseIntentToSQL(intent) {
  const i = intent.toLowerCase();
  const rules = {};
  
  if (i.includes('high-value') || i.includes('vip')) {
    rules.amount = '> 2000';
  }
  if (i.includes('mumbai')) {
    rules.location = 'Mumbai';
  } else if (i.includes('delhi')) {
    rules.location = 'Delhi';
  }
  if (i.includes('haven\'t ordered in') || i.includes('inactive')) {
    rules.daysSinceLastOrder = '> 60';
  }
  
  // Default fallback if no clear rules
  if (Object.keys(rules).length === 0) {
    rules.amount = '> 0';
  }
  
  return rules;
}

function draftCampaignMessage(intent) {
  if (intent.toLowerCase().includes('comeback') || intent.toLowerCase().includes('inactive')) {
    return "Hi {{name}}, we've missed you! Here is a special 15% off code just for you: COMEBACK15. Treat yourself today!";
  }
  if (intent.toLowerCase().includes('vip') || intent.toLowerCase().includes('high-value')) {
    return "Hello {{name}}! As one of our top customers, we are giving you exclusive early access to our new collection.";
  }
  return "Hi {{name}}, check out our latest offers tailored just for you!";
}

function generatePredictiveForecast(audienceSize, historicalAov) {
  // Simple heuristic for realism
  const openRate = 22 + Math.floor(Math.random() * 8); // 22% - 29%
  const conversionRate = 0.05; // 5% conversion from audience
  const estimatedOrders = Math.floor(audienceSize * conversionRate);
  const projectedRevenue = Math.floor(estimatedOrders * historicalAov);
  
  return {
    openRate: `${openRate}%`,
    projectedRevenue: projectedRevenue || 0,
    message: \`Sending this campaign to this group of \${audienceSize} users is projected to yield an approximate \${openRate}% open rate and roughly ₹\${projectedRevenue.toLocaleString('en-IN')} in generated revenue based on past behavior trends.\`
  };
}

function generateDiagnosticHub(reviews, openRate) {
  const foundReasons = [];
  const guessedReasons = [];
  const alternatives = [];
  
  // Analyze reviews
  const badReviews = reviews.filter(r => r.rating && r.rating <= 3);
  if (badReviews.length > 0) {
    foundReasons.push(\`Customer explicitly noted a \${badReviews[0].rating}-star satisfaction rating due to: "\${badReviews[0].text}"\`);
  } else {
    foundReasons.push("No explicit negative feedback found in recent orders.");
  }
  
  // Analyze behavior
  if (openRate < 10) {
    guessedReasons.push(\`The customer has a \${openRate}% open rate across their last messages. Inferred reason: Promotional fatigue or channel muting.\`);
    alternatives.push("Alternative Action: Suppress all promotional alerts for 30 days and pivot to an exclusive, low-frequency Email curation layout instead.");
  } else {
    guessedReasons.push("Customer is actively opening messages but not converting. Inferred reason: Price sensitivity or irrelevant product recommendations.");
    alternatives.push("Alternative Action: Offer a high-intent discount code or switch to a personalized re-engagement workflow.");
  }
  
  return {
    foundReasons,
    guessedReasons,
    alternatives
  };
}

module.exports = {
  parseIntentToSQL,
  draftCampaignMessage,
  generatePredictiveForecast,
  generateDiagnosticHub
};
