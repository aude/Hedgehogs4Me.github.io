var startTime;

function rendered() {
   //Render complete
   console.log("Render complete in "+((Date.now()-startTime)/1000)+" seconds.");
 }

 function startRender() {
   //Rendering start
   requestAnimationFrame(rendered);
 }

 function loaded() {
   requestAnimationFrame(startRender);
 }

function renderGalaxy(zoom, gal) {
  console.log("Please wait...");
  startTime = Date.now();
  document.body.innerHTML = ""; //lazy me
  gal = gal || defaultGalaxy;
  zoom = zoom || 0.8;

  var svgns = "http://www.w3.org/2000/svg",
      xlinkns = "http://www.w3.org/1999/xlink",
      svg = document.createElementNS(svgns, "svg"),
      backfilter = document.createElementNS(svgns, "filter"),
      backblur = document.createElementNS(svgns, "feGaussianBlur"),
      frontfilter = document.createElementNS(svgns, "filter"),
      //defs = document.createElementNS(svgns, "defs");
      viewBoxRadius = gal.radius/zoom;
  svg.appendChild(backfilter);
  backfilter.appendChild(backblur);
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svg.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
  svg.setAttribute("width", "100");
  svg.setAttribute("height", "100");
  svg.setAttribute("viewBox", (-viewBoxRadius)+" "+(-viewBoxRadius)+" "+(viewBoxRadius*2)+" "+(viewBoxRadius*2));
  svg.setAttribute("onload", "giveElapsedTime()");
  backfilter.setAttribute("id", "backblur");
  backblur.setAttribute("in", "SourceGraphic");
  backblur.setAttribute("stdDeviation", 20);

  //below was a sneaky way I tried to make the code faster that didn't work at all

  // for(var i=0; i<15; i++) {
  //   var g = document.createElementNS(svgns, "g"),
  //       circle = document.createElementNS(svgns, "circle");
  //   g.setAttribute("id", i.toString());
  //   circle.setAttribute("fill", "hsl("+(i*10)+", 100%, 60%)");
  //   circle.setAttribute("fill-opacity", 0.04);
  //   circle.setAttribute("r", (i*10)/10+14);
  //   circle.setAttribute("filter", "url(#backblur)");
  //   g.appendChild(circle);
  //   defs.appendChild(g);
  // }
  //
  // svg.appendChild(defs);
  //
  // for(staKey in gal.stars) {
  //   var circle = document.createElementNS(svgns, "use"),
  //       sta = gal.stars[staKey];
  //   circle.setAttributeNS(xlinkns, "href", "#"+(Math.ceil(sta.hue/10)));
  //   circle.setAttribute("x", 0);
  //   circle.setAttribute("y", -sta.position.distance); //north is up, y is down
  //   circle.setAttribute("transform", "rotate("+sta.position.longitude+")");
  //   //circle.setAttribute("filter", "url(#backblur)");
  //   svg.appendChild(circle);
  // }

  for(staKey in gal.stars) {
    var circle = document.createElementNS(svgns, "circle"),
        sta = gal.stars[staKey];
    circle.setAttribute("cx", 0);
    circle.setAttribute("cy", -sta.position.distance); //north is up, y is down
    circle.setAttribute("fill", "hsl("+sta.hue+", 100%, 60%)"); //temporary
    circle.setAttribute("fill-opacity", 0.04);
    circle.setAttribute("r", sta.hue/10+14); //temporary
    circle.setAttribute("transform", "rotate("+sta.position.longitude+")");
    circle.setAttribute("filter", "url(#backblur)"); //THIS ONE LINE SLOWS EVERYTHING DOWN TO SHIT
    svg.appendChild(circle);
  }

  for(staKey in gal.stars) {
    var circle = document.createElementNS(svgns, "circle"),
        sta = gal.stars[staKey];
    circle.setAttribute("cx", 0);
    circle.setAttribute("cy", -sta.position.distance); //north is up, y is down
    circle.setAttribute("fill", "hsl("+sta.hue+", 100%, 80%)"); //temporary
    circle.setAttribute("r", sta.hue/500); //temporary
    circle.setAttribute("fill-opacity", 0.8);
    circle.setAttribute("transform", "rotate("+sta.position.longitude+")");

    svg.appendChild(circle);
  }

  document.body.appendChild(svg);
  loaded();
}

var galaxy = function(radius, population, clusterStars) {
  this.population = population;
  this.radius = radius;
  this.stars = {};
  this.clusters = [];

  for(var i=0; i<population; i++) {
    //Since each iteration also adds a normal star and increments by 1,
    // each of those star additions adds one to clusters.length,
    // and so when clusterStars + clusters.length is equal to i,
    // that's when we have enough cluster stars.
    //(could probably be optimized)
    if(i < clusterStars + this.clusters.length) {
      //Yes, open clusters and globular clusters have the same populations.
      // This is one of the many things that this rendering does way, way differently than real life.
      var clu = new cluster(this, Math.floor(Math.random()*5+5));
      this.clusters.push(clu);
      i += clu.population;
    }

    var sta = new star(this);
    this.stars[sta.positionString] = sta;
    //console.log(this.stars[sta.positionString]);
  }

  logGalaxyInfo(this);
}

var cluster = function(gal, population) {
  this.population = population;
  //Todo: once I know globular clusters work, make them much rarer than open clusters.
  this.kind = Math.random()>0.8 ? cluster.kinds.globular : cluster.kinds.open;
  this.position = weightedClusterPosition(gal, this.kind);
  this.positionString = this.position.longitude+", "+this.position.distance;
  this.stars = {};
  for(var i=0; i<population; i++) {
    var sta = new star(gal, this);
    this.stars[sta.positionString] = sta;
    gal.stars[sta.positionString] = sta;
  }
}

cluster.kinds = {
  open: 0,
  globular: 1
}

//Todo: refactor this constructor to not suck
var star = function(gal, clu) {
  //Rarely make blue stars
  var colorPrelim = Math.random()*50+10;
  this.hue = Math.floor(
    clu ?
      clu.kind === cluster.kinds.open ? //if it's a cluster, blue if open
        colorPrelim<28 ? //in an open cluster, blue stars are more common (exaggerated here)
          colorPrelim*2
        : colorPrelim*3/8 + 217.5 //oh god, so ugly. Matches the blue range of the other one though.
      : colorPrelim
    : colorPrelim<57 ? //if it's not a cluster, blue stars are rare
      colorPrelim
    : colorPrelim*4
  );

  //console.log("Hue: "+this.hue);

  if (clu) this.cluster = clu;

  this.position = weightedStellarPosition(gal, this.hue, clu);
  this.positionString = this.position.longitude+", "+this.position.distance;
}

function weightedStellarPosition(gal, hue, clu) {
  var lon, dis;

  if (clu) {
    lon = clu.position.longitude + (Math.random()*2 - 1);
    // pi*r/360 I think is technically what would be more or less fair given a dis of radius/2
    // but let's try 100 because I'm not even totally sure about my math
    dis = clu.position.distance + ((Math.random()-0.5) * gal.radius/100);
  }
  else {
    //For now, just a circle that's denser in the center, no preference for different kinds of stars
    lon = Math.random()*360;
    dis = Math.pow(Math.random(), hue>100?1/2.5:0.8)*gal.radius;
  }

  return {
    longitude: lon,
    distance: dis
  }
}

function weightedClusterPosition(gal, kind) {
  var lon = Math.random()*360;
  var dis;

  //Todo: make this not dumb (this is just for testing and basic setup right now)
  if(kind === cluster.kinds.open) {
    //outer half
    dis = (Math.random()+1)*gal.radius/2;
  }
  else {
    //inner half
    dis = Math.random()*gal.radius/2;
  }

  return {
    longitude: lon,
    distance: dis
  }
}

//Currently EMCAScript 6 only because Object.assign
function logGalaxyInfo(gal) {
  function surveyStars(starObj) {
    var red = 0, yellow = 0, blue = 0;

    for(sta in starObj) {
      //console.log(sta);
      if(starObj[sta].hue < 35) red++;
      else if(starObj[sta].hue < 100) yellow++;
      else blue++;
    }

    return red+" red, "+yellow+" yellow, "+blue+" blue";
  }

  var info = "This galaxy is "+gal.radius+" parsecs (I guess?) across.";
  info += "\nIt contains "+gal.population+" stars, including...";

  var clusters;
  for(clust in gal.clusters) {
    info += "\n- A"+(gal.clusters[clust].kind === cluster.kinds.globular ? " globular" : "n open")+" cluster at "+gal.clusters[clust].positionString+" with "+gal.clusters[clust].population+" stars (";
    info += surveyStars(gal.clusters[clust].stars);
    info += ")";
  }

  var nonClusterStars = Object.assign({}, gal.stars);
  var nonClusterCount = 0;
  for(sta in nonClusterStars) {
    if(nonClusterStars[sta].cluster) delete nonClusterStars[sta];
    else nonClusterCount++;
  }

  info += "\nThis leaves "+nonClusterCount+" free stars (";
  info += surveyStars(nonClusterStars);
  info += ")";

  console.log(info);
}

var defaultGalaxy = new galaxy(100, 3000, 200);
