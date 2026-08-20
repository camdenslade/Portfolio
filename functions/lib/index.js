"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBadgeOverrides = exports.setBadgeOverrides = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
admin.initializeApp();
const db = admin.firestore();
exports.setBadgeOverrides = (0, https_1.onRequest)({ cors: ['https://cslade.space', 'https://portfolio-dae1f.web.app', 'http://localhost:3000'] }, async (req, res) => {
    var _a;
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    const authHeader = (_a = req.headers.authorization) !== null && _a !== void 0 ? _a : '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
        res.status(401).json({ error: 'Missing token' });
        return;
    }
    try {
        await admin.auth().verifyIdToken(token);
    }
    catch (_b) {
        res.status(401).json({ error: 'Invalid or expired token' });
        return;
    }
    const { overrides } = req.body;
    if (!overrides || typeof overrides !== 'object') {
        res.status(400).json({ error: 'Missing overrides' });
        return;
    }
    // Validate: values must be arrays of strings
    for (const [key, val] of Object.entries(overrides)) {
        if (!Array.isArray(val) || val.some(v => typeof v !== 'string')) {
            res.status(400).json({ error: `Invalid badges for project "${key}"` });
            return;
        }
    }
    await db.collection('portfolio').doc('badge-overrides').set({ overrides, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: false });
    res.status(200).json({ ok: true });
});
exports.getBadgeOverrides = (0, https_1.onRequest)({ cors: true }, async (_req, res) => {
    var _a;
    const snap = await db.collection('portfolio').doc('badge-overrides').get();
    if (!snap.exists) {
        res.status(200).json({ overrides: {} });
        return;
    }
    const data = snap.data();
    res.status(200).json({ overrides: (_a = data.overrides) !== null && _a !== void 0 ? _a : {} });
});
//# sourceMappingURL=index.js.map