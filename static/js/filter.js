/*

*/
var filter_value = {"isExpert": ""
					, "notExpert": ""
					, "property_answers": {"min": 0, "max": 0}
					, "property_questions": {"min": 0, "max": 0}
					, "property_accepted": {"min": 0, "max": 0}
					, "property_comments": {"min": 0, "max": 0}
					, "property_QA_ratio": {"min": 0, "max": 0}
					, "property_AA_ratio": {"min": 0, "max": 0}
					, "property_UA_ratio": {"min": 0, "max": 0}
					, "property_upvoted": {"min": 0, "max": 0}
					, "property_upvotes": {"min": 0, "max": 0}
					};
var contain_expert = "contain", notContain_expert = "notContain";

function initFilter(user_info, property_name){

	for(var i = 0; i < property_name.length; i++){
		$("#property_" + property_name[i]).jRange({
                    from: 0,
                    to: d3.max(user_info, function(d) { return d[i + 1]; }),
                    step: 1,
                    scale: [0, 25, 50, 75, 100],
                    format: '%s',
                    width: $("#div_left_top")[0].clientWidth - 80,
                    showLabels: true,
                    showScale: true,
                    isRange: true
                });
		$("#property_" + property_name[i]).jRange("setValue", 0 + "," + d3.max(user_info, function(d) { return d[i + 1]; }) );
	}
	
}

function plotFilter(){

	var display_circleSet_temp = cloneCircleArray(circles);
	document.getElementById("checkbox_expert").checked == true ? filter_value.isExpert = contain_expert : filter_value.isExpert = notContain_expert;
	document.getElementById("checkbox_notExpert").checked == true ? filter_value.notExpert = contain_expert : filter_value.notExpert = notContain_expert;
	for(var i = 0; i < data_propertyName.length; i++){
		var property_value = $("#property_" + data_propertyName[i]).val();
		property_value = property_value.split(",");
		filter_value["property_" + data_propertyName[i]]["min"] = parseInt(property_value[0]);
		filter_value["property_" + data_propertyName[i]]["max"] = parseInt(property_value[1]);
	}

	for(var i = 0; i < circles_origin.length; i++){
		var posInCircleSet = getPosInCircleSet(circles_origin[i], display_circleSet_temp);
		var trueOrFalse = checkPlotConformToFilter(circles_origin[i]);
		if(trueOrFalse && posInCircleSet < 0){
			var circle = new Circle(circles_origin[i].user_id, circles_origin[i].x, circles_origin[i].y, radius, circles_origin[i].expert)
			if(highLightingTool.isCircleInside(circle))
				circle.color_fill = highLightColor;
			display_circleSet_temp.push(circle);
		}
		else if(!trueOrFalse && posInCircleSet >= 0){
			circles_origin[i].x = display_circleSet_temp[posInCircleSet].x;
			circles_origin[i].y = display_circleSet_temp[posInCircleSet].y;
			display_circleSet_temp.splice(posInCircleSet, 1);
		}
	}

	circles_draged = [];
	circles_doubleClicked = reGetFocusCircles(circles_doubleClicked, display_circleSet_temp);
	circles = cloneCircleArray(display_circleSet_temp);
	highLightingTool.circles_in = highLightingTool.getCirclesInHighLightingTool(highLightingTool);
	canvasRedrew();
	displayParallelCoordinates(circles);
}

// To judge if a circle conform to the filter
function checkPlotConformToFilter(circle){
	for(var i = 0; i < data_propertyName.length; i++){
		if(data_userInfo[circle.user_id][i + 1] < filter_value["property_" + data_propertyName[i]]["min"]
			|| data_userInfo[circle.user_id][i + 1] > filter_value["property_" + data_propertyName[i]]["max"])
			return false;
	}
	if(filter_value.isExpert == "contain" && circle.expert == isExpert 
		|| filter_value.notExpert == "contain" && circle.expert == notExpert)
		return true;

	return false;
}

// To judge if a circle is inside the set circles
function getPosInCircleSet(c, circleSet){
	for(var i = 0; i < circleSet.length; i++)
		if(circleSet[i].user_id == c.user_id)
			return i;
	return -1;
}
// reGetFocusCircles
function reGetFocusCircles(circles_array, circleSet){
	var new_circles_array = [];
	for(var i = 0; i < circles_array.length; i++){
		var pos = getPosInCircleSet(circles[circles_array[i]], circleSet);
		if( pos >= 0)
			new_circles_array.push(pos);
	}
	return new_circles_array;
}