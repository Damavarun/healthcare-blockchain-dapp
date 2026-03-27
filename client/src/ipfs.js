import { create } from "ipfs-http-client";

/*
  INFURA IPFS UPDATE:
  Public Infura IPFS endpoints now require authentication.
  
  To fix:
  1. Go to https://dashboard.infura.io/ and create an IPFS project.
  2. Paste your Project ID and API Key Secret below.
  
  OR
  
  Use a local IPFS node (Kubo) at http://localhost:5001 (default).
*/

const projectId = ""; // 👈 PASTE YOUR INFURA PROJECT ID
const projectSecret = ""; // 👈 PASTE YOUR INFURA API KEY SECRET

// Basic Auth header for Infura
const auth = (projectId && projectSecret) 
  ? "Basic " + btoa(projectId + ":" + projectSecret) 
  : "";

const ipfs = create({
  // If credentials missing, try localhost (default for IPFS desktop/Kubo)
  host: projectId ? "ipfs.infura.io" : "localhost", 
  port: 5001,
  protocol: projectId ? "https" : "http",
  headers: auth ? { authorization: auth } : {},
});

export default ipfs;
