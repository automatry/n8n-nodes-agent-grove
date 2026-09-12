// Tests for the built Agent Grove node, driven through a fake IExecuteFunctions
// against an in-process mock of the Connect API. The server closes on exit.
import test from 'node:test';
import assert from 'node:assert/strict';
import { startMockServer, AGENTS, TEST_API_KEY } from './mock-server.mjs';
import { createFakeContext } from './fake-context.mjs';

const { AgentGrove } = await import('../dist/nodes/AgentGrove/AgentGrove.node.js');
const { AgentGroveApi } = await import('../dist/credentials/AgentGroveApi.credentials.js');

test('agent grove node against mock connect api', async (t) => {
	const server = await startMockServer();
	t.after(() => new Promise((resolve) => server.close(resolve)));
	const port = server.address().port;
	const node = new AgentGrove();

	await t.test('loadOptions.getAgents returns the two options in API order', async () => {
		const context = createFakeContext({ port, parameters: {}, items: 1 });
		const options = await node.methods.loadOptions.getAgents.call(context);
		assert.equal(options.length, 2);
		assert.equal(options[0].name, AGENTS[0].name);
		assert.equal(options[0].value, AGENTS[0].id);
		assert.equal(options[0].description, AGENTS[0].description);
		assert.equal(options[1].name, AGENTS[1].name);
		assert.equal(options[1].value, AGENTS[1].id);
	});

	await t.test('run simplified output and request body', async () => {
		const context = createFakeContext({
			port,
			parameters: {
				agentId: 'agent-grove-assistant',
				input: 'hello agent',
				sessionId: 'session-abc',
				options: { simplify: true, context: 'extra', requestId: 'req-1', maxTurns: 3 },
			},
		});
		const [result] = await node.execute.call(context);
		assert.equal(result.length, 1);
		assert.deepEqual(
			{ ...result[0].json, pendingActions: [] },
			{ text: 'echo: hello agent', runId: 'run-123', sessionId: 'session-abc', agentId: 'agent-grove-assistant', status: 'complete', pendingActions: [] },
		);
		assert.deepEqual(result[0].pairedItem, { item: 0 });
		const req = context.requests[0];
		assert.equal(req.method, 'POST');
		assert.equal(req.url, '/api/v1/agents/agent-grove-assistant/run');
		assert.deepEqual(req.body, { input: 'hello agent', sessionId: 'session-abc', context: 'extra', requestId: 'req-1', maxTurns: 3 });
	});

	await t.test('run with simplify=false returns the full response body', async () => {
		const context = createFakeContext({
			port,
			parameters: {
				agentId: 'agent-grove-assistant',
				input: 'hi',
				options: { simplify: false },
			},
		});
		const [result] = await node.execute.call(context);
		assert.equal(result[0].json.status, 'complete');
		assert.deepEqual(result[0].json.output, { text: 'echo: hi', format: 'markdown' });
		assert.deepEqual(result[0].json.usage, { inputTokens: 1, outputTokens: 1, costUsd: 0 });
	});

	await t.test('run omits empty optional fields from the request body', async () => {
		const context = createFakeContext({
			port,
			parameters: {
				agentId: 'agent-grove-assistant',
				input: 'hi',
				sessionId: '',
				options: {},
			},
		});
		await node.execute.call(context);
		assert.deepEqual(context.requests[0].body, { input: 'hi' });
	});

	await t.test('404 throws NodeApiError; continueOnFail yields an error item', async () => {
		const throwing = createFakeContext({
			port,
			parameters: { agentId: 'missing', input: 'hi', options: {} },
		});
		await assert.rejects(
			() => node.execute.call(throwing),
			(error) => error.httpCode === '404' && error.description === 'agent_not_found',
		);

		const tolerant = createFakeContext({
			port,
			continueOnFail: true,
			parameters: { agentId: 'missing', input: 'hi', options: {} },
		});
		const [result] = await node.execute.call(tolerant);
		assert.ok(result[0].json.error.includes('agent_not_found'));
		assert.deepEqual(result[0].pairedItem, { item: 0 });
	});

	await t.test('list returns one item per agent', async () => {
		const context = createFakeContext({ port, operation: 'list', parameters: {} });
		const [result] = await node.execute.call(context);
		assert.equal(result.length, AGENTS.length);
		assert.equal(result[0].json.id, AGENTS[0].id);
		assert.deepEqual(result[1].pairedItem, { item: 0 });
	});

	await t.test('get returns one agent object', async () => {
		const context = createFakeContext({
			port,
			operation: 'get',
			parameters: { agentId: 'listing-draft-reviewer', options: {} },
		});
		const [result] = await node.execute.call(context);
		assert.equal(result[0].json.id, 'listing-draft-reviewer');
		assert.equal(result[0].json.name, 'Draft Reviewer');
	});
});

test('node description is AI-tool ready', async () => {
	const { AgentGrove } = await import('../dist/nodes/AgentGrove/AgentGrove.node.js');
	const description = new AgentGrove().description;
	assert.equal(description.name, 'agentGrove');
	assert.equal(description.usableAsTool, true);
	assert.equal(description.inputs[0], 'main');
	assert.equal(description.outputs[0], 'main');
	assert.equal(description.credentials[0].name, 'agentGroveApi');
	assert.ok(description.credentials[0].required);
	const op = description.properties.find((p) => p.name === 'operation');
	assert.ok(op.options.every((o) => typeof o.action === 'string'));
	const agent = description.properties.find((p) => p.name === 'agentId');
	assert.ok(agent.required);
	assert.equal(agent.typeOptions.loadOptionsMethod, 'getAgents');
});

test('credential declares the /api/v1/me test and Bearer template', async () => {
	const { AgentGroveApi } = await import('../dist/credentials/AgentGroveApi.credentials.js');
	const cred = new AgentGroveApi();
	assert.equal(cred.name, 'agentGroveApi');
	assert.equal(cred.test.request.url, '/api/v1/me');
	assert.equal(cred.test.request.method, 'GET');
	assert.ok(cred.authenticate.properties.headers.Authorization.includes('Bearer'));
	assert.equal(cred.authenticate.properties.headers.Authorization, '=Bearer {{$credentials.apiKey}}');
});
