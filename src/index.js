import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
// import App from './App';
import reportWebVitals from './reportWebVitals';
import {testdata} from './testdata';


// A tab organizer extension for Google Chrome
//
// References:
// https://www.digitalocean.com/community/tutorials/js-drag-and-drop-vanilla-js
// https://codepen.io/androidcss/pen/yOopGp
// css.gg/check-o


//* Toggle Testing

const TESTING = true;
const DATA = JSON.parse(testdata);


//* Global constants and functions

window.tabTable = {};

/** Store table of all tabs, indexed by tab id */
function initializeTabTable(a) {
  console.log(a);
  a.forEach((val) => {
    window.tabTable[val.id] = {title: val.title.slice(0,55), faviconUrl: val.favIconUrl};
  });
}

/** Produce starting tabWindows state for `App` */
function groupTabs(a) {
  let ret = [];
  a.forEach((tab) => {
    let windowArray = ret.find((v) => v.windowId === tab.windowId);
    if (!windowArray) {
      windowArray = {windowId: tab.windowId, indexes: []}
      ret.push(windowArray);
    }
    ret[ret.length - 1].indexes.push(tab.id);
  });
  return ret;
}

//* React Components

class Tab extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      entered: false
    };
    this.onDrop = this.onDrop.bind(this);
    this.onDragStart = this.onDragStart.bind(this);
    this.onDragEnter = this.onDragEnter.bind(this);
    this.onDragLeave = this.onDragLeave.bind(this);
    this.onDragOver = this.onDragOver.bind(this);
  }

  onDrop(e) {
    this.setState({entered: false});
    this.props.onDrop(this.props.tabId, this.props.windowId, e);
  }

  onDragStart(e) {
    this.props.onDragStart(this.props.tabId, this.props.windowId, e);
  }

  onDragEnter(e) {
    this.setState({entered: true});
  }

  onDragLeave(e) {
    this.setState({entered: false});
  }

  onDragOver(e) {
    e.preventDefault();
  }

  render() {
    const faviconUrl = window.tabTable[this.props.tabId].faviconUrl;
    const title = window.tabTable[this.props.tabId].title;
    let classNames = 
      this.state.entered ? "tab todropon" : "tab";
    classNames = 
      this.props.isMoved(this.props.tabId) ? classNames + " moved" : classNames;
    return (
    <div key={this.props.tabId} className={classNames} draggable="true"
    onDragStart={this.onDragStart} onDrop={this.onDrop} onDragOver={this.onDragOver}
    onDragEnter={this.onDragEnter} onDragLeave={this.onDragLeave}>
      <div className="left"><img src={faviconUrl} alt="" /></div>
      <div className="right">{title}</div>
    </div>
    );
  }
}

function TabWindow(props) {
  const content = props.indexes.map((tabId) =>
  <Tab key={tabId} tabId={tabId} windowId={props.windowId}
    onDrop={props.onDrop} onDragStart={props.onDragStart}
    isMoved={props.isMoved}/>
  );
  return (
    <div className="tabsBox">
      <h3>{String(props.windowId)}</h3>
      {content}
    </div>
  );
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tabsMoved: [],
      tabWindows: props.tabWindows,
      draggedTabData: null
    };

    this.handleOnDragStart = this.handleOnDragStart.bind(this);
    this.handleOnDrop = this.handleOnDrop.bind(this);
    this.applyChanges = this.applyChanges.bind(this);
    this.updateTabWindow = this.updateTabWindow.bind(this);
    this.addBelow = this.addBelow.bind(this);
    this.remove = this.remove.bind(this);
    this.findTabIndex = this.findTabIndex.bind(this);
    this.isTabMoved = this.isTabMoved.bind(this);
  }

  handleOnDragStart(tabId, windowId, e) {
    this.setState((state) => {
      return {
        draggedTabData: {tabId: tabId, windowId: windowId}
      };
    });
  }

  handleOnDrop(dropzoneTabId, dropzoneWindowId, e) {
    this.setState((state) => {
      const draggedWid = this.state.draggedTabData.windowId;
      const draggedTid = this.state.draggedTabData.tabId;

      if (draggedTid === dropzoneTabId) {
        return state;
      }
      let newTabWindows = 
        this.updateTabWindow(state.tabWindows, draggedWid, draggedTid,
                             this.remove);
      newTabWindows = 
        this.updateTabWindow(newTabWindows, dropzoneWindowId, dropzoneTabId,
                             this.addBelow, draggedTid);
      const movedToIndex = 
        this.findTabIndex(newTabWindows, dropzoneWindowId, draggedTid);

      const tabsMoved = state.tabsMoved.concat([{
        tabId: draggedTid,
        moveProperties: {
          index: movedToIndex,
          windowId: dropzoneWindowId
        }
      }]);
    if (TESTING) {
      console.log("Dropped.  Will update state to: ");
      console.log({ tabWindows: newTabWindows, tabsMoved: tabsMoved,
        draggedTabData: "empty"});
    }
    return {
        tabWindows: newTabWindows,
        tabsMoved: tabsMoved,
        draggedTabData: "empty"
      };
    }); 
  }

  applyChanges() {
    this.props.channel.postMessage(this.state.tabsMoved);
    this.setState({tabsMoved: []});
  }

  render() {
    let tabwindows = [];
    this.state.tabWindows.forEach((tw) => {
      tabwindows.push(
        <TabWindow key={tw.windowId} windowId={tw.windowId} indexes={tw.indexes} 
          onDrop={this.handleOnDrop} onDragStart={this.handleOnDragStart}
          isMoved={this.isTabMoved}/>
      );
    });

    return (
      <div className="app">
        {tabwindows}
        <Check tabsMoved={this.state.tabsMoved} onClick={this.applyChanges}/>
      </div>
    );
  }

  //* Helper functions

  /** Find the tab associated with (tabId, windowId) in tabWindows
   *  and update with callback `fn`
   * @param {TabWindows}     tabWindows
   * @param {number}         windowId
   * @param {number}         tabId
   * @param {ModifyTabState} fn
   * @param {...*}           rest
   * @returns {TabWindows}
   */
  updateTabWindow(tabWindows, windowId, tabId, fn, ...rest) {
    return tabWindows.map(w => {
      if (w.windowId === windowId) {
        const idx = w.indexes.findIndex(tid => tid === tabId);
        if (idx === -1) {
          console.log("ERROR {updateTabWindow()}: No TabId found in supposed window");
        }
        const newIndexes = fn(w.indexes, idx, ...rest);
        return {windowId: w.windowId, indexes: newIndexes};
      } else {
        return w;
      }
    });
  }
  /** Modify a window tablist given the tablist and location of tab in array
   * @callback ModifyTabState
   * @param {number[]} indexes - TabIds within the selected window
   * @param {number}   idx     - Index of selected tab in {@link indexes}
   * @param {...*}     rest    - Additional params passed from {@link updateTabWindow}
   * @returns {number[]} - new modified {@link indexes}
   */

  /** @type {ModifyTabState} */
  addBelow(indexes, idx, newTabId) {
    return indexes.slice(0, idx+1)
            .concat([newTabId], indexes.slice(idx+1, indexes.length));
  }

  /** @type {ModifyTabState} */
  remove(indexes, idx) {
    return indexes.slice(0, idx)
            .concat(indexes.slice(idx+1, indexes.length));
  }

  findTabIndex(tabWindows, windowId, tabId) {
    return (
      tabWindows
      .find(w => w.windowId === windowId)
      .indexes
      .findIndex(tid => tid === tabId)
    )
  }

  isTabMoved(tabId) {
    const idx = this.state.tabsMoved.findIndex(elt => elt.tabId === tabId);
    return (idx !== -1);
  }
}

function Check(props) {
  return <i className="gg-check-o float" onClick={props.onClick}></i>;
}


//* Main execution
if (TESTING) {
  const dummyChannel = {
    postMessage: function (tabsMoved) {
      alert("Changes applied");
    }
  };

  initializeTabTable(DATA)
  window.myapp = <App tabWindows={groupTabs(DATA)} channel={dummyChannel}/>
  ReactDOM.render(
    window.myapp,
    document.getElementById('root')
  );
} else {
  const channel = new BroadcastChannel("my-channel");
  channel.addEventListener("message", e => {
    initializeTabTable(e.data);
    ReactDOM.render(
      <App tabWindows={groupTabs(e.data)} channel={channel}/>,
      document.getElementById('root')
    );
  });
  channel.postMessage("Ready");

}




// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

