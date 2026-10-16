/* Internal Developer Portal prototype — catalog, history and knowledge-base content. Fictional. */
Object.assign(DB, (() => {
  /* ---------- software catalog (Backstage-style entities) ---------- */
  const E = (id, kind, type, system, owner, lifecycle, desc, tags, deps) => ({ id, name: id, kind, type, system, owner, lifecycle, desc, tags: tags || [], deps: deps || [] });
  const ENTITIES = [
    // systems
    E('payments', 'System', '—', '—', 'payments-team', 'production', 'Everything involved in taking, routing and settling customer payments.', ['finance']),
    E('cloud-storage', 'System', '—', '—', 'unicorn-team', 'production', 'Object and file storage offered to internal product teams.', ['storage']),
    E('analytics', 'System', '—', '—', 'data-engineering', 'production', 'Event ingestion, reporting and dashboards.', ['data']),
    E('identity', 'System', '—', '—', 'security-guild', 'production', 'Authentication, authorisation and service-to-service identity.', ['security']),
    // services & websites
    E('payment-service', 'Component', 'service', 'payments', 'payments-team', 'production', 'Authorises and captures card and wallet payments.', ['java', 'pci'], ['ledger-service', 'payments-db', 'auth-sdk', 'logging-lib', 'http-client', 'money-utils']),
    E('ledger-service', 'Component', 'service', 'payments', 'payments-team', 'production', 'Double-entry ledger for every money movement.', ['java', 'pci'], ['payments-db', 'events-bus', 'logging-lib', 'money-utils']),
    E('billing-worker', 'Component', 'worker', 'payments', 'payments-team', 'experimental', 'Nightly invoice generation and retry of failed charges.', ['python'], ['ledger-service', 'events-bus', 'logging-lib']),
    E('auth-service', 'Component', 'service', 'identity', 'security-guild', 'production', 'Issues and validates short-lived tokens for users and services.', ['go', 'oauth'], ['identity-api', 'logging-lib']),
    E('storage-service', 'Component', 'service', 'cloud-storage', 'unicorn-team', 'production', 'Presigned uploads, lifecycle rules and quotas on top of the object store.', ['node', 'storage'], ['object-store', 'auth-sdk', 'logging-lib', 'http-client', 'feature-flag-client']),
    E('storage-gateway', 'Component', 'service', 'cloud-storage', 'unicorn-team', 'deprecated', 'Legacy gateway in front of the file servers. Replaced by storage-service.', ['legacy'], ['object-store']),
    E('analytics-ingest', 'Component', 'service', 'analytics', 'data-engineering', 'production', 'Receives product events and writes them to the lakehouse.', ['kafka', 'python'], ['events-bus', 'schema-validator', 'logging-lib']),
    E('report-generator', 'Component', 'worker', 'analytics', 'data-engineering', 'production', 'Builds scheduled reports and emails them to subscribers.', ['python'], ['analytics-ingest', 'http-client', 'logging-lib']),
    E('notification-service', 'Component', 'service', 'platform-core', 'platform-team', 'production', 'Sends email, push and chat notifications on behalf of other services.', ['node'], ['events-bus', 'feature-flag-client', 'logging-lib']),
    E('web-portal', 'Component', 'website', 'platform-core', 'unicorn-team', 'production', 'Customer-facing web application.', ['react', 'typescript'], ['payments-api', 'storage-api', 'ui-kit', 'auth-sdk', 'feature-flag-client']),
    E('mobile-bff', 'Component', 'service', 'platform-core', 'unicorn-team', 'experimental', 'Backend-for-frontend that shapes API responses for the mobile app.', ['node', 'graphql'], ['payments-api', 'storage-api', 'auth-sdk', 'logging-lib']),
    // libraries
    E('ui-kit', 'Component', 'library', 'platform-core', 'unicorn-team', 'production', 'Shared React components, tokens and icons used by all web apps.', ['react', 'design-system'], ['logging-lib']),
    E('logging-lib', 'Component', 'library', 'platform-core', 'platform-team', 'production', 'Structured logging with trace IDs and PII redaction.', ['observability']),
    E('http-client', 'Component', 'library', 'platform-core', 'platform-team', 'production', 'HTTP client with retries, timeouts and circuit breaker defaults.', ['resilience'], ['logging-lib']),
    E('auth-sdk', 'Component', 'library', 'identity', 'security-guild', 'production', 'Token validation and service identity helpers.', ['security'], ['http-client']),
    E('feature-flag-client', 'Component', 'library', 'platform-core', 'platform-team', 'production', 'Evaluates feature flags locally with streaming updates.', ['feature-flags'], ['http-client']),
    E('money-utils', 'Component', 'library', 'payments', 'payments-team', 'production', 'Currency-safe arithmetic, rounding and formatting.', ['finance', 'java']),
    E('schema-validator', 'Component', 'library', 'analytics', 'data-engineering', 'experimental', 'Validates event payloads against registered JSON schemas.', ['data', 'python']),
    E('legacy-sdk', 'Component', 'library', 'platform-core', 'platform-team', 'deprecated', 'Old internal SDK. Use http-client and auth-sdk instead.', ['legacy']),
    // APIs
    E('payments-api', 'API', 'openapi', 'payments', 'payments-team', 'production', 'Public REST API for creating and querying payments.', ['rest'], ['payment-service']),
    E('storage-api', 'API', 'openapi', 'cloud-storage', 'unicorn-team', 'production', 'REST API for uploads, downloads and quotas.', ['rest'], ['storage-service']),
    E('identity-api', 'API', 'openapi', 'identity', 'security-guild', 'production', 'Token and key endpoints used by every service.', ['rest', 'security'], ['auth-service']),
    E('events-api', 'API', 'asyncapi', 'analytics', 'data-engineering', 'production', 'Event contract for product analytics topics.', ['kafka'], ['analytics-ingest']),
    // resources
    E('payments-db', 'Resource', 'database', 'payments', 'payments-team', 'production', 'Managed PostgreSQL cluster for payments and the ledger.', ['postgres']),
    E('events-bus', 'Resource', 'kafka-cluster', 'analytics', 'platform-team', 'production', 'Shared Kafka cluster for domain events.', ['kafka']),
    E('object-store', 'Resource', 's3-bucket', 'cloud-storage', 'unicorn-team', 'production', 'Primary object store with cross-region replication.', ['storage']),
  ];
  // systems that exist only as a label on other entities
  ENTITIES.push(E('platform-core', 'System', '—', '—', 'platform-team', 'production', 'Shared building blocks used across products.', ['platform']));
  const OWNER_NAMES = { 'unicorn-team': 'Unicorn Team', 'platform-team': 'Platform Team', 'data-engineering': 'Data Engineering', 'security-guild': 'Security Guild', 'payments-team': 'Payments Team' };

  /* ---------- template run history ---------- */
  const R = (id, tpl, by, started, dur, status) => ({ id, tpl, by, started, dur, status });
  const RUNS = [
    R('8f3a21c0', 'Node.js REST Service', 'Jiri Sindelar', '4 minutes ago', '1m 12s', 'Processing'),
    R('7d91b3e4', 'Demo Template', 'Jiri Sindelar', '2 hours ago', '48s', 'Completed'),
    R('6c20af17', 'Scheduled Job', 'David Chen', '3 hours ago', '1m 03s', 'Completed'),
    R('5b88e2d9', 'Rotate Cloud Secrets', 'Olivia Patel', 'Yesterday, 16:40', '2m 31s', 'Failed'),
    R('4a17c8f2', 'Terraform Module', 'Emma Rodriguez', 'Yesterday, 11:05', '1m 54s', 'Completed'),
    R('39f6d0b1', 'API Access Request', 'Marcus Johnson', 'Yesterday, 09:22', '12s', 'Completed'),
    R('28e5c1a0', 'Message Queue', 'Sarah Mitchell', '2 days ago', '1m 40s', 'Completed'),
    R('17d4b09f', 'Tear Down an Environment', 'devops', '2 days ago', '3m 18s', 'Completed'),
    R('06c3a8ee', 'Spring Boot Service', 'David Chen', '3 days ago', '2m 07s', 'Failed'),
    R('f5b297dd', 'Feature Flag Rollout', 'Emma Rodriguez', '3 days ago', '22s', 'Completed'),
    R('e4a186cc', 'Batch ETL Pipeline', 'Olivia Patel', '4 days ago', '2m 49s', 'Completed'),
    R('d39075bb', 'Transactional Outbox', 'Sarah Mitchell', '5 days ago', '1m 26s', 'Completed'),
    R('c2f864aa', 'Retire a Service', 'Marcus Johnson', '6 days ago', '1m 01s', 'Completed'),
    R('b1e75399', 'Model Serving Endpoint', 'devops', '1 week ago', '3m 44s', 'Failed'),
  ];

  /* ---------- DevSecOpedia knowledge base ---------- */
  const KB_TOPICS = [
    { name: 'Getting started', icon: 'rocket', desc: 'Accounts, access and your first deploy' },
    { name: 'Security', icon: 'shield-halved', desc: 'Secrets, scanning and secure defaults' },
    { name: 'CI/CD', icon: 'arrows-spin', desc: 'Pipelines, releases and rollbacks' },
    { name: 'Cloud & Infrastructure', icon: 'cloud', desc: 'Environments, networking and cost' },
    { name: 'Observability', icon: 'chart-line', desc: 'Logs, metrics, traces and alerts' },
    { name: 'Compliance', icon: 'scale-balanced', desc: 'Audits, evidence and approvals' },
  ];
  const A_ = (topic, title, summary, excerpt, updated, min) => ({ id: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'), topic, title, summary, excerpt, updated, min });
  const KB_ARTICLES = [
    A_(0, 'Request access to the portal and GitHub', 'Get the right groups on day one.', 'New joiners are added to the portal automatically once their manager approves the access request. GitHub membership follows through the team groups listed on your project page. If a group is missing, raise a request from the Actions page.', 'Updated 3 days ago', 4),
    A_(0, 'Deploy your first service in a day', 'From template to production, step by step.', 'Pick a template under Self-Service, answer the questions and let the portal create the repository, pipeline and catalog entry. Merge the first pull request and the pipeline deploys to the test environment.', 'Updated last week', 9),
    A_(1, 'Managing secrets', 'Where secrets live and how to rotate them.', 'Never commit secrets. Store them in the managed vault and reference them by name in your pipeline. Rotation is automated every 90 days; use the Rotate Cloud Secrets action for an early rotation.', 'Updated 2 days ago', 6),
    A_(1, 'Dependency and container scanning', 'What runs on every pull request.', 'Every pull request is scanned for vulnerable dependencies and base images. Critical findings block the merge; others create tickets with a due date based on severity.', 'Updated 2 weeks ago', 5),
    A_(1, 'Threat modelling in 30 minutes', 'A lightweight workshop format.', 'Draw the data flows, mark trust boundaries and walk each one with the STRIDE prompts. Record mitigations as tasks in the project and link the model from the catalog entry.', 'Updated last month', 12),
    A_(2, 'Pipeline basics', 'Stages, gates and who approves what.', 'Pipelines run build, test, scan and deploy stages. Production deploys need an approval from a second engineer, and the gate records who approved and when for audit purposes.', 'Updated 5 days ago', 7),
    A_(2, 'Roll back a bad release', 'Return to the last good version safely.', 'Use the rollback button on the deployment page, or re-run the previous pipeline with the same artifact. Database migrations must be backwards compatible for exactly this reason.', 'Updated 3 weeks ago', 4),
    A_(3, 'Environments and promotion', 'Test, staging and production explained.', 'Each project gets test, staging and production environments with matching configuration. Promote the same artifact through each one rather than rebuilding it.', 'Updated last week', 6),
    A_(3, 'Keeping cloud costs in check', 'Budgets, tags and weekly reports.', 'Tag every resource with the project code. Budgets alert at 80 percent and the weekly report lists the five most expensive resources per project.', 'Updated 4 days ago', 5),
    A_(4, 'Logging standards', 'Structured logs with trace IDs.', 'Use the shared logging library so every line has a trace ID, service name and level. Never log personal data; the library redacts known fields but cannot catch everything.', 'Updated 6 days ago', 5),
    A_(4, 'Alerts that wake people up', 'Page only when a human needs to act.', 'Alert on symptoms customers feel, not on causes. Every alert needs an owner, a runbook link and a severity that matches the escalation policy.', 'Updated last month', 8),
    A_(5, 'Preparing for an audit', 'Evidence the portal collects for you.', 'Deploy approvals, access reviews and scan results are stored automatically. Export the evidence pack from the project page and share it with the auditor.', 'Updated 2 weeks ago', 6),
    A_(5, 'Data protection checklist', 'Before you store personal data.', 'Record the purpose, retention period and legal basis in the catalog entry. Complete a data protection impact assessment for anything high risk.', 'Updated last month', 7),
  ];

  return { ENTITIES, OWNER_NAMES, RUNS, KB_TOPICS, KB_ARTICLES };
})());
