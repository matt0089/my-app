import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
// import App from './App';
import reportWebVitals from './reportWebVitals';
import {testdata} from './testdata';

const TESTING = true;
const DATA = JSON.parse(testdata);

// NOTES
//
// Was inspired by convention of vscode tabs for drag drop
// insert above when hovering over element.  Can do two drags if want
//   to insert at the end

// (arrayof Tab) -> (arrayof (arrayof Tab))
// Groups tabs into corresponding windows they are members of


/*
Data design:

tabWindow:



*/


window.tabTable = {};


function initializeTabTable(a) {
  console.log(a);
  a.forEach((val) => {
    window.tabTable[val.id] = {title: val.title.slice(0,55), faviconUrl: val.favIconUrl};
  });
}

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




/* channel.addEventListener("message", e => {
  window.data = groupTabs(e.data);
  console.log(e.data);
  ReactDOM.render(
    <App data={window.data}/>,
    document.getElementById('root')
  );
}); */

// https://www.digitalocean.com/community/tutorials/js-drag-and-drop-vanilla-js


/* 
function applyChanges() {
  channel.postMessage(window.tabsMoved);

  document.querySelectorAll('.moved').forEach((e) => {
    e.classList.remove('moved');
  });
} */

/* function onKeyDown(e) {
  if (e.key === "Enter") {
    applyChanges();
  }
} */

// document.addEventListener('keydown', onKeyDown);

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
      this.state.entered ? "entry todropon" : "entry";
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
      tabWindows: props.data,
      draggedTabData: null
    };

    this.updateTabWindow = this.updateTabWindow.bind(this);
    this.addBelow = this.addBelow.bind(this);
    this.remove = this.remove.bind(this);
    this.findTabIndex = this.findTabIndex.bind(this);
    this.isTabMoved = this.isTabMoved.bind(this);
    this.handleOnDragStart = this.handleOnDragStart.bind(this);
    this.handleOnDrop = this.handleOnDrop.bind(this);

    
  }

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

  // updateTabWindow helper
  addBelow(indexes, idx, newTabId) {
    return indexes.slice(0, idx+1)
            .concat([newTabId], indexes.slice(idx+1, indexes.length));
  }

  // updateTabWindow helper
  remove(indexes, idx) {
    return indexes.slice(0, idx)
            .concat(indexes.slice(idx+1, indexes.length));
  }

  handleOnDragStart(tabId, windowId, e) {
    this.setState((state) => {
      return {
        draggedTabData: {tabId: tabId, windowId: windowId}
      };
    });
  }

  findTabIndex(tabWindows, windowId, tabId) {
    return (
      tabWindows
      .find(w => w.windowId === windowId)
      .indexes
      .findIndex(tid => tid === tabId)
    )
  }

  handleOnDrop(tabId, windowId, e) {

    this.setState((state) => {
      const draggedWid = this.state.draggedTabData.windowId;
      const draggedTid = this.state.draggedTabData.tabId;
      let ret = 
        this.updateTabWindow(state.tabWindows, draggedWid, draggedTid, this.remove);
      ret = 
        this.updateTabWindow(ret, windowId, tabId, this.addBelow, draggedTid);
      
      const movedToIndex = 
        this.findTabIndex(this.state.tabWindows, windowId, tabId);

      const tabsMoved = state.tabsMoved.concat([{
        tabId: draggedTid,
        moveProperties: {
          index: movedToIndex,
          windowId: windowId
        }
      }]);

      console.log("Dropped.  Will update state to: ");
      console.log({
        tabWindows: ret,
        tabsMoved: tabsMoved,
        draggedTabData: "empty"
      });
    
    return {
        tabWindows: ret,
        tabsMoved: tabsMoved,
        draggedTabData: "empty"
      };
    }); 
  }

  isTabMoved(tabId) {
    const idx = this.state.tabsMoved.findIndex(elt => elt.tabId === tabId);
    return (idx !== -1);
  }

  render() {
    let tabgroups = [];
    this.state.tabWindows.forEach((elt) => {
      tabgroups.push(
        <TabWindow key={elt.windowId} windowId={elt.windowId} indexes={elt.indexes} 
          onDrop={this.handleOnDrop} onDragStart={this.handleOnDragStart}
          isMoved={this.isTabMoved}/>
      );
    });

    return (
      <div className="app">
        {tabgroups}
      </div>
    );
  }
}


if (TESTING) {
  initializeTabTable(DATA)

  window.myapp = <App data={groupTabs(DATA)}/>
  ReactDOM.render(
    window.myapp,
    document.getElementById('root')
);
} else {
  const channel = new BroadcastChannel("my-channel");
  channel.addEventListener("message", e => {
    initializeTabTable(e.data);
    console.log(e.data);
    ReactDOM.render(
      <App data={groupTabs(e.data)}/>,
      document.getElementById('root')
    );
  });
}




// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

// <p>{chrome.tabs.query({},(a) => toString(a[0]))}</p>

