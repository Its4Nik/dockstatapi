import { dbFunctions } from "~/core/database/repository";

console.log("");
console.log("Deleting `test` Docker host");
dbFunctions.deleteDockerHost("test");
console.log("Cleanuing up Database config to default values");
dbFunctions.updateConfig(5, 7, "changeme");
