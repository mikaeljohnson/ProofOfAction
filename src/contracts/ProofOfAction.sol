pragma solidity ^0.5.0;

contract ProofOfAction {
  string public name;
  uint public imageCount = 0;
  mapping(uint => Image) public images;
  mapping(address => Profile) public profiles;

  struct Image {
    uint id;
    string hash;
    string description;
    uint tipAmount;
    address payable author;
  }

  struct Profile {
    uint tipTotal;
    string profilePicHash;
    string bio;
  }

  event ImageCreated(
    uint id,
    string hash,
    string description,
    uint tipAmount,
    address payable author
  );

  event ProfileCreated(
    uint tipTotal,
    string profilePicHash,
    string bio
  );

  event ImageTipped(
    uint id,
    string hash,
    string description,
    uint tipAmount,
    address payable author
  );

  constructor() public {
    name = "Proof Of Action";
  }

  function uploadImage(string memory _imgHash, string memory _description) public {
    // Make sure the image hash exists
    require(bytes(_imgHash).length > 0);
    // Make sure image description exists
    require(bytes(_description).length > 0);
    // Make sure uploader address exists
    require(msg.sender!=address(0));

    // Increment image id
    imageCount ++;

    // Add Image to the contract
    images[imageCount] = Image(imageCount, _imgHash, _description, 0, msg.sender);
    // Trigger an event
    emit ImageCreated(imageCount, _imgHash, _description, 0, msg.sender);
  }

  function tipImageOwner(uint _id) public payable {
    // Make sure the id is valid
    require(_id > 0 && _id <= imageCount);
    // Fetch the image
    Image memory _image = images[_id];
    // Fetch the author
    address payable _author = _image.author;
    // Pay the author by sending them Ether
    address(_author).transfer(msg.value);
    // Increment the tip amount
    _image.tipAmount = _image.tipAmount + msg.value;
    // Increment the tipTotal amount for poster
    profiles[_author].tipTotal + msg.value;
    // Update the image
    images[_id] = _image;
    // Trigger an event
    emit ImageTipped(_id, _image.hash, _image.description, _image.tipAmount, _author);
  }

  function updateProfile(string memory _profilePicHash, string memory _bio) public {
    // Make sure the image hash exists
    require(bytes(_profilePicHash).length > 0);
    // Make sure image description exists
    require(bytes(_bio).length > 0);
    // Make sure uploader address exists
    require(msg.sender!=address(0));
    // Sets new profile picture
    profiles[msg.sender].profilePicHash = _profilePicHash;
    // Sets new bio 
    profiles[msg.sender].bio = _bio;
    // Trigger an event
    emit ProfileCreated(profiles[msg.sender].tipTotal, _profilePicHash, _bio);
  }

  function grabProfilePicture(address user) public view returns (string memory hash) {
    return profiles[user].profilePicHash;
  }
  function grabProfileBio(address user) public view returns (string memory bio) {
    return profiles[user].bio;
  }
}
