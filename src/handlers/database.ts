import { dbFunctions } from "~/core/database";

class databaseHandler {
	async getContainers() {
		return dbFunctions.getContainerStats();
	}

	async getHosts() {
		return dbFunctions.getHostStats();
	}
}

export const DatabaseHandler = new databaseHandler();
