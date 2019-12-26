// some colour variables
  // var tcBlack = "#130C0E";
  var tcBlack = "#808080";

// rest of vars
var w = innerWidth,
    h = innerHeight,
    maxNodeSize = 50,
    x_browser = 20,
    y_browser = 25,
    isFocusLocked = false,  // Set to true when we're moving a node to the center & selecting it
    clickedNode, // Points to the node that was clicked
    root,
    maxNodeNum = Math.floor(10 + Math.random() * 10), // Number of nodes to render onscreen. Random between 20 - 50
    path,    // All the paths connecting nodes
    nodesArr,// Array of all nodes
    // linksArr,// Array of link data
    selectedNodes = [], // Randomly selected nodes
    selectedLinks = [], // Link data for selectedNodes
    node,    // Points to current SVG DOM selection, for D3 operations
    nodeIDs; // Array of all IDs (used to determine which links to form)

// Workaround to load images on GitHub pages
  if( document.location.href.indexOf('github') !== -1 )
  {
    document.querySelector('body').style.backgroundImage = "url('https://raw.githubusercontent.com/QasimQureshi/force-directed-graph/master/assets/images/background_004.png')"
  }
 
var vis; // points to our container element
var force = d3.layout.force();  // D3's force layoud

vis = d3.select("#vis").append("svg").attr("width", innerWidth).attr("height", innerHeight);

d3.json("assets/js/json/data.json", function(json) {

  // Randomly selecting values from graph.json to render onscreen
  nodesArr = json.record;
  // linksArr = json.links;

  var nodesArrDup = nodesArr.map((x) => x), // Copying nodesArr to be able to randomly splice & remove nodes non-destructively
      randomNodeIndex,
      randomNode;

  // Picking up random nodes, and populating their children
  for (var i = 0; i < maxNodeNum; i++)
  {
    randomNodeIndex = Math.floor(Math.random() * nodesArrDup.length); // Random index, within range
    var randomNode =  nodesArrDup.splice( randomNodeIndex, 1 )[0];    // Node with randomID
    // randomNode.id = i; // d3 seems to require all nodes ot have a unique ID
    selectedNodes.push( randomNode );
  }

  // Adding children after all the random nodes have been selected, to prevent initial nodes from missing added nodes
  selectedNodes.forEach( node => node.children = getNodeChildren(node.id));


  root = selectedNodes;
  root.fixed = true;
  root.x = w / 2;
  root.y = h / 4;
 
 
  // Build the path
  var defs = vis.insert("svg:defs")
      .data(["end"]);
 
 
  defs.enter().append("svg:path")
      .attr("d", "M0,-5L10,0L0,5");
 
  update();
});

var aspect = innerWidth / innerHeight,
    chart = d3.select('#vis > svg');
d3.select(window)
  .on("resize", function() {
    console.log('resize is called');
    var targetWidth = chart.node().getBoundingClientRect().width;
    chart.attr("width", targetWidth);
    chart.attr("height", targetWidth / aspect);
    w = innerWidth,
    h = innerHeight;
  });
 
 
/**
 *   
 */
function update() {
  debugger;
  var nodes = selectedNodes; //flatten(root);
  var links = d3.layout.tree().links(selectedNodes);
 
  
  // When links are empty the script runs.
  // When links are full it fails with a d3 error trying to push into nothing.

  // Restart the force layout.
  force.nodes(nodes)
    // Removing links means the script runs.
    // .links(links)
    .gravity(0.05)
    .charge(-1500)
    .linkDistance(100)
    .friction(0.5)
    .linkStrength(function(l, i) {return 1; })
    .size([w, h])
    .on("tick", tick)
        .start();
 
   path = vis.selectAll("path.link")
      .data(links, function(d) { return d.target.id; });
 
    path.enter().insert("svg:path")
      .attr("class", "link")
      .style("stroke", "#eee");
 
 
  // Exit any old paths.
  path.exit().remove();
 
 
  // Update the nodes…
  node = vis.selectAll("g.node")
      .data(nodes, function(d) { return d.id; });
 
 
  // Enter any new nodes.
  var nodeEnter = node.enter().append("svg:g")
      .attr("class", "node")
      .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
      .on("click", click)
      .call(force.drag);
 
  // Append a circle
  nodeEnter.append("svg:circle")
      .attr("r", function(d) { return Math.sqrt(d.size) / 10 || 4.5; })
      .style("fill", "#eee");
 
   
  // Append images
  // Workaround to load images on GitHub pages
  var imageBasePath = (document.location.href.indexOf('github') === -1 ? '/assets/images/doodles-100px/' : 'https://raw.githubusercontent.com/QasimQureshi/force-directed-graph/master/assets/images/doodles-100px/');
  var images = nodeEnter.append("svg:image")
        // ternary operator checks to ensure this node has an image
        .attr("xlink:href",  function(d) { return !!d.image ? imageBasePath + d.image.url.substr(d.image.url.lastIndexOf('/') + 1) : null;})
        // .attr("xlink:href", function(d) { return imageBasePath + "_029-loop.png"})
        .attr("x", function(d) { return -25;})
        .attr("y", function(d) { return -25;})
        .attr("height", 50)
        .attr("width", 50);

  // make the image grow a little on mouse over and add the text details on click
  var setEvents = images
          .on( 'mouseenter', function() {
            // select element in current context
            d3.select( this )
              .transition()
              .attr("x", function(d) { return -35;})
              .attr("y", function(d) { return -35;})
              .attr("height", 70)
              .attr("width", 70);
          })
          // set back
          .on( 'mouseleave', function() {
            d3.select( this )
              .transition()
              .attr("x", function(d) { return -25;})
              .attr("y", function(d) { return -25;})
              .attr("height", 50)
              .attr("width", 50);
          });

  // Appending details on roll over next to the node as well
  nodeEnter.append("text")
      .attr("class", "nodetext")
      .on( 'click', linkClickHandler)
      .attr('text-anchor', 'middle')
      .attr("x", x_browser)
      .attr("y", y_browser +15)
      .attr("fill", tcBlack)
      .text(function(d) { return d.title; })
      .call(getBB);

      // var textNode = node.filter(function(d) {return (!d.image)});
      //

  // Adding a background behind link labels
  d3.selectAll('g.node')
      .insert('rect', 'text')
      .attr('class', 'textRect')
      .attr('width', function(d){ return d.bbox.width + 10 })
      .attr('height', function(d){ return d.bbox.height + 5 })
      .attr('x', function(d){ return d.bbox.x - 5})
      .attr('y', function(d){return d.bbox.y - 2})
      .style('fill', '#ffffb9')
      .style('stroke', '#ccc')
      .on( 'click', linkClickHandler);


  // Opens the URL
  function linkClickHandler(d) {
    // window.location = d.link.url;
  }

  // Returns a bounding box - used to draw rectangles behind text labels, when a node is hovered upon
  function getBB(selection){
    selection.each(function(d){
      d.bbox = this.getBBox();
    })
  }


  // Exit any old nodes.
  node.exit().remove();


  // Re-select for update.
  // path = vis.selectAll("path.link");
  node = vis.selectAll("g.node");

// Moving the node to the center
          // d3.select( this.closest('.node') )

  node.on('dragenter', e => {console.log(`${e.target} is dragged`)});
  // Node click handler
  node.on('click', function(d){

    var targetX = w / 2,
        targetY = h / 2,
        divisor = 16,
        dx,
        dy;

    // Get new nodes right away.
    selectedNodes.find( node => node.id === d.id).children = getNodeChildren(d.id, true); // Adds any children elements that aren't on-stage rightnow
    // @FIX Cull the number of nodes back down to max.
    // @FIX Cancel currently underway simulations.
    // Update the scene with the new nodes.
    update();

    function step(timestamp){
      console.log('step called');

      dx = targetX - d.x,
      dy = targetY - d.y;
      d.x += dx / divisor;
      d.y += dy / divisor;
      d.px = d.x;
      d.py = d.y;
      tick();


      if(Math.abs(dx) > 2 || Math.abs(dy) > 2)
      {
        window.requestAnimationFrame(step);
      }else{
        // Animation complete asdf
        d.x = targetX;
        d.y = targetY;
        d.px = d.x;
        d.py = d.y;


        debugger;
        // Build the path
        // var defs = vis.insert("svg:defs")
        //   .data(["end"]);


        // defs.enter().append("svg:path")
        //   .attr("d", "M0,-5L10,0L0,5");


        tick();
        update();
        // debugger;
      }

    }

    window.requestAnimationFrame(step);

    // node.attr("link", function(na){

    // })
    // d.x = w / 2,
    // d.y = h / 2,
    // d.px = d.x,
    // d.py = d.y,
    // d.fixed = true;
    // tick();

    //
    // d3.select(this)
    //   .transition()
    //   .attr('x', function(d){  return ( w / 2)})
    //   .attr('y', function(d){ return ( h / 2)})
    //   .attr('px', function(d){  return ( w / 2)})
    //   .attr('py', function(d){ return ( h / 2)})

    // d.x = w / 2,
    // d.y = h / 2,
    // d.px = d.x,
    // d.py = d.y,
    // d.fixed = true;
    // tick();

    // clickedNode = d;
    //       isFocusLocked = true;

    //       // Moving the node to the center
    //       d3.select( this.closest('.node') )
    //           // .transition()
    //           // .attr("x", function(d) {  return (- window.innerWidth / 2) + this.getBBox().width })
    //           // .attr("y", function(d) { return h / 2;})

  })


  console.log('update is called');
}// Update function ends

// The basic enterFrame function
function tick() {

  // if(!isFocusLocked)
  // {

    path.attr("d", function(d) {

      var dx = d.target.x - d.source.x,
          dy = d.target.y - d.source.y,
          dr = Math.sqrt(dx * dx + dy * dy);

      var val = "M" + d.source.x + ","
                + d.source.y
                + "L" + d.target.x + ","
                + d.target.y;

      //
      return val;
    });

    node.attr("transform", nodeTransform);
  // }else{
  //
  // }

}


/**
 * Gives the coordinates of the border for keeping the nodes inside a frame
 * http://bl.ocks.org/mbostock/1129492
 */
function nodeTransform(d) {
  if(!d.clicked)
  {
    d.x =  Math.max(maxNodeSize, Math.min(w - (d.imgwidth/8 || 16), d.x));
    d.y =  Math.max(maxNodeSize, Math.min(h - (d.imgheight/8 || 16), d.y));

  }else{

  }
  return "translate(" + d.x + "," + d.y + ")";
}

/**
 * Toggle children on click.
 */
function click(d) {
  // if (d.children) {
  //   d._children = d.children;
  //   d.children = null;
  // } else {
  //   d.children = d._children;
  //   d._children = null;
  // }

  // update();
}

// returns an array of children nodes. If addToStage, all children nodes are also added to the stage tree
function getNodeChildren(nodeID, addToStage){

  var relatedLinkIDs = nodesArr.find(node => node.id = nodeID).related; // IDs of nodes related to this one
      relatedLinksArr = []; // populated with the actual nodes (not just IDs), this is what we return

  // For every link, checking if the child/target node also exists in selectedNodes[]
  relatedLinkIDs.forEach(childID => {
    var childNode = nodesArr.filter( node => node.id === childID)[0];

    // Pushing the relatedNode to nodesArr, if the childNode also exists in selectedNodes [] (is on-screen)
    // Checking if the current childNode already exists in selectedNodes[] (on-screen nodes to be rendered)
    if (!!selectedNodes.find( node => node.id === childNode.id)){
      relatedLinksArr.push( childNode );  // finding the node with the link.
    }else if(addToStage){
      // node does not exist in selectedNodes[], but we'll add it there
      childNode.children = getNodeChildren(childNode.id);
      // @FIX Shouldn't return all related nodes when adding to the stage.
      selectedNodes.push(childNode);
    }

  })

  return relatedLinksArr;
}

/**
 * Returns a list of all nodes under the root.
 */
function flatten(root) {

  var nodes = root,
      nodeIDs = nodes.map(node => node.id);

  // Using for instead of forEach, to access nodes & nodeIDs in the scope
  for(var i = 0; i < nodes.length; i++){
    let relatedNodeIDs = nodes[i].related.split(',').filter(id => nodeIDs.includes(id));
    nodes[i].children = nodes.filter(node => relatedNodeIDs.includes(node.id));
  }

  return nodes;
}


// Returns IDs of nodes currently active
function getActiveNodeIDs(){

}



// function flatten(root) {
//   var nodes = [];
//   var i = 0;

//   function recurse(node) {
//     if (node.children)
//       node.children.forEach(recurse);
//     if (!node.id)
//       node.id = ++i;
//     nodes.push(node);
//   }

//   recurse(root);
//
//   return nodes;
// }
