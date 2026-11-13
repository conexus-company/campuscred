// Hand-written stub of the CampusCred ABI (pr-alvin.md section 5).
// Replaced by the ABI exported from the compiled contract in alvin/02-deploy.

export const CAMPUSCRED_ABI = [
  {
    type: "constructor",
    stateMutability: "nonpayable",
    inputs: [{ name: "admin", type: "address" }],
  },

  // Admin
  {
    type: "function",
    name: "addIssuer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "wallet", type: "address" },
      { name: "name", type: "string" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "removeIssuer",
    stateMutability: "nonpayable",
    inputs: [{ name: "wallet", type: "address" }],
    outputs: [],
  },
  { type: "function", name: "pause", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { type: "function", name: "unpause", stateMutability: "nonpayable", inputs: [], outputs: [] },

  // Issuer
  {
    type: "function",
    name: "issueCredential",
    stateMutability: "nonpayable",
    inputs: [
      { name: "docHash", type: "bytes32" },
      { name: "studentRef", type: "bytes32" },
      { name: "credType", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "issueBatch",
    stateMutability: "nonpayable",
    inputs: [
      { name: "docHashes", type: "bytes32[]" },
      { name: "studentRefs", type: "bytes32[]" },
      { name: "credType", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "revokeCredential",
    stateMutability: "nonpayable",
    inputs: [
      { name: "docHash", type: "bytes32" },
      { name: "reason", type: "bytes32" },
    ],
    outputs: [],
  },

  // Views
  {
    type: "function",
    name: "verify",
    stateMutability: "view",
    inputs: [{ name: "docHash", type: "bytes32" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct CampusCred.Credential",
        components: [
          { name: "studentRef", type: "bytes32" },
          { name: "credType", type: "bytes32" },
          { name: "issuer", type: "address" },
          { name: "issuedAt", type: "uint64" },
          { name: "revokedAt", type: "uint64" },
          { name: "status", type: "uint8", internalType: "enum CampusCred.Status" },
          { name: "revokeReason", type: "bytes32" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "issuerName",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "ISSUER_ROLE",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "bytes32" }],
  },
  {
    type: "function",
    name: "DEFAULT_ADMIN_ROLE",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "bytes32" }],
  },
  {
    type: "function",
    name: "hasRole",
    stateMutability: "view",
    inputs: [
      { name: "role", type: "bytes32" },
      { name: "account", type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "paused",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "bool" }],
  },

  // Events
  {
    type: "event",
    name: "CredentialIssued",
    anonymous: false,
    inputs: [
      { name: "docHash", type: "bytes32", indexed: true },
      { name: "studentRef", type: "bytes32", indexed: true },
      { name: "credType", type: "bytes32", indexed: false },
      { name: "issuer", type: "address", indexed: true },
    ],
  },
  {
    type: "event",
    name: "CredentialRevoked",
    anonymous: false,
    inputs: [
      { name: "docHash", type: "bytes32", indexed: true },
      { name: "reason", type: "bytes32", indexed: false },
      { name: "by", type: "address", indexed: true },
    ],
  },
  {
    type: "event",
    name: "IssuerAdded",
    anonymous: false,
    inputs: [
      { name: "wallet", type: "address", indexed: true },
      { name: "name", type: "string", indexed: false },
    ],
  },
  {
    type: "event",
    name: "IssuerRemoved",
    anonymous: false,
    inputs: [{ name: "wallet", type: "address", indexed: true }],
  },

  // Errors (contract)
  { type: "error", name: "AlreadyIssued", inputs: [{ name: "docHash", type: "bytes32" }] },
  { type: "error", name: "NotFound", inputs: [{ name: "docHash", type: "bytes32" }] },
  { type: "error", name: "AlreadyRevoked", inputs: [{ name: "docHash", type: "bytes32" }] },
  { type: "error", name: "NotAllowed", inputs: [] },
  { type: "error", name: "EmptyHash", inputs: [] },
  { type: "error", name: "BatchTooLarge", inputs: [{ name: "size", type: "uint256" }] },
  { type: "error", name: "LengthMismatch", inputs: [] },

  // Errors (OpenZeppelin v5)
  { type: "error", name: "EnforcedPause", inputs: [] },
  { type: "error", name: "ExpectedPause", inputs: [] },
  {
    type: "error",
    name: "AccessControlUnauthorizedAccount",
    inputs: [
      { name: "account", type: "address" },
      { name: "neededRole", type: "bytes32" },
    ],
  },
] as const;
