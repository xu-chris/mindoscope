/*global d3:false*/

function buildMindmap(hash) {
  'use strict';

  d3.select('#upload').style('display', 'none');
  d3.select('#mindmap').style('display', 'block');
  /*----------  Options to set (or to calculate)  ----------*/

  var margin = 35,
      circlePadding = 1,
      diameter = getDiameter(),
        // The diameter is the minimum available screen size for the graphics.
      container   = 'content',                // The container name which holds the graphics
      $sidebar    = d3.select('#sidebar'),    // The sidebar for additional content or interactions
      $menubutton = d3.select('#menubutton'), // The menubutton to show the sidebar
      $overviewButton = d3.select('#toRoot'), // The button to show the overview
      fileURL     = 'content/'+hash+'.json',
      width       = document.getElementById(container).offsetWidth,
      height      = document.getElementById(container).offsetHeight,
      maxNodeSize = 1000 // The standard size of a node. Will be used to calc the node size
  ;


  /*----------  The Color  ----------*/

  // Color palette by http://tools.medialab.sciences-po.fr/iwanthue/
  // H: 0 - 291
  // C: 1.380 - 2.33
  // L: 0.81 - 1.22
  var color = d3.scale.ordinal()
    .range(
      ["#EF721F",
       "#4E9CEE",
       "#36D63D",
       "#DEC815",
       "#E076E7",
       "#75AE29",
       "#E8A117",
       "#39CD68",
       "#A886F2",
       "#C985D6",
       "#CA8025",
       "#ABA414",
       "#F46841",
       "#A0CB1C",
       "#50AB46",
       "#75CE2F",
       "#8E94E8",
       "#33B22E",
       "#61D350",
       "#E58222"]);

  //var color = d3.scale.category20();
  var colorgrey = d3.scale.linear()
    .domain([0, 6])
    .range(["#FCFCFC", "#C4C4C4"])
    .interpolate(d3.interpolateRgb);


  /*----------  State identifying variables  ----------*/
  var isSidebarOpen = false;
  var isSettingsOpen = false;


  /*----------  Specifying the packing algorithm  ----------*/

  var pack = d3.layout.pack()
    .padding(circlePadding) // set the node padding
    .size([diameter - margin, diameter - margin]) // set the visual size
    .value(function(d) {
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
    });

  /* Invoke the tip in the context of your visualization */
  svg.call(tip);

  /*=============================================
  =            CALCULATION FUNCTIONS            =
  =============================================*/

  /*----------  Calculates the diameter  ----------*/

  function getDiameter() {
    return (window.innerWidth > window.innerHeight ? (window.innerHeight - 50) : window.innerWidth);
  }

  /*-----------------------------  One child node handler functions  ----------------------------------*/
  /* Found on:                                                                                         */
  /* http://stackoverflow.com/questions/22307486/d3-js-packed-circle-layout-how-to-adjust-child-radius */

  function addPlaceholders( node ) {

    if(node.children) {
      for ( var i = 0; i < node.children.length; i++ ) {

        var child = node.children[i];
        addPlaceholders( child );
      }

      if(node.children.length === 1) {

        node.children.push({ name:'placeholder', children: [ { name:'placeholder', children:[] }] });
      }
    }
  }

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
  }

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
    }
  }

  function makePositionsRelativeToZero( nodes ) {

    //use this to have vis centered at 0,0,0 (easier for positioning)
    var offsetX = nodes[0].x;
    var offsetY = nodes[0].y;

    for( var i = 0; i < nodes.length; i ++ ) {

      var node = nodes[i];

      node.x -= offsetX;
      node.y -= offsetY;
    }
  }

  String.prototype.trunc =
    function(n,useWordBoundary){
       var toLong = this.length>n,
           s_ = toLong ? this.substr(0,n-1) : this;
       s_ = useWordBoundary && toLong ? s_.substr(0,s_.lastIndexOf(' ')) : s_;
       return  toLong ? s_ + '…' : s_;
    };


  /*======================================================================================
  =                                                                                      =
  =            Function call to get and structure the data from the JSON-file            =
  =                                                                                      =
  ======================================================================================*/
  d3.json(fileURL, function(error, root) {

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
              var output = 'node'+(d.parent ? d.children ? '' : ' leaf' : ' root');

              // set class to even or to odd, based on its level;
              output += ((d.depth % 2) === 0 ? ' even' : ' odd');

              return output;
            })
            .attr("r", function(d) { return d.r+ 7; })
            .style("fill", function(d) {

              // Setting the color based on the hierarchy
              if (d.depth == 1) nodeTree++;

              if (d.children) {
                if ((d.depth % 2) != 0) {
                  return color(nodeTree);
                }
                else {
                  var tempColor = d3.hsl(color(nodeTree));
                  console.log(tempColor.s);
                  var newColor = d3.hsl('hsl('+tempColor.h+","+(tempColor.s * 100 * 1.09)+"%,"+(tempColor.l * 100 * 1.2)+'%)');
                  console.log(newColor);
                  return newColor;
                  //return "rgba(255,255,255,0.30)";
                }
              }
              else {
                return null;
              }
            })
            .on("click", function(d) {
              d3.select(this).classed('visited',true);
              if (focus !== d) {
                closeSidebar();
                zoom(d), d3.event.stopPropagation();
              }
            })
            .on('mouseover', function(d) {
              tip.attr('class', 'd3-tip animate').show(d);
            })
            .on('mouseout', function(d) {
              tip.attr('class', 'd3-tip').show(d);
              tip.hide();
            });


    /*----------  Building the labels to the nodes  ----------*/

    var text = svg.selectAll("text")
      .data(nodes)
        .enter() // this is the D3 foreach loop
          .append("text")
            .attr("class", "label")
            .style("fill-opacity", function(d) { return d.parent === root ? 1 : 0; })
            .style("display", function(d) { return d.parent === root ? null : 'none'; })
            .text(function(d) {
              return d.name;
            })
            // .html(function(d) {
            //   var name = d.name;
            //   var x = 15;
            //   var output = "";
            //   var split = name.match(/\b[\w']+(?:[^\w\n]+[\w']+){0,2}\b/g);

            //   split.forEach(function (elem) {
            //     output += "<tspan>"+elem+'</tspan>';
            //   });
            //   return output;
            // });

    nodeTree = 0;
    var nodelist = d3.select('#nodelist').selectAll("div")
      .data(nodes)
        .enter()
          .append('div')
              .text(function(d) {
                return d.name;
              })
          .attr("class", function(d) {
            // set class to node and to leaf (for endpoints) or to root (for stem)
            var output = 'listitem'+(d.parent ? d.children ? '' : ' leaf' : ' root');

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
                zoom(d);
                d3.event.stopPropagation();
            }
            else {
              if (focus !== d.parent) {
                zoom(d.parent);
                d3.event.stopPropagation();
              }
            }
          })
          .on('mouseover', function(d,i) {
            circle
              .filter(function(d2,i2) {
                return i == i2;
              })
              .classed("hover", true);
          })
          .on('mouseout', function(d,i) {
            circle
              .filter(function(d2,i2) {
                return i == i2;
              })
              .classed("hover", false);
          });


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
        toggleSidebar();
      })

    d3.select('#openSettings')
      .on("click", function() {
        toggleSettings();
      })

    // Keyboard controls
    d3.select("body").on("keydown", function () {
      // f key opens the sidebar and focuses the search input field
      if (!isSidebarOpen && d3.event.keyCode == 70) {
        d3.event.preventDefault();
        toggleSidebar();
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
        .filter(function(d) {
          var name = d.name;
          return (name.toLowerCase().indexOf(searchterm.toLowerCase()) > -1);
        })
        .classed("hide", false);

      circle
        .classed("hide", true)
        .filter(function(d) {
          var name = d.name;
          return (name.toLowerCase().indexOf(searchterm.toLowerCase()) > -1);
        })
        .classed("hide", false);
      text
        .classed("hide", true)
        .filter(function(d) {
          var name = d.name;
          return (name.toLowerCase().indexOf(searchterm.toLowerCase()) > -1);
        })
        .classed("hide", false);

      if (searchterm != "") {
        d3.select('#searchterm')
          .text(searchterm)
          .classed('show',true)
          .on('click', function() {
            d3.select('#searchterm').classed('show',false);
            document.getElementById("search").value = "";
            nodelist.classed("hide", false);
            circle.classed("hide", false);
            text.classed("hide", false);
          });
      }
      else {
        d3.select('#searchterm')
          .classed('show',false);
      }
    });

    d3.select("#hideVisited").on("change", function() {
      var hide = this.checked ? true : false;
      d3.select('body').classed('hide-visited',hide);
    });

    // Resizing the window
    d3.select(window).on('resize', function(){
      setSize();
      setSidebarContentHeight();
    });


    /*----------  Actions  ----------*/

    function zoom(d) {
      var focus0 = focus; focus = d;

      setPath(d);

      if (focus === focus0) {
        return;
      }

      if (d === root) {
        $overviewButton.attr('disabled', 'true');
      }
      else {
        $overviewButton.attr('disabled', null);
      }

      var transition = d3.transition()
        .duration(d3.event.altKey ? 7500 : 750)
        .tween("zoom", function() {
          var i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]);
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
          if (d.parent === focus) {
            this.style.display = "inline";
          }
        })
        .each("end", function(d) {
          if (d.parent !== focus) {
            this.style.display = "none";
          }
        });
    }

    function zoomTo(v) {
      nodelist
        .classed("active", false)
        .filter(function(d2) {
          return focus == d2;
        })
        .classed("active", true);

      circle
        .classed("active", false)
        .filter(function(d2) {
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
            .attr('transform', 'translate('+(width/2)+','+((height/2)+(margin/2))+')'); // centering

    }

    function toggleSidebar() {
      $sidebar.classed("show", !$sidebar.classed("show"));
      if (isSidebarOpen == false) {
        setSidebarContentHeight();
        isSidebarOpen = true;
        setTimeout(function(){
          d3.select('#search').node().focus();
        }, 300);
      }
      else {
        isSidebarOpen = false;
        d3.select('#search').node().blur();
      }
    }

    function closeSidebar() {
      $sidebar.classed("show", false);
      isSidebarOpen = false;
      d3.select('#search').node().blur();
    }


    function setPath(d) {
      var container = d3.select('#path .content');
      container.html('');
      container.append('span')
        .attr('class','active')
        .text(d.name);

      getParentPath(d, container);
    }

    function getParentPath(d, container) {
      if (d.parent == null) return;
      d = d.parent;

      container.insert('span', ':first-child')
        .attr('class','divider');

      var title = ((d.depth + 2) > focus.depth || d.depth < 2) ? d.name : '···';

      container.insert('button', ':first-child')
        .text(title)
        .on('click', function() {
          closeSidebar();
          zoom(d);
        })
        .on('mouseover', function() {
          circle
            .filter(function(d2) {
              return d == d2;
            })
            .classed("hover", true);
        })
        .on('mouseout', function() {
          circle
            .filter(function(d2) {
              return d == d2;
            })
            .classed("hover", false);
        });

      getParentPath(d, container);
    }

    function setSidebarContentHeight() {
      // Set nodelist height
      var listheight = (
        height
        -($sidebar.select('header').node().getBoundingClientRect().height)
        -($sidebar.select('.searchbar').node().getBoundingClientRect().height)
        -($sidebar.select('footer').node().getBoundingClientRect().height)
      );

      console.log(listheight);

      d3.select('#sidebar .content').style('height', listheight+'px');

      //d3.select('#nodelist').style('height', listheight);
    }

    function toggleSettings() {
      d3.select('#sidebar #nodelist').classed("show", !d3.select('#sidebar #nodelist').classed("show"));
      d3.select('#sidebar #settings').classed("show", !d3.select('#sidebar #settings').classed("show"));
      d3.select('#sidebar #openSettings').classed("active", !d3.select('#sidebar #openSettings').classed("active"));
    }

    /*===================================================
    =            ARRANGEMENT AND INITIAL VIZ            =
    ===================================================*/

    // Register the nodes
    var node = svg.selectAll("circle,text");

    // Set initial zoom to root
    zoomTo([root.x, root.y, root.r * 2 + margin]);
    setPath(root);

    setSize();
    setSidebarContentHeight();

    history.pushState('', root.name, "/"+hash);

    document.getElementById("shareURL").value = window.location.href;

    document.title = root.name + ' | Mind-o-scope';
  });
}