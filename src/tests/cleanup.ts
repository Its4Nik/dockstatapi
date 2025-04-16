import { dbFunctions } from "~/core/database";
import { findObjectByKey } from "~/core/utils/helpers";

import type { DockerHost } from "~/typings/docker";

console.log("");
console.log("Deleting `test` Docker host");

const testHosts: DockerHost[] = dbFunctions.getDockerHosts();

const testHost = findObjectByKey(testHosts, "name", "test");

if (testHost) {
	dbFunctions.deleteDockerHost(testHost.id as number);
	console.log(`Docker host with name "${testHost.name}" deleted.`);
} else {
	console.log("Docker host not found.");
}

console.log("Cleaning up Database config to default values");
dbFunctions.updateConfig(5, 7, "changeme");
