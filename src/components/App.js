import ProofOfAction from '../abis/ProofOfAction.json'
import React, { Component } from 'react';
import { HashRouter as Router, Route, Switch } from 'react-router-dom';
import Navbar from './Navbar'
import Main from './Main'
import Post from './Post'
import Profile from './Profile'
import Web3 from 'web3';
import './App.css';

//Declare IPFS
const ipfsClient = require('ipfs-http-client')
const ipfs = ipfsClient({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' }) // leaving out the arguments will default to these values

class App extends Component {

  async componentWillMount() {
    await this.loadWeb3()
    await this.loadBlockchainData()
  }

  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable()
    }
    else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
    }
    else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!')
    }
  }

  async loadBlockchainData() {
    const web3 = window.web3
    // Load account
    const accounts = await web3.eth.getAccounts()
    this.setState({ account: accounts[0] })
    // Network ID
    const networkId = await web3.eth.net.getId()
    const networkData = ProofOfAction.networks[networkId]
    if(networkData) {
      const proofofaction = new web3.eth.Contract(ProofOfAction.abi, "0x76292f6Ae965Fa2851f0a3288dA0D1ef38Bd211c")
      this.setState({ proofofaction })
      const imagesCount = await proofofaction.methods.imageCount().call()
      this.setState({ imagesCount })
      // Load profile hash
      const profilePicture = await proofofaction.methods.grabProfilePicture(accounts[0]).call()
      this.setState({profilePicture})
      // Load profile bio
      const profileBio = await proofofaction.methods.grabProfileBio(accounts[0]).call()
      console.log(profileBio)
      this.setState({profileBio})
      // Load images
      for (var i = 1; i <= imagesCount; i++) {
        const image = await proofofaction.methods.images(i).call()
        this.setState({
          images: [...this.state.images, image]
        })
      }
      // Sort images. Show highest tipped images first
      this.setState({
        images: this.state.images.sort((a,b) => b.tipAmount - a.tipAmount )
      })
      this.setState({ loading: false})
    } else {
      window.alert('OpenBoard contract not deployed to detected network.')
    }
  }

  captureFile = event => {

    event.preventDefault()
    const file = event.target.files[0]
    const reader = new window.FileReader()
    reader.readAsArrayBuffer(file)

    reader.onloadend = () => {
      this.setState({ buffer: Buffer(reader.result) })
      console.log('buffer', this.state.buffer)
    }
  }

  uploadImage = description => {
    console.log("Submitting file to ipfs...")

    //adding file to the IPFS
    ipfs.add(this.state.buffer, (error, result) => {
      console.log('Ipfs result', result)
      if(error) {
        console.error(error)
        return
      }

      this.setState({ loading: true })
      this.state.proofofaction.methods.uploadImage(result[0].hash, description).send({ from: this.state.account }).on('transactionHash', (hash) => {
        this.setState({ loading: false })
      })
    })
  }

  updateProfile = description => {
    console.log("Submitting file to ipfs...")

    //adding file to the IPFS
    ipfs.add(this.state.buffer, (error, result) => {
      console.log('Ipfs result', result)
      if(error) {
        console.error(error)
        return
      }

      this.setState({ loading: true })
      this.state.proofofaction.methods.updateProfile(result[0].hash, description).send({ from: this.state.account }).on('transactionHash', (hash) => {
        this.setState({ loading: false })
      })
    })
  }

  tipImageOwner(id, tipAmount) {
    this.setState({ loading: true })
    this.state.proofofaction.methods.tipImageOwner(id).send({ from: this.state.account, value: tipAmount }).on('transactionHash', (hash) => {
      this.setState({ loading: false })
    })
  }
  async getProfilePicture(user) {
    const profilePicture = await this.state.proofofaction.methods.grabProfilePicture(user).call()
    console.log(profilePicture)
    this.setState({tempValue: profilePicture})
  }

  constructor(props) {
    super(props)
    this.state = {
      account: '',
      tempValue: '',
      proofofaction: null,
      images: [],
      loading: true,
      profilePicture: '',
      profileBio: '',
      headerLinks: [
        { title: 'Main', path: '/'},
        { title: 'About Me', path: '/about'},
        { title: 'Portfolio', path: '/portfolio'},
        { title: 'Contact Me', path: '/contact'}
      ],
      main: {
        title: 'OpenBoard',
        subTitle: 'A fully decentralized alternative social media application',
        text: 'Check out our most popular posts below or submit your own!'
      },
      post: {
        title: 'New Post',
        subTitle: '',
        text: 'Upload any picture format with a brief description to have it uploaded to IPFS and shared to the world, you will also receive 1 $OBT, the social currency of the platform'
      },
      profile: {
        title: '',
        subTitle: 'Your Profile',
        text: 'Upload any picture format with a brief description to have it uploaded to IPFS and shared to the world'
      }
    }

    this.updateProfile = this.updateProfile.bind(this)
    this.uploadImage = this.uploadImage.bind(this)
    this.tipImageOwner = this.tipImageOwner.bind(this)
    this.captureFile = this.captureFile.bind(this)
    this.getProfilePicture = this.getProfilePicture.bind(this)
  }

  render() {
    return (
<div>        
        <Navbar account={this.state.account} profilePicture={this.state.profilePicture}/>
        { this.state.loading
          ? <div id="loader" className="text-center mt-5"><p>Loading...</p></div>
          : <Router>
            <Switch>
            <Route path="/" exact render={() => <Main
              getProfilePicture={this.getProfilePicture}
              tempValue={this.tempValue}
              images={this.state.images}
              tipImageOwner={this.tipImageOwner}
              title={this.state.main.title} 
              subTitle={this.state.main.subTitle} 
              text={this.state.main.text}
            />}/>
            <Route path="/post" exact render={() => <Post
              captureFile={this.captureFile}
              uploadImage={this.uploadImage}
              title={this.state.post.title} 
              subTitle={this.state.post.subTitle} 
              text={this.state.post.text}
            />}/>
            <Route path="/profile" exact render={() => <Profile
              profilePicture={this.state.profilePicture}
              account ={this.state.account}
              images={this.state.images}
              captureFile={this.captureFile}
              updateProfile={this.updateProfile}
              title={this.state.profile.title} 
              subTitle={this.state.profile.subTitle} 
              text={this.state.profileBio}
            />}/>
            </Switch>
            </Router>
        }
        
      </div>
    );
  }
}

export default App;