import type { Theme } from "~/typings/database";
import { db } from "./database";
import { executeDbOperation } from "./helper";

const stmt = {
  insert: db.prepare(`
      INSERT INTO themes (name, creator, vars, tags) VALUES (?, ?, ?, ?)
    `),
  remove: db.prepare(`DELETE FROM themes WHERE name = ?`),
  read: db.prepare(`SELECT * FROM themes WHERE name = ?`),
  readAll: db.prepare(`SELECT * FROM themes`),
};

export function getThemes() {
  return executeDbOperation("Get Themes", () => stmt.readAll.all()) as Theme[];
}

export function addTheme({ name, creator, vars, tags }: Theme) {
  return executeDbOperation("Save Theme", () =>
    stmt.insert.run(name, creator, vars, tags.toString()),
  );
}
export function getSpecificTheme(name: string): Theme {
  return executeDbOperation(
    "Getting specific Theme",
    () => stmt.read.get(name) as Theme,
  );
}

export function deleteTheme(name: string) {
  return executeDbOperation("Remove Theme", () => stmt.remove.run(name));
}
