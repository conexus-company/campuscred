// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/// @notice Credential registry keyed by document hash. Deliberately non-transferable:
/// no transfer/approve functions and no ERC-721 interface (FR-10).
contract CampusCred is AccessControl, Pausable {
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    uint256 private constant MAX_BATCH = 50;

    enum Status { None, Active, Revoked }

    struct Credential {
        bytes32 studentRef;    // salted hash, never the raw student number
        bytes32 credType;      // keccak256("CERT_ENROLLMENT") etc.
        address issuer;
        uint64  issuedAt;
        uint64  revokedAt;
        Status  status;
        bytes32 revokeReason;  // short code, e.g. "ISSUED_IN_ERROR"
    }

    mapping(bytes32 => Credential) private credentials;  // docHash => record
    mapping(address => string)     public  issuerName;

    event CredentialIssued(bytes32 indexed docHash, bytes32 indexed studentRef, bytes32 credType, address indexed issuer);
    event CredentialRevoked(bytes32 indexed docHash, bytes32 reason, address indexed by);
    event IssuerAdded(address indexed wallet, string name);
    event IssuerRemoved(address indexed wallet);

    error AlreadyIssued(bytes32 docHash);
    error NotFound(bytes32 docHash);
    error AlreadyRevoked(bytes32 docHash);
    error NotAllowed();
    error EmptyHash();
    error BatchTooLarge(uint256 size);
    error LengthMismatch();

    constructor(address admin) { _grantRole(DEFAULT_ADMIN_ROLE, admin); }

    function addIssuer(address wallet, string calldata name) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(ISSUER_ROLE, wallet);
        issuerName[wallet] = name;
        emit IssuerAdded(wallet, name);
    }

    /// @dev Keeps issuerName so past credentials still show their issuer.
    function removeIssuer(address wallet) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(ISSUER_ROLE, wallet);
        emit IssuerRemoved(wallet);
    }

    function issueCredential(bytes32 docHash, bytes32 studentRef, bytes32 credType) external whenNotPaused {
        if (!hasRole(ISSUER_ROLE, msg.sender)) revert NotAllowed();
        _issue(docHash, studentRef, credType);
    }

    function issueBatch(bytes32[] calldata docHashes, bytes32[] calldata studentRefs, bytes32 credType)
        external
        whenNotPaused
    {
        if (!hasRole(ISSUER_ROLE, msg.sender)) revert NotAllowed();
        if (docHashes.length != studentRefs.length) revert LengthMismatch();
        if (docHashes.length > MAX_BATCH) revert BatchTooLarge(docHashes.length);
        for (uint256 i = 0; i < docHashes.length; i++) {
            _issue(docHashes[i], studentRefs[i], credType);
        }
    }

    function revokeCredential(bytes32 docHash, bytes32 reason) external whenNotPaused {
        Credential storage c = credentials[docHash];
        if (c.status == Status.None) revert NotFound(docHash);
        // Decision 2: original issuer only while still holding ISSUER_ROLE; admin always.
        bool isAdmin = hasRole(DEFAULT_ADMIN_ROLE, msg.sender);
        bool isLiveIssuer = c.issuer == msg.sender && hasRole(ISSUER_ROLE, msg.sender);
        if (!isAdmin && !isLiveIssuer) revert NotAllowed();
        if (c.status == Status.Revoked) revert AlreadyRevoked(docHash);
        c.status = Status.Revoked;
        c.revokedAt = uint64(block.timestamp);
        c.revokeReason = reason;
        emit CredentialRevoked(docHash, reason, msg.sender);
    }

    function verify(bytes32 docHash) external view returns (Credential memory) {
        return credentials[docHash];
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) { _pause(); }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) { _unpause(); }

    function _issue(bytes32 docHash, bytes32 studentRef, bytes32 credType) private {
        if (docHash == bytes32(0)) revert EmptyHash();
        if (credentials[docHash].status != Status.None) revert AlreadyIssued(docHash);
        credentials[docHash] = Credential({
            studentRef: studentRef,
            credType: credType,
            issuer: msg.sender,
            issuedAt: uint64(block.timestamp),
            revokedAt: 0,
            status: Status.Active,
            revokeReason: bytes32(0)
        });
        emit CredentialIssued(docHash, studentRef, credType, msg.sender);
    }
}
