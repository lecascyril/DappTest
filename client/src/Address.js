import React from 'react';
import './Address.css';


export default class Addresse extends React.Component {

    constructor(props) {
        super(props);
    }


    render(){
        return(
            <div className='header'><p>Voici l'adress que vous utilisez: </p>{this.props.addr}</div>
        )
    }

}
