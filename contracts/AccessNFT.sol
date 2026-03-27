// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract AccessNFT is ERC721 {

    uint256 public nextTokenId;

    struct Access {
        address patient;
        address doctor;
        uint256 expiresAt;
    }

    mapping(uint256 => Access) public accessInfo;
    mapping(address => mapping(address => uint256)) public activeAccessToken;

    event AccessGranted(address patient, address doctor, uint256 tokenId, uint256 expiresAt);
    event AccessRevoked(address patient, address doctor, uint256 tokenId);

    constructor() ERC721("MedicalAccess", "MEDACC") {}

    function grantAccess(address doctor, uint256 duration) external {

        require(doctor != address(0), "Invalid doctor");
        require(activeAccessToken[msg.sender][doctor] == 0, "Access already granted");

        nextTokenId++;
        uint256 tokenId = nextTokenId;

        _safeMint(doctor, tokenId);

        accessInfo[tokenId] = Access({
            patient: msg.sender,
            doctor: doctor,
            expiresAt: block.timestamp + duration
        });

        activeAccessToken[msg.sender][doctor] = tokenId;

        emit AccessGranted(msg.sender, doctor, tokenId, block.timestamp + duration);
    }

    function revokeAccess(address doctor) external {

        uint256 tokenId = activeAccessToken[msg.sender][doctor];

        require(tokenId != 0, "No access");

        _burn(tokenId);

        delete accessInfo[tokenId];
        delete activeAccessToken[msg.sender][doctor];

        emit AccessRevoked(msg.sender, doctor, tokenId);
    }

    function hasValidAccess(address patient, address doctor) public view returns (bool) {

        uint256 tokenId = activeAccessToken[patient][doctor];

        if(tokenId == 0){
            return false;
        }

        return accessInfo[tokenId].expiresAt > block.timestamp;
    }
}