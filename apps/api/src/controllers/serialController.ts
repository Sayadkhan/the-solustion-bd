import { Request, Response } from "express";
import { serialService } from "../services/serialService";

export const lookupWarranty = async (req: Request, res: Response): Promise<void> => {
  try {
    const { serialNumber } = req.params;
    if (!serialNumber) {
      res.status(400).json({ success: false, message: "Serial number is required" });
      return;
    }

    const result = await serialService.lookupWarranty(serialNumber);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};
