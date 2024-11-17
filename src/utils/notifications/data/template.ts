import fs from "fs";
import logger from "../../logger";
const templatePath: string = "./utils/notifications/data/template.json";
const containersPath: string = "./data/states.json";

function getTemplate() {
  try {
    const data = fs.readFileSync(templatePath, "utf8");
    return JSON.parse(data);
  } catch (error: any) {
    console.error("Failed to load template:", error);
    return null;
  }
}

function setTemplate(newTemplate: string) {
  try {
    fs.writeFileSync(
      templatePath,
      JSON.stringify(newTemplate, null, 2),
      "utf8",
    );
    logger.debug("Template updated successfully");
  } catch (error: any) {
    logger.error("Failed to update template:", error);
  }
}

function renderTemplate(containerId: string) {
  const template = getTemplate();
  if (!template) return null;

  try {
    const data = fs.readFileSync(containersPath, "utf8");
    const containers = JSON.parse(data);

    let containerData = null;
    for (const host in containers) {
      containerData = containers[host].find((c: any) => c.id === containerId);
      if (containerData) break;
    }

    if (!containerData) {
      console.error(`Container with ID ${containerId} not found`);
      return null;
    }

    // Substitute placeholders in the template with container data
    return Object.keys(containerData).reduce(
      (text, key) =>
        text.replace(new RegExp(`{{${key}}}`, "g"), containerData[key]),
      template.message,
    );
  } catch (error: any) {
    logger.error("Failed to load containers:", error);
    return null;
  }
}

export { getTemplate, setTemplate, renderTemplate };
