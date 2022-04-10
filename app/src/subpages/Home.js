import * as React from "react";

class Home extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        return <h1>Home page: {this.props.getState().page}</h1>;
    }

}

export default Home;
