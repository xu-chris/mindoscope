
/*----------  Options to set (or to calculate)  ----------*/

var margin = 10,
    circlePadding = 3,
    diameter = getDiameter(),
      // The diameter is the minimum available screen size for the graphics.
    container   = 'content',           // The container which holds the graphics 
    $sidebar    = d3.select('#sidebar'),           // The sidebar for additional content or interactions
    $menubutton = d3.select('#menubutton'),        // The menubutton to show the sidebar
    $overviewButton = d3.select('#toRoot') // The button to show the overview
    dataFile    = file,  // The file with everything
    width       = document.getElementById(container).offsetWidth,
    height      = document.getElementById(container).offsetHeight,
    title       = "Mindmap",
    maxNodeSize = 10000 // The standard size of a node. Will be used to calc the node size
;


/*----------  The Color  ----------*/

var color = d3.scale.category20();
var colorgrey = d3.scale.linear()
  .domain([0, 6])
  .range(["#FCFCFC", "#929292"])
  .interpolate(d3.interpolateRgb);


/*----------  State identifying variables  ----------*/
var isSidebarOpen = false;


/*----------  Specifying the packing algorithm  ----------*/

var pack = d3.layout.pack()
  .padding(circlePadding) // set the node padding
  .size([diameter - margin, diameter - margin]) // set the visual size
  .value(function(d) { 
    //return d.size; 
    return maxNodeSize * Math.pow(1/d.depth,3);
  });

/*----------  Building the Environment  ----------*/

var svg = d3.select("#"+container).append("svg")
  .append("g");

var tip = d3.tip()
  .attr('class', 'd3-tip')
  .offset([-10, 0])
  .html(function(d) {
    return d.name;
  })

/* Invoke the tip in the context of your visualization */
svg.call(tip);

/*=============================================
=            CALCULATION FUNCTIONS            =
=============================================*/

/*----------  Calculates the diameter  ----------*/

function getDiameter() {
  return (window.innerWidth > window.innerHeight ? window.innerHeight : window.innerWidth);
}

/*-----------------------------  One child node handler functions  ----------------------------------*/
/* Found on:                                                                                         */
/* http://stackoverflow.com/questions/22307486/d3-js-packed-circle-layout-how-to-adjust-child-radius */

function addPlaceholders( node ) {

  if(node.children) {

    for( var i = 0; i < node.children.length; i++ ) {

      var child = node.children[i];
      addPlaceholders( child );
    }

    if(node.children.length === 1) {

      node.children.push({ name:'placeholder', children: [ { name:'placeholder', children:[] }] });
    }
  }
};

function removePlaceholders( nodes ) {

  for( var i = nodes.length - 1; i >= 0; i-- ) {

    var node = nodes[i];

    if( node.name === 'placeholder' ) {

      nodes.splice(i,1);
    } else {

      if( node.children ) {

        removePlaceholders( node.children );
      }
    }
  }
};

function centerNodes( nodes ) {

  for( var i = 0; i < nodes.length; i ++ ) {

    var node = nodes[i];

    if( node.children ) {

      if( node.children.length === 1) {

        var offset = node.x - node.children[0].x;
        node.children[0].x += offset;
        reposition(node.children[0],offset);
      }
    }
  }

  function reposition( node, offset ) {

    if(node.children) {
      for( var i = 0; i < node.children.length; i++ ) {

        node.children[i].x += offset;
        reposition( node.children[i], offset );
      }
    }
  };
};

function makePositionsRelativeToZero( nodes ) {

  //use this to have vis centered at 0,0,0 (easier for positioning)
  var offsetX = nodes[0].x;
  var offsetY = nodes[0].y;

  for( var i = 0; i < nodes.length; i ++ ) {

    var node = nodes[i];

    node.x -= offsetX;
    node.y -= offsetY;
  }
};

function type(d) {
  d.value = +d.value;
  return d;
}


/*======================================================================================
=                                                                                      =
=            Function call to get and structure the data from the JSON-file            =
=                                                                                      =
= TODO:                                                                                =
= - Changing to XML format                                                             =
= - Reading MM-specific content and structuring it                                     =
=                                                                                      =
======================================================================================*/
d3.json(dataFile, function(error, root) {

  // Adding placeholders if a node has just one child
  // This extends the radius of the parent node 
  addPlaceholders(root);

  // Kill the process when there's no file or if the structure is unreadable
  if (error) throw error;
  // dynamic variables to calculate the visualization
  var focus   = root, // The middle of everything
      nodes   = pack.nodes(root), // Packing every node into a circle packing layout
      view;

  // Removing the placeholders
  removePlaceholders(nodes);
  // Centering the one child nodes
  centerNodes( nodes );
  // Repositioning the nodes
  makePositionsRelativeToZero( nodes );

  // DEV: show the root in the console
  console.log(root);

  /*===========================================
  =            BUILDING THE VISUAL            =
  ===========================================*/

  /*----------  Building the circle of the nodes  ----------*/
  var nodeTree = 0;
  var circle = svg.selectAll("circle")
    .data(nodes) // getting the data for every node
      .enter() // this is the D3 foreach loop
        .append("circle") // building the circle for each data node
          .attr("class", function(d) {
            // set class to node and to leaf (for endpoints) or to root (for stem)
            output = 'node'+(d.parent ? d.children ? '' : ' leaf' : ' root');

            // set class to even or to odd, based on its level;
            output += ((d.depth % 2) === 0 ? ' even' : ' odd');

            return output; 
          })
          // .style("fill", function(d) { 
          //   return d.children ? color(d.depth) : null; 
          // })
          .attr("r", function(d) { return d.r+ 7; })
          .style("fill", function(d) {

            // Setting the color based on the hierarchy
            if (d.depth == 1) nodeTree++;

            if (d.children) {
              if ((d.depth % 2) != 0) return color(nodeTree);
              else return "rgba(255,255,255,0.35)";
            }
            else return null;
          })
          .on("click", function(d) { 
            $sidebar.classed("show", false);
            if (focus !== d) zoom(d), d3.event.stopPropagation(); 
          })
          .on('mouseover', function(d) {
            tip.attr('class', 'd3-tip animate').show(d)
          })
          .on('mouseout', function(d) {
            tip.attr('class', 'd3-tip').show(d)
            tip.hide()
          })


  /*----------  Building the labels to the nodes  ----------*/
  
  var text = svg.selectAll("text")
    .data(nodes)
      .enter() // this is the D3 foreach loop
        .append("text")
          .attr("class", "label")
          // .style("fill-opacity", function(d) { return d.parent === root ? 1 : 0; })
          // .style("display", function(d) { return d.parent === root ? null : "none"; })
          .style("fill-opacity", function(d) { return d.parent === root ? 1 : 0; })
          .style("display", function(d) { return d.parent === root ? null : 'none'; })
          .text(function(d) { 
            if (d.depth === 0) {
              console.log('found root name: '+d.name);
              title = d.name
            };
            return d.name; 
          });


  var nodeTree = 0;
  var nodelist = d3.select('#nodelist').selectAll("div")
    .data(nodes)
      .enter()
        .append('div')
            .text(function(d) {
              return d.name; 
            })
        .attr("class", function(d) {
          // set class to node and to leaf (for endpoints) or to root (for stem)
          output = 'listitem'+(d.parent ? d.children ? '' : ' leaf' : ' root');

          // set class to even or to odd, based on its level;
          output += ((d.depth % 2) === 0 ? ' even' : ' odd');

          return output; 
        })
        .style("background-color", function(d) { 
          return d.children ? colorgrey(d.depth) : "#f2f2f2"; 
        })
        .on('click', function(d) {
          if (d.children) {
            if (focus !== d) 
              zoom(d), d3.event.stopPropagation();
          }
          else {
            if (focus !== d.parent) 
              zoom(d.parent), d3.event.stopPropagation();
          }
        })
        .on('mouseover', function(d,i) {
          circle
            .filter(function(d2,i2) {
              return i == i2;
            })
            .classed("highlight", true);
        })
        .on('mouseout', function(d,i) {
          circle
            .filter(function(d2,i2) {
              return i == i2;
            })
            .classed("highlight", false);
        });
        

  /*===================================================
  =            ARRANGEMENT AND INITIAL VIZ            =
  ===================================================*/

  // Register the nodes
  var node = svg.selectAll("circle,text");
  
  // Set initial zoom to root
  zoomTo([root.x, root.y, root.r * 2 + margin]);

  // d3.select('#'+container+' svg g')
  //   .append("text")
  //   .attr("class", "title")
  //   .attr('transform', 'translate(0,-'+height/2+')')
  //   .text(title);
  
  setSize();

  /*===========================================
  =            INTERACTION ACTIONS            =
  ===========================================*/

  /*----------  Interactions  ----------*/
  
  // Zoom out when user clicks on container
  d3.select('#'+container)
    // .style("background", color(-1))
    .on("click", function() { 
      zoom(root); 
    });

  // Zoom back to the overview
  $overviewButton
    .on("click", function() { 
      zoom(root); 
    });

  // Open the sidebar
  $menubutton
    .on("click", function() { 
      toggleSidebar()
    });

  // Keyboard controls
  d3.select("body").on("keydown", function () { 
    // f key opens the sidebar and focuses the search input field
    if (!isSidebarOpen && d3.event.keyCode == 70) {
      d3.event.preventDefault();
      openSearch();
    }
    // Escape key
    else if (d3.event.keyCode == 27) {
      toggleSidebar();
    }
  });

  d3.select("#search").on("input", function () {
    var searchterm = this.value;

    zoom(root);

    nodelist
      .classed("hide", true)
      .filter(function(d,i) {
        var name = d.name;
        return (name.toLowerCase().indexOf(searchterm.toLowerCase()) > -1);
      })
      .classed("hide", false);

    circle
      .classed("hide", true)
      .filter(function(d,i) {
        var name = d.name;
        return (name.toLowerCase().indexOf(searchterm.toLowerCase()) > -1);
      })
      .classed("hide", false);
    text
      .classed("hide", true)
      .filter(function(d,i) {
        var name = d.name;
        return (name.toLowerCase().indexOf(searchterm.toLowerCase()) > -1);
      })
      .classed("hide", false);

  })

  // Resizing the window
  d3.select(window).on('resize', setSize);


  /*----------  Actions  ----------*/
  
  function zoom(d) {
    var focus0 = focus; focus = d;

    if (d === root) {
      $overviewButton.attr('disabled', 'true');
    }
    else {
      $overviewButton.attr('disabled', null);
    }

    var transition = d3.transition()
      .duration(d3.event.altKey ? 7500 : 750)
      .tween("zoom", function(d) {
        var i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2 + margin]);
        return function(t) { zoomTo(i(t)); };
      });

    transition.selectAll("text")
      .filter(function(d) { 
        return d.parent === focus || this.style.display === "inline"; 
      })
      .style("fill-opacity", function(d) { 
        return d.parent === focus ? 1 : 0; 
      })
      .each("start", function(d) { 
        if (d.parent === focus) this.style.display = "inline"; 
      })
      .each("end", function(d) { 
        if (d.parent !== focus) this.style.display = "none"; 
      });
  }

  function zoomTo(v) {
    nodelist
      .classed("active", false)
      .filter(function(d2,i2) {
        return focus == d2;
      })
      .classed("active", true);

    circle
      .classed("active", false)
      .filter(function(d2,i2) {
        return focus == d2;
      })
      .classed("active", true);

    var k = diameter / v[2]; view = v;
    node.attr("transform", function(d) { return "translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")"; });
    circle.attr("r", function(d) { return d.r * k; });
  }

  function setSize() {
    // update variables
    width  = document.getElementById(container).offsetWidth;
    height = document.getElementById(container).offsetHeight;
    diameter = getDiameter();

    // reset the sizes
    d3.select('#'+container+' svg')
      .style('width',width)
      .style('height',height);

    d3.select(self.frameElement)
      .style("height", diameter + "px");

    d3.select('#'+container)
      .select('svg')
        .select('g')
          .attr('transform', 'translate('+(width/2)+','+(height/2)+')'); // centering

  }

  function toggleSidebar() {
    $sidebar.classed("show", !$sidebar.classed("show"));
    if (isSidebarOpen == false) {
      isSidebarOpen = true;
    }
    else {
      isSidebarOpen = false;
      d3.select('#search').node().blur();
    }
  }

  function openSearch() {
    toggleSidebar();
    setTimeout(function(){
      d3.select('#search').node().focus();
    }, 300);
  }
});