var margin = {top: 30, right: 10, bottom: 10, left: 10},
    width = document.getElementById("div_middle_parallelCoordinates").clientWidth - margin.left - margin.right,
    height = document.getElementById("div_middle_parallelCoordinates").clientHeight - margin.top - margin.bottom;

  var x = d3.scale.ordinal().rangePoints([0, width], 1),
      y = {},
      dragging = {};

  var line = d3.svg.line(),
      axis = d3.svg.axis().orient("left"),
      background,
      foreground;
var array_parallel_coordinate_highlighted = [];


function displayParallelCoordinates(circleSet){

  if(d3.select("svg[id=\"div_middle_parallelCoordinates_svg\"]"))
    d3.select("svg[id=\"div_middle_parallelCoordinates_svg\"]").remove();
  
  var svg = d3.select("#div_middle_parallelCoordinates").append("svg")
      .attr("id", "div_middle_parallelCoordinates_svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var user_data_parallel = getUserDataParallel(circleSet);

  // Extract the list of dimensions and create a scale for each.
    x.domain(dimensions = d3.keys(user_data_parallel[0]).filter(function(d) {
      return d != "name" && (y[d] = d3.scale.linear()
          .domain(d3.extent(user_data_parallel, function(p) { return +p[d]; }))
          .range([height, 0]));
    }));

    // Add grey background lines for context.
    background = svg.append("g")
        .attr("class", "background")
        .selectAll("path")
        .data(user_data_parallel)
        .enter().append("path")
        .attr("d", path);

    // Add blue foreground lines for focus.
    foreground = svg.append("g")
        .attr("class", "foreground")
        .selectAll("path")
        .data(user_data_parallel)
        .enter().append("path")
        .attr("d", path);

    // Add a group element for each dimension.
    var g = svg.selectAll(".dimension")
        .data(dimensions)
        .enter().append("g")
        .attr("class", "dimension")
        .attr("transform", function(d) { return "translate(" + x(d) + ")"; })
        .call(d3.behavior.drag()
          .origin(function(d) { return {x: x(d)}; })
          .on("dragstart", function(d) {
            dragging[d] = x(d);
            background.attr("visibility", "hidden");
          })
          .on("drag", function(d) {
            dragging[d] = Math.min(width, Math.max(0, d3.event.x));
            foreground.attr("d", path);
            dimensions.sort(function(a, b) { return position(a) - position(b); });
            x.domain(dimensions);
            g.attr("transform", function(d) { return "translate(" + position(d) + ")"; })
          })
          .on("dragend", function(d) {
            delete dragging[d];
            transition(d3.select(this)).attr("transform", "translate(" + x(d) + ")");
            transition(foreground).attr("d", path);
            background
                .attr("d", path)
                .transition()
                .delay(500)
                .duration(0)
                .attr("visibility", null);
          }));

    // Add an axis and title.
    g.append("g")
        .attr("class", "axis")
        .each(function(d) { d3.select(this).call(axis.scale(y[d])); })
        .append("text")
        .style("text-anchor", "middle")
        .attr("y", -9)
        .text(function(d) { return d; });

    // Add and store a brush for each axis.
    g.append("g")
        .attr("class", "brush")
        .each(function(d) {
          d3.select(this).call(y[d].brush = d3.svg.brush().y(y[d]).on("brushstart", brushstart).on("brush", brush));
        })
        .selectAll("rect")
        .attr("x", -8)
        .attr("width", 16);
}


function position(d) {
  var v = dragging[d];
  return v == null ? x(d) : v;
}

function transition(g) {
  return g.transition().duration(500);
}

// Returns the path for a given data point.
function path(d) {
  return line(dimensions.map(function(p) { return [position(p), y[p](d[p])]; }));
}

function brushstart() {
  d3.event.sourceEvent.stopPropagation();
}

// Handles a brush event, toggling the display of foreground lines.
function brush() {
  var actives = dimensions.filter(function(p) { return !y[p].brush.empty(); }),
      extents = actives.map(function(p) { return y[p].brush.extent(); });
  foreground.style("display", function(d) {
    return actives.every(function(p, i) {
      return extents[i][0] <= d[p] && d[p] <= extents[i][1];
    }) ? null : "none";
  });
}

// Get User Data fit the display code
function getUserDataParallel(circleSet){
  var user_data = [];
  for(var i = 0; i < circleSet.length; i++){
    var single_user = getSingleDisplayUnit(circleSet[i]);
    user_data.push(single_user);
  }
  return user_data;
}

// Create the format for single display unit
function getSingleDisplayUnit(circle){
  var single_user = new Object();
  single_user.name = data_userInfo[circleSet[i].user_id][0];
  for(var j = 0; j < data_propertyName.length; j++){
    single_user[data_propertyName[j]] = data_userInfo[circleSet[i].user_id][j + 1];
  }

  return single_user
}