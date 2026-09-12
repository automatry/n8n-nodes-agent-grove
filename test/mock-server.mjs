import { createServer } from 'node:http';

export const TEST_API_KEY = 'agk_live_test8684b6f0e7c2a9d1b3';

const AGENTS = [
	{
		id: 'agent-grove-assistant',
		name: 'Agent Grove Assistant',
		description: 'The platform assistant on your Agent Grove account.',
		kind: 'platform',
	},
	{
		id: 'listing-draft-reviewer',
		name: 'Draft Reviewer',
		description: 'A listing agent that reviews documents.',
		kind: 'listing',
	},
];

function respond(res, status, body) {
	const payload = JSON.stringify(body);
	res.writeHead(status, { 'content-type': 'application/json' });
	res.end(payload);
}

export function startMockServer() {
	return new Promise((resolve) => {
		const server = createServer((req, res) => {
			let chunks = [];
			req.on('data', (c) => chunks.push(c));
			req.on('end', () => {
				const auth = req.headers.authorization ?? '';
				const ok = auth === `Bearer ${TEST_API_KEY}`;
				const bodyRaw = Buffer.concat(chunks).toString('utf8');

				if (!ok) {
					respond(res, 401, { error: 'unauthorized', message: 'Invalid or missing API key', requestId: 'req-401' });
					return;
				}
				if (req.url === '/api/v1/me' && req.method === 'GET') {
					respond(res, 200, { uid: 'u1', displayName: 'Rich', platform: { name: 'Agent Grove', apiVersion: '1' } });
					return;
				}
				if (req.url === '/api/v1/agents' && req.method === 'GET') {
					respond(res, 200, { agents: AGENTS });
					return;
				}
				let m;
				if ((m = req.url.match(/^\/api\/v1\/agents\/([^/]+)$/)) && req.method === 'GET') {
					const agent = AGENTS.find((a) => a.id === decodeURIComponent(m[1]));
					if (agent) respond(res, 200, agent);
					else respond(res, 404, { error: 'agent_not_found', message: 'No such agent', requestId: 'req-404' });
					return;
				}
				if ((m = req.url.match(/^\/api\/v1\/agents\/([^/]+)\/run$/)) && req.method === 'POST') {
					if (decodeURIComponent(m[1]) === 'missing') {
						respond(res, 404, { error: 'agent_not_found', message: 'No such agent', requestId: 'req-404b' });
						return;
					}
					let body = {};
					try {
						body = JSON.parse(bodyRaw || '{}');
					} catch {
						body = {};
					}
					respond(res, 200, {
						runId: 'run-123',
						sessionId: 'session-abc',
						agentId: decodeURIComponent(m[1]),
						status: 'complete',
						replayed: false,
						output: { text: `echo: ${body.input ?? ''}`, format: 'markdown' },
						model: 'test-model',
						usage: { inputTokens: 1, outputTokens: 1, costUsd: 0 },
						toolCalls: [],
						pendingActions: [],
						error: null,
					});
					return;
				}
				respond(res, 404, { error: 'not_found', message: 'Unknown route', requestId: 'req-x' });
			});
		});
		server.listen(0, '127.0.0.1', () => resolve(server));
	});
}

export { AGENTS };
