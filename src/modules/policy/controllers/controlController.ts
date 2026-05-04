import { Request, Response } from "express";
import * as ControlDB from "../../../db/policy/controls";
import * as MappingDB from "../../../db/policy/policyControlMappings";
import { getPolicyById } from "../../../db/policy/policies";
// ============================================
// CREATE CONTROL
// ============================================
export const createControl = async (req: Request, res: Response) => {
  try {
    const { framework, control_code, description } = req.body;

    if (!framework || !control_code) {
      return res.status(400).json({ message: "Framework and control_code are required" });
    }

    if (!ControlDB.FRAMEWORKS.includes(framework)) {
      return res.status(400).json({ message: `Invalid framework. Must be one of: ${ControlDB.FRAMEWORKS.join(', ')}` });
    }

    const existing = await ControlDB.getControlByFrameworkAndCode(framework, control_code);
    if (existing) {
      return res.status(409).json({ message: "Control already exists" });
    }

    const control = await ControlDB.createControl({ framework, control_code, description });
    res.status(201).json({ success: true, control });
  } catch (error) {
    console.error("Create Control Error:", error);
    res.status(500).json({ message: "Failed to create control" });
  }
};

// ============================================
// GET ALL CONTROLS
// ============================================
export const getControls = async (req: Request, res: Response) => {
  try {
    const { framework, search } = req.query;
    const controls = await ControlDB.getAllControls({
      framework: framework as any,
      search: search as string,
    });

    res.status(200).json({
      success: true,
      count: controls.length,
      controls,
    });
  } catch (error) {
    console.error("Get Controls Error:", error);
    res.status(500).json({ message: "Failed to fetch controls" });
  }
};

// ============================================
// GET CONTROL BY ID
// ============================================
export const getControlById = async (req: Request, res: Response) => {
  try {
    const { controlId } = req.params;
    const control = await ControlDB.getControlById(controlId);


    if (!control) {
      return res.status(404).json({ message: "Control not found" });
    }

    res.status(200).json({ success: true, control });
  } catch (error) {
    console.error("Get Control By ID Error:", error);
    res.status(500).json({ message: "Failed to fetch control" });
  }
};

// ============================================
// MAP POLICY TO CONTROL
// ============================================
export const mapPolicyToControl = async (req: Request, res: Response) => {
  try {
    const { id: policyId } = req.params;
    const { control_id } = req.body;


    if (!control_id) {
      return res.status(400).json({ message: "Control ID is required" });
    }


    const policy = await getPolicyById(policyId);
    if (!policy) {
      return res.status(404).json({ message: "Policy not found" });
    }

    const control = await ControlDB.getControlById(control_id);
    if (!control) {
      return res.status(404).json({ message: "Control not found" });
    }

    const exists = await MappingDB.mappingExists(policyId, control_id);
    if (exists) {
      return res.status(409).json({ message: "Policy is already mapped to this control" });
    }

    const mapping = await MappingDB.createMapping({ policy_id: policyId, control_id });
    res.status(201).json({ success: true, mapping });
  } catch (error) {
    console.error("Map Policy To Control Error:", error);
    res.status(500).json({ message: "Failed to map policy to control" });
  }
};

// ============================================
// UNMAP POLICY FROM CONTROL
// ============================================
export const unmapPolicyFromControl = async (req: Request, res: Response) => {
  try {
    const { id: policyId, controlId } = req.params;
    const deleted = await MappingDB.deleteMapping(policyId, controlId);


    if (!deleted) {
      return res.status(404).json({ message: "Mapping not found" });
    }


    res.status(200).json({ success: true, message: "Mapping removed successfully" });
  } catch (error) {
    console.error("Unmap Policy From Control Error:", error);
    res.status(500).json({ message: "Failed to remove mapping" });
  }
};

// ============================================
// GET POLICY CONTROLS
// ============================================
export const getPolicyControls = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const controls = await MappingDB.getControlsByPolicyId(id);

    res.status(200).json({
      success: true,
      count: controls.length,
      controls,
    });
  } catch (error) {
    console.error("Get Policy Controls Error:", error);
    res.status(500).json({ message: "Failed to fetch controls" });
  }
};

// ============================================
// GET POLICIES BY CONTROL
// ============================================
export const getPoliciesByControl = async (req: Request, res: Response) => {
  try {
    const { controlId } = req.params;
    const policies = await MappingDB.getPoliciesByControlId(controlId);

    res.status(200).json({
      success: true,
      count: policies.length,
      policies,
    });
  } catch (error) {
    console.error("Get Policies By Control Error:", error);
    res.status(500).json({ message: "Failed to fetch policies" });
  }
};

