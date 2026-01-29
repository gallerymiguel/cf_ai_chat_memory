export interface Env {
	AI: Ai;
	CHAT_DO: DurableObjectNamespace;
}

type ChatMessage = {
	role: "user" | "assistant" | "system";
	content: string;
};

function json(data: unknown, init?: ResponseInit, origin?: string | null) {
	return new Response(JSON.stringify(data), {
		headers: {
			"content-type": "application/json",
			...corsHeaders(origin ?? null),
			...(init?.headers ?? {}),
		},
		...init,
	});
}


function corsHeaders(origin: string | null) {
	// For MVP: allow localhost dev + any origin. You can lock this down later.
	return {
		"Access-Control-Allow-Origin": origin ?? "*",
		"Access-Control-Allow-Methods": "POST, GET, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type",
	};
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);
		const origin = request.headers.get("Origin");

		// Handle CORS preflight
		if (request.method === "OPTIONS") {
			return new Response(null, { status: 204, headers: corsHeaders(origin) });
		}

		// Health check route
		if (url.pathname === "/health") {
			return json({ ok: true }, undefined, origin);
		}

		// Main chat route
		if (url.pathname === "/api/chat" && request.method === "POST") {
			let body;
			try {
				body = await request.json();
			} catch {
				return json({ error: "Invalid JSON" }, { status: 400 }, origin);
			}

			const sessionId = body?.sessionId;
			const message = body?.message;

			if (!sessionId || typeof sessionId !== "string") {
				return json({ error: "Missing or invalid sessionId" }, { status: 400 }, origin);
			}
			if (!message || typeof message !== "string") {
				return json({ error: "Missing or invalid message" }, { status: 400 }, origin);
			}

			// Route to correct DO instance
			const id = env.CHAT_DO.idFromName(sessionId);
			const stub = env.CHAT_DO.get(id);

			const doResp = await stub.fetch("https://do/chat", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ message }),
			});

			return doResp;
		}
		// Read history for a session (debug)
		if (url.pathname === "/api/history" && request.method === "GET") {
			const sessionId = url.searchParams.get("sessionId");
			if (!sessionId) {
				return json({ error: "Missing sessionId" }, { status: 400 }, origin);
			}

			const id = env.CHAT_DO.idFromName(sessionId);
			const stub = env.CHAT_DO.get(id);

			// Call the DO history route
			return stub.fetch("https://do/history", { method: "GET" });
		}

		return new Response("Not Found", { status: 404 });
	},
};

// Durable Object: stores chat history + calls LLM
export class ChatSession implements DurableObject {
	state: DurableObjectState;
	env: Env;

	constructor(state: DurableObjectState, env: Env) {
		this.state = state;
		this.env = env;
	}

	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);

		if (url.pathname === "/chat" && request.method === "POST") {
			let body;
			try {
				body = await request.json();
			} catch {
				return json({ error: "Invalid JSON" }, { status: 400 }, origin);
			}

			const userMessage = body?.message;
			if (!userMessage || typeof userMessage !== "string") {
				return json({ error: "Missing or invalid message" }, { status: 400 }, origin);
			}

			// Load history (persistent)
			const history =
				(await this.state.storage.get<ChatMessage[]>("messages")) ?? [];

			// Add user message
			history.push({ role: "user", content: userMessage });

			// Build conversation for model
			const modelMessages: ChatMessage[] = [
				{
					role: "system",
					content: "You are a helpful assistant. Keep replies concise.",
				},
				...history,
			];

			// Detect if AI is available
			// Detect local dev (Worker dev server)
			const host = request.headers.get("Host") || "";
			const isLocalDev = host.includes("127.0.0.1") || host.includes("localhost");

			let replyText = "";

			if (isLocalDev) {
				// Local fallback (no AI available in local mode)
				replyText = `LOCAL MODE (no AI): stored message "${userMessage}"`;
			} else {
				// Production: Real Workers AI call
				try {
					const result: any = await this.env.AI.run(
						"@cf/meta/llama-3.1-8b-instruct",
						{ messages: modelMessages }
					);

					replyText =
						result?.response ??
						result?.result?.response ??
						result?.result ??
						"Sorry — no response.";
				} catch (err: any) {
					const msg = String(err?.message ?? err);

					// Wrangler local dev case
					if (msg.includes("Binding AI needs to be run remotely")) {
						replyText = `LOCAL MODE (no AI): stored message "${userMessage}"`;
					} else {
						replyText = `AI error: ${msg}`;
					}
				}

			}


			// Store assistant reply
			history.push({ role: "assistant", content: replyText });
			// Save new history
			await this.state.storage.put("messages", history);
			return json({ reply: replyText });
		}

		if (url.pathname === "/history" && request.method === "GET") {
			const history =
				(await this.state.storage.get<ChatMessage[]>("messages")) ?? [];
			return json({ messages: history });
		}

		return new Response("Not Found", { status: 404 });
	}
}
