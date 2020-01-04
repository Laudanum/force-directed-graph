'use strict';

/*
 * @TODO
 * - [v] Resize with the window
 * - [ ] Mobile version
 *      - [ ] Test touches
 *      - [ ] Remove hovers
 *      - [ ] Show some labels
 * - [ ] Fix settings for each force
 * - [ ] Enable collision detection
 * - [ ] Integrate static pages
 * - [ ] Add menu
 * - [ ] Fix label sizes so they don't grab focus
 * - [ ] Fix label hovers
 * - [ ] Fix z-indexes
 * - [ ] Compare with Flash version
 * - [ ] Add badges
 * - [ ] Add night-mode
 * - [v] Convert CSS to SASS
 * - [ ] Add self.log() fn
 * - [ ] Support other browsers
 */


class App {
  debug = false;

  dataFile = '/assets/js/json/data.json';
  maxNodes = 12;
  maxEdgesPerNode = 3;
  maxEdges = Math.round(this.maxEdgesPerNode * this.maxNodes * 0.8);
  relatedNodesRatio =  0.6;
  w = 500;
  h = 500;
  bodyCharge = -50;
  imageSize = 50;
  // linkStrength = 50;
  linkDistance = 120;
  textOffset = {
    x: 20,
    y: 40,
  };
  label = {
    width: 290,
    height: 75,
  };


  constructor(appName) {
    this.dataSet = null;

    // Measure the window.
    this.updateStageSize()

    this.loadData()
      .then(dataSet => {
        this.dataSet = dataSet;
        console.log(`Data loaded ${this.dataSet.length} nodes found.`);

        return this.getNodes();
      })
      .then(nodes => {
        console.log(`Received ${nodes.length} random nodes.`);

        this.initialiseSimulation(nodes);
        this.startSimulation();
      })
      ;
  }


  /*
   * Returns a promise of data.
   */
  loadData() {
    return new Promise((resolve, reject) => {
      fetch(this.dataFile)
        .then(res => {
          if (!res.ok) {
            throw new Error('HTTP error ' + res.status);
          }
          return res.json();
        })
        .then(json => {
          resolve(json.record);
        })
        .catch(err => reject(err))
    })
  }


  /*
   * Get up to maxNodes random nodes.
   */
  getNodes(maxNodes) {
    const self = this;

    if ( ! maxNodes ) maxNodes = this.maxNodes;

    return self.cull(this.dataSet, maxNodes);
  }


  /*
   * Get nodes related to this node.
   */
  getRelatedNodes(id) {
    const self = this;

    if ( self.debug )
      console.log(`Get nodes related to ${id}.`);

    const node = self.dataSet.filter(n => n.id === id);

    return self.dataSet.filter(n => {
      return node[0].related.indexOf(n.id) !== -1;
    });
  }


  /*
   * Given a set of nodes calculate their edges.
   */
  getEdges(nodes, maxEdgesPerNode) {
    const self = this;

    if ( ! nodes || nodes.length === 0 ) return [];

    // Flatten the current nodes into an array of ids.
    const currentNodeIds = nodes.map(node => node.id);

    let edges = [];
    // Iterate the nodes
    nodes.forEach(node => {
      // Filter related by whether it exists in nodes.
      let related = node.related.filter(r => {
        return currentNodeIds.indexOf(r) > -1;
      })

      // Reduce the number of edges for any given node.
      // Note this is the only place where a `get` does a `cull` but I can't
      // think of a better place to do this.
      related = self.cull(related, maxEdgesPerNode);

      // Iterate each related.
      const sourceId = currentNodeIds.indexOf(node.id);
      related.forEach(related => {
        // Source and target are indexes in the array.
        const targetId = currentNodeIds.indexOf(related);
        edges.push({source: sourceId, target: targetId});
      })
    });
    if ( self.debug )
      console.log(`${edges.length} edges.`);

    return edges;
  }


  /*
   * Sets a bounding box - used to draw rectangles behind text labels
   * when a node is hovered over.
   */
  getBoundingBox(selection) {
    selection.each(function(d) {
      // d.boundingBox = this.getBBox();
      d.boundingBox = this.getBoundingClientRect();
    });
  }


  /*
   * Given a data point return the correct HTML.
   */
  getHtml(data) {
    let html = `<strong>${data.title}</strong>`;
    if ( data.artist )
      html += `<br>${data.artist}`;
    return html;
  }


  /*
   * Accepts an array and a max number of items.
   * Optionally it also accepts a item to preserve.
   * Returns a number of items randomly culled.
   */
  cull(items, max, preserve) {
    const self = this;
    let preserved;

    if ( self.debug )
      console.log(`Culling to ${max}.`);

    if ( preserve ) {
      preserved = _.find(items, item => item.id === preserve.id);
      items = _.filter(items, item => item.id !== preserve.id);
    }

    if ( max < 1 ) {
      if ( preserved )
        return [preserved];
      return [];
    }

    items = _.shuffle(items).slice(0, max);

    if ( preserved )
      items.push(preserved);

    return items;

  }


  /*
   * Move this node to the centre of the simulation.
   */
  centreNodeImmediately(node) {
    const self = this;

    node.fx = self.w/2;
    node.fy = self.h/2;

    return;
  }


  /*
   * Animate this node to the centre of the simulation.
   */
  centreNode(node) {
    const self = this;

    // Animating the node to the center
    const
        alpha = 16,
        alphaTarget = 0.1
        ;
    let
        dx,
        dy;

    // RequestAnimationFrame event-handler
    function stepCentreNode(timestamp) {
      const targetX = self.w / 2,
        targetY = self.h / 2;

      // Cancel the centring if our pinned node has changed.
      if ( self.pinned !== node.id ) {
        if ( self.debug ) {
          console.log(`Centring of ${node.id} has stopped.`);
        }
        self.tick();
        return false;
      }
      // Animating the node towards the center
      dx = targetX - node.x,
      dy = targetY - node.y;
      // @FIX Use the simulations alpha
      node.x += dx / alpha;
      node.y += dy / alpha;
      node.px = node.x;
      node.py = node.y;

      // Only animate until the distance from target is greater than
      // the alpha target.
      // @FIX Use the simulations alpha target
      const alphaTarget = 0.1;
      if ( Math.abs(dx) > alphaTarget || Math.abs(dy) > alphaTarget ) {
        window.requestAnimationFrame(stepCentreNode);
      } else {
        // Animation complete
        node.x = targetX;
        node.y = targetY;
        node.px = node.x;
        node.py = node.y;

        self.pinned = null;
        self.tick();

        if ( self.debug )
          console.log(`Centre of ${node.id} has been achieved.`)
      }
    }

    window.requestAnimationFrame(stepCentreNode);
  }


  /*
   * Set the w and h variables.
   */
  updateStageSize() {
    const self = this;

    const simulation = d3.select('#simulation > svg');

    self.w = simulation.node().getBoundingClientRect().width;
    self.h = simulation.node().getBoundingClientRect().height;
    simulation.attr("width", self.w);
    simulation.attr("height", self.h);
  }


  /*
   * Pin the clicked node to the center of the simulation.
   * Get more nodes related to the clicked node.
   * Recalculate edges.
   * Update the simulation.
   */
  nodeEventHandler(d) {
    const self = this;

    if ( self.debug )
      console.log(`Node ${d.id} clicked.`);

    // Pin the current node to the centre.
    self.pinned = d.id;
    self.centreNode(d);

    let relatedNodes = self.getRelatedNodes(d.id);
    // Cull related nodes too.
    relatedNodes = self.cull(relatedNodes, Math.round(self.maxNodes * self.relatedNodesRatio));
    let currentNodes = self.simulation.nodes();

    if ( self.debug )
      console.log(relatedNodes);

    // Set each node to the centre of the simulation.
    relatedNodes.forEach(node => {
      if ( node.x === undefined ) {
        node.x = self.w/2;
        node.y = self.h/2;
      }
    })

    // Cull down (randomly) to maxNodes.
    if ( self.debug )
      console.log(`${currentNodes.length} nodes before culling.`);
    // @FIX Don't cull the one we clicked.
    currentNodes = self.cull(currentNodes, self.maxNodes - relatedNodes.length, d);
    if ( self.debug )
      console.log(`${currentNodes.length} nodes after culling.`);

    // Merge related nodes with culled current nodes.
    currentNodes = currentNodes.concat(relatedNodes);
    if ( self.debug )
      console.log(`${currentNodes.length} nodes after merging.`);

    // Dedupe currentNodes.
    currentNodes = _.uniqBy(currentNodes, 'id');
    if ( self.debug )
      console.log(`${self.currentNodes.length} unique nodes.`);

    // Cull again
    if ( currentNodes.length > self.maxNodes )
      currentNodes = self.cull(currentNodes, self.maxNodes, d);

    self.currentNodes = currentNodes;

    // Recalculate edges.
    self.edges = self.getEdges(self.currentNodes, self.maxEdgesPerNode);
    self.edges = self.cull(self.edges, self.maxEdges);

    self.simulation.nodes(self.currentNodes);

    // Recreate the links force.
    self.simulation
      .force('link', d3.forceLink().distance(self.linkDistance).links(self.edges))
      // .force('charge', d3.forceManyBody().strength(self.bodyCharge))
      .force('center', d3.forceCenter(this.w / 2, this.h / 2))
      ;

    if ( self.debug )
      console.log(`Simulation now has ${self.simulation.nodes().length} nodes.`);

    self.updateNodes();
    self.updateEdges();

    // If alpha was zero restart as well.
    if ( self.simulation.alpha() > self.simulation.alphaTarget() ) {
      self.simulation.alpha(0.5);
      // self.simulation.alphaTarget(0.01);
      self.simulation.restart();
    }
    // Update alpha which will restart tick() https://github.com/d3/d3-force/issues/97
    // self.simulation.alpha(self.simulation.alpha() * 1.5);
    // self.simulation.alpha(1);
    // else
      // self.simulation.alphaTarget(0.2);
  }


  /*
   * Opens the URL.
   */
  labelEventHandler(d) {
    window.location = d.link.url;
  }


  /*
   * Set up the simulation with a set of nodes.
   * https://www.d3indepth.com/force-layout/
   */
  initialiseSimulation(nodes) {
    const self = this;

    self.currentNodes = nodes;

    self.simulation = d3.forceSimulation(nodes)
      .force('charge', d3.forceManyBody().strength(self.bodyCharge))
      .force('center', d3.forceCenter(this.w / 2, this.h / 2))


    d3.select(window)
      .on("resize", () => {
        self.updateStageSize();

        // Recentre
        self.simulation
          .force('center', d3.forceCenter(this.w / 2, this.h / 2))
          ;

        // If the simulation has stopped; reheat.
        if ( self.simulation.alpha() > self.simulation.alphaTarget() ) {
          self.simulation.alpha(0.5);
          self.simulation.restart();
        }
      });

    console.log(`Simulation initialised.`);
  }


  /*
   * Add all the required events.
   */
  startSimulation() {
    const self = this;

    // Calculate all the edges in self.nodes.
    self.edges = self.getEdges(self.currentNodes, self.maxEdgesPerNode);
    self.edges = self.cull(self.edges, self.maxEdges);
    if ( self.debug )
      console.log(`Found ${self.edges.length} edges.`);

    // Add the link force.
    self.simulation
      .force('link', d3.forceLink().distance(self.linkDistance).links(self.edges))
      ;

    self.simulation.on('tick', () => {
      self.tick();
    });

    self.updateNodes();
    self.updateEdges();
  }


  /*
   * Called when we want to change the data.
   */
  updateNodes() {
    const self = this;

    if ( self.debug )
      console.log(`${self.currentNodes.length} nodes.`);

    const simulation = d3.select('svg')
      .select('g.nodes')
      .selectAll('g.node')
      .data(self.currentNodes, d => d.id)
      ;

    const item = simulation.enter()
      .append('svg:g')
      .attr('class', 'node')
      .on('click', d => self.nodeEventHandler(d))
      ;

    // Circles
    if ( self.debug ) {
      item
        .append('circle')
        .attr('r', 5)
        ;
    }

    // Doodles
    item
      .append('svg:image')
      .attr('xlink:href', function(d) {
        return d.image.url;
      })
      ;

    // Labels
    item
      .append('foreignObject')
      .attr('width', self.label.width)
      .attr('height', (d) => {
        if ( d.boundingBox ) {
          return d.boundingBox.height;
        }
        return self.label.height;
      })
      .attr('class', 'label-container')
      .append('xhtml:body')
      .attr('class', 'label')
      .attr('text-anchor', 'middle')
      .attr('x', self.textOffset.x)
      .attr('y', self.textOffset.x)
      .html(function(d) { return self.getHtml(d); })
      .on( 'click', self.labelEventHandler)
      .call(self.getBoundingBox)
      ;

    // Join to the simulation.
    item.merge(simulation)

    simulation.exit().remove();
  }


  /*
   * Called when the data changes.
   * And by the simulation on each frame.
   */
  updateEdges() {
    const self = this;

    const simulation = d3.select('svg')
      .select('g.edges')
      .selectAll('line')
      .data(self.edges, d => { return `${d.source.id}-${d.target.id}`; })
      ;

    simulation.enter()
      .append('line')
      .merge(simulation)
      .attr('x1', function(d) {
        return d.source.x
      })
      .attr('y1', function(d) {
        return d.source.y
      })
      .attr('x2', function(d) {
        return d.target.x
      })
      .attr('y2', function(d) {
        return d.target.y
      })
      ;

    simulation.exit().remove();
  }


  /*
   * Called by the simulation on every frame.
   */
  tick() {
    const self = this;

    const simulation = d3.select('svg')
      .selectAll('g.node')
      .attr('class', d => {
        // @FIX Why can't we do this once, elsewhere?
        if ( d.id === self.pinned ) {
          return 'node node-pinned';
        }
        return 'node';
      })
      .attr('transform', d => {
        return `translate(${d.x}, ${d.y})`;
      })
      ;

    simulation.exit().remove();

    self.updateEdges();
  }

}

const app = new App('Constellation');
