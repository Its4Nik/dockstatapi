import { Request, Response } from "express";
import { createResponseHandler } from "./response";
import {
  hideContainer,
  unhideContainer,
  addTagToContainer,
  removeTagFromContainer,
  pinContainer,
  unpinContainer,
  setLink,
  removeLink,
  setIcon,
  removeIcon,
} from "../controllers/frontendConfiguration";

class FrontendHandler {
  private req: Request;
  private res: Response;

  constructor(req: Request, res: Response) {
    this.req = req;
    this.res = res;
  }

  async show(containerName: string) {
    const ResponseHandler = createResponseHandler(this.res);
    try {
      await unhideContainer(containerName);
      return ResponseHandler.ok("Container unhidden successfully.");
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return ResponseHandler.critical(errorMsg);
    }
  }

  async hide(containerName: string) {
    const ResponseHandler = createResponseHandler(this.res);
    try {
      await hideContainer(containerName);
      return ResponseHandler.ok("Hid container succesfully");
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return ResponseHandler.critical(errorMsg);
    }
  }

  async addTag(containerName: string, tag: string) {
    const ResponseHandler = createResponseHandler(this.res);
    try {
      await addTagToContainer(containerName, tag);
      return ResponseHandler.ok("Tag added successfully.");
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return ResponseHandler.critical(errorMsg);
    }
  }

  async removeTag(containerName: string, tag: string) {
    const ResponseHandler = createResponseHandler(this.res);
    try {
      await removeTagFromContainer(containerName, tag);
      ResponseHandler.ok("Tag removed successfully.");
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return ResponseHandler.critical(errorMsg);
    }
  }

  async pin(containerName: string) {
    const ResponseHandler = createResponseHandler(this.res);
    try {
      await pinContainer(containerName);
      return ResponseHandler.ok("Container pinned successfully.");
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return ResponseHandler.critical(errorMsg);
    }
  }

  async unPin(containerName: string) {
    const ResponseHandler = createResponseHandler(this.res);
    try {
      await unpinContainer(containerName);
      return ResponseHandler.ok("Container unpinned successfully.");
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return ResponseHandler.critical(errorMsg);
    }
  }

  async addLink(containerName: string, link: string) {
    const ResponseHandler = createResponseHandler(this.res);
    try {
      await setLink(containerName, link);
      return ResponseHandler.ok("Link added successfully.");
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return ResponseHandler.critical(errorMsg);
    }
  }

  async removeLink(containerName: string) {
    const ResponseHandler = createResponseHandler(this.res);
    try {
      await removeLink(containerName);
      return ResponseHandler.ok("Removed link succesfully");
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return ResponseHandler.critical(errorMsg);
    }
  }

  async addIcon(containerName: string, icon: string, useCustomIcon: string) {
    const ResponseHandler = createResponseHandler(this.res);
    const iconBool = useCustomIcon === "true";
    try {
      await setIcon(containerName, icon, iconBool);
      return ResponseHandler.ok("Icon added successfully.");
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return ResponseHandler.critical(errorMsg);
    }
  }

  async removeIcon(containerName: string) {
    const ResponseHandler = createResponseHandler(this.res);
    try {
      await removeIcon(containerName);
      return ResponseHandler.ok("Icon removed successfully.");
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return ResponseHandler.critical(errorMsg);
    }
  }
}

export const createFrontendHandler = (req: Request, res: Response) =>
  new FrontendHandler(req, res);
