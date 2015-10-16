/* global d3:false*/
/*jslint todo: true */


/**
 * A zoomable Circle packing layout for mindmap presentation with breadcrumb path and
 * sidebar.
 *
 * This project is based on following code:
 * GitHub Gist: https://gist.github.com/mbostock/7607535
 * Preview: http://bl.ocks.org/mbostock/7607535
 */

function buildMindmap(hash, zoomDuration) {
  'use strict';

  /**
   * Options to set (or to calculate)
   */

  /* Values and sizes */
  var margin        = 35;
  var circlePadding = 1.5;
  var nodePow       = 3;
    // The standard size of a node. Will be used to calc the node size

  /* IDs and classes */
  var container       = 'content';
    // The container ID name which holds the graphics
  var sidebar         = '#sidebar';
  var menubutton      = '#menubutton';
  var overviewButton  = '#toRoot';

  var treelist        = '#treelist';

  var settingsElement = '#settings';
  var settingsButton  = "#openSettings";

  var hoverClass    = 'hover';
  var activeClass   = 'active';
  var visitedClass  = 'visited';

  var showClass     = 'show';
  var hideClass     = 'hide';

  var evenClass     = 'even';
  var oddClass      = 'odd';

  var nodeClass     = 'node';
  var leafClass     = 'leaf';
  var rootClass     = 'root';

  var treelistItemClass = 'item';

  /* Some other options */
  var siteTitle   = "Mind-o-scope";
  var title;
  var contentPath = "uploaded/";





  /**
   * UI Elements and areas
   */

  var $upload         = d3.select('#upload');
  var $dropzone       = d3.select('.dropzone');

  var $mindmap        = d3.select('#mindmap');
  var $container      = d3.select("#"+container);
  var $menubutton     = d3.select(menubutton);
    // The menubutton to show the sidebar
  var $overviewButton = d3.select(overviewButton);
    // The button to show the overview
  var $searchterm     = d3.select('#searchterm');

  /* Sidebar */
  var $sb            = d3.select(sidebar);
    // The sidebar for additional content or interactions
  var $settingsElement = $sb.select(settingsElement);
  var $settingsButton  = $sb.select(settingsButton);
  var $sbSearchfield = $sb.select('#search');
  var $sbTreelist    = $sb.select(treelist);

  /* Settings elements */
  var $hideVisited     = d3.select("#hideVisited");
  var $hideLabels      = d3.select("#hideLabels");
  var $disableTooltips = d3.select("#disableTooltip");
  var $zoomDuration    = d3.select('#zoomDuration');

  var $downloadButton  = d3.select("#download");
  var $newButton       = d3.select("#new");
  var $deleteButton    = d3.select("#delete");





  /**
   * Dynamically declared variables
   */

  var width = window.innerWidth;
  var height = window.innerHeight;
  var fileURL = contentPath+hash+'.json';
  var diameter = getDiameter();
    // The diameter is the minimum available screen size for the graphics.





  /**
   * Colors
   */

  /**
   * Color palette by http://tools.medialab.sciences-po.fr/iwanthue/
   * H: 0 - 291
   * C: 1.380 - 2.33
   * L: 0.81 - 1.22
   */
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

  // Grey colors for the sidebar
  var colorgrey = d3.scale.linear()
    .domain([0, 8])
    .range(["#FCFCFC", "#D4D4D4"])
    .interpolate(d3.interpolateRgb);





  /**
   * Specifying the packing algorithm
   */

  var pack = d3.layout.pack()
    .padding(circlePadding) // set the node padding
    .size([diameter - margin, diameter - margin]) // set the visual size
    .value(function(d) {

      // Calculating the size of each node, based on its depth.
      return Math.pow(1/d.depth,nodePow);
    })
    .sort(function (a, b) {

      // Changing Sort
      // Source: http://stackoverflow.com/questions/20736876/controlling-order-of-circles-in-d3-circle-pack-layout-algorithm
      return -(a.value - b.value);
    });





  /**
   * Building the Environment
   */
  cleanup(); // cleaning up the setting before building something new
  var svg = $container.append("svg")
    .append("g");

  // This is for the tooltip vis
  // See /vendors/d3-tip
  var tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(function(d) {
      return d.name;
    });

  // Invoke the tip in the context of the visualization
  svg.call(tip);





  /**
   * CALCULATION FUNCTIONS
   */

  /**
   * Calculates the diameter
   * @return {int} the diameter
   */
  function getDiameter() {

    return (window.innerWidth > window.innerHeight ? (window.innerHeight - 50) : window.innerWidth);
  }

  /**
   * Calculates the depth recursively
   * @param  {root} obj The current object (it's recursive!)
   * @return {int}      The depth
   */
  function getDepth(obj) {

    var depth = 0;

    if (obj.children) {
      obj.children.forEach(function (d) {
        var tmpDepth = getDepth(d);
        if (tmpDepth > depth) {
          depth = tmpDepth;
        }
      });
    }

    return 1 + depth;
  }

  /**
   * One child node handler functions
   * Found on:
   * http://stackoverflow.com/questions/22307486/d3-js-packed-circle-layout-how-to-adjust-child-radius
   */

  /**
   * Adds the placeholder to a node
   * @param {Object} node The selected data node
   */
  function addPlaceholders(node) {

    if (node.children) {
      for (var i = 0; i < node.children.length; i++) {

        var child = node.children[i];

        addPlaceholders( child );
      }

      if (node.children.length === 1) {
        node.children.push({
          name:'===placeholder===',
          children: [ {
            name:'===placeholder===',
            children:[]
          }]
        });
      }
    }
  }

  /**
   * Removes the placeholders
   * @param {Object} nodes The selected data node
   */
  function removePlaceholders(nodes) {

    for (var i = nodes.length - 1; i >= 0; i--) {

      var node = nodes[i];

      if (node.name === '===placeholder===') {
        nodes.splice(i,1);
      } else if (node.children) {
        removePlaceholders(node.children);
      }
    }
  }

  /**
   * Centers every single children node by repositioning them
   * @param  {Object} nodes The selected data node
   */
  function centerNodes(nodes) {

    for (var i = 0; i < nodes.length; i ++) {

      var node = nodes[i];

      if (node.children) {
        if (node.children.length === 1) {
          var offset = node.x - node.children[0].x;
          node.children[0].x += offset;
          reposition(node.children[0],offset);
        }
      }
    }
  }

  /**
   * Repositions a node by a giving offset
   * @param  {Object} node   The selected data node
   * @param  {Array}  offset The offset, set by x and y coordinates as array
   */
  function reposition(node, offset) {

    if (node.children) {
      for (var i = 0; i < node.children.length; i++) {
        node.children[i].x += offset;
        reposition(node.children[i], offset);
      }
    }
  }

  /**
   * Repositions every node from the center of the screen.
   * @param  {Object} nodes Every single data node (namely root)
   */
  function repositionNodesRelativeToZero(nodes) {

    //use this to center vis at 0,0,0 (easier for positioning)
    var offsetX = nodes[0].x;
    var offsetY = nodes[0].y;

    for (var i = 0; i < nodes.length; i ++) {
      var node = nodes[i];
      node.x -= offsetX;
      node.y -= offsetY;
    }
  }

  /**
   * Sets parameter values
   * Source: http://stackoverflow.com/a/13064060
   *
   * @param {String} paramName  The parameter name
   * @param {String} paramValue The new value
   */
  // TODO: rearrange those with Cookies. Parameter poisoned URLS are bullshit.
  function setGetParameter(paramName, paramValue) {

    var url = window.location.href;

    if (url.indexOf(paramName + "=") >= 0) {
      var prefix = url.substring(0, url.indexOf(paramName));
      var suffix = url.substring(url.indexOf(paramName));
      suffix = suffix.substring(suffix.indexOf("=") + 1);
      suffix = (suffix.indexOf("&") >= 0) ? suffix.substring(suffix.indexOf("&")) : "";
      url = prefix + paramName + "=" + paramValue + suffix;
    } else {
      if (url.indexOf("?") < 0) {
        url += "?" + paramName + "=" + paramValue;
      } else {
        url += "&" + paramName + "=" + paramValue;
      }
    }

    updateURL(url, title);
  }

  /**
   * Updates the window history with a new URL and also the URL sharing input field.
   * Additionally: sets the document title to the Mind Map title.
   * @param  {String} url The new URL
   */
  function updateURL(url,title) {

    //history.pushState('', title, url);

    document.getElementById("shareURL").value = url.split('?')[0];
    // set the title of the document (for browser history)
    document.title = title;
  }

  /**
   * Makes an ajax request, used to delete the Mind Map without reloading the page.
   * @param  {String} url The URL to the post script
   */
  function ajax(url) {

    var xmlhttp = new XMLHttpRequest(); // code for IE7+, Firefox, Chrome, Opera, Safari

    xmlhttp.onreadystatechange = function() {
      if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
        document.getElementById('A1').innerHTML = xmlhttp.status;
        document.getElementById('A2').innerHTML = xmlhttp.statusText;
        document.getElementById('A3').innerHTML = xmlhttp.responseText;
      }
    };

    xmlhttp.open("post",url,true);
    xmlhttp.send();
  }

  /**
   * End of CALCULATION FUNCTIONS
   */





  /**
   * DRAWING FUNCTIONS
   */

  /**
   * Draws circles and attach every class on it
   * @param  {Object} nodes The nodes data
   * @return {Object}       Selection of every circle
   */
  function drawCircle(nodes) {

    var nodeTree = 0;

    // Returns directly the circle. This isn't really elegant for code quality but it saves memory.
    return svg.selectAll("circle")
      .data(nodes) // getting the data for every node
        .enter() // this is the D3 foreach loop
          .append("circle") // building the circle for each data node
            .attr("class", function (d) {

              // set class to node and to leaf (for endpoints) or to root (for stem)
              var output = nodeClass+(d.parent ? d.children ? '' : ' '+leafClass : ' '+rootClass);

              // set class to even or to odd, based on its level;
              output += ((d.depth % 2) === 0 ? ' '+evenClass : ' '+oddClass);

              return output;
            })
            .attr("r", function (d) {

              return d.r;
            })
            .style("fill", function (d) {

              // Setting the color based on the hierarchy
              if (d.depth === 1) {
                nodeTree++;
              }

              if (d.children || d.depth === 1) {
                if ((d.depth % 2) === 0) {
                  return color(nodeTree);
                } else {
                  var tempColor = d3.hsl(color(nodeTree));
                  var newColor = d3.hsl('hsl('+tempColor.h+","+(tempColor.s * 100 * 1.09)+"%,"+(tempColor.l * 100 * 1.2)+'%)');

                  return newColor;
                }
              } else {
                return null;
              }
            });
  }

  /**
   * Draws the labels that are belonging to the circles.
   * @param  {Object} nodes The data container
   * @return {Object}       Selection of every built text element
   */
  function drawLabels(nodes,root) {

    // Returning directly the Label
    return svg.selectAll("g.label")
      .data(nodes)
        .enter() // this is the D3 foreach loop
          .append("g")
            .attr("class", "label")
            .style("opacity", function (d) {

              return d.parent === root ? 1 : 0;
            })
            .style("display", function (d) {

              return d.parent === root ? "inline" : 'none';
            })
            .attr("transform", "translate(0," + height + ")")
            .append("foreignObject")
              // Using the SVG foreignObject to use the wrapping functionality of HTML elements
              .attr("width", 120)
              .attr("x", -120/2)
              .attr("height", 200)
              .attr("y", -200/2)
              .append("xhtml:div")
                .classed('labelContainer', true)
                .html(function (d) {

                  return '<div><span>'+d.name+'</span></div>';
                });
  }

  /**
   * Draws the node elements
   * Treelist logic based on http://bl.ocks.org/thehogfather/0e48ec486abbd5be17d7
   * @param  {Object} root The data
   * @return {Object}      Selection of every built item element
   */
  function drawNodeList(root) {

        // Options
    var indent = 12;
    var nodeTree = 0;

    // Dynamic variables
    var tree    = d3.layout.tree();
    var ul      = $sbTreelist.append("ul");
    var nodes   = tree.nodes(root);
    var nodeEls = ul.selectAll("li."+treelistItemClass).data(nodes);

    //list nodes
    var listEnter = nodeEls
      .enter()
        .append("li")
          .attr("class", function (d) {

            // set class to node and to leaf (for endpoints) or to root (for stem)
            var output = treelistItemClass+(d.parent ? d.children ? '' : ' '+leafClass : ' '+rootClass);

            // set class to even or to odd, based on its level;
            output += ((d.depth % 2) === 0 ? ' '+evenClass : ' '+oddClass);

            return output;
          })
          .style("opacity", 1)
          .style("background-color", function (d) {

            return colorgrey(d.depth);
          })
          .append("span").attr("class", "value")
            .style("padding-left", function (d) {

              return 30 + d.depth * indent + "px";
            })
            .html(function (d) {

              return d.name;
            });

    // Calculating the node tree layout
    var rootTop = ul.selectAll("li."+treelistItemClass)
      .filter(function (d,i) {

        return i === 0;
      })
      .node()
        .getBoundingClientRect()
          .top;

    // Calculating variables
    nodes.forEach(function (d, i) {

      // Get position of li element
      var top = ul.selectAll("li."+treelistItemClass)
        .filter(function (d2,i2) {

          return i2 === i;
        })
        .node()
          .getBoundingClientRect()
            .top;

      d.x = top - rootTop;//i * 38;
      d.y = d.depth * indent;

      if (d.depth === 1) {
        nodeTree++;
      }

      d.value = nodeTree;
    });

    listEnter
      .append("span")
        .attr("class", function (d) {

          return 'point'+(d.parent ? d.children ? '' : ' '+leafClass : ' '+rootClass);
        })
        .style("padding-left", function (d) {

          return d.depth * indent + "px";
        })
        .style("color", function (d) {

          var tempColor = d3.hsl(color(d.value));
          var newColor = d3.hsl('hsl('+tempColor.h+","+(tempColor.s * 100 * 1.09)+"%,"+(tempColor.l * 100 * 1.2)+'%)');

          return newColor;
        });

    // tree link nodes
    var width  = $sbTreelist.node().getBoundingClientRect().width;
    var height = $sbTreelist.node().getBoundingClientRect().height;
    var margin = {top: 16, right: 10, bottom: 10, left: 14};

    // Interpolation function
    var diagonal = d3.svg.line()
      .x(function (d) {

        return d.x;
      })
      .y(function (d) {

        return d.y;
      })
      .interpolate("step-before");

    $sbTreelist
      .append("svg")
        .attr("width", width - margin.left - margin.right+"px")
        .attr("height", height+"px")
        .append("g")
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
          .selectAll("path.link")
            .data(tree.links(nodes))
              .enter()
                .insert("path", ":first-child")
                .attr("class", "link")
                .attr("stroke", function (d) {

                  var tempColor = d3.hsl(color(d.target.value));
                  var newColor = d3.hsl('hsl('+tempColor.h+","+(tempColor.s * 100 * 1.09)+"%,"+(tempColor.l * 100 * 1.2)+'%)');

                  return newColor;
                })
                .attr("d", function (d) {

                  return diagonal([{
                      y: d.source.x,
                      x: d.source.y
                    }, {
                      y: d.target.x,
                      x: d.target.y
                    }]);
                });

    return nodeEls;

  }

  /**
   * End of DRAWING FUNCTIONS
   */





  /**
   * INTERACTION ACTION FUNCTIONS
   */

  /* Dynamic Variables */
  var isSidebarOpen = false;

  /**
   * Translates the zoom from current focused node to node d
   * @param  {Object} d The target node
   */
  function zoom(d) {

    var focus0 = focus;
    focus = d;

    setPath(d);

    // Do nothing when the old is the new focus
    if (focus === focus0) {
      return;
    }

    if (d.parent == null) {
      $overviewButton.attr('disabled', 'true');
    } else {
      $overviewButton.attr('disabled', null);
    }

    // interpolates the Zoom from current focused node to target node d
    var transition = d3.transition()
      .duration(d3.event.altKey ? zoomDuration * 10 : zoomDuration)
      .tween("zoom", function () {

        var i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]);

        return function (t) {

          zoomTo(i(t));
        };
      });

    // Arranges which labels are shown
    transition.selectAll("g.label")
      .filter(function (d) {

        return d.parent === focus || this.style.display === "inline";
      })
      .style("opacity", function (d) {

        return d.parent === focus ? 1 : 0;
      })
      .each("start", function (d) {

        if (d.parent === focus) {
          this.style.display = "inline";
        }
      })
      .each("end", function (d) {

        if (d.parent !== focus) {
          this.style.display = "none";
        }
      });
  }

  /**
   * Calculates the transformation and the size for each single node
   * @param  {Array} v The Array with the x and y position
   */
  function zoomTo(v) {

    var k = diameter / v[2]; view = v;

    // Set the active node element in the list by attaching the class 'active'
    nodelist
      .classed(activeClass, false)
      .filter(function (d) {

        return focus === d;
      })
      .classed(activeClass, true);

    // Set the active node by attaching the class 'active'
    node
      .classed(activeClass, false)
      .filter(function (d) {

        return focus === d;
      })
      .classed(activeClass, true);

    node.attr("transform", function (d) {

      return "translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")";
    });

    circle.attr("r", function (d) {

      return d.r * k;
    });
  }

  /**
   * Shows and hides the sidebar and handles the focus on the #search input field
   */
  function toggleSidebar() {

    $sb.classed(showClass, !$sb.classed(showClass));
    if (isSidebarOpen === false) {
      setSidebarContentHeight();
      $menubutton.classed('active', true);
      isSidebarOpen = true;
      setTimeout(function () {

        $sbSearchfield.node().focus();
      }, 300);
    } else {
      $menubutton.classed('active', false);
      isSidebarOpen = false;
      closeSettings();
      $sbSearchfield.node().blur();
    }
  }

  /**
   * Closes immediately the sidebar
   */
  function closeSidebar() {
    $menubutton.classed('active', false);
    $sb.classed(showClass, false);
    isSidebarOpen = false;
    $sbSearchfield.node().blur();
    closeSettings();
  }

  /**
   * Shows and hides the settings pane
   */
  function toggleSettings() {

    $settingsElement.classed(showClass, !$settingsElement.classed(showClass));
    $settingsButton.classed(activeClass, !$settingsButton.classed(activeClass));
    $sb.classed("visibleSettings", !$sb.classed("visibleSettings"));
  }

  /**
   * Closes the settings pane
   */
  function closeSettings() {

    $settingsElement.classed(showClass, false);
    $settingsButton.classed(activeClass, false);
  }

  /**
   * Handles the search input by giving a direct feedback. For this we have to handle every
   * single Element in the UI to visualize the feedback.
   * @param  {String} searchterm The string that holds the search term
   */
  function handleSearchInput(searchterm) {

    closeSettings();
    // First we have to filter the node list
    nodelist
      .classed(hideClass, true)
      .filter(function (d) {

        var name = d.name;

        return (name.toLowerCase().indexOf(searchterm.toLowerCase()) > -1);
      })
      .classed(hideClass, false);

    // Then we have to filter the nodes itself
    node
      .classed(hideClass, true)
      .filter(function (d) {

        var name = d.name;

        return (name.toLowerCase().indexOf(searchterm.toLowerCase()) > -1);
      })
      .classed(hideClass, false);

    // Handle the searchterm if it's not empty
    if (searchterm !== "") {
      $sbTreelist.select("svg")
        .style('display','none');
      // attach the searchterm to the searchterm element in the UI
      $searchterm
        .text(searchterm)
        .classed(showClass,true)
        .on('click', function () {

          $searchterm.classed(showClass,false);
          document.getElementById("search").value = "";
          nodelist.classed(hideClass, false);
          node.classed(hideClass, false);
          $sbTreelist.select("svg")
            .style('display',null);
        });
    } else { // hide the searchterm element (that enables fast deleting of the searchterm)
      $searchterm
        .classed(showClass,false);
      $sbTreelist.select("svg")
        .style('display',null);
    }
  }

  /**
   * Sets the zoom duration
   * @param  {int} duration The duration
   */
  function optionSetZoomDuration(duration) {

    setGetParameter("zoom",duration);
    zoomDuration = duration;
  }

  /**
   * Hides or shows the visited nodes
   * @param  {boolean} hide Boolean that toggles the hiding option
   */
  function optionHideVisited(hide) {

    setGetParameter("visited",(hide ? "y" : ""));
    d3.select('body').classed('hide-visited',hide);
  }

  /**
   * Hides or shows the node labels
   * @param  {boolean} hide Boolean to hide or show the labels
   */
  function optionHideLabels(hide) {

    setGetParameter("labels",(hide ? "y" : ""));
    d3.select('body').classed('hide-labels',hide);
  }

  /**
   * Hides or shows the tooltips on mouseover, shows by default.
   * @param  {boolean} hide Boolean to hide or show the labels
   */
  function optionHideTooltips(hide) {

    setGetParameter("tooltips",(hide ? "y" : ""));
    d3.select('body').classed('hide-tooltip',hide);
  }

  /**
   * Action when user clicks on "Download"-button
   */
  function optionDownload() {

    window.location="download.php?hash="+hash;
  }

  /**
   * Action when user clicks on "New"-Button
   */
  function optionNew() {

    reset();
  }

  /**
   * Action when user clicks on "Delete"-Button
   */
  function optionDelete() {

    ajax("delete.php?hash="+hash);
    reset();
  }

  /**
   * Resets the whole UI to the dropzone.
   * NOTE: This effects also the dropzone UI field
   */
  // TODO: Writing an own reset function for the dropzone.
  function reset() {

    cleanup();

    $dropzone
      .classed('hover', false)
      .classed('error', false)
      .classed('dropped', false)
      .classed('success', false)
      .classed('dz-processing', false)
      .classed('dz-complete', false);

    d3.select('body').style('position', 'relative');
    $upload.style('display', 'block');
    $mindmap.style('display', 'none');

    var url = window.location.href;
    var newURL = url.substring(0,url.lastIndexOf("/"));
    updateURL(newURL, siteTitle);
  }

  function cleanup() {
    $container.select('svg').remove();
    $sbTreelist.select('ul').remove();
    $sbTreelist.select('svg').remove();
    d3.select('#path .content').html('');

    $sbSearchfield.value = "";
    $searchterm.classed(showClass,false);

    closeSidebar();
    closeSettings();
  }

  /**
   * Registers every interaction by binding them on events.
   * @param  {Object} root All nodes (namely the root)
   */
  function registerInteractions(root) {

    /**
     * Window Arrangements
     */

    // Resizing the window
    d3.select(window).on('resize', function () {

      setSize();
      setSidebarContentHeight();
    });



    /**
     * Basic Visualization interactions
     */

    // Zoom out when user clicks on container
    d3.select('#'+container)
      // .style("background", color(-1))
      .on("click", function () {

        zoom(root);
        closeSidebar();
      });


    // Zoom back to the overview
    $overviewButton
      .on("click", function () {

        zoom(root);
      });

    // Mouse Events on circles
    var tipShow;

    circle
      .on("click", function (d) {
        tip.attr('class','d3-tip');
        tip.hide(d);
        d3.select(this).classed(visitedClass,true);
        if (focus !== d) {
          closeSidebar();
          zoom(d);
          d3.event.stopPropagation();
        } else if (d.parent != null) {
          zoom(d.parent);
          d3.event.stopPropagation();
        }
      })
      .on('mouseover', function (d) {

        tip.show(d);

        tipShow = setTimeout(function () {

          tip.attr('class','d3-tip show');
        }, 300);
      })
      .on('mouseout', function (d) {

        clearTimeout(tipShow);
        tip.attr('class','d3-tip');
        tip.hide(d);
      });



    /**
     * Sidebar interactions
     */

    // Open the sidebar
    $menubutton
      .on("click", function () {

        toggleSidebar();
      });

    // Mouse events on nodelist elements
    nodelist
      .on('click', function (d) {

        if (d.children) {
          if (focus !== d) {
            zoom(d);
            d3.event.stopPropagation();
          }
        } else {
          if (focus !== d.parent) {
            zoom(d.parent);
            d3.event.stopPropagation();
          }
        }
      })
      .on('mouseover', function (d,i) {
        node
          .filter(function (d2,i2) {

            return i === i2;
          })
          .classed(hoverClass, true);
      })
      .on('mouseout', function (d,i) {
        node
          .filter(function (d2,i2) {

            return i === i2;
          })
          .classed(hoverClass, false);
      });

    // Open the settings pane
    $settingsButton
      .on("click", function () {

        toggleSettings();
      });

    // Handle search inputs
    $sbSearchfield
      .on("input", function () {

        // First zoom out
        zoom(root);

        // then: handle the search input and its following actions
        handleSearchInput(this.value);
      });

    // Prevent Zooming to input field (just for mobile devices)
    d3.selectAll('input')
      .on("focus", function () {

        d3.event.preventDefault();
      });



    /**
     * Options
     */

    // Option: hide visited nodes
    $hideVisited
      .on("change", function () {

        optionHideVisited(this.checked);
      });

    // Option: hide labels
    $hideLabels
      .on("change", function () {

        optionHideLabels(this.checked);
      });

    // Option: hide tooltips
    $disableTooltips
      .on("change", function() {

        optionHideTooltips(this.checked);
      });

    // Option: set zoom direction
    $zoomDuration
      .on("mousedown", function () {

        d3.select('#zoomDurationOutput').classed('active', true);
      })
      .on("mouseout", function () {

        d3.select('#zoomDurationOutput').classed('active', false);
      })
      .on("change", function () {

        optionSetZoomDuration(this.value);
      });

    // Handling Download-button clicks
    $downloadButton
      .on("click", function () {

        //optionDownload();
      });

    // Handling New-button clicks
    $newButton
      .on("click", function () {

        //optionNew();
      });

    // Handling delete-button clicks
    $deleteButton
      .on("click", function () {

        //optionDelete();
      });



    /**
     * Keyboard interactions
     */

    d3.select("body").on("keydown", function () {

      if (!isSidebarOpen && d3.event.keyCode == 70) {
        // f key opens the sidebar and focuses the search input field
        d3.event.preventDefault();
        toggleSidebar();
      } else if (d3.event.keyCode == 27) {
        // Escape key
        d3.event.preventDefault();
        toggleSidebar();
      }
    });
  }

  /**
   * End of INTERACTION ACTION FUNCTIONS
   */





  /**
   * ARRANGEMENT FUNCTIONS
   */

  /**
   * Sets the size of the visualization and of every single UI element
   */
  function setSize() {

    // Disable overflow scrolling (hack)
    d3.select('body').style('position', 'relative');
    // update variables
    width  = document.getElementById(container).offsetWidth;
    height = document.getElementById(container).offsetHeight;
    diameter = getDiameter();

    // reset the sizes
    d3.select('#'+container)
      .select('svg')
        .style('width',width+'px')
        .style('height',height+'px')
        .select('g')
          .attr('transform', 'translate('+(width/2)+','+((height/2)+(margin/2))+')'); // centering

    d3.select(self.frameElement)
      .style("height", diameter + "px");

    // Apply overflow scrolling hack for iOS
    d3.select('body').style('position', 'fixed');

    setSidebarContentHeight();
  }

  /**
   * Sets recursive the node path by using getParentPath function
   * @param {Object} d: the actual node
   */
  function setPath(d) {
    var container = d3.select('#path .content');
    container.html('');
    container.append('span')
      .attr('class',activeClass)
      .text(d.name);

    // start the recursive call
    getParentPath(d, container);

    /**
     * gets recursively a clickable breadcrumb path from actual node to the root
     * @param  {Object} d:         the actual viewed node (depends on recursion state)
     * @param  {Object} container: the container element that holds the path.
     * @return {String}            exits the function call if no parent node was found
     *                             (that means it's the root).
     */
    function getParentPath(d, container) {
      if (d.parent == null) return;
      d = d.parent;

      container.insert('span', ':first-child')
        .attr('class','divider');

      var title = ((d.depth + 2) > focus.depth || d.depth < 2) ? d.name : '···';

      container.insert('button', ':first-child')
        .text(title)
        .on('click', function () {

          closeSidebar();
          zoom(d);
        })
        .on('mouseover', function () {

          if (title === '···') {
            d3.select(this).classed('show-tip', true);
          }
          circle
            .filter(function (d2) {

              return d === d2;
            })
            .classed(hoverClass, true);
        })
        .on('mouseout', function () {

          if (title === '···') {
            d3.select(this).classed('show-tip', false);
          }
          circle
            .filter(function (d2) {

              return d === d2;
            })
            .classed(hoverClass, false);
        })
        .append('span')
          .text(d.name)
          .classed('path-tip', true)
          .attr('style', function () {

            return 'margin-left: -' + d3.select(this).node().getBoundingClientRect().width / 2 + 'px';
          })
      ;

      getParentPath(d, container);
    }
  }

  /**
   * Sets the sidebar content height
   */
  // TODO: could be depreached by a table display style
  function setSidebarContentHeight() {

    // Set nodelist height
    var listheight = (
      height -
        ($sb.select('header').node().getBoundingClientRect().height) -
        ($sb.select('.searchbar').node().getBoundingClientRect().height) -
        ($sb.select('footer').node().getBoundingClientRect().height)
    );

    $sb.select('.content').style('height', listheight+'px');
    $sb.select('.scrollmask').style('height', listheight+'px');
  }

  /**
   * End of ARRANGEMENT FUNCTIONS
   */





  /**
   * READ DATA AND BUILD VISUALIZATION
   */

  /* Variables */
  var focus, nodes, view;
  var circle, text, nodelist, node;

  /**
   * This is the init function. It brings the whole thing to life by calling every single needed function
   * in this too long script.
   *
   * Here's what it does:
   * 1) Checking for errors and throwing them.
   * 2) Arrange the whole UI.
   *   2.1) Setting the sizes and variables.
   *   2.2) Setting the path.
   * 3) Drawing the nodelist before focus will be drawn. This is needed because of the placeholders.
   * 4) Drawing the whole scene.
   *   4.1) Adding placeholders.
   *   4.2) Setting the variable for focus.
   *   4.3) Setting the data layout by using d3 circle packing layout
   *   4.4) remove placeholders, centering nodes
   *   4.5) draw circles and labels
   * 5) Register interactions
   * 6) Zoom to root node
   * 7) Set option toggles and URL
   *
   * @param  {String} fileURL The URL to the JSON-file
   */
  function init(fileURL) {
    d3.json(fileURL, function(error, root) {

      // Kill the process when there's no file or if the structure is unreadable
      if (error) throw error;

      // Set sizes of the UI
      setSize();
      setPath(root);

      nodelist = drawNodeList(root);

      /* Initialize the data */

      // Adding placeholders if a node has just one child
      // This extends the radius of the parent node
      addPlaceholders(root);

      // dynamic variables to calculate the visualization
      focus = root; // Set the focus to the root node
      nodes = pack.nodes(root); // Packing every node into a circle packing layout

      // Set the maximum color domain dimension by recursively calculate it
      // This is needed to set the maximum level of interpolations
      console.log("Depth of the Mind Map: "+getDepth(root));
      colorgrey.domain([0, getDepth(root)]);

      // Removing the placeholders
      removePlaceholders(nodes);
      // Centering the one child nodes
      centerNodes(nodes);

      // DEV: show the root in the console
      console.log("Structure:");
      console.log(root);


      /* Building the visuals */

      circle = drawCircle(nodes);

      text = drawLabels(nodes, root);


      /* Initialize Interactions */
      registerInteractions(root);


      /* Arrangement and initialization */

      // Register the nodes
      node = svg.selectAll("circle,g.label");


      // Set initial zoom to root
      zoomTo([root.x, root.y, root.r * 2 + margin]);

      // Set options
      optionHideVisited(d3.select("#hideVisited").node().checked);
      optionHideLabels(d3.select("#hideLabels").node().checked);
      optionHideTooltips(d3.select("#disableTooltip").node().checked);

      // set the URL to the found hash value
      var url = window.location.href;
      var newURL = url.substring(0,url.lastIndexOf("/"))+"/"+hash+location.search;
      title = root.name+' | '+siteTitle;
      updateURL(newURL, title);
    });
  }

  /**
   * End of READ DATA AND BUILD VISUALIZATION
   */





  // First: Showing mindmap site by hiding upload site
  $upload.style('display', 'none');
  $mindmap.style('display', 'block');

  // Initialize everything
  init(fileURL);

  /**
   * End of document
   */
}