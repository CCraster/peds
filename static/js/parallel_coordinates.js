// var blue_to_brown = d3.scale.linear()
// 	.domain([0, 1])
// 	.range([color_circle_notExpert, color_circle_isExpert])
// 	.interpolate(d3.interpolateLab);

var color = function(d){
	var c = new Circle(d.user_id, 0, 0, "");;
	var pos = getPosInCircleSet(c, circles);
	return circles[pos].color_fill[circles[pos].color_fill.length - 1].split(":")[1];
};
var array_hideAxis = ["user_id", "isExpert"];

var parcoords = d3.parcoords()("#div_middle_parallelCoordinates")
			.color(color)
			.alpha(0.25)
			.mode("queue") // progressive rendering
			.height($("#div_middle_parallelCoordinates")[0].clientHeight)
			.margin({
				top: 25,
				left: 3,
				right: 3,
				bottom: 10
			});

 function displayParallelCoordinates(circleSet){

	var user_data_parallel = getUserDataParallel(circleSet);
	parcoords
			.data(user_data_parallel) 
			.hideAxis(array_hideAxis)
			.render()
			.reorderable()
			.brushMode("1D-axes")
			.interactive();
	highlightDataInParallelCoordinate();
	// parcoords.on("brush", function(d){ console.log(d)})
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
	var user_index = data_userId.indexOf(circle.user_id);
	single_user.user_id = circle.user_id;
	single_user.isExpert = data_userInfo[user_index][0];
	for(var j = 0; j < data_propertyName.length; j++){
		single_user[data_propertyName[j]] = data_userInfo[user_index][j + 2];
	}
	return single_user;
}

// To highlight in parallel coordinate
function highlightDataInParallelCoordinate(){
	var array_highlighted = [];
	for(var i = 0; i < circles.length; i++){
		if(circles[i].color_fill.length > 1)
			array_highlighted.push(getSingleDisplayUnit(circles[i]));
		else if(marqueeTool_activated == "marquee_default" && marquee_activated_num > -1 && marqueeTools["marquee_default"][marquee_activated_num].isCircleInside(circles[i]))
			array_highlighted.push(getSingleDisplayUnit(circles[i]));
	}
	if(array_highlighted.length > 0)
		parcoords.highlight(array_highlighted);
	else
		parcoords.unhighlight();
}
//////////////////////////////////////////////////////////////////////////////
function handleParallelCheckBoxClick(e){
	var filter_id = e.target.id.split("checkbox_parallel_")[1];console.log(filter_id)
	if(e.target.checked == true){
		property_display.push(filter_id);
		$("#div_filter_container_property").append("<div id=\"div_filter_" + filter_id + "\" class=\"filter\"><span class=\"filter_span\">" + filter_id + "</span>" + "<div class=\"filter_div\"><input id=\"property_" + filter_id + "\" class=\"range_slider\" type=\"hidden\" />" + "</div></div>");
		createFilter(filter_id);
		array_hideAxis.splice(array_hideAxis.indexOf(filter_id), 1);
		parcoords.hideAxis(array_hideAxis);
		highlightDataInParallelCoordinate();
	}
	else{
		$("#div_filter_" + filter_id).remove();
		property_display.splice(property_display.indexOf(filter_id), 1);
		array_hideAxis.push(filter_id);
		parcoords.hideAxis(array_hideAxis);
		highlightDataInParallelCoordinate();
	}
}
// 
function parallelCoordinatesRefit(){
	var flag = false;
	circles.forEach(function(d){
		if(d.color_fill.length > 1){
			flag = true;
		}
	});
	if(flag)
		displayParallelCoordinates(circles);
	else if(property_display.length > 0){
		var property_delete = property_display.splice(property_display, 1);
		$("#div_middle_parallelCoordinates").empty();
		displayParallelCoordinates(circles);
		property_display.push(property_delete);
		$("#div_middle_parallelCoordinates").empty();
		displayParallelCoordinates(circles);
	}
}