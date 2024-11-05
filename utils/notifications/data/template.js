const fs = require("fs");
const path = require("path");

const templatePath = path.join(__dirname, "template.json");
const containersPath = path.join(__dirname, "../../../data/states.json");

function getTemplate() {
  try {
    const data = fs.readFileSync(templatePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Failed to load template:", error);
    return null;
  }
}

function setTemplate(newTemplate) {
  try {
    fs.writeFileSync(
      templatePath,
      JSON.stringify(newTemplate, null, 2),
      "utf8",
    );
    console.log("Template updated successfully");
  } catch (error) {
    console.error("Failed to update template:", error);
  }
}

function renderTemplate(containerId) {
  const template = getTemplate();
  if (!template) return null;

  try {
    const data = fs.readFileSync(containersPath, "utf8");
    const containers = JSON.parse(data);

    let containerData = null;
    for (const host in containers) {
      containerData = containers[host].find((c) => c.id === containerId);
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
      template.text,
    );
  } catch (error) {
    console.error("Failed to load containers:", error);
    return null;
  }
}

module.exports = { getTemplate, setTemplate, renderTemplate };
