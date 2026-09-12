import type {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

interface AgentRunResponse {
	runId: string;
	sessionId: string;
	agentId: string;
	status: string;
	output?: { text?: string };
	pendingActions?: unknown[];
	replayed?: boolean;
}

interface AgentListResponse {
	agents: Array<{
		id: string;
		name: string;
		description?: string;
	}>;
}

function stripTrailingSlash(url: string): string {
	return url.replace(/\/+$/, '');
}

function simplifyRun(body: AgentRunResponse): Record<string, unknown> {
	return {
		text: body.output?.text ?? '',
		runId: body.runId,
		sessionId: body.sessionId,
		agentId: body.agentId,
		status: body.status,
		pendingActions: body.pendingActions ?? [],
	};
}

async function request(
	context: IExecuteFunctions | ILoadOptionsFunctions,
	credential: { baseUrl: string },
	options: { method: string; url: string; body?: unknown; timeout?: number },
): Promise<unknown> {
	return await context.helpers.httpRequestWithAuthentication.call(context, 'agentGroveApi', {
		method: options.method,
		baseURL: stripTrailingSlash(credential.baseUrl),
		url: options.url,
		json: true,
		...(options.body !== undefined ? { body: options.body } : {}),
		...(options.timeout !== undefined ? { timeout: options.timeout } : {}),
	});
}

export class AgentGrove implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Agent Grove',
		name: 'agentGrove',
		icon: { light: 'file:agent-grove.svg', dark: 'file:agent-grove.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Run the AI agents hosted on your Agent Grove account',
		defaults: { name: 'Agent Grove' },
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'agentGroveApi', required: true }],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [{ name: 'Agent', value: 'agent' }],
				default: 'agent',
				description: 'The resource to work with',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Run',
						value: 'run',
						action: 'Run an agent',
						description: 'Run an agent on your Agent Grove account',
					},
					{
						name: 'Get',
						value: 'get',
						action: 'Get an agent',
						description: 'Get one agent by id',
					},
					{
						name: 'List',
						value: 'list',
						action: 'List available agents',
						description: 'List the agents available on your Agent Grove account',
					},
				],
				default: 'run',
				description: 'The operation to perform',
			},
			{
				displayName: 'Agent',
				name: 'agentId',
				type: 'options',
				typeOptions: { loadOptionsMethod: 'getAgents' },
				required: true,
				displayOptions: {
					show: {
						resource: ['agent'],
						operation: ['run', 'get'],
					},
				},
				description: 'The agent to run. Agents are listed from your Agent Grove account.',
			},
			{
				displayName: 'Input',
				name: 'input',
				type: 'string',
				typeOptions: { rows: 4 },
				required: true,
				displayOptions: {
					show: {
						resource: ['agent'],
						operation: ['run'],
					},
				},
				description: 'What to ask or tell the agent',
			},
			{
				displayName: 'Session ID',
				name: 'sessionId',
				type: 'string',
				required: false,
				displayOptions: {
					show: {
						resource: ['agent'],
						operation: ['run'],
					},
				},
				description:
					'Use the same value across runs to continue one conversation; leave empty to start a new one',
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				required: false,
				default: {},
				displayOptions: {
					show: {
						resource: ['agent'],
						operation: ['run'],
					},
				},
				description: 'Optional settings for this run',
				options: [
					{
						displayName: 'Context',
						name: 'context',
						type: 'string',
						default: '',
						description: 'Extra context for this run, up to 500 characters',
					},
					{
						displayName: 'Request ID',
						name: 'requestId',
						type: 'string',
						default: '',
						description:
							'Idempotency key: the same value returns the same run instead of running again',
					},
					{
						displayName: 'Max Turns',
						name: 'maxTurns',
						type: 'number',
						typeOptions: { minValue: 1, maxValue: 8 },
						default: 4,
						description: 'Maximum reasoning turns',
					},
					{
						displayName: 'Simplify Output',
						name: 'simplify',
						type: 'boolean',
						default: true,
						description:
							'Return only the answer text and run identifiers instead of the full response',
					},
				],
			},
		],
	};

	methods = {
		loadOptions: {
			async getAgents(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const credential = (await this.getCredentials('agentGroveApi')) as {
					baseUrl: string;
				};
				const response = (await request(this, credential, {
					method: 'GET',
					url: '/api/v1/agents',
				})) as AgentListResponse;
				return (response.agents ?? []).map((agent) => ({
					name: agent.name,
					value: agent.id,
					description: agent.description,
				}));
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const credential = (await this.getCredentials('agentGroveApi')) as { baseUrl: string };

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			const operation = this.getNodeParameter('operation', itemIndex) as string;
			try {
				if (operation === 'run') {
					const agentId = this.getNodeParameter('agentId', itemIndex) as string;
					const input = this.getNodeParameter('input', itemIndex) as string;
					const sessionId = this.getNodeParameter('sessionId', itemIndex, '') as string;
					const options = this.getNodeParameter('options', itemIndex, {}) as {
						context?: string;
						requestId?: string;
						maxTurns?: number;
						simplify?: boolean;
					};
					const body: Record<string, unknown> = { input };
					if (sessionId) {
						body.sessionId = sessionId;
					}
					if (options.context) {
						body.context = options.context;
					}
					if (options.requestId) {
						body.requestId = options.requestId;
					}
					if (options.maxTurns !== undefined) {
						body.maxTurns = options.maxTurns;
					}
					const response = (await request(this, credential, {
						method: 'POST',
						url: `/api/v1/agents/${agentId}/run`,
						body,
						timeout: 120000,
					})) as AgentRunResponse;
					const json =
						options.simplify === false ? (response as Record<string, unknown>) : simplifyRun(response);
					returnData.push({ json, pairedItem: { item: itemIndex } });
				} else if (operation === 'get') {
					const agentId = this.getNodeParameter('agentId', itemIndex) as string;
					const response = (await request(this, credential, {
						method: 'GET',
						url: `/api/v1/agents/${agentId}`,
					})) as Record<string, unknown>;
					returnData.push({ json: response, pairedItem: { item: itemIndex } });
				} else {
					const response = (await request(this, credential, {
						method: 'GET',
						url: '/api/v1/agents',
					})) as AgentListResponse;
					for (const agent of response.agents ?? []) {
						returnData.push({ json: agent as unknown as object, pairedItem: { item: itemIndex } });
					}
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: itemIndex },
					});
					continue;
				}
				if ((error as { httpCode?: string }).httpCode !== undefined) {
					throw new NodeApiError(this.getNode(), error as object, { itemIndex });
				}
				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex });
			}
		}

		return [returnData];
	}
}
