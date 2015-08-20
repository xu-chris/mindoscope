/*----------  Options  ----------*/

var DOMContainer = document.querySelector('#container'),
		rendererOptions = {
			antialias : 			true, 
			resolution : 			window.devicePixelRatio, 
			backgroundColor : 0xffffff,
			transparent : 		false,
			autoResize : 			true
		},
		renderingEngine = PIXI.WebGLRenderer;


/*----------  Pixi.js aliases  ----------*/

var Container = PIXI.Container,
		loader = PIXI.loader,
		Sprite = PIXI.Sprite,
		Graphics = PIXI.Graphics,
		Text = PIXI.Text,
		Circle = PIXI.Circle,
		Ellipse = PIXI.Ellipse,
		Point = PIXI.Point;


/*----------  Dynamic variables  ----------*/

var width  = window.innerWidth,
		height = window.innerHeight,
		stage = new Container(), 
		camera = new Container(), 
		renderer = new renderingEngine(width, height,rendererOptions),
		scale = 1,
		activeElement;
DOMContainer.appendChild(renderer.view);

/* Dev variables */
var pointShape;



/*----------  Automatically Resizing the scene  ----------*/

window.addEventListener('resize', this.resize.bind(this), false);

function resize() {
	console.log('Window has been resized');
	width  = window.innerWidth;
	height = window.innerHeight;

	renderer.resize(width, height);
}

/*====================================================
=            ZUI INTERACTIONS AND ACTIONS            =
====================================================*/

/*----------  Mouse interactions  ----------*/
// Click is handled directly by the nodes

/*----------  Keyboard interactions  ----------*/


/*----------  Actions  ----------*/

function zoom(element) {

	var delta = 0;

	activeElement = element;

	// Calculating the scale
	scale = (width > height ? (height / element.height) : (width / element.width)) - delta;

	// Calculating the absolute element position
	absPosition = getAbsPosition(element);

	// Setting the pivot point (mostly the center of the node), relatively to the size of the window
	camera.pivot.set(0-(width/2/scale)+absPosition.x, 0-(height/2/scale)+absPosition.y);

	// Scale the camera about the calculated scale
	camera.scale.set(scale, scale);

	/*----------  DEV  ----------*/
	setPoint(absPosition.x, absPosition.y);
	console.log("Zoomed with Scale "+scale+" (camera.scale.y="+camera.scale.y+") and Positioning x="+camera.position.x+" and y="+camera.position.y);
	console.log("Pivot positions x="+absPosition.x+" y="+absPosition.y);
	console.log("Point size w="+element.width+" h="+element.height);
	console.log("camera has the size of w="+camera.width+" h="+camera.height);
	console.log("Window has the size of w="+width+" h="+height);
	console.log("---------------finished setting into view-----------");
}


function pan(mouseData) {

	/* moving the content of the stage container */

}

/*=====  End of ZUI interactions and actions  ======*/



/*==============================================
=            NODE DRAWING FUNCTIONS            =
==============================================*/

function makeNode(text, level) {

	// The pieces of an node
	var shape, label;

	// Var of the node itself
	var nodeRadius = 100,
			node = new Container();

	/*----------  Drawing the shape  ----------*/
	
	if (level%2 == 0) {
		var color = 0x468CC8;
	}
	else {
		var color = 0xffffff;
	}
	shape = new Graphics();

	shape.beginFill(color);
	shape.drawCircle(0,0,nodeRadius);
	shape.endFill();


	/*----------  Drawing the label  ----------*/
	
	if (level%2 == 0) {
		var color = 0xffffff;
	}
	else {
		var color = 0x000000;
	}

	label = new Text(text, {font : .05*shape.width+'px Arial', fill : color, align : 'center', wordWrap : true, wordWrapWidth : .75*shape.width});


	/*----------  Set up interactions  ----------*/

	shape.hitArea = new Circle(0,0,nodeRadius);
	shape.interactive = true;

	shape.click = function(mouseData){
		zoom(this);
	}

	/*----------  Building the whole node by putting together all pieces  ----------*/
	node.addChild(shape);
	node.addChild(label);

	/* DEV START */
	first = shape;
	/* DEV END */

	/*----------  Positioning the label  ----------*/
	
	label.x = 0-label.width/2;
	label.y = 0-label.height/2

	/*----------  Finishing  ----------*/
	return node;
}

function makeParentNode(text, level, childNodesArray) {

	// The pieces of an node
	var shape, label,
			childNodes = new Container();

	// Var of the node itself
	var nodeRadius = 50,
			node = new Container();


	/*----------  Calculating the size  ----------*/

	console.log('Parentnode has '+childNodesArray.length + ' childnodes');
	childNodesArray.forEach(function(childNode, index) {
		nodeRadius += childNode.getChildAt(0).width;
		childNodes.addChild(childNode);
		console.log('Childnode '+index+' has w='+childNodesArray.length + ' childnodes');
	});

	nodeRadius = nodeRadius/2 * Math.sqrt(2);


	/*----------  Draw the shape  ----------*/
	
	if (level%2 == 0) {
		var color = 0x468CC8;
	}
	else {
		var color = 0xffffff;
	}
	shape = new Graphics();

	shape.beginFill(color);
	shape.drawCircle(0,0,nodeRadius);
	shape.endFill();

	
	/*----------  Draw the label  ----------*/
	
	if (level%2 == 0) {
		var color = 0xffffff;
	}
	else {
		var color = 0x000000;
	}

	label = new Text(text, {font : .05*shape.width+'px Arial', fill : color, align : 'center', wordWrap : true, wordWrapWidth : .75*shape.width});


	/*----------  Set up interactions  ----------*/
	
	shape.hitArea = new Circle(0,0,nodeRadius);
	shape.interactive = true;
	shape.currentCursorStyle = 'pointer';

	shape.click = function(mouseData){
		zoom(this);
	}


	/*----------  Building the whole node by putting together all pieces  ----------*/
	// First: the shape
	node.addChild(shape);
	// Second: the child nodes with it's node container and shapes
	node.addChild(childNodes);
	// Third: the Label
	node.addChild(label);

	// Positioning the label
	label.x = 0-label.width/2;
	label.y = 0-(nodeRadius/1.5)-label.height/2;

	/*----------  Finishing  ----------*/
	return node;
}

/*=====  End of Node drawing functions  ======*/

/*========================================
=            HELPER FUNCTIONS            =
========================================*/

/*----------  Function for calc the absolute position of an element ----------*/

function getAbsPosition(element) {
	var level = element;
	var absX = level.position.x;

	while(level.parent != null)
	{
		level = level.parent;
		absX += level.position.x;
	}

	var level = element;
	var absY = level.position.y;

	while(level.parent != null)
	{
		level = level.parent;
		absY += level.position.y;
	}

	output = new PIXI.Point(absX, absY);

	return output;
}

/*----------  DEV Function to draw a point on a specific position  ----------*/

function setPoint(x,y) {
	var pointShape = new Graphics();

	pointShape.beginFill(0xff0000);
	pointShape.drawEllipse(0,0,10,10);
	pointShape.endFill();

	pointShape.x = x;
	pointShape.y = y;

	stage.addChild(pointShape);
}



/*=====  End of Helper Functions  ======*/


/*=======================================
=            SETUP THE SCENE            =
=======================================*/

function setup() {

	/*----------  Building nodes  ----------*/
	// Level 2
	var nodeTest = makeNode('This is a test. But well I have to check, if this is long enough',2);
	nodeTest.position.set(30,20);

	// Level 1
	var parentNodeTest = makeParentNode('This is the parent node', 1, [nodeTest]);

	var nodeTest = makeNode('This is a child. But in an other level.',1);

	nodeTest.position.set(-200,-100);
	parentNodeTest.position.set(100,100);

	// Level 0
	var level0 = makeParentNode('This is the Hello World', 0, [parentNodeTest,nodeTest]);

	// Add Level 0 Node
	stage.addChild(level0);

	// Add the stage to the camera
	camera.addChild(stage);

	// Scale and Zoom to the first node
	firstNodeShape = level0;
	zoom(firstNodeShape);
	
	/*----------  DEV  ----------*/
	absPosition = getAbsPosition(first);
	setPoint(absPosition.x, absPosition.y);
	console.log("Zoomed with Scale camera.scale.y="+camera.scale.y+" and Positioning x="+camera.position.x+" and y="+camera.position.y);
	console.log("Point size w="+first.width+" h="+first.height);
	console.log("pivot positions x="+absPosition.x+" y="+absPosition.y);
	console.log("camera has the size of w="+camera.width+" h="+camera.height);
	console.log("Window has the size of w="+width+" h="+height);
	console.log("---------------finished initializing------------------");

	update();
}

function update() {
 
	requestAnimationFrame(update);

	if (camera.scale.x != scale) {
		console.log('Scale does not match')
	}

	// render the stage   
	renderer.render(camera);
}

/*=====  End of setup the scene  ======*/

/*----------  Start building the scene  ----------*/
setup();