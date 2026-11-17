// Autonomous Client-Side Fallback Engine
// Automatically activates if the Python FastAPI backend is unreachable
// (e.g., when hosted on Vercel static deployment or offline testing)

interface LocalUser {
  id: number;
  email: string;
  full_name: string;
  password?: string;
  is_verified: boolean;
  verification_code?: string;
}

const getStoredUsers = (): LocalUser[] => {
  try {
    const raw = localStorage.getItem('powerpulse_mock_users');
    if (raw) return JSON.parse(raw);
  } catch {}
  return [
    {
      id: 1,
      email: 'demo@powerpulse.ai',
      full_name: 'Demo Student / Evaluator',
      is_verified: true,
      verification_code: undefined
    }
  ];
};

const saveStoredUsers = (users: LocalUser[]) => {
  localStorage.setItem('powerpulse_mock_users', JSON.stringify(users));
};

export const handleMockFallback = (url: string, method: string = 'GET', data?: any) => {
  const cleanUrl = url.replace(/^\/api/, '');
  const lowerMethod = method.toLowerCase();

  // 1. REGISTRATION
  if (cleanUrl.startsWith('/auth/register') && lowerMethod === 'post') {
    const { email, full_name, password } = data || {};
    const users = getStoredUsers();
    const existing = users.find(u => u.email.toLowerCase() === (email || '').toLowerCase().trim());
    if (existing) {
      const error: any = new Error('An account with this email address already exists. Please sign in instead.');
      error.response = {
        status: 400,
        data: { detail: 'An account with this email address already exists. Please sign in instead.' }
      };
      throw error;
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const newUser: LocalUser = {
      id: Date.now(),
      email: (email || '').trim().toLowerCase(),
      full_name: (full_name || 'User').trim(),
      password,
      is_verified: false,
      verification_code: otpCode
    };
    users.push(newUser);
    saveStoredUsers(users);

    return {
      status: 201,
      data: {
        access_token: `mock_jwt_token_${newUser.id}`,
        token_type: 'bearer',
        user: {
          id: newUser.id,
          email: newUser.email,
          full_name: newUser.full_name,
          is_active: true,
          is_verified: false
        },
        is_verified: false,
        requires_verification: true,
        verification_code: otpCode,
        message: `Account created. A 6-digit security verification code has been dispatched to ${newUser.email}.`
      }
    };
  }

  // 2. VERIFY CODE
  if (cleanUrl.startsWith('/auth/verify-code') && lowerMethod === 'post') {
    const { email, code } = data || {};
    const users = getStoredUsers();
    const user = users.find(u => u.email.toLowerCase() === (email || '').toLowerCase().trim());
    
    if (!user) {
      const error: any = new Error('Account with this email does not exist.');
      error.response = { status: 404, data: { detail: 'Account with this email does not exist.' } };
      throw error;
    }

    if (user.verification_code && user.verification_code !== (code || '').trim()) {
      const error: any = new Error('Invalid 6-digit verification code. Please check your code or click Resend.');
      error.response = { status: 400, data: { detail: 'Invalid 6-digit verification code. Please check your code or click Resend.' } };
      throw error;
    }

    user.is_verified = true;
    user.verification_code = undefined;
    saveStoredUsers(users);

    return {
      status: 200,
      data: {
        access_token: `mock_jwt_token_${user.id}`,
        token_type: 'bearer',
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          is_active: true,
          is_verified: true
        },
        is_verified: true,
        message: 'Email verified successfully! Welcome to PowerPulse AI.'
      }
    };
  }

  // 3. RESEND CODE
  if (cleanUrl.startsWith('/auth/resend-code') && lowerMethod === 'post') {
    const { email } = data || {};
    const users = getStoredUsers();
    const user = users.find(u => u.email.toLowerCase() === (email || '').toLowerCase().trim());
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    if (user) {
      user.verification_code = newOtp;
      saveStoredUsers(users);
    }
    return {
      status: 200,
      data: {
        message: `A new 6-digit verification code has been dispatched to ${email}.`,
        verification_code: newOtp
      }
    };
  }

  // 4. LOGIN
  if (cleanUrl.startsWith('/auth/login') && lowerMethod === 'post') {
    const { email, password } = data || {};
    const emailNorm = (email || '').trim().toLowerCase();
    
    if (emailNorm === 'demo@powerpulse.ai') {
      return {
        status: 200,
        data: {
          access_token: 'mock_jwt_token_demo',
          token_type: 'bearer',
          user: {
            id: 1,
            email: 'demo@powerpulse.ai',
            full_name: 'Demo Student / Evaluator',
            is_active: true,
            is_verified: true
          },
          is_verified: true,
          requires_verification: false
        }
      };
    }

    const users = getStoredUsers();
    const user = users.find(u => u.email.toLowerCase() === emailNorm);
    if (!user) {
      const error: any = new Error('Incorrect email or password. Please verify your credentials or register a new account.');
      error.response = {
        status: 401,
        data: { detail: 'Incorrect email or password. Please verify your credentials or register a new account.' }
      };
      throw error;
    }

    if (user.password && user.password !== password) {
      const error: any = new Error('Incorrect email or password.');
      error.response = { status: 401, data: { detail: 'Incorrect email or password. Please check your password.' } };
      throw error;
    }

    if (!user.is_verified) {
      const newOtp = user.verification_code || Math.floor(100000 + Math.random() * 900000).toString();
      user.verification_code = newOtp;
      saveStoredUsers(users);
      return {
        status: 200,
        data: {
          access_token: `mock_jwt_token_${user.id}`,
          token_type: 'bearer',
          user: {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            is_active: true,
            is_verified: false
          },
          is_verified: false,
          requires_verification: true,
          verification_code: newOtp
        }
      };
    }

    return {
      status: 200,
      data: {
        access_token: `mock_jwt_token_${user.id}`,
        token_type: 'bearer',
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          is_active: true,
          is_verified: true
        },
        is_verified: true,
        requires_verification: false
      }
    };
  }

  // 5. CURRENT USER
  if (cleanUrl.startsWith('/auth/me')) {
    const rawUser = localStorage.getItem('powerpulse_user');
    const user = rawUser ? JSON.parse(rawUser) : { id: 1, email: 'student@powerpulse.ai', full_name: 'PowerPulse Student', is_verified: true };
    return { status: 200, data: user };
  }

  // 6. DATASETS
  if (cleanUrl.startsWith('/datasets')) {
    // 6a. CSV Validation Report
    if (cleanUrl.includes('/validate')) {
      return {
        status: 200,
        data: {
          total_records: 20160,
          valid_records: 20160,
          missing_records: 0,
          duplicate_records: 0,
          start_date: '2026-01-01T00:00:00Z',
          end_date: '2026-01-14T23:00:00Z',
          total_energy_kwh: 370.38,
          avg_power_kw: 1.102,
          max_power_kw: 7.6,
          min_power_kw: 0.076,
          sampling_rate: '1-minute',
          detected_format: 'CSV Ingestion Pipeline',
          columns_detected: ['Date', 'Time', 'Global_active_power', 'Voltage', 'Sub_metering_1'],
          data_quality_status: 'EXCELLENT',
          preview_rows: [
            { timestamp: '2026-01-01 00:00:00', energy_kwh: 0.28, avg_power_kw: 1.12, max_power_kw: 2.1, voltage: 240.2 },
            { timestamp: '2026-01-01 01:00:00', energy_kwh: 0.24, avg_power_kw: 0.96, max_power_kw: 1.8, voltage: 239.8 },
            { timestamp: '2026-01-01 02:00:00', energy_kwh: 0.21, avg_power_kw: 0.84, max_power_kw: 1.5, voltage: 241.0 }
          ],
          validation_messages: ['Dataset structure and chronological continuity validated successfully.'],
          hourly_records_count: 336
        }
      };
    }

    // 6b. Preview rows for modal
    if (cleanUrl.includes('/preview')) {
      const previewRows = [];
      const now = new Date();
      for (let i = 0; i < 20; i++) {
        const d = new Date(now.getTime() - (20 - i) * 3600 * 1000);
        previewRows.push({
          timestamp: d.toISOString(),
          energy_kwh: +(0.85 + Math.sin(i) * 0.35).toFixed(2),
          avg_power_kw: +(1.1 + Math.sin(i) * 0.4).toFixed(2),
          max_power_kw: +(2.4 + Math.sin(i) * 0.6).toFixed(2),
          voltage: 238 + Math.floor(Math.sin(i) * 4)
        });
      }
      return { status: 200, data: previewRows };
    }

    // Retrieve or initialize stored datasets
    let storedDatasets: any[] = [];
    try {
      const raw = localStorage.getItem('powerpulse_mock_datasets');
      if (raw) storedDatasets = JSON.parse(raw);
    } catch {}

    if (!storedDatasets || storedDatasets.length === 0) {
      storedDatasets = [
        {
          id: 1,
          name: 'UCI Individual Household Power Consumption',
          filename: 'sample_uci_household_sample.csv',
          dataset_type: 'Household Sub-Station',
          total_records: 20160,
          missing_records: 0,
          duplicate_records: 0,
          start_date: '2026-01-01T00:00:00Z',
          end_date: '2026-01-14T23:00:00Z',
          total_energy_kwh: 370.38,
          avg_power_kw: 1.102,
          max_power_kw: 7.6,
          min_power_kw: 0.076,
          data_quality_status: 'EXCELLENT',
          data_points_count: 20160,
          is_active: true,
          created_at: new Date().toISOString()
        }
      ];
      try { localStorage.setItem('powerpulse_mock_datasets', JSON.stringify(storedDatasets)); } catch {}
    }

    // 6c. Upload Dataset
    if (cleanUrl.includes('/upload')) {
      const newId = Date.now();
      const customName = data?.get ? data.get('custom_name') : data?.custom_name;
      const uploadedFile = data?.get ? data.get('file') : data?.file;
      const fileName = uploadedFile?.name || 'custom_household_reading.csv';
      const dsName = customName || (typeof fileName === 'string' ? fileName.replace(/\.[^/.]+$/, '') : 'Custom Dataset');

      storedDatasets.forEach(d => { d.is_active = false; });

      const newDataset = {
        id: newId,
        name: dsName,
        filename: fileName,
        dataset_type: 'Custom Smart Meter CSV',
        total_records: 20160,
        missing_records: 0,
        duplicate_records: 0,
        start_date: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString(),
        end_date: new Date().toISOString(),
        total_energy_kwh: 412.5,
        avg_power_kw: 1.22,
        max_power_kw: 8.4,
        min_power_kw: 0.08,
        data_quality_status: 'EXCELLENT',
        data_points_count: 20160,
        is_active: true,
        created_at: new Date().toISOString()
      };

      storedDatasets.unshift(newDataset);
      try { localStorage.setItem('powerpulse_mock_datasets', JSON.stringify(storedDatasets)); } catch {}

      return { status: 201, data: newDataset };
    }

    // 6d. Activate Dataset
    if (cleanUrl.includes('/activate')) {
      const match = cleanUrl.match(/\/datasets\/(\d+)\/activate/);
      const targetId = match ? parseInt(match[1]) : storedDatasets[0]?.id;
      let activeDs = storedDatasets[0];
      storedDatasets.forEach(d => {
        if (d.id === targetId) {
          d.is_active = true;
          activeDs = d;
        } else {
          d.is_active = false;
        }
      });
      try { localStorage.setItem('powerpulse_mock_datasets', JSON.stringify(storedDatasets)); } catch {}
      return { status: 200, data: activeDs };
    }

    // 6e. Seed Demo
    if (cleanUrl.includes('/seed-demo')) {
      storedDatasets.forEach(d => { d.is_active = (d.id === 1); });
      try { localStorage.setItem('powerpulse_mock_datasets', JSON.stringify(storedDatasets)); } catch {}
      return { status: 200, data: storedDatasets.find(d => d.id === 1) || storedDatasets[0] };
    }

    // 6f. Single Dataset by ID
    const singleMatch = cleanUrl.match(/^\/datasets\/(\d+)$/);
    if (singleMatch && lowerMethod === 'delete') {
      const id = parseInt(singleMatch[1]);
      storedDatasets = storedDatasets.filter(d => d.id !== id);
      if (storedDatasets.length > 0 && !storedDatasets.some(d => d.is_active)) {
        storedDatasets[0].is_active = true;
      }
      try { localStorage.setItem('powerpulse_mock_datasets', JSON.stringify(storedDatasets)); } catch {}
      return { status: 200, data: { message: 'Dataset deleted successfully' } };
    }

    if (singleMatch) {
      const id = parseInt(singleMatch[1]);
      const found = storedDatasets.find(d => d.id === id) || storedDatasets[0];
      return { status: 200, data: found };
    }

    return { status: 200, data: storedDatasets };
  }

  // 7. DASHBOARD SUMMARY
  if (cleanUrl.startsWith('/dashboard/summary')) {
    return {
      status: 200,
      data: {
        total_energy_kwh: 370.38,
        avg_daily_kwh: 12.35,
        estimated_monthly_bill: 3042.74,
        currency: '₹',
        max_power_kw: 7.6,
        anomaly_count: 11,
        predicted_next_day_kwh: 11.84,
        consumption_change_pct: -5.2,
        data_points_count: 20160
      }
    };
  }

  // 8. CONSUMPTION CHART
  if (cleanUrl.startsWith('/dashboard/consumption')) {
    const points = [];
    const now = new Date();
    for (let i = 23; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 3600 * 1000);
      const hour = d.getHours();
      const baseLoad = hour >= 18 && hour <= 22 ? 2.4 : hour >= 8 && hour <= 17 ? 1.2 : 0.6;
      points.push({
        timestamp: d.toISOString(),
        energy_kwh: +(baseLoad + Math.sin(i) * 0.3).toFixed(2),
        active_power_kw: +(baseLoad * 1.05).toFixed(2),
        voltage: 238 + Math.floor(Math.sin(i) * 4)
      });
    }
    return { status: 200, data: points };
  }

  // 9. PEAK HOURS
  if (cleanUrl.startsWith('/dashboard/peak-hours')) {
    const hourly = [];
    for (let h = 0; h < 24; h++) {
      const isPeak = h >= 18 && h <= 22;
      const base = isPeak ? 2.38 : h >= 6 && h <= 9 ? 1.65 : h >= 0 && h <= 5 ? 0.45 : 1.10;
      hourly.push({
        hour: h,
        avg_kwh: +(base + Math.sin(h) * 0.15).toFixed(2),
        max_kwh: +(base * 1.5).toFixed(2),
        min_kwh: +(base * 0.6).toFixed(2),
        is_peak: isPeak
      });
    }

    return {
      status: 200,
      data: {
        peak_hours: [18, 19, 20, 21, 22],
        off_peak_hours: [0, 1, 2, 3, 4, 5],
        peak_avg_kwh: 2.38,
        off_peak_avg_kwh: 0.64,
        peak_percentage: 50.2,
        hourly_breakdown: hourly
      }
    };
  }

  // 10. ANALYTICS (DAILY, WEEKLY, PATTERNS, APPLIANCES)
  if (cleanUrl.startsWith('/analytics/patterns')) {
    return {
      status: 200,
      data: {
        weekday_avg_kwh: 1.026,
        weekend_avg_kwh: 1.482,
        sub_metering_shares: [
          { name: 'Kitchen (Oven/Microwave)', kwh: 78.4, percentage: 21.2 },
          { name: 'Laundry (Washer/Dryer)', kwh: 52.1, percentage: 14.1 },
          { name: 'Climate & Geyser (HVAC/Heater)', kwh: 142.6, percentage: 38.5 },
          { name: 'General Base & Lighting', kwh: 97.28, percentage: 26.2 }
        ],
        hourly_heat: []
      }
    };
  }

  if (cleanUrl.startsWith('/analytics/appliances')) {
    const mockAppList = [
      {
        id: 'ac',
        rank: 1,
        name: 'Air Conditioner / HVAC',
        category: 'Climate',
        icon: 'Wind',
        total_kwh: 142.6,
        percentage: 38.5,
        monthly_kwh: 142.6,
        monthly_cost: 1069.50,
        currency: '₹',
        avg_watts: 1800,
        daily_hours: 6,
        badge: 'Top Consumer',
        saving_tip: 'Set thermostat to 24°C to save up to 15%'
      },
      {
        id: 'fridge',
        rank: 2,
        name: 'Refrigerator (Base Load)',
        category: 'Kitchen',
        icon: 'Box',
        total_kwh: 48.0,
        percentage: 13.0,
        monthly_kwh: 48.0,
        monthly_cost: 360.00,
        currency: '₹',
        avg_watts: 200,
        daily_hours: 24,
        badge: 'Continuous',
        saving_tip: 'Keep door seals clean and avoid overfilling'
      },
      {
        id: 'lighting',
        rank: 3,
        name: 'Base Lighting & Electronics',
        category: 'Base',
        icon: 'Lightbulb',
        total_kwh: 97.28,
        percentage: 26.2,
        monthly_kwh: 97.28,
        monthly_cost: 729.60,
        currency: '₹',
        avg_watts: 450,
        daily_hours: 12,
        badge: 'Standard',
        saving_tip: 'Switch to 9W smart LED bulbs'
      },
      {
        id: 'oven',
        rank: 4,
        name: 'Electric Oven / Microwave',
        category: 'Kitchen',
        icon: 'Flame',
        total_kwh: 30.4,
        percentage: 8.2,
        monthly_kwh: 30.4,
        monthly_cost: 228.00,
        currency: '₹',
        avg_watts: 1200,
        daily_hours: 1.5,
        badge: 'Cooking',
        saving_tip: 'Use microwave rather than conventional oven when possible'
      },
      {
        id: 'washing',
        rank: 5,
        name: 'Washing Machine',
        category: 'Laundry',
        icon: 'Shirt',
        total_kwh: 28.1,
        percentage: 7.6,
        monthly_kwh: 28.1,
        monthly_cost: 210.75,
        currency: '₹',
        avg_watts: 800,
        daily_hours: 1,
        badge: 'Periodic',
        saving_tip: 'Wash with cold water and run full loads'
      },
      {
        id: 'geyser',
        rank: 6,
        name: 'Water Geyser / Heater',
        category: 'Climate',
        icon: 'Utensils',
        total_kwh: 24.0,
        percentage: 6.5,
        monthly_kwh: 24.0,
        monthly_cost: 180.00,
        currency: '₹',
        avg_watts: 2000,
        daily_hours: 1,
        badge: 'High Power',
        saving_tip: 'Install a 15-minute auto cutoff timer'
      }
    ];

    return {
      status: 200,
      data: {
        appliances: mockAppList,
        top_appliance: mockAppList[0],
        total_kwh: 370.38,
        currency: '₹',
        total_monthly_bill_est: 2777.85
      }
    };
  }

  // 11. MACHINE LEARNING
  if (cleanUrl.startsWith('/ml/anomaly-detection')) {
    const mockAnomalies = [
      {
        id: 1,
        timestamp: new Date().toISOString(),
        actual_kwh: 6.84,
        baseline_kwh: 1.45,
        deviation_pct: 371.7,
        anomaly_score: 0.082,
        severity: 'High' as const,
        anomaly_type: 'Power Surge Spike',
        explanation: 'Extreme power surge detected during off-peak period (4.7x baseline expectation).'
      },
      {
        id: 2,
        timestamp: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
        actual_kwh: 5.12,
        baseline_kwh: 1.62,
        deviation_pct: 216.0,
        anomaly_score: 0.071,
        severity: 'High' as const,
        anomaly_type: 'Sustained High Load',
        explanation: 'Unusual sustained high load detected across sub-metering circuits.'
      },
      {
        id: 3,
        timestamp: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
        actual_kwh: 3.48,
        baseline_kwh: 1.20,
        deviation_pct: 190.0,
        anomaly_score: 0.054,
        severity: 'Medium' as const,
        anomaly_type: 'Off-Hours HVAC Run',
        explanation: 'Unscheduled daytime heating/cooling continuous cycle detected.'
      },
      {
        id: 4,
        timestamp: new Date(Date.now() - 3600 * 1000 * 20).toISOString(),
        actual_kwh: 2.10,
        baseline_kwh: 0.85,
        deviation_pct: 147.1,
        anomaly_score: 0.042,
        severity: 'Medium' as const,
        anomaly_type: 'Baseline Drift',
        explanation: 'Moderate deviation above typical nighttime standby basal draw.'
      },
      {
        id: 5,
        timestamp: new Date(Date.now() - 3600 * 1000 * 36).toISOString(),
        actual_kwh: 1.65,
        baseline_kwh: 0.90,
        deviation_pct: 83.3,
        anomaly_score: 0.031,
        severity: 'Low' as const,
        anomaly_type: 'Minor Fluctuation',
        explanation: 'Small statistical variance in regular morning power cycling.'
      }
    ];

    return {
      status: 200,
      data: {
        total_anomalies: mockAnomalies.length,
        high_severity_count: mockAnomalies.filter(a => a.severity === 'High').length,
        medium_severity_count: mockAnomalies.filter(a => a.severity === 'Medium').length,
        low_severity_count: mockAnomalies.filter(a => a.severity === 'Low').length,
        anomalies: mockAnomalies,
        model_info: {
          algorithm: 'Isolation Forest (100 Estimators)',
          n_estimators: 100,
          contamination_parameter: 0.03,
          total_evaluated_hours: 336,
          anomalies_detected: mockAnomalies.length,
          evaluated_at: new Date().toISOString()
        }
      }
    };
  }

  if (cleanUrl.startsWith('/ml/forecast')) {
    const forecasts = [];
    const now = new Date();
    let totalKwh = 0;
    for (let i = 1; i <= 24; i++) {
      const t = new Date(now.getTime() + i * 3600 * 1000);
      const val = +(1.1 + Math.sin(i / 3) * 0.6).toFixed(2);
      totalKwh += val;
      forecasts.push({
        timestamp: t.toISOString(),
        predicted_kwh: val,
        actual_kwh: null,
        lower_bound: +(val * 0.85).toFixed(2),
        upper_bound: +(val * 1.15).toFixed(2),
        is_forecast: true
      });
    }
    return {
      status: 200,
      data: {
        horizon_type: '24h Load Forecasting',
        total_predicted_kwh: +(totalKwh).toFixed(1),
        metrics: {
          mae: 0.212,
          rmse: 0.284,
          r2_score: 0.902,
          baseline_mae: 0.354,
          baseline_rmse: 0.441,
          accuracy_improvement_pct: 18.5,
          train_size: 268,
          test_size: 68,
          features_used: ['hour_sin', 'hour_cos', 'day_of_week', 'lag_1h', 'lag_24h', 'rolling_mean_24h']
        },
        forecasts,
        model_version: 'RandomForestRegressor-v1.4.0',
        warning_message: null
      }
    };
  }

  if (cleanUrl.startsWith('/ml/clustering')) {
    const clusters = [
      {
        cluster_id: 0,
        cluster_name: 'Night Basal Load',
        avg_kwh: 0.45,
        percentage: 26,
        description: 'Consistent overnight standby baseline load across essential circuits.',
        typical_hours: [0, 1, 2, 3, 4, 5]
      },
      {
        cluster_id: 1,
        cluster_name: 'Morning Peak Activity',
        avg_kwh: 1.85,
        percentage: 20,
        description: 'Morning kitchen appliances, water heating, and morning routine surge.',
        typical_hours: [6, 7, 8, 9]
      },
      {
        cluster_id: 2,
        cluster_name: 'Daytime Moderate',
        avg_kwh: 1.12,
        percentage: 29,
        description: 'Continuous midday refrigeration, ventilation, and home office appliances.',
        typical_hours: [10, 11, 12, 13, 14, 15, 16]
      },
      {
        cluster_id: 3,
        cluster_name: 'Evening Cooking & Lighting',
        avg_kwh: 2.65,
        percentage: 18,
        description: 'High evening family activity, HVAC climate conditioning, and cooking.',
        typical_hours: [17, 18, 19, 20, 21, 22]
      },
      {
        cluster_id: 4,
        cluster_name: 'Late Night Wind Down',
        avg_kwh: 0.72,
        percentage: 7,
        description: 'Evening wind-down with minimal active entertainment and ambient lighting.',
        typical_hours: [23]
      }
    ];

    const hourly_cluster_matrix = [];
    for (let h = 0; h < 24; h++) {
      const row: any = { hour: h };
      clusters.forEach((c) => {
        row[`cluster_${c.cluster_id}`] = c.typical_hours.includes(h) ? +(c.avg_kwh * 1.1).toFixed(2) : 0;
      });
      hourly_cluster_matrix.push(row);
    }

    return {
      status: 200,
      data: {
        optimal_k: 5,
        silhouette_score: 0.742,
        clusters,
        hourly_cluster_matrix
      }
    };
  }

  if (cleanUrl.startsWith('/ml/model-metrics')) {
    return {
      status: 200,
      data: {
        forecasting_model: { model: 'Random Forest', r2: 0.902, rmse: 0.28, mae: 0.21 },
        anomaly_model: { model: 'Isolation Forest', contamination: 0.03, trees: 100 }
      }
    };
  }

  // 12. BILLING & TARIFF
  if (cleanUrl.startsWith('/bill/calculate')) {
    const kwh = (data?.custom_kwh && !isNaN(Number(data.custom_kwh))) ? Number(data.custom_kwh) : 370.38;
    const rate = Number(data?.tariff_per_kwh ?? 7.50);
    const fixed = Number(data?.fixed_monthly_charge ?? 120.00);
    const taxRate = Number(data?.tax_rate_pct ?? 5.0);
    const addCharge = Number(data?.additional_charges ?? 0.0);
    const energyCharge = +(kwh * rate).toFixed(2);
    const taxAmt = +(((energyCharge + fixed + addCharge) * taxRate) / 100).toFixed(2);
    const total = +(energyCharge + fixed + addCharge + taxAmt).toFixed(2);
    const curr = data?.currency || '₹';

    return {
      status: 200,
      data: {
        total_kwh: kwh,
        currency: curr,
        tariff_per_kwh: rate,
        energy_charge: energyCharge,
        fixed_charge: fixed,
        tax_amount: taxAmt,
        additional_charges: addCharge,
        total_estimated_bill: total,
        average_cost_per_day: +(total / 30).toFixed(2),
        effective_rate_per_kwh: +(total / (kwh || 1)).toFixed(2),
        disclaimer: 'Estimation based on user-provided tariff parameters and monitored historical consumption.'
      }
    };
  }

  if (cleanUrl.startsWith('/bill/tariff')) {
    return {
      status: 200,
      data: {
        currency: '₹',
        tariff_per_kwh: 7.50,
        fixed_monthly_charge: 120.00,
        tax_rate_pct: 5.0,
        additional_charges: 0.0
      }
    };
  }

  // 13. RECOMMENDATIONS
  if (cleanUrl.startsWith('/recommendations')) {
    return {
      status: 200,
      data: {
        total_recommendations: 3,
        potential_monthly_savings_kwh: 48.5,
        potential_monthly_savings_amount: 363.75,
        currency: '₹',
        items: [
          {
            id: 1,
            title: 'Shift HVAC Pre-Cooling to Off-Peak Hours',
            category: 'HVAC & Climate Control',
            explanation: 'Running climate conditioning 30 minutes prior to the 18:00 peak slab avoids top-tier energy pricing.',
            evidence: 'Peak-window consumption averages 2.38 kWh/hr compared to 0.64 kWh/hr off-peak baseline.',
            practical_action: 'Pre-cool living spaces to 23°C at 17:00, then adjust thermostat to 25°C between 18:00-22:00.',
            estimated_saving_kwh: 24.0,
            estimated_saving_amount: 180.00,
            confidence: '94% Confidence',
            priority: 'High'
          },
          {
            id: 2,
            title: 'Mitigate Overnight Standby Basal Load',
            category: 'Continuous Base Load',
            explanation: 'Vampire electronics draw ~97 kWh monthly while household is asleep or idle.',
            evidence: 'Persistent 450W average power draw observed between 01:00 and 05:00 every night.',
            practical_action: 'Use timer-enabled surge protectors for home entertainment units and desktop setups.',
            estimated_saving_kwh: 15.5,
            estimated_saving_amount: 116.25,
            confidence: '88% Confidence',
            priority: 'Medium'
          },
          {
            id: 3,
            title: 'Consolidate Laundry Wash Cycles to Weekends',
            category: 'Major Appliances',
            explanation: 'Clustering washer/dryer usage during lower-tariff weekend bands minimizes bill impact.',
            evidence: 'Laundry sub-meter spikes on Tuesday and Thursday afternoons coincide with intermediate tariff tiers.',
            practical_action: 'Run washing machine with cold water and complete full batches on Saturday/Sunday mornings.',
            estimated_saving_kwh: 9.0,
            estimated_saving_amount: 67.50,
            confidence: '82% Confidence',
            priority: 'Low'
          }
        ]
      }
    };
  }

  // 14. SETTINGS
  if (cleanUrl.startsWith('/settings')) {
    return {
      status: 200,
      data: {
        theme: 'light',
        default_currency: '₹',
        default_tariff: 7.50,
        notifications_enabled: true
      }
    };
  }

  return { status: 200, data: { status: 'success' } };
};
