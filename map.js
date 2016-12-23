// this has to get a map from mapzen and give me the data
var zoom = 13;

var width = 1000,
height = 1000

var svg = d3.select('svg');

var map = d3.select("body").append("div")
    .attr("class", "map")
    .style("width", width + "px")
    .style("height", height + "px")

var layer = map.append("div")
    .attr("class", "layer");

var projection = d3.geoMercator()
    .scale((1 << 21) / 2 / Math.PI) // change scale here, 21 is about z13
    .translate([-width / 2, -height / 2]); // just temporary

/*    var tile_projection = d3.geoTransform({
      point: function(x, y) {
        // Sometimes PBF points in a mixed-geometry layer are corrupted
        if(!isNaN(y)){
          x = x/extents*256;
          y = y/extents*256;
        } else {
          y = x[0][1]/extents * 256;
          x = x[0][0]/extents * 256;
        }
        this.stream.point(x, y);
      }
    })

    */
    var tile_projection = d3.geoMercator();


    var tilePath = d3.geoPath()
    .projection(tile_projection)


    var newcords = tilePath([-122.4407, 37.7524])

    console.log(lon2tile(-122.44, 13));
    console.log(lat2tile(37.744, 13));


  var tileX = 1309;
  var tileY = 3167;



var mapzenurl = "https://tile.mapzen.com/mapzen/vector/v1/all/" + zoom + "/" +
                  tileX + "/" + tileY +".topojson"


d3.json(mapzenurl, function(err, json){
  console.log(json);
  var k = Math.pow(2, zoom) * 256; // size of the world in pixels
  var zoom = 13;


  tilePath.projection()
    .translate([k / 2 - tileX * 256, k / 2 - tileY * 256]) // [0°,0°] in pixels
    .scale(k / 2 / Math.PI)
    .precision(0);

    var data = {};
    for (var key in json.objects) {
      data[key] = topojson.feature(json, json.objects[key]);
    }
    console.log(data)

    var layers = ['water', 'landuse', 'roads', 'buildings'];

    // build up a single concatenated array of all tile features from all tile layers
     var features = [];

     layers.forEach(function(layer){
       if(data[layer])
       {
           for(var i in data[layer].features)
           {
               // Don't include any label placement points
               if(data[layer].features[i].properties.label_placement) { continue }
               // Don't show large buildings at z13 or below.
               if(zoom <= 13 && layer == 'buildings') { continue }
               // Don't show small buildings at z14 or below.
               if(zoom <= 14 && layer == 'buildings' && data[layer].features[i].properties.area < 2000) { continue }
               data[layer].features[i].layer_name = layer;
               features.push(data[layer].features[i]);
           }
       }
     });

     console.log(features)
     // put all the features into SVG paths
     var sprojection = d3.geoMercator()
    .center([-122.429, 37.73])  // sf is 37.7749° N, 122.4194
  //  .rotate([4.4, 0])
//    .parallels([50, 60])
    .scale(430000)
    .translate([width / 2, height / 2]);

var path = d3.geoPath(sprojection);



svg.selectAll("path")
  .data(features.sort(function(a, b) { return a.properties.sort_rank ? a.properties.sort_rank - b.properties.sort_rank : 0 }))
.enter().append("path")
  .attr("class", function(d) { var kind = d.properties.kind || ''; if(d.properties.boundary){kind += '_boundary';} return d.layer_name + '-layer ' + kind; })
  .attr("d", path)
  .attr("fill", "none")
  .attr('stroke-width', .5)
  .attr('stroke', "green");



  //get svg element.
  var svgo = document.getElementById("svg");

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
})

function lon2tile(lon, zoom){
  return (Math.floor((lon+180)/360*Math.pow(2,zoom)))
}

function lat2tile(lat,zoom)  {
  return (Math.floor((1-Math.log(Math.tan(lat*Math.PI/180) + 1/Math.cos(lat*Math.PI/180))/Math.PI)/2 *Math.pow(2,zoom)));
}
