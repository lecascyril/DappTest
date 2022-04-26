import React from 'react';
import './Proposals.css';


export default class Proposals extends React.Component {

    constructor(props) {
        super(props);
    }


    render(){
        return(
            <div >
                
            <p>Voici les differentes propositions:</p>
            <table>
                <tr><th>Numero de proposition</th><th>La proposition</th><th>Le nombre de voix</th></tr>
            {this.props.propo.map((propi, index) => (
                 <tr><td>{index}</td><td>{propi[0]}</td><td>{propi[1]}</td></tr>
            ))}
            </table>            
            
            </div>
        )
    }

}
