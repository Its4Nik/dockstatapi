interface stackSocketMessage {
	message?: string;
	type?: "stack-progress" | "stack-error" | "stack-status" | "stack-removed";
	data?: stackSocketData;
}

interface stackSocketData {
	stack_id: number;
	message: string;
	action?: string;
	status?: string;
	timestamp?: string;
}

export type { stackSocketMessage };
