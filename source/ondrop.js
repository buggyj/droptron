/*\
title: $:/bj/widgets/ondrop.js
type: application/javascript
module-type: widget

List and list item widgets

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

/*
The list widget creates list element sub-widgets that reach back into the list widget for their configuration
*/


var OnDrop = function(parseTreeNode,options) {
	// Main initialisation inherited from widget.js
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
OnDrop.prototype = new Widget();

/*
Render this widget into the DOM
*/
OnDrop.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	var tag = this.parseTreeNode.isBlock ? "div" : "span";
	if(this.dropTag && $tw.config.htmlUnsafeElements.indexOf(this.dropTag) === -1) {
		tag = this.dropTag;
	}
	var domNode = this.document.createElement(tag);
	domNode.className = "tc-dropzone";
	$tw.utils.addEventListeners(domNode,[
		{name: "dragover", handlerObject: this, handlerMethod: "handleDragOverEvent"},	
		{name: "drop", handlerObject: this, handlerMethod: "handleDropEvent"}
		]);
	// Insert element
	parent.insertBefore(domNode,nextSibling);
	this.renderChildren(domNode,null);
	this.domNodes.push(domNode);
};

/*
Compute the internal state of the widget
*/
OnDrop.prototype.execute = function() {
	this.tabletid = this.getAttribute("$tabletid");
	this.catname = this.getAttribute("$catname");
	this.delay = this.getAttribute("$delay")||null;
	// Make child widgets
	this.makeChildWidgets();
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
OnDrop.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	// Completely refresh if any of our attributes have changed
	if(changedAttributes["$tabletid"] || changedAttributes["$catname"] || changedAttributes["$delay"]) {
		this.refreshSelf();
		return true;
	} else {
	return this.refreshChildren(changedTiddlers);
	}
};

OnDrop.prototype.handleDragOverEvent  = function(event) {
	// Tell the browser that we're still interested in the drop
	event.preventDefault();
	//e.stopPropagation();
	//event.dataTransfer.dropEffect = "copy";
};

OnDrop.prototype.handleDropEvent  = function(event) {
	var self = this;
	//cancel normal action
	self.cancelAction(event);
	for (let f of event.dataTransfer.files) {
        if(f.type=="text/html"){
			console.log('The file(s) you dragged: ', f);
			this.filepath = f.path;
			//window.electron.send('ondragstart', f.path)
			this.invokeAction();
        } else alert("not a wiki file");	
	 }
	 self.dispatchEvent({type: "tm-dropHandled", param: null});
	 //else let the event fall thru
};

OnDrop.prototype.cancelAction =function(event) {
	event.preventDefault();
	// Stop the drop ripple up to any parent handlers
	event.stopPropagation();
};

/*
Invoke the action associated with this widget
*/
OnDrop.prototype.invokeAction = function(triggeringWidget,event) {
	var self = this,
		options = {};
	var pagedata = {data:{}};
	$tw.utils.each(this.attributes,function(attribute,name) {
		if(name.charAt(0) !== "$") {
			pagedata.data[name] = attribute;
		}
	});
	pagedata.data.filepath = this.filepath;
	pagedata.data.category=this.catname;
	self.dispatchEvent({type: "tiddlyclip-create", category:this.catname, pagedata: pagedata, currentsection:null, localsection:this.tabletid, delay:this.delay});
	return true; // Action was invoked
};

OnDrop.prototype.invokeMsgAction = function(param) {
	return this.invokeAction(this); 
}
exports.ondrop = OnDrop;
})();

