'use strict';

class App {
  dataFile = '/assets/js/json/data.json';
  maxNodes = 24;
  w = 500;
  h = 500;
  bodyCharge = -50;
  imageSize = 50;
  // linkStrength = 50;
  linkDistance = 120;


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
            throw new Error("HTTP error " + res.status);
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
   * Given a set of nodes calculate their links.
   */
  getLinks(nodes) {
    const self = this;

    if ( ! nodes || nodes.length === 0 ) return [];

    // Flatten the current nodes into an array of ids.
    const currentNodeIds = nodes.map(node => node.id);

    const links = [];
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
        links.push({source: sourceId, target: targetId});
      })
    });

    return links;
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

    // Calculate all the links in self.nodes.
    self.links = self.getLinks(self.currentNodes);
    console.log(`Found ${self.links.length} edges.`);

    // Add the link force.
    self.simulation.force('link', d3.forceLink().distance(self.linkDistance).links(self.links))

    this.simulation.on('tick', () => {
      self.tick();
    });

    self.updateNodes();
    self.updateLinks();
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
      .merge(simulation)
      ;

    // Circles
    item
      .append('circle')
      .attr('r', 5)
      ;

    // Doodles
    item
      .append('svg:image')
      .attr('xlink:href', function(d) {
        return d.image.url;
      })
      .attr('width', self.imageSize)
      .attr('height', self.imageSize)
      .attr('x', d => self.imageSize / -2)
      .attr('y', d => self.imageSize / -2)
      ;

    // Labels
    // @TODO

    // Behaviours
    // @TODO

    simulation.exit().remove();
  }

  /*
   * Called when the data changes.
   * And by the simulation on each frame.
   * @TODO Separate out the creation and the tick.
   */
  updateLinks() {
    const self = this;

    const simulation = d3.select('svg')
      .select('g.links')
      .selectAll('line')
      .data(self.links)
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

    self.updateLinks();
  }

}

const app = new App('Constellation');
