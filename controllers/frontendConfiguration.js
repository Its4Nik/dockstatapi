const fs = require("fs");
const path = require("path");
const dataPath = path.join(__dirname, "../data/frontendConfiguration.json");
const logger = require("../utils/logger");

async function hideContainer(containerName) {
  try {
    let data = await readData();
    const containerIndex = data.findIndex(
      (container) => container.name === containerName,
    );

    if (containerIndex !== -1) {
      data[containerIndex].hidden = true;
      await saveData(data);
    } else {
      data.push({ name: containerName, hidden: true });
      await saveData(data);
    }
  } catch (error) {
    logger.error(error);
  }
}

async function unhideContainer(containerName) {
  try {
    let data = await readData();
    const containerIndex = data.findIndex(
      (container) => container.name === containerName,
    );

    if (containerIndex !== -1) {
      delete data[containerIndex].hidden;
      await saveData(data);
      cleanupData();
    }
  } catch (error) {
    logger.error(error);
  }
}

async function addTagToContainer(containerName, tag) {
  try {
    let data = await readData();
    const containerIndex = data.findIndex(
      (container) => container.name === containerName,
    );

    if (containerIndex !== -1) {
      if (!data[containerIndex].tags) {
        data[containerIndex].tags = [];
      }
      data[containerIndex].tags.push(tag);
      await saveData(data);
    } else {
      data.push({ name: containerName, tags: [tag] });
      await saveData(data);
    }
  } catch (error) {
    logger.error(error);
  }
}

async function removeTagFromContainer(containerName, tag) {
  try {
    let data = await readData();
    const containerIndex = data.findIndex(
      (container) => container.name === containerName,
    );

    if (containerIndex !== -1 && data[containerIndex].tags) {
      data[containerIndex].tags = data[containerIndex].tags.filter(
        (t) => t !== tag,
      );
      await saveData(data);
      cleanupData();
    }
  } catch (error) {
    logger.error(error);
  }
}

async function pinContainer(containerName) {
  try {
    let data = await readData();
    const containerIndex = data.findIndex(
      (container) => container.name === containerName,
    );

    if (containerIndex !== -1) {
      data[containerIndex].pinned = true;
      await saveData(data);
    } else {
      data.push({ name: containerName, pinned: true });
      await saveData(data);
    }
  } catch (error) {
    logger.error(error);
  }
}

async function unpinContainer(containerName) {
  try {
    let data = await readData();
    const containerIndex = data.findIndex(
      (container) => container.name === containerName,
    );

    if (containerIndex !== -1) {
      delete data[containerIndex].pinned;
      await saveData(data);
      cleanupData();
    }
  } catch (error) {
    logger.error(error);
  }
}

async function readData() {
  try {
    const data = await fs.promises.readFile(dataPath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("readData");
    if (error.code === "ENOENT") {
      await saveData([]);
      return [];
    } else {
      throw error;
    }
  }
}

async function saveData(data) {
  try {
    await fs.promises.writeFile(
      dataPath,
      JSON.stringify(data, null, 2),
      "utf-8",
    );
    logger.info("Succesfully wrote to file");
  } catch (error) {
    logger.error(error);
  }
}

async function cleanupData() {
  try {
    const data = await readData();
    let cleanedData = [];

    if (data && Array.isArray(data)) {
      cleanedData = data.filter((container) => {
        // Filter out containers with empty "tags" or containers with only one property (name)
        if (
          container.tags &&
          Array.isArray(container.tags) &&
          container.tags.length === 0
        ) {
          delete container.tags;
        }
        return Object.keys(container).length > 1;
      });
    }

    await saveData(cleanedData);
  } catch (error) {
    logger.error(error);
  }
}

module.exports = {
  hideContainer,
  unhideContainer,
  addTagToContainer,
  removeTagFromContainer,
  pinContainer,
  unpinContainer,
  cleanupData,
};
