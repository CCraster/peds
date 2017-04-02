/*

*/
var filter_value = {};
var flag_maintain_circles_in_marquee = true;
var flag_T_F, flag_F_F, flag_T_T, flag_F_T, flag_show_real, flag_show_machine;

function createFilter(property_name){
	var index = data_propertyName.indexOf(property_name);
	var max= d3.max(data_userInfo, function(d) { return d[index + 2]; });
	$("#property_" + property_name).ionRangeSlider({
	    min: 0,
	    max: max,
	    from: 0,
	    to: max,
	    step: max > 1 ? 1 : 0.01,
	    type: 'double',
	    prefix: "",
	    postfix: "",
	    prettify: true,
	    grid: true,
	    onChange: plotFilter
	});
}

function plotFilter(){

	var display_circleSet_temp = cloneCircleArray(circles);
	flag_T_T = $("#checkbox_expert").prop("checked");
	flag_F_T = $("#checkbox_notExpert").prop("checked");
	flag_T_F = $("#checkbox_expert_machine").prop("checked");
	flag_F_F = $("#checkbox_notExpert_machine").prop("checked");
	flag_show_real = $("#checkbox_real_show").prop("checked");
	flag_show_machine = $("#checkbox_machine_show").prop("checked");
	for(var i = 0; i < property_display.length; i++){
		var property_value = $("#property_" + property_display[i]).prop("value");
		property_value = property_value.split(";");
		filter_value["property_" + property_display[i]] = {"min":0, "max":0};
		filter_value["property_" + property_display[i]]["min"] = parseInt(property_value[0]);
		filter_value["property_" + property_display[i]]["max"] = parseInt(property_value[1]);
	}

	for(var i = 0; i < circles_origin.length; i++){
		var posInCircleSet = getPosInCircleSet(circles_origin[i], display_circleSet_temp);
		var trueOrFalse = checkPlotConformToFilter(circles_origin[i]);
		if(trueOrFalse && posInCircleSet < 0){
			var circle = new Circle(circles_origin[i].user_id, circles_origin[i].x, circles_origin[i].y, circles_origin[i].expert)
			display_circleSet_temp.push(circle);
		}
		else if(!trueOrFalse && posInCircleSet >= 0){
			circles_origin[i].x = display_circleSet_temp[posInCircleSet].x;
			circles_origin[i].y = display_circleSet_temp[posInCircleSet].y;
			display_circleSet_temp.splice(posInCircleSet, 1);
		}
	}

	// circles_doubleClicked = reGetFocusCircles(circles_doubleClicked, display_circleSet_temp);
	for(p in marqueeTools){
		if(p == "marquee_default" || p == "marquee_away_highLight" || p == "marquee_move_highLight"){
			for(var i = 0; i < marqueeTools["marquee_default"].length; i++){
				marqueeTools[p][i].circles_extra = reGetFocusCircles(marqueeTools[p][i].circles_extra, display_circleSet_temp);
				marqueeTools[p][i].circles_in = reGetFocusCircles(marqueeTools[p][i].circles_in, display_circleSet_temp);
			}
		}
		else{
			marqueeTools[p].circles_extra = reGetFocusCircles(marqueeTools[p].circles_extra, display_circleSet_temp);
			marqueeTools[p].circles_in = reGetFocusCircles(marqueeTools[p].circles_in, display_circleSet_temp);
		}
	}
	circles = display_circleSet_temp;
	canvasRedrew();
	displayParallelCoordinates(circles);
}

// To judge if a circle conform to the filter
function checkPlotConformToFilter(circle){
	var flag_expert = false, flag_property = true, flag_tag = false;
	var index_circle = data_userId.indexOf(circle.user_id);
	if(flag_show_real == false && flag_show_machine == false)
		flag_expert = true;
	else if(flag_show_real == true && flag_show_machine == true){
		if(flag_T_T == true && data_userInfo[index_circle][0] == 1 && data_userInfo[index_circle][1] == 1)
			flag_expert = true;
		if(flag_F_T == true && data_userInfo[index_circle][0] == 0 && data_userInfo[index_circle][1] == 1)
			flag_expert = true;
		if(flag_T_F == true && data_userInfo[index_circle][0] == 1 && data_userInfo[index_circle][1] == 0)
			flag_expert = true;
		if(flag_F_F == true && data_userInfo[index_circle][0] == 0 && data_userInfo[index_circle][1] == 0)
			flag_expert = true;
	}
	else if(flag_show_real == true && flag_show_machine == false){
		if(flag_T_F == true && data_userInfo[index_circle][0] == 1)
			flag_expert = true;
		if(flag_F_F == true && data_userInfo[index_circle][0] == 0)
			flag_expert = true;
	}
	else{
		if(flag_T_T == true && data_userInfo[index_circle][1] == 1)
			flag_expert = true;
		if(flag_F_T == true && data_userInfo[index_circle][1] == 0)
			flag_expert = true;
	}
	for(var i = 0; i < property_display.length; i++){
		var index = data_propertyName.indexOf(property_display[i]);
		if(data_userInfo[index_circle][index + 2] < filter_value["property_" + property_display[i]]["min"]
			|| data_userInfo[index_circle][index + 2] > filter_value["property_" + property_display[i]]["max"]){
			flag_property = false;
			break;
		}
	}
	if((JSON.stringify(data_userDetail[circle.user_id])) == "{}" || tags_contains.length == 0){
		flag_tag = true;
	}
	else if(JSON.stringify(data_userDetail[circle.user_id]["total_tags"]) != "{}"){
		// for(p in data_userDetail[circle.user_id]["top_tags"]["first"])
		// 	if(tags_contains.indexOf(p) != -1)
		// 		flag_tag = true;
		// for(p in data_userDetail[circle.user_id]["top_tags"]["second"])
		// 	if(tags_contains.indexOf(p) != -1){
		// 		flag_tag = true;
		// 		break;
		// 	}
		for(var i = 0; i < tags_contains.length; i++){
			if(data_userDetail[circle.user_id]["top_tags"]["first"][tags_contains[i]]){
				flag_tag = true;
				break;
			}
			if(data_userDetail[circle.user_id]["top_tags"]["second"][tags_contains[i]]){
				flag_tag = true;
				break;
			}
		}
	}
	return flag_expert && flag_property && flag_tag;
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

// handleTagsButtonClick
function handleTagsButtonClick(e){
	var tag_id = this.id.split("tags_button_")[1];
	if(this.className == "tags_button_choosed"){
		tags_contains.splice(tags_contains.indexOf(tag_id), 1);
		this.setAttribute("class", "tags_button_unchoosed")
	}
	else{
		tags_contains.push(tag_id);
		this.setAttribute("class", "tags_button_choosed");
	}
	plotFilter();
}
//	handleTagsSelectCheckBoxClick
function handleTagsSelectCheckBoxClick(e){
	if($("#tags_select_checkbox").prop("checked") == true){
		tags_contains = tags_all.slice(0);
		tags_all.forEach(function(d){
			document.getElementById("tags_button_" + d).setAttribute("class", "tags_button_choosed");
		});
	}
	else{
		tags_all.forEach(function(d){
			document.getElementById("tags_button_" + d).setAttribute("class", "tags_button_unchoosed");
		});
		tags_contains = [];
	}
	plotFilter();
}
// handleMarqueeMoveCheckboxClick
function handleMarqueeRemoveCheckboxClick(e){
	if($("#marquee_remove_checkbox").prop("checked") == true)
		flag_maintain_circles_in_marquee = false;
	else
		flag_maintain_circles_in_marquee = true;
}