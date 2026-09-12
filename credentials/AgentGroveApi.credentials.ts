import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class AgentGroveApi implements ICredentialType {
	name = 'agentGroveApi';

	displayName = 'Agent Grove API';

	documentationUrl = 'https://github.com/automatry/n8n-nodes-agent-grove#readme';

	icon: { light: string; dark: string } = {
		light: 'file:../icons/agent-grove.svg',
		dark: 'file:../icons/agent-grove.dark.svg',
	};

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'Create one in Agent Grove under Settings → Integrations',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://agent-grove.com',
			description: 'Leave as is unless Agent Grove gave you another address',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/api/v1/me',
			method: 'GET',
		},
	};
}
