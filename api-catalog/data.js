/* Internal API catalog prototype — all data is fictional. */
window.DATA = {
  /* Test / Production blocks used by the Get Access wizard. "immediate" and "reviewer" are filled in per API. */
  envs: [
    {
      id: 'test', title: 'Test', keyType: 'Standard Key', keyIcon: 'key',
      blurb: 'Ideal for development and integration testing. Access sandbox data with full API coverage and no rate limits on test endpoints.'
    },
    {
      id: 'prod', title: 'Production', keyType: 'Rotation Key', keyIcon: 'arrows-rotate',
      blurb: 'For live applications serving real users. Includes SLA-backed uptime, production rate limits, and access to real data.'
    }
  ],
  teams: ['Identity Platform', 'Clinical Data Services', 'Supply Chain Analytics', 'Research IT', 'Commercial Apps'],
  categories: ['Identity', 'Operations', 'Data', 'Messaging', 'Finance'],
  healthStates: {
    ok: { icon: 'circle-check', label: 'Operational' },
    degraded: { icon: 'triangle-exclamation', label: 'Degraded' },
    down: { icon: 'circle-xmark', label: 'Down' },
    maint: { icon: 'wrench', label: 'Maintenance' }
  },

  /* access: 'open' = production key granted immediately, 'restricted' = needs approval.
     health: [state, uptime % over 30 days, optional note] for test and prod. used = requests/day in thousands. */
  apis: [
    { id: 'auth', name: 'Authentication API', desc: 'Issue, refresh and revoke the access tokens every internal service uses to talk to the others.', v: '2.4', status: 'Stable', cat: 'Identity', owner: 'Identity Platform', access: 'restricted', reviewer: 'James Mitchell', used: 940, updated: '2026-09-28', base: '/v2', health: { test: ['ok', 99.98], prod: ['ok', 99.99] } },
    { id: 'users', name: 'User Directory API', desc: 'Look up employees, teams and reporting lines from the corporate directory.', v: '1.8', status: 'Stable', cat: 'Identity', owner: 'Identity Platform', access: 'open', used: 610, updated: '2026-08-14', base: '/v1/users', health: { test: ['ok', 99.9], prod: ['ok', 99.95] } },
    { id: 'consent', name: 'Consent Management API', desc: 'Record and query data-processing consent for study participants and customers.', v: '1.2', status: 'Beta', cat: 'Identity', owner: 'Research IT', access: 'restricted', reviewer: 'Priya Nair', used: 38, updated: '2026-10-02', base: '/v1/consents', health: { test: ['ok', 99.7], prod: ['maint', 99.4, 'Planned database upgrade until 18:00 CET.'] } },

    { id: 'orders', name: 'Order Management API', desc: 'Create, track and amend purchase orders across suppliers and plants.', v: '3.1', status: 'Stable', cat: 'Operations', owner: 'Supply Chain Analytics', access: 'open', used: 720, updated: '2026-09-12', base: '/v3/orders', health: { test: ['ok', 99.9], prod: ['ok', 99.97] } },
    { id: 'inventory', name: 'Inventory API', desc: 'Stock levels, batches and expiry dates for every warehouse and lab store.', v: '2.0', status: 'Stable', cat: 'Operations', owner: 'Supply Chain Analytics', access: 'open', used: 515, updated: '2026-09-30', base: '/v2/inventory', health: { test: ['ok', 99.8], prod: ['degraded', 99.2, 'Elevated latency on stock queries; the team is investigating.'] } },
    { id: 'shipping', name: 'Shipment Tracking API', desc: 'Live status and estimated arrival for inbound and outbound shipments.', v: '1.5', status: 'Stable', cat: 'Operations', owner: 'Supply Chain Analytics', access: 'open', used: 280, updated: '2026-07-21', base: '/v1/shipments', health: { test: ['maint', 99.5, 'Sandbox refresh in progress, back in about 2 hours.'], prod: ['ok', 99.96] } },

    { id: 'clinical', name: 'Clinical Data API', desc: 'Read-only access to de-identified clinical study datasets and visit schedules.', v: '4.0', status: 'Stable', cat: 'Data', owner: 'Clinical Data Services', access: 'restricted', reviewer: 'James Mitchell', used: 190, updated: '2026-09-05', base: '/v4/studies', health: { test: ['ok', 99.9], prod: ['ok', 99.93] } },
    { id: 'lab', name: 'Lab Results API', desc: 'Query validated assay results by sample, instrument or experiment.', v: '2.2', status: 'Beta', cat: 'Data', owner: 'Research IT', access: 'restricted', reviewer: 'Tomas Havel', used: 74, updated: '2026-10-08', base: '/v2/results', health: { test: ['ok', 99.6], prod: ['down', 97.1, 'Major outage since 09:40 CET. Results queries return errors.'] } },
    { id: 'genes', name: 'Gene Annotation API', desc: 'Annotations, pathways and cross-references for gene symbols and variants.', v: '1.0', status: 'Beta', cat: 'Data', owner: 'Research IT', access: 'open', used: 22, updated: '2026-10-11', base: '/v1/genes', health: { test: ['down', 96.4, 'Sandbox database unreachable; fix is being deployed.'], prod: ['ok', 99.7] } },

    { id: 'notify', name: 'Notification API', desc: 'Send email, push and chat notifications using shared, pre-approved templates.', v: '2.7', status: 'Stable', cat: 'Messaging', owner: 'Commercial Apps', access: 'open', used: 830, updated: '2026-09-19', base: '/v2/notifications', health: { test: ['ok', 99.9], prod: ['ok', 99.98] } },
    { id: 'events', name: 'Event Bus API', desc: 'Publish and subscribe to business events with guaranteed, ordered delivery.', v: '1.9', status: 'Stable', cat: 'Messaging', owner: 'Identity Platform', access: 'restricted', reviewer: 'Tomas Havel', used: 450, updated: '2026-08-30', base: '/v1/events', health: { test: ['ok', 99.9], prod: ['ok', 99.94] } },
    { id: 'webhooks', name: 'Webhook Relay API', desc: 'Register callback URLs and let the relay retry deliveries for you.', v: '0.9', status: 'Beta', cat: 'Messaging', owner: 'Commercial Apps', access: 'open', used: 17, updated: '2026-10-13', base: '/v0/webhooks', health: { test: ['ok', 99.5], prod: ['ok', 99.6] } },

    { id: 'invoices', name: 'Invoicing API', desc: 'Issue, match and reconcile supplier and customer invoices.', v: '3.3', status: 'Stable', cat: 'Finance', owner: 'Commercial Apps', access: 'restricted', reviewer: 'James Mitchell', used: 260, updated: '2026-09-02', base: '/v3/invoices', health: { test: ['ok', 99.9], prod: ['ok', 99.95] } },
    { id: 'budget', name: 'Budget Forecast API', desc: 'Yearly cost-centre forecasts. Replaced by Invoicing API reporting; retiring in 2027.', v: '1.1', status: 'Deprecated', cat: 'Finance', owner: 'Commercial Apps', access: 'open', used: 12, updated: '2026-03-17', base: '/v1/forecasts', health: { test: ['ok', 99.4], prod: ['ok', 99.5] } },
    { id: 'rates', name: 'Currency Rates API', desc: 'Daily and historical exchange rates for 160 currencies.', v: '2.1', status: 'Stable', cat: 'Finance', owner: 'Commercial Apps', access: 'open', used: 395, updated: '2026-06-09', base: '/v2/rates', health: { test: ['ok', 99.9], prod: ['ok', 99.99] } }
  ],

  /* Keys already issued to the signed-in user. Pending only ever appears on restricted APIs in production. */
  keys: {
    test: [
      { id: 'k1', name: 'lab-inventory-test', masked: 'tst_••••••••3f40', created: '12 Mar 2026', life: 'Expires 12 Jan 2027', apis: [['inventory', 'approved', '12 Mar 2026'], ['orders', 'approved', '12 Mar 2026'], ['auth', 'approved', '12 Mar 2026']] },
      { id: 'k2', name: 'mobile-app-sandbox', masked: 'tst_••••••••a91c', created: '02 Jun 2026', life: 'Expires 02 Jun 2027', apis: [['auth', 'approved', '02 Jun 2026'], ['notify', 'approved', '02 Jun 2026'], ['users', 'approved', '19 Jun 2026']] },
      { id: 'k3', name: 'ci-integration-tests', masked: 'tst_••••••••77de', created: '28 Aug 2026', life: 'Expires 28 Nov 2026', apis: [['orders', 'approved', '28 Aug 2026'], ['shipping', 'approved', '28 Aug 2026'], ['events', 'approved', '28 Aug 2026']] },
      { id: 'k4', name: 'genomics-prototype', masked: 'tst_••••••••0b25', created: '14 Oct 2026', life: 'Expires 14 Jan 2027', apis: [['genes', 'approved', '14 Oct 2026'], ['lab', 'approved', '14 Oct 2026'], ['clinical', 'approved', '14 Oct 2026']] }
    ],
    prod: [
      { id: 'k5', name: 'lab-inventory-prod', masked: 'prd_••••••••c4a8', created: '20 Mar 2026', life: 'Rotates every 90 days · next 14 Nov 2026', apis: [['inventory', 'approved', '20 Mar 2026'], ['orders', 'approved', '20 Mar 2026'], ['auth', 'pending', '3 Oct 2026']] },
      { id: 'k6', name: 'mobile-app-prod', masked: 'prd_••••••••19fb', created: '15 Jul 2026', life: 'Rotates every 60 days · next 24 Nov 2026', apis: [['notify', 'approved', '15 Jul 2026'], ['users', 'approved', '15 Jul 2026'], ['auth', 'approved', '1 Aug 2026'], ['consent', 'pending', '9 Oct 2026']] },
      { id: 'k7', name: 'finance-reporting-prod', masked: 'prd_••••••••6e02', created: '09 Sep 2026', life: 'Rotates every 30 days · next 09 Nov 2026', apis: [['rates', 'approved', '09 Sep 2026'], ['budget', 'approved', '09 Sep 2026'], ['invoices', 'pending', '7 Oct 2026']] }
    ]
  },

  services: [
    { id: 'dev', icon: 'code-branch', title: 'Development of API', blurb: 'Build a new internal API with the platform team. We help with design review, the shared OpenAPI template, CI pipelines and onboarding to the catalog.', points: ['Design review within 5 working days', 'Starter repository with auth and logging built in', 'Listed in this catalog on launch'] },
    { id: 'proxy', icon: 'shuffle', title: 'API proxy', blurb: 'Put an existing backend behind the managed gateway without changing it. Routing, throttling, authentication and caching are configured for you.', points: ['Token validation and per-key rate limits', 'Request and response caching', 'Live health shown on your catalog card'] },
    { id: 'monitor', icon: 'chart-line', title: 'Monitoring and analytics', blurb: 'Dashboards and alerts for the APIs you own: latency, error rates, usage per consumer and 30-day uptime reports.', points: ['Alerts to chat or email on degraded health', 'Usage by team and by key', 'Monthly uptime report for stakeholders'] }
  ],

  steps: [
    ['magnifying-glass', 'Find an API', 'Browse the catalog or search by name, team or category.'],
    ['server', 'Choose environment', 'Start in Test. Production is for live applications.'],
    ['key', 'Get your key', 'Test keys are issued immediately. Restricted production access needs a review.'],
    ['terminal', 'Call the API', 'Use the code examples on the API page to make your first request.']
  ],
  faq: [
    ['What is the difference between test and production keys?', 'Test keys work against sandbox data and have no rate limits on test endpoints. Production keys work against real data, are rotated automatically and are covered by the SLA.'],
    ['How long does production approval take?', 'APIs tagged Open grant production access immediately. APIs tagged Restricted are reviewed by the API owner and usually take about 2 weeks.'],
    ['What is the Integration Security Assessment?', 'A short document describing how your application stores keys, handles data and logs requests. It is required for every Restricted production request. The guide on this page includes a template.'],
    ['How does key rotation work?', 'Production keys are replaced on the schedule you choose (30, 60 or 90 days). The previous key keeps working for 48 hours so you can deploy without downtime.'],
    ['Can one key access several APIs?', 'Yes. A key can hold access to many APIs. Each API is approved separately, so one key can show Approved for some APIs and Pending for others on the Keys page.'],
    ['What do the health icons on API cards mean?', 'The two icons show the current state of the Test and Production environments: operational, degraded, down or under planned maintenance. Hover an icon for details and 30-day uptime.']
  ],
  contacts: [
    ['comments', 'Support channel', '#api-platform-help', 'Ask a question and get a reply within one business day.', 'Open channel'],
    ['calendar-check', 'Office hours', 'Tuesdays and Thursdays, 14:00', 'Drop in with your design or integration questions.', 'Add to calendar'],
    ['shield-halved', 'Security assessment guide', 'Template and examples', 'How to write the document required for restricted APIs.', 'Read guide']
  ]
};
