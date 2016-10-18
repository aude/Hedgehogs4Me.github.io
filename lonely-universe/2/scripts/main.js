var startTime;

var mouseDowns = {
  map: false
};

var lastMousePosition;

function clearMouseDowns() {
  for (down in mouseDowns) {
    mouseDowns[down] = false;
  }

  lastMousePosition = undefined;
}

function mouseUp(e) {
  if (e.button == 0) {
    clearMouseDowns();
  }
}

function mouseDown(e) {
  if (e.button == 0) {
    if (e.currentTarget.id == "map") {
      mouseDowns.map = true;
      lastMousePosition = [e.screenX, e.screenY];
    }
  }
}

function mouseMove (e) {
  if (mouseDowns.map) {
    if (lastMousePosition) {
      var mapC = document.getElementById("mapContainer");
      mapC.scrollLeft += lastMousePosition[0]-e.screenX;
      mapC.scrollTop += lastMousePosition[1]-e.screenY;
      lastMousePosition = [e.screenX, e.screenY];
    }
  }
}

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

function renderGalaxy(zoom, topLeftX, topLeftY, gal) {
  console.log("Please wait...");
  startTime = Date.now();
  gal = gal || defaultGalaxy;
  zoom = zoom || 0.8;
  if (zoom < 0.8) zoom = 0.8;
  var viewBoxRadius = gal.radius/zoom;
  //This also sanitizes in the case of undefined, etc
  //Will not handle stuff like null, unfortunately
  topLeftX = topLeftX >= -gal.radius/0.8 ? +topLeftX : -gal.radius/0.8;
  topLeftY = topLeftY >= -gal.radius/0.8 ? +topLeftY : -gal.radius/0.8;
  //Make sure you don't go too far down or to the right
  //May require adjustment for non-square screens and stuff
  if (topLeftX + viewBoxRadius*2 > gal.radius/0.8) topLeftX = (gal.radius/0.8) - viewBoxRadius*2;
  if (topLeftY + viewBoxRadius*2 > gal.radius/0.8) topLeftY = (gal.radius/0.8) - viewBoxRadius*2;

  var sameGalaxy = document.getElementById(gal.numericId);
  if(sameGalaxy) {
    sameGalaxy.setAttribute("viewBox", topLeftX+" "+topLeftY+" "+(viewBoxRadius*2)+" "+(viewBoxRadius*2));
    loaded();
    return;
  }

  var galaxyMap = document.getElementById("map");
  galaxyMap.innerHTML = ""; //lazy me

  var svgns = "http://www.w3.org/2000/svg",
      xlinkns = "http://www.w3.org/1999/xlink",
      svg = document.createElementNS(svgns, "svg"),
      defs = document.createElementNS(svgns, "defs");
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svg.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
  // svg.setAttribute("width", "100");
  // svg.setAttribute("height", "100");
  svg.setAttribute("viewBox", topLeftX+" "+topLeftY+" "+(viewBoxRadius*2)+" "+(viewBoxRadius*2));
  svg.setAttribute("id", gal.numericId);

  for (var i=0; i<26; i++) {
    var radialGradient = document.createElementNS(svgns, "radialGradient");
    radialGradient.setAttribute("id", i.toString());

    for (var j=0; j<5; j++) {
      var stop = document.createElementNS(svgns, "stop");
      stop.setAttribute("offset", Math.floor((100/64)*Math.pow(j, 3))+"%");
      stop.setAttribute("stop-color", "hsl("+(i*10)+", 100%, "+(40+(10*(4-j)))+"%)");
      stop.setAttribute("stop-opacity", 3*(100-(25*j))/2000);
      radialGradient.appendChild(stop);
    }

    defs.appendChild(radialGradient);
  }

  //center def
  var radialGradient = document.createElementNS(svgns, "radialGradient"),
      insideStop = document.createElementNS(svgns, "stop"),
      middleStop = document.createElementNS(svgns, "stop"),
      outsideStop = document.createElementNS(svgns, "stop");
  radialGradient.setAttribute("id", "center");

  insideStop.setAttribute("offset", "0%");
  insideStop.setAttribute("stop-color", "hsl(40, 100%, 90%)");
  middleStop.setAttribute("offset", "50%");
  middleStop.setAttribute("stop-color", "hsl(40, 100%, 90%)");
  middleStop.setAttribute("stop-opacity", "0.3");
  outsideStop.setAttribute("offset", "100%");
  outsideStop.setAttribute("stop-color", "hsl(40, 100%, 90%)");
  outsideStop.setAttribute("stop-opacity", "0");
  radialGradient.appendChild(insideStop);
  radialGradient.appendChild(middleStop);
  radialGradient.appendChild(outsideStop);

  defs.appendChild(radialGradient);

  svg.appendChild(defs);

  for(staKey in gal.stars) {
    var sta = gal.stars[staKey];
    var circle = document.createElementNS(svgns, "circle");
    circle.setAttribute("fill", "url(#"+(Math.floor(sta.hue/10))+")");
    circle.setAttribute("cx", 0);
    circle.setAttribute("cy", -sta.position.distance); //north is up, y is down
    circle.setAttribute("r", sta.hue/8+4);
    circle.setAttribute("transform", "rotate("+sta.position.longitude+")");

    circle.setAttribute("class", "unclickable");

    svg.appendChild(circle);
  }

  for(staKey in gal.stars) {
    var circle = document.createElementNS(svgns, "circle"),
        sta = gal.stars[staKey];
    circle.setAttribute("cx", 0);
    circle.setAttribute("cy", -sta.position.distance); //north is up, y is down
    circle.setAttribute("fill", "hsl("+sta.hue+", 100%, 80%)"); //temporary
    circle.setAttribute("r", sta.hue/1500+0.15); //temporary
    circle.setAttribute("fill-opacity", 0.8);
    circle.setAttribute("transform", "rotate("+sta.position.longitude+")");

    svg.appendChild(circle);
  }

  var center = document.createElementNS(svgns, "circle");
  center.setAttribute("fill", "url(#center)");
  center.setAttribute("r", gal.radius*0.5);
  center.setAttribute("id", "galacticCenter");
  center.setAttribute("class", "unclickable");

  svg.appendChild(center);


  galaxyMap.appendChild(svg);
  // var img = document.createElement("img");
  // img.setAttribute("src", "data:image/svg+xml;base64," + btoa(svg.outerHTML));
  // img.setAttribute("width", "100px");
  // img.setAttribute("height", "100px");
  // galaxyMap.appendChild(img);

  loaded();
}

var galaxy = function(radius, population, clusterStars) {
  this.numericId = Math.random().toString(); //irresponsible
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

  var rdm = Math.random();
  if(clu) {
    this.cluster = clu;
    if(clu.kind === cluster.kinds.open) {
      //Open clusters
      if(rdm < 0.5) {
        //Blue stars
        this.hue = 225 + Math.random()*15;
      }
      else if(rdm < 0.75) {
        //Yellow stars
        this.hue = 35 + Math.random()*15;
      }
      else {
        //Red stars
        this.hue = 10 + Math.random()*25;
      }
    }
    else {
      //Globular clusters
      if(rdm < 0.03) {
        //Blue stars
        this.hue = 225 + Math.random()*15;
      }
      else if(rdm < 0.15) {
        //Yellow stars
        this.hue = 35 + Math.random()*15;
      }
      else {
        //Red stars
        this.hue = 10 + Math.random()*25;
      }
    }
  }
  else {
    //Free stars
    if(rdm < 0.25) {
      //Blue stars
      this.hue = 225 + Math.random()*15;
    }
    else if(rdm < 0.6) {
      //Yellow stars
      this.hue = 35 + Math.random()*15;
    }
    else {
      //Red stars
      this.hue = 10 + Math.random()*25;
    }
  }

  this.position = weightedStellarPosition(gal, this.hue, clu);
  this.positionString = this.position.longitude+", "+this.position.distance;
}

function biasToGalaxyArms(dis, lon, hue) {
  var spread = hue>100 ? 6 - lon/100 : (3.8 - lon/300);
  var arm = Math.random() > 1;
  var focusDistance = lon * (1/400) + 1/10;
  dis = spread * (dis-1) * dis * (dis-focusDistance) + dis;
  if (hue < 100){
    if (dis < 0.1) dis += 0.05 + Math.random()*0.1;
    if (lon > 180 + Math.random()*60 && Math.random() < 0.2 && dis > 0.5) dis -= 0.5;
  }
  else if (hue > 100) {
    if (dis < 0.2) dis += 0.5;
    if (lon < 180 - Math.random()*140 && Math.random() < 0.4 && dis < 0.5) dis += 0.5;
  }
  if(Math.random() > 0.5) dis *= -1;
  return dis;
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
    if (hue > 100) {
      //dis = Math.pow(Math.random(), 1/2.5);
      dis = Math.random();
      dis = (Math.tan(2*dis - 1) + Math.tan(1) + 3.5 - Math.PI) / 3.5; //Remove stars from inside and fade/normalize
      dis = biasToGalaxyArms(dis, lon, hue);
      dis *= gal.radius;
    }
    else {
      dis = Math.pow(Math.random(), 1/0.7);
      dis = (Math.tan(2*dis - 1) + Math.tan(1)) / Math.PI; //fade/normalize
      dis = biasToGalaxyArms(dis, lon, hue);
      dis *= gal.radius;
    }
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
    dis = 0.4 + Math.random()/2;
    dis = biasToGalaxyArms(dis, lon, 230);
    dis *= gal.radius;
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

// function galaxyDragStart(e) {
//   var smokeScreen = document.createElement("div");
//   smokeScreen.setAttribute("style", "position: fixed; background-color: black; top: 0; left:0; right: 0; bottom: 0;")
//   document.body.insertBefore(smokeScreen, e.target);
// }

var defaultGalaxy = new galaxy(100, 1200, 200);
