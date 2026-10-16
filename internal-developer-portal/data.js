/* Internal Developer Portal prototype — all data is fictional. */
const DB = (() => {
  const TL = 'This demo template will ask some basic questions, create a GitHub repository, populate it with a landing page, enable GitHub Pages, and trigger a GitHub Action to deploy the landing page to GitHub Pages. The contents of the landing page are driven by the answers provided at the beginning of the template.';
  const STEPS = ['To start it will ask for some inputs…', 'It will create a repository in your chosen location', 'It will publish the result and link it to your catalog'];

  const TYPES = ['Request', 'Create', 'Configure', 'Delete'];
  const OWNERS = ['Unicorn Team', 'Platform Team', 'Data Engineering', 'Security Guild'];
  const SECS = {
    actions: { title: 'Actions', hash: '#/templates', cats: ['RESTful HTTP Services', 'Messaging Services', 'Cron Jobs & Workers', 'Infrastructure as Code - IaC'] },
    patterns: { title: 'Patterns', hash: '#/patterns', cats: ['Event-driven', 'Integration', 'Resilience & Scale'] },
    datascience: { title: 'Data Science', hash: '#/data-science', cats: ['Pipelines', 'Notebooks & Experiments', 'Model Serving'] },
  };

  // icons: small extra badges next to the type chip (design: folder-open / eye / lock)
  const mk = (sec) => (id, title, type, owner, cat, icons, starred, tldr) => ({ sec, id, title, type, owner, cat, icons: icons || [], starred: !!starred, tldr: tldr || TL });
  const A = mk('actions'), P = mk('patterns'), D = mk('datascience');
  const TEMPLATES = [
    A('demo', 'Demo Template', 'Request', 'Unicorn Team', 0, ['folder-open'], true),
    A('node-svc', 'Node.js REST Service', 'Create', 'Unicorn Team', 0, [], true),
    A('feature-flags', 'Feature Flag Rollout', 'Configure', 'Platform Team', 0, ['eye'], true),
    A('sunset', 'Retire a Service', 'Delete', 'Platform Team', 0, ['lock', 'folder-open']),
    A('api-access', 'API Access Request', 'Request', 'Security Guild', 0),
    A('spring-svc', 'Spring Boot Service', 'Create', 'Unicorn Team', 0, ['folder-open']),
    A('queue', 'Message Queue', 'Create', 'Platform Team', 1, ['folder-open']),
    A('topic-access', 'Topic Access Request', 'Request', 'Data Engineering', 1),
    A('dlq', 'Drain Dead-letter Queue', 'Configure', 'Platform Team', 1, ['eye']),
    A('cron', 'Scheduled Job', 'Create', 'Data Engineering', 2, ['folder-open']),
    A('worker-scale', 'Scale a Worker Pool', 'Configure', 'Platform Team', 2, ['eye']),
    A('cron-retire', 'Retire a Scheduled Job', 'Delete', 'Data Engineering', 2, ['lock']),
    A('tf-module', 'Terraform Module', 'Create', 'Platform Team', 3, ['folder-open']),
    A('tf-secrets', 'Rotate Cloud Secrets', 'Configure', 'Security Guild', 3, ['lock']),
    A('tf-destroy', 'Tear Down an Environment', 'Delete', 'Platform Team', 3, ['lock', 'folder-open']),

    P('pat-outbox', 'Transactional Outbox', 'Create', 'Platform Team', 0, ['folder-open'], true, 'Scaffolds a service that writes events and state changes in one transaction, then publishes them reliably through a relay. Includes a replay job and dashboards.'),
    P('pat-saga', 'Saga Orchestrator', 'Create', 'Unicorn Team', 0, ['folder-open'], false, 'Creates an orchestrator with compensating steps for a multi-service workflow, plus a state table and a timeout handler.'),
    P('pat-cqrs', 'CQRS Read Model', 'Create', 'Data Engineering', 0, [], false, 'Adds a read-optimised projection fed by your event stream, with a rebuild command and lag alerting.'),
    P('pat-gateway', 'API Gateway Route', 'Request', 'Platform Team', 1, [], true, 'Requests a new route on the shared API gateway with auth, rate limits and a canary rollout policy.'),
    P('pat-adapter', 'Legacy System Adapter', 'Create', 'Unicorn Team', 1, ['folder-open'], false, 'Wraps a legacy SOAP or file-based system behind a modern REST facade with contract tests.'),
    P('pat-circuit', 'Circuit Breaker Policy', 'Configure', 'Platform Team', 2, ['eye'], false, 'Applies timeouts, retries and a circuit breaker to a downstream call, with sensible defaults per tier.'),
    P('pat-bulkhead', 'Bulkhead Isolation', 'Configure', 'Platform Team', 2, ['eye'], false, 'Splits worker pools and connection limits so a slow dependency cannot exhaust the whole service.'),
    P('pat-autoscale', 'Autoscaling Profile', 'Configure', 'Platform Team', 2, ['folder-open'], false, 'Attaches a target-tracking autoscaling profile with scheduled scale-ups for known peaks.'),

    D('ds-etl', 'Batch ETL Pipeline', 'Create', 'Data Engineering', 0, ['folder-open'], true, 'Scaffolds an orchestrated batch pipeline with schema checks, data-quality tests and a backfill command.'),
    D('ds-stream', 'Streaming Ingest Job', 'Create', 'Data Engineering', 0, [], false, 'Creates a streaming job from a topic to the lakehouse with checkpointing and a dead-letter sink.'),
    D('ds-dataset', 'Dataset Access Request', 'Request', 'Security Guild', 0, ['lock'], false, 'Requests read access to a governed dataset, with a purpose statement and automatic expiry.'),
    D('ds-notebook', 'Notebook Workspace', 'Create', 'Data Engineering', 1, ['folder-open'], true, 'Provisions a managed notebook environment with approved libraries, a shared data mount and cost limits.'),
    D('ds-experiment', 'Experiment Tracking', 'Configure', 'Data Engineering', 1, ['eye'], false, 'Connects a project to the experiment tracker so runs, parameters and metrics are logged by default.'),
    D('ds-gpu', 'GPU Quota Increase', 'Request', 'Platform Team', 1, [], false, 'Requests additional GPU hours for a team for a fixed period, with an owner approval step.'),
    D('ds-serve', 'Model Serving Endpoint', 'Create', 'Data Engineering', 2, ['folder-open'], false, 'Deploys a model behind an autoscaled HTTP endpoint with canary traffic, monitoring and rollback.'),
    D('ds-drift', 'Drift Monitor', 'Configure', 'Data Engineering', 2, ['eye'], false, 'Adds data and prediction drift checks to a deployed model with alerts to the owning team.'),
    D('ds-retire', 'Retire a Model', 'Delete', 'Data Engineering', 2, ['lock'], false, 'Decommissions a model endpoint, archives its artifacts and removes it from the catalog.'),
  ];

  const MEMBERS = [
    { name: 'Sarah Mitchell', email: 'sarah.mitchell@company.com', role: 'Admin, Developer', icon: 'user' },
    { name: 'David Chen', email: 'david.chen@company.com', role: 'Contributor', icon: 'user' },
    { name: 'Emma Rodriguez', email: 'emma.rodriguez@company.com', role: 'Contributor', icon: 'user' },
    { name: 'Marcus Johnson', email: 'marcus.johnson@company.com', role: 'Contributor', icon: 'user' },
    { name: 'Olivia Patel', email: 'olivia.patel@company.com', role: 'Viewer', icon: 'user' },
    { name: 'devops', email: 'devops@company.com', role: 'Contributor', icon: 'robot' },
  ];

  const DESC = 'This demo template will ask some basic questions, create a GitHub repository, populate it with a landing page, enable GitHub Pages.';
  const PROJECTS = [
    { id: 'cloud-storage', name: 'Cloud Storage', code: 'CSM-2847', desc: DESC, people: 6, components: 19 },
    { id: 'payment-gateway', name: 'Payment Gateway', code: 'PGW-1053', desc: DESC, people: 6, components: 19 },
    { id: 'analytics-dashboard', name: 'Analytics Dashboard', code: 'ADH-4691', desc: DESC, people: 6, components: 19 },
  ];

  return { TL, STEPS, TYPES, OWNERS, SECS, TEMPLATES, MEMBERS, PROJECTS };
})();
