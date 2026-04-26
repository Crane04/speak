import { Router } from "express";
import { reverseGeocode } from "../controllers/geo.controller";

const router = Router();

// GET /api/geo/reverse?lat=..&lng=..
router.get("/reverse", reverseGeocode);

export default router;

