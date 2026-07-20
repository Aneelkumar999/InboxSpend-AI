import { http, HttpResponse } from 'msw';

export const handlers = [
  http.post('*/api/auth/google', () => {
    return HttpResponse.json({ access_token: 'mock-token' });
  }),

  http.get('*/api/dashboard', () => {
    return HttpResponse.json({
      monthly_expense: 45000,
      weekly_expense: 12000,
      today_expense: 2500,
      avg_daily_spend: 1500,
      highest_merchant: 'Amazon',
      highest_category: 'Shopping',
      total_expense: 120000,
      monthly_growth: -5.2,
      monthly_chart: [
        { label: 'Jan', value: 20000 },
        { label: 'Feb', value: 25000 },
        { label: 'Mar', value: 30000 },
        { label: 'Apr', value: 22000 },
        { label: 'May', value: 45000 },
        { label: 'Jun', value: 35000 },
      ],
      category_pie: [
        { label: 'Food', value: 30 },
        { label: 'Shopping', value: 40 },
        { label: 'Travel', value: 15 },
        { label: 'Bills', value: 15 },
      ],
      weekly_chart: [
        { label: 'Week 1', value: 10000 },
        { label: 'Week 2', value: 15000 },
        { label: 'Week 3', value: 8000 },
        { label: 'Week 4', value: 12000 },
      ],
      merchant_chart: [
        { label: 'Amazon', value: 15000 },
        { label: 'Uber', value: 5000 },
        { label: 'Starbucks', value: 3000 },
        { label: 'Netflix', value: 1500 },
      ],
    });
  }),

  http.get('*/api/expenses', ({ request }) => {
    const url = new URL(request.url);
    const category = url.searchParams.get('category') || '';
    const search = url.searchParams.get('search') || '';
    const sortBy = url.searchParams.get('sort_by') || 'date';
    const sortOrder = url.searchParams.get('sort_order') || 'desc';

    let data = [
      { id: '1', date: '2026-07-10T10:00:00Z', merchant: 'Amazon', category: 'Shopping', amount: 1500, email_subject: 'Your Amazon Order' },
      { id: '2', date: '2026-07-12T12:30:00Z', merchant: 'Uber', category: 'Travel', amount: 450, email_subject: 'Your Uber Ride' },
      { id: '3', date: '2026-07-14T09:15:00Z', merchant: 'Starbucks', category: 'Food', amount: 350, email_subject: 'Starbucks Receipt' },
      { id: '4', date: '2026-07-15T18:00:00Z', merchant: 'Netflix', category: 'Subscriptions', amount: 199, email_subject: 'Your Netflix Membership' },
    ];

    if (category) {
      data = data.filter((d) => d.category === category);
    }
    if (search) {
      data = data.filter((d) => d.merchant.toLowerCase().includes(search.toLowerCase()) || d.email_subject.toLowerCase().includes(search.toLowerCase()));
    }
    
    // Sort logic
    data.sort((a, b) => {
      let valA = a[sortBy as keyof typeof a];
      let valB = b[sortBy as keyof typeof b];
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return HttpResponse.json(data);
  }),

  http.post('*/api/sync', () => {
    return HttpResponse.json({ message: 'Sync completed successfully' });
  }),

  http.get('*/api/reports', () => {
    return HttpResponse.json({
      summary: 'Your spending is typical this month.',
      insights: ['You spent 15% less on Food compared to last month.'],
    });
  }),

  http.post('*/api/chat', async () => {
    return HttpResponse.json({ reply: 'This is a mock AI response about your spending.' });
  }),
];
