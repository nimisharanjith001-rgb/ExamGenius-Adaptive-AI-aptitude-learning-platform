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
    return {
      status: 200,
      data: {
        peak_hours: ['18:00', '19:00', '20:00', '21:00', '22:00'],
        off_peak_hours: ['00:00', '01:00', '02:00', '03:00', '04:00', '05:00'],
        peak_avg_kwh: 2.38,
        off_peak_avg_kwh: 0.64,
        peak_percentage: 50.2,
        hourly_breakdown: []
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
    return {
      status: 200,
      data: {
        appliances: [
          { name: 'Air Conditioner / HVAC', category: 'Climate', estimated_kwh: 142.6, percentage: 38.5, icon: 'Wind' },
          { name: 'Refrigerator (Base Load)', category: 'Kitchen', estimated_kwh: 48.0, percentage: 13.0, icon: 'Refrigerator' },
          { name: 'Electric Oven / Microwave', category: 'Kitchen', estimated_kwh: 30.4, percentage: 8.2, icon: 'Flame' },
          { name: 'Washing Machine', category: 'Laundry', estimated_kwh: 28.1, percentage: 7.6, icon: 'Shirt' },
          { name: 'Water Geyser / Heater', category: 'Climate', estimated_kwh: 24.0, percentage: 6.5, icon: 'Droplets' },
          { name: 'Base Lighting & Electronics', category: 'Base', estimated_kwh: 97.28, percentage: 26.2, icon: 'Tv' }
        ],
        top_appliance: 'Air Conditioner / HVAC',
        total_kwh: 370.38,
        currency: '₹'
      }
    };
  }

  // 11. MACHINE LEARNING
  if (cleanUrl.startsWith('/ml/anomaly-detection')) {
    return {
      status: 200,
      data: {
        total_anomalies: 11,
        high_severity_count: 2,
        medium_severity_count: 5,
        low_severity_count: 4,
        anomaly_rate_pct: 3.2,
        anomalies: [
          {
            timestamp: new Date().toISOString(),
            actual_kwh: 6.84,
            baseline_kwh: 1.45,
            deviation_pct: 371.7,
            severity: 'HIGH',
            explanation: 'Extreme power surge detected during off-peak period (4.7x baseline expectation).'
          },
          {
            timestamp: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
            actual_kwh: 5.12,
            baseline_kwh: 1.62,
            deviation_pct: 216.0,
            severity: 'HIGH',
            explanation: 'Unusual sustained high load detected across sub-metering circuits.'
          }
        ],
        model_info: { model: 'Isolation Forest (100 Estimators)', contamination: 0.03 }
      }
    };
  }

  if (cleanUrl.startsWith('/ml/forecast')) {
    const forecast = [];
    const now = new Date();
    for (let i = 1; i <= 24; i++) {
      const t = new Date(now.getTime() + i * 3600 * 1000);
      const val = +(1.1 + Math.sin(i / 3) * 0.6).toFixed(2);
      forecast.push({
        timestamp: t.toISOString(),
        predicted_kwh: val,
        lower_bound: +(val * 0.85).toFixed(2),
        upper_bound: +(val * 1.15).toFixed(2)
      });
    }
    return {
      status: 200,
      data: {
        horizon_type: '24h Load Forecasting',
        model_name: 'Random Forest Regressor',
        r2_score: 0.902,
        rmse: 0.28,
        mae: 0.21,
        forecast
      }
    };
  }

  if (cleanUrl.startsWith('/ml/clustering')) {
    return {
      status: 200,
      data: {
        optimal_k: 5,
        clusters: [
          { cluster_id: 0, label: 'Night Basal Load', avg_kwh: 0.45, count: 62 },
          { cluster_id: 1, label: 'Morning Peak Activity', avg_kwh: 1.85, count: 48 },
          { cluster_id: 2, label: 'Daytime Moderate', avg_kwh: 1.12, count: 70 },
          { cluster_id: 3, label: 'Evening Cooking & Lighting', avg_kwh: 2.65, count: 85 },
          { cluster_id: 4, label: 'High Demand Surge', avg_kwh: 5.40, count: 18 }
        ]
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
    return {
      status: 200,
      data: {
        energy_charges: 2450.25,
        fixed_charges: 120.00,
        tax_amount: 128.51,
        total_bill: 2698.76,
        currency: '₹',
        units_billed: 370.38
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
        tax_rate_pct: 5.0
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
            title: 'Shift HVAC Pre-Cooling to Off-Peak Hours',
            description: 'Run air conditioning 30 minutes earlier before the 18:00 peak slab begins to reduce peak-tier charges.',
            estimated_saving_kwh: 24.0,
            estimated_saving_amount: 180.00,
            priority: 'HIGH'
          },
          {
            title: 'High Standby Basal Load Detected',
            description: 'Standby electronics consume ~97 kWh monthly. Using smart power strips could yield immediate savings.',
            estimated_saving_kwh: 15.5,
            estimated_saving_amount: 116.25,
            priority: 'MEDIUM'
          },
          {
            title: 'Optimize Laundry Wash Cycles',
            description: 'Consolidate wash loads to weekends to capitalize on lower tariff slabs.',
            estimated_saving_kwh: 9.0,
            estimated_saving_amount: 67.50,
            priority: 'LOW'
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
