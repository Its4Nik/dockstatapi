interface config {
	keep_data_for: number;
	fetching_interval: number;
	api_key: string;
}

interface stacks_config {
	id: number;
	name: string;
	version: number;
	custom: boolean;
	source: string;
	container_count: number;
	stack_prefix: string;
	automatic_reboot_on_error: boolean;
	image_updates: boolean;
}

interface log_message {
	level: string;
	timestamp: string;
	message: string;
	file: string;
	line: number;
}

export type { config, stacks_config, log_message };
