/*

*/
var width_locateBar = 8;
var drag_locate = d3.behavior.drag()
					.on("drag", handleLocateBarDragMove);
var margin_weight, width_weight, height_weight, x, y, antiX;
// var data_propertyName = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "AA", "AB"];
// var weight = {"value": [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.05, 0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85, 0.95, 0.11, 0.22, 0.33, 0.44, 0.55, 0.66, 0.77, 0.88, 0.99]};

// Display weight of MDS
function displayWeight_MDS(weight){
	
	if(d3.select("svg[id=\"div_left_bottom_svg\"]"))
		d3.select("svg[id=\"div_left_bottom_svg\"]").remove();
	if(d3.select("svg[id=\"div_left_bottom_svg_xAxis\"]"))
		d3.select("svg[id=\"div_left_bottom_svg_xAxis\"]").remove();

	margin_weight = {top: 10, right: 20, bottom: 0, left: 60};
	width_weight = document.getElementById("div_left_bottom_weight").clientWidth - margin_weight.left - margin_weight.right - 20;
	if(data_propertyName.length > 12)
		height_weight = data_propertyName.length * 20 - margin_weight.top - margin_weight.bottom - 20;
	else
		height_weight = $("#div_left_bottom_weight").height() - margin_weight.top - margin_weight.bottom;

	x = d3.scale.linear()
		.domain([0, 1])
		.range([0, width_weight]);
	antiX = d3.scale.linear()
			.domain([0, width_weight])
			.range([0, 1]);
	y = d3.scale.ordinal()
		.domain(data_propertyName)
		.rangeRoundBands([0, height_weight], 0.1);

	var xAxis = d3.svg.axis()
		.scale(x)
		.orient("bottom");

	var yAxis = d3.svg.axis()
		.scale(y)
		.orient("left")
		.tickSize(0)
		.tickPadding(6);

	var svg = d3.select("#div_left_bottom_weight").append("svg")
		.attr("id", "div_left_bottom_svg")
		.attr("width", width_weight + margin_weight.left + margin_weight.right)
		.attr("height", height_weight + margin_weight.top + margin_weight.bottom)
		.append("g")
		.attr("transform", "translate(" + margin_weight.left + "," + margin_weight.top + ")");

	svg.selectAll(".bar")
		.data(weight.value)
		.enter().append("rect")
		.attr("id", function(d, i){ return "weight_display_rect_" + data_propertyName[i]; })
		.attr("class", "bar")
		.attr("x", 0)
		.attr("y", function(d, i) { return y(data_propertyName[i]); })
		.attr("width", function(d) { return x(d); })
		.attr("height", y.rangeBand());
	svg.selectAll(".locate_bar")
		.data(weight.value)
		.enter().append("rect")
		.attr("id", function(d, i){ return "weight_locate_rect_" + data_propertyName[i]; })
		.attr("class", "locate_bar")
		.attr("x", function(d, i){ return x(d) - width_locateBar; })
		.attr("y", function(d, i) { return y(data_propertyName[i]); })
		.attr("width", width_locateBar)
		.attr("height", y.rangeBand())
		.on("mouseover", handleLocateBarMouseOver)
		.on("mouseout", handleLocateBarMouseOut)
		.call(drag_locate);
		// .on("mouseover", handleLocateBarMouseOver);

	svg.append("g")
	  .attr("class", "y axis")
	  .attr("transform", "translate(" + x(0) + ",0)")
	  .call(yAxis);

	var svg_xAxis = d3.select("#div_left_bottom_weight_xAxis").append("svg")
		.attr("id", "div_left_bottom_svg_xAxis")
		.attr("width", $("#div_left_bottom_weight_xAxis").width())
		.attr("height", $("#div_left_bottom_weight_xAxis").height())
		.append("g")
		.attr("transform", "translate(" + margin_weight.left + "," + 1 + ")");
	// var width_xAxis = $("#div_left_bottom_weight_xAxis").width() - margin_weight.left - margin_weight.right;
	svg_xAxis.append("g")
		  .attr("class", "x axis")
		  .attr("transform", "translate(0," + 0 + ")")
		  .call(xAxis);
}
// handleLocateBarMouseOver
function handleLocateBarMouseOver(d){
	$("#div_left_bottom_svg").css("cursor", "col-resize");
}
// handleLocateBarMouseout
function handleLocateBarMouseOut(d){
	$("#div_left_bottom_svg").css("cursor", "default");
}

// handleLocateBarDragMove
function handleLocateBarDragMove(d){
	var rect_id = this.id.split("weight_locate_rect_")[1];
	$("#div_left_bottom_svg").css("cursor", "col-resize");
	if(d3.event.x >= 0 && d3.event.x <= width_weight){
		d3.select(this)
			.attr("x", d3.event.x - width_locateBar);
		d3.select("#weight_display_rect_" + rect_id)
			.attr("width", d3.event.x);
		weight_MDS["value"][data_propertyName.indexOf(rect_id)] = antiX(d3.event.x);
	}
}