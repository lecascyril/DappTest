import React, { Component } from "react";
import './App.css';
import getWeb3 from "./getWeb3";
import Voting from "./contracts/Voting.json";
import Addresse from "./Address.js";
import Proposals from "./Proposals.js";


class User extends Component {  
    state = { web3: null, accounts: null, contract: null, step: 0, isV: false, isA: false, proposals: null, voters: null, winningDesc:null, winningID: null, winningCount: null};

    componentDidMount = async () => {
      try {
        const web3 = await getWeb3();
        const accounts = await web3.eth.getAccounts();
        const networkId = await web3.eth.net.getId();
        const deployedNetwork = Voting.networks[networkId];
        const instance = new web3.eth.Contract(
          Voting.abi,
          deployedNetwork && deployedNetwork.address,
        );

        let options = {
          fromBlock: 0,
          toBlock: 'latest'
        };
        //check voters registered
        let listAddress = await instance.getPastEvents('VoterRegistered', options);
        let isVoter= false;
        if(listAddress.length!=0){
          for(let i=0; i<listAddress.length; i++){
            if(listAddress[i].returnValues._voterAddress==accounts[0]){
              isVoter=true;
            }
          }
        }
        let adminaddr = await instance.methods.owner().call();
        let isAdmin= false;
        if(adminaddr==accounts[0]){
          isAdmin=true
        }

        // check proposals
        const listproposals = await instance.getPastEvents('ProposalRegistered', options);
        let proposals=[];
        for(let j=0; j<listproposals.length; j++){
          proposals.push(await instance.methods.getOneProposal(listproposals[j].returnValues._proposalId).call());
        }
        
        let stepA = await instance.methods.workflowStatus().call();

        // check wining ids
        const winningID= await instance.methods.winningProposalID().call();
        let winningDesc="pas de gagnant pour le moment";
        let winningCount= "0"
        if(stepA>3){
          const winningProposal= await instance.methods.getOneProposal(winningID).call();
          winningDesc= winningProposal.description;
          winningCount= winningProposal.voteCount;
        }


        this.setState({ web3, accounts, contract: instance, step: stepA, isV: isVoter, isA:isAdmin, proposals, winningDesc, winningID, winningCount});
      } catch (error) {
        alert( `Non-Ethereum browser detected. Can you please try to install MetaMask before starting.`, );
        console.error(error);
      }
    };



    registerVoter = async() => {
        const { accounts, contract } = this.state;
        const address = document.getElementById("address").value;
        await contract.methods.addVoter(address).send({from: accounts[0]});
    }

    propose = async() => {
        const { accounts, contract} = this.state;
        let prop= document.getElementById("propal").value;
        await contract.methods.addProposal(prop).send({from: accounts[0]});
    }

    vote = async() => {
        const { accounts, contract} = this.state;
        let voted = document.getElementById("votedId").value; 
        await contract.methods.setVote(voted).send({from: accounts[0]});
    }

    checkVoter = async() => {
        const { contract, accounts } = this.state;
        const address = document.getElementById("checkAddress").value;
        let voter = await contract.methods.getVoter(address).call({from:accounts[0]});
        let whichVote = voter.votedProposalId;

        document.getElementById("whichVote").innerHTML=whichVote;
    }

    nextStep = async() => {
        const { contract,accounts } = this.state;

        let step=this.state.step;
        if (step==0){
            await contract.methods.startProposalsRegistering().send({from: accounts[0]});
        }
        else if (step==1){
            await contract.methods.endProposalsRegistering().send({from: accounts[0]});
        }
        else if (step==2){
            await contract.methods.startVotingSession().send({from: accounts[0]});
        }
        else if (step==3){
            await contract.methods.endVotingSession().send({from: accounts[0]});
        }
        else if (step==4){
            await contract.methods.tallyVotes().send({from: accounts[0]});
        }
        step ++;
        this.setState({ step: step});
    }


    render(){

        if (!this.state.web3) {
            return <div>Loading Web3, accounts, and contract...</div>;
          } 
        if (this.state.isA==false && this.state.isV==false){
            return (
                <div>Vas t'en!</div>
            )
        }

        if( this.state.step == 0 ){
            if(this.state.isA==true){
                return(      
                    <div className="user">
                                <Addresse addr={this.state.accounts} />
                        <h1>Bonjour l'admin.</h1><p>La session de vote en est actuellement à l'étape {this.state.step}</p>
                        <h2>A cette étape, vous pouvez ajouter des adresses à whitelister: </h2>
                        <input type="text" id="address"  />
                        <button onClick={this.registerVoter} > Envoyer </button>
                        <br />
                        <h2>Vous pouvez mettre fin à cette étape et passer à la suivante en cliquant</h2>
                        <button onClick={this.nextStep} >Etape suivante</button>
                    </div>
                )
            }
            else{
                return(      
                    <div className="user">
                        <Addresse addr={this.state.accounts} />
                        <h1>Bonjour le voteur.</h1><p>La session de vote en est actuellement à l'étape {this.state.step}</p>
                        <h2>A cette étape, vous devez attendre que l'administrateur lance l'étape des propositions (ou vous rajoute a la whitelist, si ce n'est deja fait)</h2>
                    </div>
                )
            }
           
        }


        else if ( this.state.step == 1){
            if(this.state.isA==true){
                return(      
                    <div className="user">
                        <Addresse addr={this.state.accounts} />
                        <h1>Bonjour l'admin.</h1><p>La session de vote en est actuellement à l'étape {this.state.step}</p>
                        <br />
                        <h2>Vous pouvez mettre fin à cette étape et passer à la suivante en cliquant</h2>
                        <button onClick={this.nextStep} >Etape suivante</button>
                    </div>
                )
            }
            else{
                return(      
                    <div className="user">
                        <Addresse addr={this.state.accounts} />
                        <h1>Bonjour le voteur.</h1><p>La session de vote en est actuellement à l'étape {this.state.step}</p>
                        <h2>A cette étape, vous pouvez proposer des idées sur lesquelles voter ici:</h2>
                        <input type="text" id="propal" />
                        <button onClick={this.propose} >Check</button>              
                    </div>
                )
            }
        }


        else if ( this.state.step == 2){
            if(this.state.isA==true){
                return(      
                    <div className="user">
                        <Addresse addr={this.state.accounts} />
                        <h1>Bonjour l'admin.</h1><p>La session de vote en est actuellement à l'étape {this.state.step}</p>
                        <br />
                        <h2>Vous pouvez mettre fin à cette étape et passer à la suivante en cliquant</h2>
                        <button onClick={this.nextStep} >Etape suivante</button>
                        <Proposals propo={this.state.proposals} />

                    </div>
                )
            }
            else{
                return(      
                    <div className="user">
                        <Addresse addr={this.state.accounts} />
                        <h2>A cette étape, vous devez attendre que l'administrateur lance l'étape des votes</h2>
                        <p>En attendant, voici l'ensemble des propositions qui ont été soumises au prochain vote: </p>
                        <Proposals propo={this.state.proposals} />
                    </div>
                )   
            }     
        }

        else if ( this.state.step == 3){
            if(this.state.isA==true){
                return(      
                    <div className="user">
                        <Addresse addr={this.state.accounts} />
                        <h1>Bonjour Monsieur l'admin.</h1><p>La session de vote en est actuellement à l'étape {this.state.step}</p>
                        <br />
                        <h2>Vous pouvez mettre fin à cette étape et passer à la suivante en cliquant</h2>
                        <button onClick={this.nextStep} >Etape suivante</button>
                        <Proposals propo={this.state.proposals} />

                    </div>
                )
            }
            else{
                return(      
                    <div className="user">
                        <Addresse addr={this.state.accounts} />
                        <h1>Bonjour Monsieur le voteur.</h1><p>La session de vote en est actuellement à l'étape {this.state.step}</p>
                        <h2>A cette étape, vous pouvez voter pour la meilleure idée. Vous pourrez changer votre vote jusqu'à la fin de cette étape.</h2>
                        <input type="text" id="votedId" />
                        <button onClick={this.vote} >Voter</button>       
                        <Proposals propo={this.state.proposals} />
                      </div>
                )
            }
        }

        else if ( this.state.step == 4){
            if(this.state.isA==true){
                return(      
                    <div className="user">
                        <Addresse addr={this.state.accounts} />
                        <h1>Bonjour l'admin.</h1><p>La session de vote en est actuellement à l'étape {this.state.step}</p>
                        <br />
                        <h2>Vous pouvez mettre fin à cette étape et passer à la suivante en cliquant</h2>
                        <button onClick={this.nextStep} >Etape suivante</button>
                        <Proposals propo={this.state.proposals} />
                    </div>
                )
            }
            else{
                return(      
                    <div className="user">
                        <Addresse addr={this.state.accounts} />
                        <h1>Bonjour le voteur.</h1><p>La session de vote en est actuellement à l'étape {this.state.step}</p>
                        <h2>A cette étape, les votes sont finis, vous devez attendre le comptage par l'admin.</h2>
                        <p>voici un récapitulatif des propositions et leur nombre de votes, merci</p>
                        <Proposals propo={this.state.proposals} />
                    </div>
                )
            }
        }

        else if ( this.state.step == 5){
            return(      
                <div className="user">
                    <Addresse addr={this.state.accounts} />
                    <h1>Bonjour.</h1><p>La session de vote en est actuellement à l'étape {this.state.step}</p>
                    <h2>Nous avons notre grand gagnant! C'est la proposition {this.state.winningDesc}, de numéro d'id {this.state.winningID} avec {this.state.winningCount} votes. </h2>
                    <p>Si vous voulez voir pour qui a voté un utilisateur, rentrez son adress ici:</p>
                    <input type="text" id="checkAddress" />
                    <button onClick={this.checkVoter} >Check</button>
                    <div id="whichVote"></div>
                    <Proposals propo={this.state.proposals} />
                </div>
            )
        } 
    }
}
export default User;