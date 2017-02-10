/*

*/
// Display weight of MDS
function displayWeight_MDS(weight){
	
	if(d3.select("svg[id=\"div_left_bottom_svg\"]"))
		d3.select("svg[id=\"div_left_bottom_svg\"]").remove();

	var margin = {top: 20, right: 30, bottom: 40, left: 30},
	width = document.getElementById("div_left_bottom").clientWidth - margin.left - margin.right,
	height = document.getElementById("div_left_bottom").clientHeight - margin.top - margin.bottom;

	var x = d3.scale.linear()
		.domain([0, d3.max(weight.value, function(d){ return d; })]).nice()
		.range([0, width]);
	var y = d3.scale.ordinal()
		.domain(weight.name.map(function(d) { return d; }))
    .rangeRoundBands([0, height], 0.1);

  	var xAxis = d3.svg.axis()
		.scale(x)
	    .orient("bottom");

	var yAxis = d3.svg.axis()
	    .scale(y)
	    .orient("left")
	    .tickSize(0)
	    .tickPadding(6);

	var svg = d3.select("#div_left_bottom").append("svg")
		.attr("id", "div_left_bottom_svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	svg.selectAll(".bar")
	      .data(weight.value)
	    	.enter().append("rect")
	      .attr("class", "bar")
	      .attr("x", 0)
	      .attr("y", function(d, i) { return y(weight.name[i]); })
	      .attr("width", function(d) { return x(d); })
	      .attr("height", y.rangeBand());

	svg.append("g")
	      .attr("class", "x axis")
	      .attr("transform", "translate(0," + height + ")")
	      .call(xAxis);

	svg.append("g")
	  .attr("class", "y axis")
	  .attr("transform", "translate(" + x(0) + ",0)")
	  .call(yAxis);
}