import type { log_message } from "~/typings/database";
import { db } from "./database";
import { executeDbOperation } from "./helper";

const stmt = {
	insert: db.prepare(
		"INSERT INTO backend_log_entries (timestamp, level, message, file, line) VALUES (?, ?, ?, ?, ?)",
	),
	selectAll: db.prepare(
		"SELECT timestamp, level, message, file, line FROM backend_log_entries ORDER BY timestamp DESC",
	),
	selectByLevel: db.prepare(
		"SELECT timestamp, level, message, file, line FROM backend_log_entries WHERE level = ?",
	),
	deleteAll: db.prepare("DELETE FROM backend_log_entries"),
	deleteByLevel: db.prepare("DELETE FROM backend_log_entries WHERE level = ?"),
};

export function addLogEntry(data: log_message) {
	return executeDbOperation(
		"Add Log Entry",
		() =>
			stmt.insert.run(
				data.level,
				data.timestamp,
				data.message,
				data.file,
				data.line,
			),
		() => {
			if (
				typeof data.level !== "string" ||
				typeof data.timestamp !== "string" ||
				typeof data.message !== "string" ||
				typeof data.file !== "string" ||
				typeof data.line !== "number"
			) {
				throw new TypeError(
					"Invalid log entry parameters ${data.file} ${data.line} ${data.message} ${data}",
				);
			}
		},
		true,
	);
}

export function getAllLogs() {
	return executeDbOperation("Get All Logs", () => stmt.selectAll.all());
}

export function getLogsByLevel(level: string) {
	return executeDbOperation(
		"Get Logs By Level",
		() => stmt.selectByLevel.all(level),
		() => {
			if (typeof level !== "string") throw new TypeError("Invalid level type");
		},
	);
}

export function clearAllLogs() {
	return executeDbOperation("Clear All Logs", () => stmt.deleteAll.run());
}

export function clearLogsByLevel(level: string) {
	return executeDbOperation(
		"Clear Logs By Level",
		() => stmt.deleteByLevel.run(level),
		() => {
			if (typeof level !== "string") throw new TypeError("Invalid level type");
		},
	);
}
