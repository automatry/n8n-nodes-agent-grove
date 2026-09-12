import { TEST_API_KEY } from './mock-server.mjs';

// Minimal fake of IExecuteFunctions / ILoadOptionsFunctions backed by fetch.
export function createFakeContext({
	port,
	operation = 'run',
	parameters = {},
	items = 1,
	continueOnFail = false,
} = {}) {
	const credentials = { apiKey: TEST_API_KEY, baseUrl: `http://127.0.0.1:${port}` };
	const requests = [];

	async function httpRequestWithAuthentication(_credName, options) {
		requests.push(options);
		const url = `${options.baseURL}${options.url}`;
		const init = { method: options.method, headers: { Authorization: `Bearer ${credentials.apiKey}` } };
		if (options.body !== undefined) {
			init.body = JSON.stringify(options.body);
			init.headers['content-type'] = 'application/json';
		}
		const response = await fetch(url, init);
		const text = await response.text();
		let body;
		try {
			body = text === '' ? undefined : JSON.parse(text);
		} catch {
			body = text;
		}
		if (!response.ok) {
			const error = new Error(body?.message ?? `HTTP ${response.status}`);
			error.httpCode = String(response.status);
			error.statusCode = response.status;
			error.hint = body;
			error.description = body?.error;
			throw error;
		}
		return body;
	}

	return {
		getInputData() {
			return Array.from({ length: items }, () => ({ json: {} }));
		},
		getNodeParameter(name, _index, defaultValue) {
			const value = parameters[name];
			if (value === undefined) {
				if (defaultValue !== undefined) return defaultValue;
				if (name === 'operation') return operation;
				throw new Error(`no parameter ${name}`);
			}
			return value;
		},
		async getCredentials() {
			return credentials;
		},
		getNode() {
			return { typeVersion: 1 };
		},
		continueOnFail() {
			return continueOnFail;
		},
		helpers: {
			httpRequestWithAuthentication,
			returnJsonArray: (json) => [{ json }],
		},
		requests,
	};
}
