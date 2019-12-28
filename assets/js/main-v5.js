'use strict';

class App {
  debug = false;

  dataFile = '/assets/js/json/data.json';
  maxNodes = 16;
  maxEdges = 4;
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


  constructor(appName) {
    this.dataSet = null;

    // Measure the window.
    this.w = document.getElementsByTagName('svg')[0].clientWidth;
    this.h = document.getElementsByTagName('svg')[0].clientHeight;

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
    // @FIX This should be random.
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
      // @TODO Cull related to 90%.
      return node[0].related.indexOf(n.id) !== -1;
    });
  }


  /*
   * Given a set of nodes calculate their edges.
   */
  getEdges(nodes, maxEdges) {
    const self = this;

    if ( ! nodes || nodes.length === 0 ) return [];

    // Flatten the current nodes into an array of ids.
    const currentNodeIds = nodes.map(node => node.id);

    let edges = [];
    // Iterate the nodes
    nodes.forEach(node => {
      // Filter related by whether it exists in nodes.
      const related = node.related.filter(r => {
        return currentNodeIds.indexOf(r) > -1;
      })

      // Iterate each related.
      const sourceId = currentNodeIds.indexOf(node.id);
      related.forEach(related => {
        // Source and target are indexes in the array.
        const targetId = currentNodeIds.indexOf(related);
        edges.push({source: sourceId, target: targetId});
      })
    });
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
   * Returns a number of items randomly culled.
   */
  cull(items, max) {
    const self = this;

    if ( self.debug )
      console.log(`Culling to ${max}.`);

    if ( max < 1 )
      return [];
    return _.shuffle(items).slice(0, max);
  }


  /*
   * @TODO Centre the node.
   * @TODO Add more data.
   */
  nodeEventHandler(d) {
    const self = this;

    if ( self.debug )
      console.log(`Node ${d.id} clicked.`);

    // @TODO Pin the current node to the centre.

    let relatedNodes = self.getRelatedNodes(d.id);
    // Cull related nodes too
    relatedNodes = self.cull(relatedNodes, Math.round(self.maxNodes * 0.8));
    let currentNodes = self.simulation.nodes();

    if ( self.debug )
      console.log(relatedNodes);

    // Cull down (randomly) to maxNodes.
    if ( self.debug )
      console.log(`${currentNodes.length} nodes before culling.`);
    // @FIX Don't cull the one we clicked.
    currentNodes = self.cull(currentNodes, self.maxNodes - relatedNodes.length);
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
      currentNodes = self.cull(currentNodes, self.maxNodes);

    self.currentNodes = currentNodes;

    // Recalculate edges.
    self.edges = self.getEdges(self.currentNodes);
    // console.log(self.edges)
    // @TODO Cull edges.

    self.simulation.nodes(self.currentNodes);

    // Recreate the links force.
    self.simulation
      .force('link', d3.forceLink().distance(self.linkDistance).links(self.edges))
      // .force('charge', d3.forceManyBody().strength(self.bodyCharge))
      // .force('center', d3.forceCenter(this.w / 2, this.h / 2))
      ;

    if ( self.debug )
      console.log(`Simulation now has ${self.simulation.nodes().length} nodes.`);

    self.updateNodes();
    self.updateEdges();
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

    console.log(`Simulation initialised.`);
  }


  /*
   * Add all the required events.
   */
  startSimulation() {
    const self = this;

    // Calculate all the edges in self.nodes.
    self.edges = self.getEdges(self.currentNodes);
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
      console.log(`${self.currentNodes.length} nodes`)

    const simulation = d3.select('svg')
      .select('g.nodes')
      .selectAll('g.node')
      .data(self.currentNodes, d => d.id)
      ;

    const item = simulation.enter()
      .append('svg:g')
      .attr('class', 'node')
      .on('click', e => self.nodeEventHandler(e))
      .merge(simulation)
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
      .attr('width', 290)
      .attr('height', 75)
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

    // Behaviours
    // @TODO

    simulation.exit().remove();
  }


  /*
   * Called when the data changes.
   * And by the simulation on each frame.
   * @TODO Separate out the creation and the tick.
   */
  updateEdges() {
    const self = this;

    const simulation = d3.select('svg')
      .select('g.edges')
      .selectAll('line')
      .data(self.edges)
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
      .attr('transform', function(d) {
        return `translate(${d.x}, ${d.y})`;
      })
      ;

    simulation.exit().remove();

    self.updateEdges();
  }

}

const app = new App('Constellation');
