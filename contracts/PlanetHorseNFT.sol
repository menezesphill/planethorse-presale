// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./Withdrawable.sol";
import "./Authorizable.sol";

contract PlanetHorseNFT is
  ERC721,
  ERC721Enumerable,
  Pausable,
  Withdrawable,
  ReentrancyGuard,
  Authorizable
{
  using Counters for Counters.Counter;
  using Strings for uint256;

  event RevealRequested(address indexed from, uint256 tokenId, string tokenTier);

  ERC20 public paymentCurrency;

  Counters.Counter private _tokenIdCounter;
  Counters.Counter private _commonSupply;
  Counters.Counter private _rareSupply;
  Counters.Counter private _srareSupply;
  Counters.Counter private _epicSupply;
  Counters.Counter private _legendSupply;
  Counters.Counter private _slegendSupply;

  string private _hiddenBaseURI;

  uint256 private _maxSupply;
  uint256 private _maxMintAmount;

  uint256 private _whitelistSaleTime;
  uint256 private _publicSaleTime;
  uint256 private _unlimitedSaleTime;
  uint256 private _revealTime;

  bool private _transfersPaused;

  struct TieredSupply {
    uint16 COMMON_MAX_SUPPLY;
    uint16 RARE_MAX_SUPPLY;
    uint16 SRARE_MAX_SUPPLY;
    uint16 EPIC_MAX_SUPPLY;
    uint16 LEGEND_MAX_SUPPLY;
    uint16 SLEGEND_MAX_SUPPLY;
  }

  TieredSupply internal _tieredSupply = TieredSupply({
    COMMON_MAX_SUPPLY: 1800,
    RARE_MAX_SUPPLY: 1650,
    SRARE_MAX_SUPPLY: 1500,
    EPIC_MAX_SUPPLY: 1125,
    LEGEND_MAX_SUPPLY: 900,
    SLEGEND_MAX_SUPPLY: 525
  });

  mapping(uint256 => bool) private _revealed;
  mapping(uint256 => bool) private _revealRequestCompleted;
  mapping(address => bool) private _whitelist;
  mapping(uint256 => string) private _tokenTiers;
  mapping(uint256 => string) private _revealedTokenURIs;


  constructor(
    ERC20 paymentCurrency_,
    uint256 maxSupply_,
    uint256 maxMintAmount_,
    uint256 whitelistSaleTime_,
    uint256 publicSaleTime_,
    uint256 unlimitedSaleTime_,
    string memory hiddenBaseURI_,
    bool transfersPaused_
  )
    ERC721("PlanetHorseNFT", "PHORSE NFT")
  { 
    paymentCurrency = paymentCurrency_;
    _maxSupply = maxSupply_;
    _maxMintAmount = maxMintAmount_;
    _whitelistSaleTime = whitelistSaleTime_;
    _publicSaleTime = publicSaleTime_;
    _unlimitedSaleTime = unlimitedSaleTime_;
    _hiddenBaseURI = hiddenBaseURI_;
    _transfersPaused = transfersPaused_;

    _tokenIdCounter.increment();
  }

  function maxSupply() public view returns (uint256) {
    return _maxSupply;
  }

  function maxMintAmount() public view returns (uint256) {
    return _maxMintAmount;
  }

  function pause() public onlyOwner {
    _pause();
  }

  function unpause() public onlyOwner {
    _unpause();
  }

  function mint(
    string memory rarity_
    )
     external 
     whenNotPaused 
     nonReentrant 
  {
    _checkRarityBeforeMint(rarity_);
    if (block.timestamp < _unlimitedSaleTime) {
      require(
      balanceOf(msg.sender) + 1 <= _maxMintAmount,
      "PlanetHorseNFT: exceeds max mint limit"
    );
    }
    require(
      totalSupply() + 1 <= _maxSupply,
      "PlanetHorseNFT: exceeds max supply"
    );
    if (block.timestamp < _publicSaleTime) {
      revert("PlanetHorseNFT: public sale hasn't started");
    }

      uint256 tokenId = _tokenIdCounter.current();
      _tokenTiers[tokenId] = rarity_;
      _mintByRarity(msg.sender, rarity_);
    
  }

  function mintWhitelist(
    string memory rarity_
  )
    external
    whenNotPaused
    nonReentrant
  {
    _checkRarityBeforeMint(rarity_);
    require(
      _whitelist[msg.sender],
      "PlanetHorseNFT: sender not whitelisted"
    );
    if (block.timestamp < _unlimitedSaleTime) {
      require(
      balanceOf(msg.sender) + 1 <= _maxMintAmount,
      "PlanetHorseNFT: exceeds max mint limit"
    );
    }
    require(
      totalSupply() + 1 <= _maxSupply,
      "PlanetHorseNFT: exceeds max supply"
    );
    if (block.timestamp < _whitelistSaleTime) {
      revert("PlanetHorseNFT: whitelist sale hasn't started");
    }
    
      uint256 tokenId = _tokenIdCounter.current();
      _tokenTiers[tokenId] = rarity_;
      _mintByRarity(msg.sender, rarity_);
    
  }

  function mintOwner(address to_, string memory rarity_) external onlyOwner {
      _checkRarityBeforeMint(rarity_);
      uint256 tokenId = _tokenIdCounter.current();
      _tokenTiers[tokenId] = rarity_;
      _safeMint(to_);
  }

  function _safeMint(address to) internal {
    uint256 tokenId = _tokenIdCounter.current();
    require(tokenId <= _maxSupply, 'PlanetHorseNFT: exceeds max supply');

    _tokenIdCounter.increment();
    _safeMint(to, tokenId);
  }

  function _checkRarityBeforeMint(string memory rarity_) internal pure {
        require(
        keccak256(bytes(rarity_)) == keccak256("common") || 
        keccak256(bytes(rarity_)) == keccak256("rare") || 
        keccak256(bytes(rarity_)) == keccak256("srare") || 
        keccak256(bytes(rarity_)) == keccak256("epic") || 
        keccak256(bytes(rarity_)) == keccak256("legend") || 
        keccak256(bytes(rarity_)) == keccak256("slegend"), "PlanetHorseNFT: invalid argument"
        );
  }

  function _mintByRarity(address minter_, string memory rarity_) internal whenNotPaused {
      if (keccak256(bytes(rarity_)) == keccak256("common")) {
        uint16 tierSupply = uint16(_commonSupply.current());
        require(tierSupply < _tieredSupply.COMMON_MAX_SUPPLY, "PlanetHorseNFT: Tier Limit Reached!");
        require(paymentCurrency.transferFrom(minter_, address(this), 5000000), "PlanetHorseNFT: Payment Failed!");
        _commonSupply.increment();
        _safeMint(minter_);       
      } else if (keccak256(bytes(rarity_)) == keccak256("rare")) {
        uint16 tierSupply = uint16(_rareSupply.current());
        require(tierSupply < _tieredSupply.RARE_MAX_SUPPLY, "PlanetHorseNFT: Tier Limit Reached!");
        require(paymentCurrency.transferFrom(minter_, address(this), 7500000), "PlanetHorseNFT: Payment Failed!");
        _rareSupply.increment();
        _safeMint(minter_);
      } else if (keccak256(bytes(rarity_)) == keccak256("srare")) {
        uint16 tierSupply = uint16(_srareSupply.current());
        require(tierSupply < _tieredSupply.SRARE_MAX_SUPPLY, "PlanetHorseNFT: Tier Limit Reached!");
        require(paymentCurrency.transferFrom(minter_, address(this), 12000000), "PlanetHorseNFT: Payment Failed!");
        _srareSupply.increment();
        _safeMint(minter_);
      } else if (keccak256(bytes(rarity_)) == keccak256("epic")) {
        uint16 tierSupply = uint16(_epicSupply.current());
        require(tierSupply < _tieredSupply.EPIC_MAX_SUPPLY, "PlanetHorseNFT: Tier Limit Reached!");
        require(paymentCurrency.transferFrom(minter_, address(this), 15000000), "PlanetHorseNFT: Payment Failed!");
        _epicSupply.increment();
        _safeMint(minter_);
      } else if (keccak256(bytes(rarity_)) == keccak256("legend")) {
        uint16 tierSupply = uint16(_legendSupply.current());
        require(tierSupply < _tieredSupply.LEGEND_MAX_SUPPLY, "PlanetHorseNFT: Tier Limit Reached!");
        require(paymentCurrency.transferFrom(minter_, address(this), 30000000), "PlanetHorseNFT: Payment Failed!");
        _legendSupply.increment();
        _safeMint(minter_);
      } else if (keccak256(bytes(rarity_)) == keccak256("slegend")) {
        uint16 tierSupply = uint16(_slegendSupply.current());
        require(tierSupply < _tieredSupply.SLEGEND_MAX_SUPPLY, "PlanetHorseNFT: Tier Limit Reached!");
        require(paymentCurrency.transferFrom(minter_, address(this), 50000000), "PlanetHorseNFT: Payment Failed!");
        _slegendSupply.increment();
        _safeMint(minter_);
      } else {
        revert("PlanetHorseNFT: invalid argument");
      }
  }

  function tokenURI(uint256 tokenId)
    public
    view
    override
    returns (string memory)
  {
    require(
      _exists(tokenId),
      "ERC721Metadata: URI query for nonexistent token"
    );

    if (_revealed[tokenId]) {
      return
        string(
          abi.encodePacked(_revealedTokenURIs[tokenId])
        );
    } else {
      return
        string(
          abi.encodePacked(_hiddenBaseURI, string(_tokenTiers[tokenId]), ".json")
        );
    }
  }

  function tokenTierById(uint256 tokenId)
    public
    view
    returns (string memory)
  {
    require(
      _exists(tokenId),
      "ERC721Metadata: URI query for nonexistent token"
    );
    return string(_tokenTiers[tokenId]);
  }

  function transfersPaused() public view returns (bool) {
    return _transfersPaused;
  }

  function setTransfersPaused(bool transfersPaused_) external onlyOwner {
    _transfersPaused = transfersPaused_;
  }

  function _beforeTokenTransfer(
    address from,
    address to,
    uint256 tokenId
  ) internal override(ERC721, ERC721Enumerable) {
    require(
      !_transfersPaused || from == address(0),
      'PlanetHorseNFT: transfers are paused'
    );

    super._beforeTokenTransfer(from, to, tokenId);
  }

  function supportsInterface(bytes4 interfaceId)
    public
    view
    override(ERC721, ERC721Enumerable)
    returns (bool)
  {
    return
      ERC721.supportsInterface(interfaceId) ||
      ERC721Enumerable.supportsInterface(interfaceId);
  }

  function setMaxSupply(uint256 maxSupply_) external onlyOwner {
    _maxSupply = maxSupply_;
  }

  function setMaxMintAmount(uint256 maxMintAmount_) external onlyOwner {
    _maxMintAmount = maxMintAmount_;
  }

  function setHiddenURI(string memory baseURI)
    external
    onlyOwner
  {
    _hiddenBaseURI = baseURI;
  }

  function setRevealedURI(string memory baseURI, uint256 tokenId)
    external
    onlyAuthorized
  {
    if(authorized[msg.sender]) {
      require(!_revealRequestCompleted[tokenId], "PlanetHorseNFT: Duplicated reveal request");
    }
    _revealedTokenURIs[tokenId] = baseURI;
    _revealRequestCompleted[tokenId] = true;

  }

  function reveal(uint256 tokenId)
    external
    whenNotPaused
  {
    require(!_revealed[tokenId], "PlanetHorseNFT: token already revealed");
    require(ownerOf(tokenId) == msg.sender, "PlanetHorseNFT: only NFT owner can unbox");
    if (block.timestamp < _revealTime) {
      revert("PlanetHorseNFT: box opening hasn't started");
    }
     _revealed[tokenId] = true;
     emit RevealRequested(msg.sender, tokenId, _tokenTiers[tokenId]);
  }

  function isRevealed(uint256 tokenId)
    external
    view
    returns (bool)
  {
    return _revealed[tokenId];
  }

  function registerWhitelist(address[] memory addrs) external onlyOwner {
        for(uint256 i = 0; i < addrs.length; i++)
            _whitelist[addrs[i]] = true;
    }

  function whitelistSaleTime() public view returns (uint256) {
    return _whitelistSaleTime;
  }

  function setWhitelistSaleTime(uint256 whitelistSaleTime_) external onlyOwner {
    _whitelistSaleTime = whitelistSaleTime_;
  }

  function publicSaleTime() public view returns (uint256) {
    return _publicSaleTime;
  }

  function setPublicSaleTime(uint256 publicSaleTime_) external onlyOwner {
    _publicSaleTime = publicSaleTime_;
  }

  function unlimitedSaleTime() public view returns (uint256) {
    return _unlimitedSaleTime;
  }

  function setunlimitedSaleTime(uint256 unlimitedSaleTime_) external onlyOwner {
    _unlimitedSaleTime = unlimitedSaleTime_;
  }

    function revealTime() public view returns (uint256) {
    return _revealTime;
  }

  function setRevealTime(uint256 revealTime_) external onlyOwner {
    _revealTime = revealTime_;
  }

}