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
    if ( ! maxNodes ) maxNodes = this.maxNodes;
    // @FIX This should be random.
    return this.dataSet.slice(0, maxNodes);
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
  getEdges(nodes) {
    const self = this;

    if ( ! nodes || nodes.length === 0 ) return [];

    // Flatten the current nodes into an array of ids.
    const currentNodeIds = nodes.map(node => node.id);

    const edges = [];
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

    return edges;
  }


  /*
   * Sets a bounding box - used to draw rectangles behind text labels
   * when a node is hovered over.
   */
  getBoundingBox(selection){
    selection.each(function(d){
      d.boundingBox = this.getBBox();
    })
  }


  /*
   * @TODO Centre the node.
   * @TODO Add more data.
   */
  nodeEventHandler(d) {
    const self = this;

    if ( self.debug )
      console.log(`Node ${d.id} clicked.`);

    const nodes = self.getRelatedNodes(d.id);

    if ( self.debug )
      console.log(nodes);
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
    self.simulation.force('link', d3.forceLink().distance(self.linkDistance).links(self.edges))

    this.simulation.on('tick', () => {
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

    const simulation = d3.select('svg')
      .select('g.nodes')
      .selectAll('g.node')
      .data(this.currentNodes)
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
      .append('text')
      .attr('class', 'label')
      .attr('text-anchor', 'middle')
      .attr('x', self.textOffset.x)
      .attr('y', self.textOffset.x)
      .text(function(d) { return d.title; })
      .on( 'click', self.labelEventHandler)
      .call(self.getBoundingBox)
      ;

    item
      .insert('rect', 'text')
      .attr('class', 'label-container')
      .attr('width', function(d){ return d.boundingBox.width + 10 })
      .attr('height', function(d){ return d.boundingBox.height + 5 })
      .attr('x', function(d){ return d.boundingBox.x - 5})
      .attr('y', function(d){return d.boundingBox.y - 2})
      .on( 'click', self.labelEventHandler);
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
