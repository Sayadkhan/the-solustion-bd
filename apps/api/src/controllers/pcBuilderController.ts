import { Request, Response } from "express";
import { pcBuilderService } from "../services/pcBuilderService";

export const validateBuild = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pcBuilderService.validateBuildByProductIds(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: (error as Error).message });
  }
};

export const saveBuild = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id || req.body.userId;
    const build = await pcBuilderService.saveBuild({
      ...req.body,
      userId,
    });
    res.status(201).json({
      success: true,
      message: "Build saved successfully",
      shortCode: build.shortCode,
      data: build,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: (error as Error).message });
  }
};

export const getBuildByShortCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const code = req.params.shortCode || req.params.shareId;
    const build = await pcBuilderService.getBuildByShortCode(code);
    if (!build) {
      res.status(404).json({ success: false, message: "PC Build quotation not found" });
      return;
    }
    res.json({ success: true, data: build });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

export const getBuildByShareId = getBuildByShortCode;
