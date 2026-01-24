type LogLevel = "info" | "warn" | "error";

function format(level: LogLevel, message: string) {
	return `[keeper] [${level.toUpperCase()}] ${message}`;
}

export function logInfo(message: string) {
	console.log(format("info", message));
}

export function logWarn(message: string) {
	console.warn(format("warn", message));
}

export function logError(message: string) {
	console.error(format("error", message));
}
