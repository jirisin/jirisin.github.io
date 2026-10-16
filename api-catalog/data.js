/* Internal API catalog prototype — all data is fictional. */
window.DATA = {
  api: { name: 'Authentication API', version: 'v2.4', owner: 'Identity Platform team' },
  envs: [
    {
      id: 'test', title: 'Test', keyType: 'Standard Key', keyIcon: 'key',
      blurb: 'Ideal for development and integration testing. Access sandbox data with full API coverage and no rate limits on test endpoints.',
      immediate: true
    },
    {
      id: 'prod', title: 'Production', keyType: 'Rotation Key', keyIcon: 'arrows-rotate',
      blurb: 'For live applications serving real users. Includes SLA-backed uptime, production rate limits, and access to real data.',
      immediate: false, reviewer: 'James Mitchell'
    }
  ],
  teams: ['Identity Platform', 'Clinical Data Services', 'Supply Chain Analytics', 'Research IT', 'Commercial Apps'],
  endpoints: [
    ['POST', '/v2/token', 'Exchange credentials for an access token'],
    ['POST', '/v2/token/refresh', 'Refresh an expired access token'],
    ['GET', '/v2/userinfo', 'Return claims for the signed-in user'],
    ['POST', '/v2/revoke', 'Revoke a token before it expires']
  ],
  docs: [
    ['Getting started', 'Authenticate your first request in five minutes.'],
    ['Token lifecycle', 'Lifetimes, refresh behaviour and revocation.'],
    ['Error reference', 'Every error code the API can return, with fixes.'],
    ['Rate limits', 'Limits per environment and how to request more.']
  ]
};
