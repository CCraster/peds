var blue_to_brown = d3.scale.linear()
  .domain([0, 1])
  .range([color_circle_notExpert, color_circle_isExpert])
  .interpolate(d3.interpolateLab);

var color = function(d){
  for(p in color_marqueeTool){
    var posInCircles = getPosInCircleSet(new Circle(d.user_id, d.x, d.y, d.radius, d.isExpert), circles);
    if(marqueeTools[p].circles_in.indexOf(posInCircles) != -1)
      return color_marqueeTool[p];
  }
  if(d.isExpert == isExpert)
    return color_circle_isExpert;
  else if(d.isExpert == notExpert)
    return color_circle_notExpert;
};

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
function highlightDataInParallelCoordinate(){
  var array_highlighted = [];
  for(p in color_marqueeTool){
    var circles_num_set = marqueeTools[p].circles_in;
    for(var i = 0; i < circles_num_set.length; i++){
      var single_user = getSingleDisplayUnit(circles[circles_num_set[i]]);
      array_highlighted.push(single_user);
    }
  }
  if(lastMoveOver >= 0)
    array_highlighted.push(getSingleDisplayUnit(circles[lastMoveOver]));
  if(array_highlighted.length > 0)
    parcoords.highlight(array_highlighted);
  else
    parcoords.unhighlight();
}