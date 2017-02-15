var blue_to_brown = d3.scale.linear()
  .domain([0, 1])
  .range([color_circle_notExpert, color_circle_isExpert])
  .interpolate(d3.interpolateLab);

var color = function(d) { return blue_to_brown(d["isExpert"]); };

var parcoords = d3.parcoords()("#div_middle_parallelCoordinates")
	.color(color)
  .alpha(1)
  .mode("queue") // progressive rendering
  .height($("#div_middle_parallelCoordinates")[0].clientHeight)
  .margin({
    top: 36,
    left: 0,
    right: 0,
    bottom: 16
  });

var array_parallel_coordinate_highlighted = [];

 function displayParallelCoordinates(circleSet){
 	var user_data_parallel = getUserDataParallel(circleSet);
 	parcoords
	    .data(user_data_parallel) 
	    .hideAxis(["user_id", "isExpert"])
	    .render()
	    .reorderable()
	    .brushMode("1D-axes");
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
  single_user.user_id = circle.user_id;
  single_user.isExpert = data_userInfo[circle.user_id][0];
  for(var j = 0; j < data_propertyName.length; j++){
    single_user[data_propertyName[j]] = data_userInfo[circle.user_id][j + 1];
  }
  return single_user;
}

// To highlight in parallel coordinate
function highlightDataInParallelCoordinate(circle_num_array){
  var array_highlighted = [];
  for(var i = 0; i < circle_num_array.length; i++){
    var single_user = getSingleDisplayUnit(circles[circle_num_array[i]]);
    array_highlighted.push(single_user);
  }
  if(array_highlighted.length > 0)
    parcoords.highlight(array_highlighted);
  else
    parcoords.unhighlight();
}