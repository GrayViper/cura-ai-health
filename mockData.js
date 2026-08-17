// Cura AI Health - Medical Dictionary and Sample Reports Database

const BIOMARKER_DICT = {
  // --- Hematology (CBC) ---
  'hb': {
    name: 'Hemoglobin',
    category: 'Hematology',
    unit: 'g/dL',
    range: { min: 12.0, max: 17.5 },
    optimal: { min: 13.5, max: 16.5 },
    description: 'The iron-rich protein in red blood cells that carries oxygen from your lungs to the rest of your body.',
    high: {
      title: 'Elevated Hemoglobin (Polycythemia)',
      causes: 'Dehydration, smoking, high altitude, chronic lung disease, or bone marrow overproduction.',
      symptoms: 'Fatigue, dizziness, headache, blurred vision, or itching.',
      diet: 'Ensure high hydration. Limit alcohol and iron supplements unless prescribed. Consult a doctor for cardiovascular health.'
    },
    low: {
      title: 'Low Hemoglobin (Anemia)',
      causes: 'Iron deficiency, vitamin B12/folate deficiency, chronic blood loss, or bone marrow disorders.',
      symptoms: 'Weakness, cold hands/feet, shortness of breath, pale skin, or chest pain.',
      diet: 'Increase intake of iron-rich foods (lean meats, spinach, lentils, fortified cereals) paired with Vitamin C (citrus, bell peppers) to boost absorption.'
    }
  },
  'wbc': {
    name: 'White Blood Cell Count',
    category: 'Hematology',
    unit: 'x10^3/µL',
    range: { min: 4.5, max: 11.0 },
    optimal: { min: 5.0, max: 10.0 },
    description: 'Cells of the immune system involved in defending the body against infectious disease and foreign materials.',
    high: {
      title: 'Leukocytosis',
      causes: 'Infection, inflammation, physical stress, allergies, or bone marrow conditions.',
      symptoms: 'Fever, fatigue, bruising, or general malaise.',
      diet: 'Focus on anti-inflammatory diet (berries, olive oil, leafy greens, walnuts) and rest.'
    },
    low: {
      title: 'Leukopenia',
      causes: 'Viral infections, autoimmune disorders, vitamin deficiencies (copper, zinc), or bone marrow damage.',
      symptoms: 'Increased vulnerability to infections, frequent fevers, sore throat, or mouth sores.',
      diet: 'Ensure excellent food safety. Boost immunity with zinc-rich foods (seeds, legumes) and adequate protein intake.'
    }
  },
  'plt': {
    name: 'Platelet Count',
    category: 'Hematology',
    unit: 'x10^3/µL',
    range: { min: 150, max: 450 },
    optimal: { min: 180, max: 400 },
    description: 'Small cell fragments in the blood that clump together to form clots and stop bleeding.',
    high: {
      title: 'Thrombocytosis',
      causes: 'Acute inflammation, tissue damage, iron deficiency, or clonal bone marrow disorders.',
      symptoms: 'Usually asymptomatic, but can cause blood clots or unusual bruising in extreme cases.',
      diet: 'Hydrate well. Focus on heart-healthy foods (omega-3 from salmon/flaxseeds, garlic, berries) which have mild anti-platelet effects.'
    },
    low: {
      title: 'Thrombocytopenia',
      causes: 'Viral infections, alcohol abuse, pregnancy, vitamin B12/folate deficiency, or immune destruction.',
      symptoms: 'Easy bruising, nosebleeds, bleeding gums, or prolonged bleeding from cuts.',
      diet: 'Limit alcohol. Avoid foods that might impair platelets (like tonic water containing quinine). Eat folate-rich foods.'
    }
  },
  'rbc': {
    name: 'Red Blood Cell Count',
    category: 'Hematology',
    unit: 'x10^6/µL',
    range: { min: 4.0, max: 5.9 },
    optimal: { min: 4.5, max: 5.5 },
    description: 'The cells responsible for transporting oxygen throughout your body.',
    high: {
      title: 'Erythrocytosis',
      causes: 'Low oxygen levels (smoking, altitude, sleep apnea), dehydration, or renal tumors.',
      symptoms: 'Headache, fatigue, flushing, or joint pain.',
      diet: 'Stay fully hydrated. Reduce red meat consumption and avoid high-dose iron supplements.'
    },
    low: {
      title: 'Erythropenia',
      causes: 'Anemia, nutritional deficiencies, chronic kidney disease, or blood loss.',
      symptoms: 'Fatigue, pale skin, cold sensitivity, and rapid heart rate.',
      diet: 'Incorporate Vitamin B12 (eggs, dairy, fish) and iron-rich foods in your diet.'
    }
  },

  // --- Lipids (Cardiovascular) ---
  'chol': {
    name: 'Total Cholesterol',
    category: 'Lipid Panel',
    unit: 'mg/dL',
    range: { min: 100, max: 200 },
    optimal: { min: 120, max: 180 },
    description: 'A measure of the total amount of cholesterol in your blood, including LDL and HDL.',
    high: {
      title: 'Hypercholesterolemia',
      causes: 'Diets high in saturated/trans fats, lack of exercise, genetics, smoking, or thyroid issues.',
      symptoms: 'Often asymptomatic, but increases risk of atherosclerosis and heart disease.',
      diet: 'Reduce saturated fats (fatty meats, butter) and trans fats. Increase soluble fiber (oats, beans, apples) and healthy fats (avocados, olive oil).'
    },
    low: {
      title: 'Hypocholesterolemia',
      causes: 'Malnutrition, hyperthyroidism, chronic liver disease, or malabsorption disorders.',
      symptoms: 'Depression, anxiety, or cognitive difficulties (in severe cases).',
      diet: 'Focus on nutrient-dense healthy fats (eggs, nuts, seeds, olive oil, fatty fish) to restore adequate levels.'
    }
  },
  'ldl': {
    name: 'LDL Cholesterol ("Bad")',
    category: 'Lipid Panel',
    unit: 'mg/dL',
    range: { min: 0, max: 100 },
    optimal: { min: 0, max: 79 },
    description: 'Low-Density Lipoprotein: transports cholesterol to tissues. High levels can build up in arterial walls.',
    high: {
      title: 'Elevated LDL Cholesterol',
      causes: 'Sedentary lifestyle, high saturated fat diet, genetics, diabetes, or obesity.',
      symptoms: 'No symptoms, but leads to plaque buildup in arteries.',
      diet: 'Limit dairy fat and fatty meats. Consume plant sterols, oats, almonds, and green tea. Increase aerobic exercise (30 mins daily).'
    },
    low: {
      title: 'Low LDL Cholesterol',
      causes: 'Rare. Can be associated with severe illness, malnutrition, or genetic mutations.',
      symptoms: 'Rarely symptomatic; positive for heart health, but extremely low levels (<40) can affect cell membranes.',
      diet: 'Ensure balanced macronutrient and healthy fat intake.'
    }
  },
  'hdl': {
    name: 'HDL Cholesterol ("Good")',
    category: 'Lipid Panel',
    unit: 'mg/dL',
    range: { min: 40, max: 100 },
    optimal: { min: 50, max: 90 },
    description: 'High-Density Lipoprotein: absorbs cholesterol in the blood and carries it back to the liver for excretion.',
    high: {
      title: 'High HDL (Protective)',
      causes: 'Exercise, healthy fat consumption, moderate alcohol, or genetics.',
      symptoms: 'Asymptomatic. Highly protective against heart disease.',
      diet: 'Maintain current healthy habits. Levels above 90 mg/dL are generally favorable but could warrant review if genetics play a role.'
    },
    low: {
      title: 'Low HDL Cholesterol',
      causes: 'Sedentary lifestyle, smoking, obesity, high carbohydrate intake, or type 2 diabetes.',
      symptoms: 'Increased risk of coronary artery disease.',
      diet: 'Exercise regularly (especially HIIT and cardio). Quit smoking. Consume extra virgin olive oil, nuts, and avocados.'
    }
  },
  'tg': {
    name: 'Triglycerides',
    category: 'Lipid Panel',
    unit: 'mg/dL',
    range: { min: 0, max: 150 },
    optimal: { min: 30, max: 100 },
    description: 'A type of fat (lipid) found in your blood, stored in fat cells when calories are unused.',
    high: {
      title: 'Hypertriglyceridemia',
      causes: 'Excess calories, high sugar/carb diet, heavy alcohol consumption, diabetes, or thyroid issues.',
      symptoms: 'Asymptomatic. High levels (>500) can cause pancreas inflammation.',
      diet: 'Strictly limit sugar, refined grains, and alcohol. Incorporate omega-3 fatty acids (salmon, chia seeds). Increase physical activity.'
    },
    low: {
      title: 'Low Triglycerides',
      causes: 'Low-fat diet, hyperthyroidism, malnutrition, or malabsorption.',
      symptoms: 'Low energy or dry skin.',
      diet: 'Ensure adequate caloric intake and eat healthy fats (butter, coconut oil, nuts, avocados).'
    }
  },

  // --- Thyroid Panel ---
  'tsh': {
    name: 'Thyroid Stimulating Hormone',
    category: 'Thyroid Profile',
    unit: 'µIU/mL',
    range: { min: 0.45, max: 4.5 },
    optimal: { min: 0.5, max: 2.5 },
    description: 'A pituitary hormone that stimulates the thyroid gland to produce thyroxine (T4) and triiodothyronine (T3).',
    high: {
      title: 'Elevated TSH (Hypothyroidism Indicator)',
      causes: 'Hashimoto\'s thyroiditis, iodine deficiency, or pituitary abnormalities. Indicates an underactive thyroid.',
      symptoms: 'Fatigue, weight gain, cold intolerance, dry skin, constipation, and muscle weakness.',
      diet: 'Ensure adequate iodine and selenium (brazil nuts). Limit raw goitrogenic foods (cabbage, broccoli) in large amounts.'
    },
    low: {
      title: 'Low TSH (Hyperthyroidism Indicator)',
      causes: 'Graves\' disease, thyroid nodules, or excessive thyroid hormone medication. Indicates an overactive thyroid.',
      symptoms: 'Weight loss, rapid heartbeat, anxiety, heat intolerance, tremor, or sleep issues.',
      diet: 'Avoid excess iodine (kelp, iodized salt). Focus on calming foods, cruciferous vegetables (which can natural suppress thyroid activity), and healthy proteins.'
    }
  },
  'ft4': {
    name: 'Free Thyroxine (T4)',
    category: 'Thyroid Profile',
    unit: 'ng/dL',
    range: { min: 0.8, max: 1.8 },
    optimal: { min: 1.0, max: 1.5 },
    description: 'The main hormone secreted by the thyroid gland, circulating in an active, unbound state.',
    high: {
      title: 'High Free T4',
      causes: 'Hyperthyroidism, thyroiditis, or high doses of thyroid hormone replacement.',
      symptoms: 'Nervousness, sweating, weight loss, and heart palpitations.',
      diet: 'Incorporate antioxidant-rich foods and consult an endocrinologist.'
    },
    low: {
      title: 'Low Free T4',
      causes: 'Hypothyroidism, pituitary gland issues, or iodine deficiency.',
      symptoms: 'Fatigue, sluggishness, memory problems, and swelling.',
      diet: 'Focus on gut health and minerals like selenium, zinc, and iron.'
    }
  },
  'ft3': {
    name: 'Free Triiodothyronine (T3)',
    category: 'Thyroid Profile',
    unit: 'pg/mL',
    range: { min: 2.0, max: 4.4 },
    optimal: { min: 2.8, max: 3.8 },
    description: 'The highly active thyroid hormone that directly regulates cellular metabolism.',
    high: {
      title: 'High Free T3',
      causes: 'Hyperthyroidism or conversion issues of T4 to T3.',
      symptoms: 'High metabolism, weight loss, anxiety, tremors.',
      diet: 'Reduce inflammatory foods, focus on magnesium-rich foods to soothe muscles.'
    },
    low: {
      title: 'Low Free T3',
      causes: 'Hypothyroidism, severe systemic illness, or poor conversion of T4 to T3 (due to stress, gut issues).',
      symptoms: 'Low body temperature, fatigue, brain fog, thinning hair.',
      diet: 'Address stress levels (cortisol blocks conversion). Consume selenium, zinc, and anti-inflammatory nutrients.'
    }
  },

  // --- Metabolic / Glucose ---
  'hba1c': {
    name: 'Hemoglobin A1c',
    category: 'Metabolic Panel',
    unit: '%',
    range: { min: 4.0, max: 5.6 }, // 5.7 - 6.4 is prediabetes, >= 6.5 is diabetes
    optimal: { min: 4.5, max: 5.3 },
    description: 'A measure of your average blood sugar levels over the past 3 months.',
    high: {
      title: 'Elevated HbA1c (Prediabetes / Diabetes)',
      causes: 'Insulin resistance, physical inactivity, diet high in refined carbs and sugar, or genetics.',
      symptoms: 'Increased thirst, frequent urination, fatigue, or blurred vision.',
      diet: 'Adopt a low-glycemic diet. Focus on fiber, healthy fats, and protein. Avoid sugary beverages, white flour, and processed sweets. Engage in regular resistance and aerobic exercise.'
    },
    low: {
      title: 'Low HbA1c',
      causes: 'Frequent hypoglycemia, liver disease, chronic kidney disease, or hemolytic anemia.',
      symptoms: 'Dizziness, shaking, sweating, or hunger if caused by low blood sugar events.',
      diet: 'Eat regular, balanced meals containing complex carbohydrates, protein, and fat to stabilize glucose levels.'
    }
  },
  'glucose': {
    name: 'Fasting Blood Glucose',
    category: 'Metabolic Panel',
    unit: 'mg/dL',
    range: { min: 70, max: 99 },
    optimal: { min: 75, max: 90 },
    description: 'The concentration of glucose (sugar) present in the blood after fasting overnight.',
    high: {
      title: 'Hyperglycemia',
      causes: 'Insulin resistance, high carbohydrate intake, stress, lack of sleep, or diabetes.',
      symptoms: 'Thirst, headache, difficulty concentrating, fatigue.',
      diet: 'Drink plenty of water. Walk after meals to help muscles clear glucose. Choose complex carbohydrates over simple sugars.'
    },
    low: {
      title: 'Hypoglycemia',
      causes: 'Prolonged fasting, intense exercise without eating, or excess insulin/diabetes medications.',
      symptoms: 'Shakiness, sweating, rapid heart rate, confusion, dizziness.',
      diet: 'Consume 15g of fast-acting carbs (fruit juice, honey) if showing symptoms, followed by a balanced meal.'
    }
  }
};

const SAMPLE_REPORTS = {
  cbc: {
    id: 'rep_001',
    title: 'Complete Blood Count (CBC)',
    date: '2026-06-15',
    category: 'Hematology',
    notes: 'Routine physical checkup. Patient reports occasional fatigue but otherwise healthy.',
    biomarkers: {
      'hb': 11.2,    // Low
      'wbc': 6.2,     // Normal
      'plt': 240,     // Normal
      'rbc': 3.9      // Low
    },
    summary: 'The Complete Blood Count indicates mild microcytic anemia, characterized by slightly reduced hemoglobin and red blood cells. The white blood cell count and platelet counts are fully stable and within optimal ranges, which rules out acute infection or clotting disorders. The mild decrease in Hemoglobin (11.2 g/dL) is consistent with iron deficiency or nutritional shortfall.',
    actions: [
      { type: 'diet', text: 'Increase intake of iron-dense foods like spinach, lentils, pumpkin seeds, and lean proteins.' },
      { type: 'diet', text: 'Pair iron sources with Vitamin C (citrus, tomatoes) to double absorption efficiency.' },
      { type: 'test', text: 'Consider getting a Ferritin and Iron panel to confirm iron stores.' },
      { type: 'lifestyle', text: 'Ensure 7.5 to 8.5 hours of sleep to support cellular regeneration.' }
    ]
  },
  lipid: {
    id: 'rep_002',
    title: 'Advanced Lipid Panel',
    date: '2026-06-20',
    category: 'Cardiovascular',
    notes: 'Follow-up for cardiovascular risk assessment. Family history of hyperlipidemia.',
    biomarkers: {
      'chol': 245,    // High
      'ldl': 162,     // High
      'hdl': 35,      // Low
      'tg': 210       // High
    },
    summary: 'This Lipid Panel shows an atherogenic profile with marked dyslipidemia. Total cholesterol is elevated, driven by high LDL ("bad") cholesterol (162 mg/dL) and elevated Triglycerides (210 mg/dL). Concurrently, HDL ("good") cholesterol is sub-optimal at 35 mg/dL. This combination increases the risk of arterial plaque buildup (atherosclerosis) and cardiovascular strain.',
    actions: [
      { type: 'diet', text: 'Strictly avoid trans fats and limit saturated fats to <7% of daily calories.' },
      { type: 'diet', text: 'Consume 20-30g of soluble fiber daily (oat bran, psyllium, beans, okra) to bind LDL.' },
      { type: 'lifestyle', text: 'Implement 150 minutes of moderate-intensity aerobic exercise or 75 minutes of vigorous exercise weekly.' },
      { type: 'lifestyle', text: 'Supplement with high-quality Omega-3 fatty acids (EPA/DHA) to lower triglycerides.' }
    ]
  },
  thyroid: {
    id: 'rep_003',
    title: 'Thyroid Function Test',
    date: '2026-07-01',
    category: 'Endocrinology',
    notes: 'Evaluated due to persistent fatigue, cold sensitivity, and unexplained weight gain.',
    biomarkers: {
      'tsh': 6.8,     // High
      'ft4': 0.72,    // Low
      'ft3': 2.1      // Low-Normal
    },
    summary: 'The thyroid panel indicates primary subclinical to mild overt hypothyroidism. The pituitary gland is secreting elevated TSH (6.8 µIU/mL) to prompt the thyroid, yet Free T4 remains low at 0.72 ng/dL, indicating the thyroid is underproducing hormone. This accounts for symptoms of fatigue, low metabolic rate, and temperature sensitivity.',
    actions: [
      { type: 'diet', text: 'Consume 2-3 Brazil nuts daily for organic Selenium, which helps convert T4 to active T3.' },
      { type: 'diet', text: 'Support adrenal health by managing stress, as high cortisol inhibits active thyroid hormone action.' },
      { type: 'medical', text: 'Share these results with an endocrinologist to discuss if low-dose thyroid hormone therapy (levothyroxine) is appropriate.' },
      { type: 'lifestyle', text: 'Incorporate light strength training rather than heavy exhausting cardio, which can stress the thyroid.' }
    ]
  },
  diabetes: {
    id: 'rep_004',
    title: 'Metabolic & Glycemic Profile',
    date: '2026-07-02',
    category: 'Metabolic',
    notes: 'Routine screening. Subject has a sedentary desk job and seeks lifestyle improvements.',
    biomarkers: {
      'glucose': 118,  // High (Fasting)
      'hba1c': 6.1     // High (Prediabetes range)
    },
    summary: 'The metabolic markers indicate a state of impaired fasting glucose and insulin resistance, placing the patient in the prediabetes range (HbA1c of 5.7%-6.4% is classified as prediabetic). The elevated fasting blood glucose (118 mg/dL) combined with an HbA1c of 6.1% suggests blood sugars are chronically elevated over the past 90 days. This condition is highly reversible through targeted nutrition and active muscle loading.',
    actions: [
      { type: 'diet', text: 'Implement a low-glycemic, whole-food diet. Avoid refined sugars, flours, sodas, and juices.' },
      { type: 'lifestyle', text: 'Take a 10-15 minute walk immediately after meals to allow skeletal muscle to clear blood sugar.' },
      { type: 'lifestyle', text: 'Focus on resistance training 2-3 times per week to increase muscle mass, which enhances insulin sensitivity.' },
      { type: 'test', text: 'Re-test Fasting Insulin and HbA1c in 3 months to monitor regression progress.' }
    ]
  }
};

const CHAT_RESPONSES = {
  greetings: [
    "Hello! I am Cura AI, your digital health assistant. I can analyze your uploaded medical report and answer any clinical questions in detail. How can I assist you today?",
    "Hi there! Welcome to Cura AI. Upload a lab report or select one of our demo panels above, and I can walk you through the results, explain specific markers, or suggest lifestyle and dietary adjustments."
  ],
  general: [
    "Please upload a medical report or select a sample report above. Once loaded, I'll be able to answer specific questions about your biomarkers, values, and action items!",
    "I'm ready to help! To get started, drag and drop a medical report or select one of the templates. I will then analyze your specific biomarkers."
  ]
};

// Export to window object for browser access
window.CuraMedicalDb = {
  BIOMARKER_DICT,
  SAMPLE_REPORTS,
  CHAT_RESPONSES
};
