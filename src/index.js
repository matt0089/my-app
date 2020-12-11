import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
// import App from './App';
import reportWebVitals from './reportWebVitals';

// NOTES
//
// Was inspired by convention of vscode tabs for drag drop
// insert above when hovering over element.  Can do two drags if want
//   to insert at the end

// (arrayof Tab) -> (arrayof (arrayof Tab))
// Groups tabs into corresponding windows they are members of

window.tabsMoved = [];

function groupTabs(a) {
  let ret = {};
  a.forEach((val) => {
    if (!ret.hasOwnProperty(val.windowId)) {
      ret[val.windowId] = [];
    }
    ret[val.windowId].push(val);
  });
  return ret;
}

const channel = new BroadcastChannel("my-channel");

channel.addEventListener("message", e => {
  window.data = groupTabs(e.data);
  console.log(e.data);
  ReactDOM.render(
    <App data={window.data}/>,
    document.getElementById('root')
  );
});

// https://www.digitalocean.com/community/tutorials/js-drag-and-drop-vanilla-js
function onDragStart(event) {
  //console.log("onDragStart, data sent, e.target.id == ", event.target.id);
  event
  .dataTransfer
  .setData('text/plain', event.target.id);

}

//let fillerDiv = document.createElement('div');
//fillerDiv.classList.add('fillerEntry');

function onDragOver(event) {
  event.preventDefault();
}

function onDragEnter(e) {
  e
  .currentTarget
  .classList
  .add("todropon");

  //const elt = e.currentTarget;
  //elt.insertAdjacentElement('beforebegin', fillerDiv);
}

function onDragLeave(e) {
  e
  .currentTarget
  .classList
  .remove("todropon");

  //const elt = document.querySelector('.fillerDiv');
  //elt.parentElement.removeChild(elt);
}

// HTMLElement -> Integer | Null (if unsuccessful)
function calcWindowIndex(elt) {
  let idx=null;
  const c = elt.parentElement.children;
  for (let i=1; i < c.length; ++i) {
    if (c[i].id === elt.id) {
      idx = parseInt(i-1);
    }
  }
  if (idx == null) {
    console.log("ERROR: didn't find tab in it's supposed assigned window")
  }
  return idx+1; // inserted below => index is 1 + index of entry above
}

function onDrop(event) {
  const id = event
  .dataTransfer
  .getData('text');
  //console.log("Data received: ", id);

  const draggableElement = document.getElementById(id);
  //console.log("draggableElement == ", draggableElement);

  draggableElement
  .classList
  .add('moved');
  
  const dropzone = event.currentTarget;
  dropzone.insertAdjacentElement("afterend", draggableElement);
  
  
  event
  .dataTransfer
  .clearData();

  event
  .currentTarget
  .classList
  .remove("todropon");

  // index becomes a string inside the object initializer, I don't know why

  window.tabsMoved.push({
    tabId: draggableElement.id,
    moveProperties: {
      index: parseInt(calcWindowIndex(dropzone)),
      windowId: parseInt(draggableElement.parentElement.dataset.windowid)
    }
  });
}

function Tablist(props) {

  const content = props.data.map((tab) =>
    <div key={tab.id} className="entry" draggable="true"
    onDragStart={onDragStart} onDrop={onDrop} onDragOver={onDragOver}
    onDragEnter={onDragEnter} onDragLeave={onDragLeave} id={tab.id}>
      <div className="left"><img src={tab.favIconUrl} alt="" /></div>
      <div className="right">{tab.title.slice(0,55)}</div>
    </div>
  );
  return (
    <div className="tabsBox" data-windowid={String(props.data[0].windowId)}>
      <h3>{String(props.data[0].windowId)}</h3>
      {content}
    </div>
  );
}

/* function Groups(props) {
  return (
    <div className="groupsBox">
      {"Empty for now"}
    </div>
  );
} */

function applyChanges() {
  channel.postMessage(window.tabsMoved);

  document.querySelectorAll('.moved').forEach((e) => {
    e.classList.remove('moved');
  });
}

function onKeyDown(e) {
  if (e.key === "Enter") {
    applyChanges();
  }
}

document.addEventListener('keydown', onKeyDown);


function App(props) {
  let tabgroups = [];
  Object.keys(window.data).forEach((k) => {
    tabgroups.push(<Tablist key={k} data={props.data[k]}/>);
  }); 

  return (
    <div className="app">
      {tabgroups}
    </div>
  )
}




// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

// <p>{chrome.tabs.query({},(a) => toString(a[0]))}</p>
