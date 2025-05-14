import { init } from "~/core/database/database";

init();

import * as backup from "~/core/database/backup";
import * as config from "~/core/database/config";
import * as containerStats from "~/core/database/containerStats";
import * as dockerHosts from "~/core/database/dockerHosts";
import * as hostStats from "~/core/database/hostStats";
import * as logs from "~/core/database/logs";
import * as stacks from "~/core/database/stacks";

export const dbFunctions = {
	...dockerHosts,
	...logs,
	...config,
	...containerStats,
	...hostStats,
	...stacks,
	...backup,
};

export type dbFunctions = typeof dbFunctions;
