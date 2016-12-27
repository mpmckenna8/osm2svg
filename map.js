// 46°47′12.98″N 92°5′53.5″W doluth
var center = [-122.4283, 37.7750] // San Francisco

// this has to get a map from mapzen and give me the data
var layers = ['roads', 'earth', 'landuse', 'places', 'pois', 'transit', 'water', 'boundaries', 'roads', 'buildings'];
filterLayer = 'roads';
var zoom = 13,
scalar = 20;

var laysel = d3.select('#layerSelect')
    .on('change', function(d){


      console.log(d, this.value)
      filterLayer = this.value;

      svg.selectAll('g').remove()

      renderMap()


    })

laysel.selectAll('option')
  .data(layers)
  .enter()
  .append('option')
  .text(function(d){
    console.log(d)
    return d
  })


var pi = Math.PI,
    tau = 2 * pi;

var width = 500 //Math.max(960, window.innerWidth),
    height = Math.max(500, window.innerHeight);


// Initialize the projection to fit the world in a 1×1 square centered at the origin.
var projection = d3.geoMercator()
.center([-122.4283, 37.7750])
.scale((1 << scalar) / 2 / Math.PI)
.translate([width / 2, height / 2]);

var path = d3.geoPath()
    .projection(projection);

var tiler = d3.tile()
    .size([width, height]);


var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr('id', 'svgo');

// To show what the tiler thing returns
//console.log(tiler.scale(projection.scale() * 2 * Math.PI).translate(projection([0, 0]))())

renderMap()

function makesvglink(){
  //get svg element.
  var svgo = document.getElementById("svgo");

  //get svg source.
  var serializer = new XMLSerializer();
  var source = serializer.serializeToString(svgo);

  //add name spaces.
  if(!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)){
      source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  if(!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)){
      source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
  }

  //add xml declaration
  source = '<?xml version="1.0" standalone="no"?>\r\n' + source;

  //convert svg source to URI data scheme.
  var url = "data:image/svg+xml;charset=utf-8,"+encodeURIComponent(source);

  //set url value to a element's href attribute.
  document.getElementById("link").href = url;
  //you can download svg file by right click menu.


}


function changeScale(d){
  console.log(d.value)
  scalar = d.value;

  svg.selectAll('g').remove()

  renderMap()

}

function changeLat(d){
  center[1] = d.value;
  svg.selectAll('g').remove()

  renderMap();

}

function changeLon(d){

  center[0] = d.value;
  svg.selectAll('g').remove()

  renderMap();
}

function renderMap(){
  console.log('shoulr rnder again', scalar)
  // Initialize the projection to fit the world in a 1×1 square centered at the origin.
  projection = d3.geoMercator()
  .center(center)
  .scale((1 << scalar) / 2 / Math.PI)
  .translate([width / 2, height / 2]);

  path = d3.geoPath()
      .projection(projection);


      svg.selectAll("g")
          .data(tiler
            .scale(projection.scale() * 2 * Math.PI)
            .translate(projection([0, 0])))
        .enter().append("g")
          .each(function(d) {
            console.log('should have tile things again')
            console.log(d)
            zoom = d[2]
            var g = d3.select(this);

            d3.json("https://tile.mapzen.com/mapzen/vector/v1/all/" + d[2] + "/" + d[0] + "/" + d[1] + ".topojson?api_key=vector-tiles-ChxYDvR", function(error, json) {
              if (error) throw error;

        //      console.log(json);

        var data = {};
        for (var key in json.objects) {
          data[key] = topojson.feature(json, json.objects[key]);
        }

        console.log(data)
        console.log(filterLayer)
        // build up a single concatenated array of all tile features from all tile filterLayers
             var features = [];

               if(data[filterLayer])
               {
                   for(var i in data[filterLayer].features)
                   {
                       // Don't include any label placement points
                       if(data[filterLayer].features[i].properties.label_placement) { continue }
                       // Don't show large buildings at z13 or below.
                       if(zoom <= 13 && filterLayer == 'buildings') { continue }
                      // console.log(data[filterLayer].features[i])
                       // Don't show small buildings at z14 or below.
                       if(zoom <= 14 && filterLayer == 'buildings' && data[filterLayer].features[i].properties.area < 2000) { continue }
                //       if(data[filterLayer].features[i].properties.is_bicycle_related == true){ continue }
                       data[filterLayer].features[i].layer_name = filterLayer;
                       features.push(data[filterLayer].features[i]);
                   }
               }

              g.selectAll("path")
                .data(features.sort(function(a, b) { return a.properties.sort_key - b.properties.sort_key; }))
              .enter().append("path")
                .attr("class", function(d) { return d.properties.kind; })
                .attr("d", path)
                .attr("fill", 'none')
                .attr('stroke', 'purple');

/* Adds a circle where noisebridge is
              var nb = (projection([ -122.4193, 37.7624]));

              g.append('circle')
                .attr('cx', nb[0])
                .attr('cy',nb[1])
                .attr('r', 10);
  */


            makesvglink();

                });
        });

  makesvglink();
}
