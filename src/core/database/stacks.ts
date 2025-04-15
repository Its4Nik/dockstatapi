import { Stack } from "~/typings/docker-compose";
import { db } from "./database";
import { executeDbOperation } from "./helper";
import type { stacks_config } from "~/typings/database";
import { findObjectByKey } from "../utils/helpers";

const stmt = {
  insert: db.prepare(`
    INSERT INTO stacks_config (
      name, version, custom, source, container_count,
      stack_prefix, automatic_reboot_on_error, image_updates
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `),
  selectAll: db.prepare(`
    SELECT id, name, version, custom, source, container_count, stack_prefix,
           automatic_reboot_on_error, image_updates
    FROM stacks_config
    ORDER BY name DESC
  `),
  update: db.prepare(`
    UPDATE stacks_config SET
      version = ?, custom = ?, source = ?, container_count = ?,
      stack_prefix = ?, automatic_reboot_on_error = ?, image_updates = ?
    WHERE name = ?
  `),
  delete: db.prepare(`DELETE FROM stacks_config WHERE id = ?`),
};

export function addStack(stack: stacks_config) {
  executeDbOperation("Add Stack", () =>
    stmt.insert.run(
      stack.name,
      stack.version,
      stack.custom,
      stack.source,
      stack.container_count,
      stack.stack_prefix,
      stack.automatic_reboot_on_error,
      stack.image_updates
    )
  );

  return findObjectByKey(getStacks(), "name", stack.name)?.id;
}

export function getStacks() {
  return executeDbOperation("Get Stacks", () =>
    stmt.selectAll.all()
  ) as Stack[];
}

export function deleteStack(id: number) {
  return executeDbOperation(
    "Delete Stack",
    () => stmt.delete.run(id),
    () => {
      if (typeof id !== "number") throw new TypeError("Invalid stack ID");
    }
  );
}

export function updateStack(stack: stacks_config) {
  return executeDbOperation("Update Stack", () =>
    stmt.update.run(
      stack.version,
      stack.custom,
      stack.source,
      stack.container_count,
      stack.stack_prefix,
      stack.automatic_reboot_on_error,
      stack.image_updates,
      stack.name
    )
  );
}
