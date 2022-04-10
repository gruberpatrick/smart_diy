import * as React from "react";

import Sidebar from "../components/Sidebar";
import WebsocketHandler from "../components/WebsocketHandler";
import Pages from "../components/Pages"

import 'bootstrap/dist/css/bootstrap.min.css';

// markup
class IndexPage extends React.Component {

  state = {
    connectedClients: [],
    page: "home",
  };

  constructor(props) {
    super(props);
    this.changeState = this.changeState.bind(this);
    this.getState = this.getState.bind(this);
    this.hashChange = this.hashChange.bind(this);
    this.websocket = new WebsocketHandler(this.changeState, this.getState);
  }

  componentDidMount() {
    window.addEventListener("hashchange", this.hashChange, false);
  }

  componentWillUnmount() {
    window.removeEventListener("hashchange", this.hashChange, false);
  }

  hashChange(e) {
    var hash = window.location.hash.substring(1);
    if(hash === "") {
      hash = "home";
    }
    this.setState({page: hash});
  }

  changeState(state, callback) {
    this.setState(state, callback);
  }

  getState() {
    return this.state;
  }

  getPage() {
    return React.createElement(
      Pages[this.state.page],
      {
        getState: this.getState,
        changeState: this.changeState,
      },
    );
  }

  render() {
    return <div>
      <Sidebar getState={this.getState} changeState={this.changeState} />
      <div id="content">{this.getPage()}</div>
    </div>;
  }

}

export default IndexPage;
