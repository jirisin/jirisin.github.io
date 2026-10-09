/* Internal Developer Portal prototype — all data is fictional. */
const DB = (() => {
  const TL = 'This demo template will ask some basic questions, create a GitHub repository, populate it with a landing page, enable GitHub Pages, and trigger a GitHub Action to deploy the landing page to GitHub Pages. The contents of the landing page are driven by the answers provided at the beginning of the template.';
  const STEPS = ['To start it will ask for some inputs…', 'It will create a repository in your chosen location', 'It will publish the result and link it to your catalog'];

  const TYPES = ['Request', 'Create', 'Configure', 'Delete'];
  const OWNERS = ['Unicorn Team', 'Platform Team', 'Data Engineering', 'Security Guild'];
  const CATS = ['RESTful HTTP Services', 'Messaging Services', 'Cron Jobs & Workers', 'Infrastructure as Code - IaC'];

  // icons: small extra badges next to the type chip (design: folder-open / eye / lock)
  const T = (id, title, type, owner, cat, icons, starred) => ({ id, title, type, owner, cat, icons: icons || [], starred: !!starred, tldr: TL });
  const TEMPLATES = [
    T('demo', 'Demo Template', 'Request', 'Unicorn Team', 0, ['folder-open'], true),
    T('node-svc', 'Node.js REST Service', 'Create', 'Unicorn Team', 0, [], true),
    T('feature-flags', 'Feature Flag Rollout', 'Configure', 'Platform Team', 0, ['eye'], true),
    T('sunset', 'Retire a Service', 'Delete', 'Platform Team', 0, ['lock', 'folder-open']),
    T('api-access', 'API Access Request', 'Request', 'Security Guild', 0),
    T('spring-svc', 'Spring Boot Service', 'Create', 'Unicorn Team', 0, ['folder-open']),
    T('queue', 'Message Queue', 'Create', 'Platform Team', 1, ['folder-open']),
    T('topic-access', 'Topic Access Request', 'Request', 'Data Engineering', 1),
    T('dlq', 'Drain Dead-letter Queue', 'Configure', 'Platform Team', 1, ['eye']),
    T('cron', 'Scheduled Job', 'Create', 'Data Engineering', 2, ['folder-open']),
    T('worker-scale', 'Scale a Worker Pool', 'Configure', 'Platform Team', 2, ['eye']),
    T('cron-retire', 'Retire a Scheduled Job', 'Delete', 'Data Engineering', 2, ['lock']),
    T('tf-module', 'Terraform Module', 'Create', 'Platform Team', 3, ['folder-open']),
    T('tf-secrets', 'Rotate Cloud Secrets', 'Configure', 'Security Guild', 3, ['lock']),
    T('tf-destroy', 'Tear Down an Environment', 'Delete', 'Platform Team', 3, ['lock', 'folder-open']),
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

  return { TL, STEPS, TYPES, OWNERS, CATS, TEMPLATES, MEMBERS, PROJECTS };
})();
