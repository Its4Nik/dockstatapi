import { dbFunctions } from "~/core/database";
import type { Theme } from "~/typings/database";

class themeHandler {
  getThemes(): Theme[] {
    return dbFunctions.getThemes();
  }
  addTheme(theme: Theme) {
    try {
      return dbFunctions.addTheme({ ...theme });
    } catch (error) {
      throw new Error(`Could not save theme ${theme}, error: ${error}`);
    }
  }
  deleteTheme({ name }: Theme) {
    try {
      return dbFunctions.deleteTheme(name);
    } catch (error) {
      throw new Error(`Could not save theme ${name}, error: ${error}`);
    }
  }
  getTheme(name: string): Theme {
    return dbFunctions.getSpecificTheme(name);
  }
}

export const ThemeHandler = new themeHandler();
