/*


*/
var padding = 20;
var text_padding = 3;
var radius = 5;
var canvas = $("#canvas")[0];
var context/* = canvas.getContext("2d")*/;
var canvas_MDS_width, canvas_MDS_height;
var circles_origin = [], circles = [], weight_MDS = [];
var data_userInfo = [], data_propertyName = [], data_userDetail = [], data_userId = [];
var property_display = [];
var xScale, yScale, antiXScale, antiYScale;
var color_circle_TT = "#FF7373", color_circle_TF = "#FF0000", color_circle_FT = "#00a600", color_circle_FF = "#73ff73";
var color_circle_hover = "#ffe66d";
var color_button_normal = "#ef3753";
var color_marqueeTool = {
	"marquee_default": "black",
	"marquee_away_highLight": "#911231",
	"marquee_move_highLight": "#264215",
	"marquee_remove": "#896432",
	"marqueeTool_remove": "teal"
}, 
marqueeTools = {"marquee_default":[], "marquee_move_highLight":[] , "marquee_away_highLight":[]}, marqueeTool_remove, marqueeTool_activated = "", marquee_activated_num = -1;
var mouse_drag_types = {
	"corner_expand_leftUp": 11,
	"corner_expand_rightUp": 12,
	"corner_expand_rightDown": 13,
	"corner_expand_leftDown": 14,
	"edge_expand_up": 21,
	"edge_expand_right": 22,
	"edge_expand_down": 23,
	"edge_expand_left": 24,
	"marquee_move": 3,
	"out_the_marquee": 4,
	"marqueeTool_remove": 5
},mouse_drag_type = "";
var isExpert = 1, notExpert = 0;
var click_startPos = {x: 0, y: 0},click_endPos = {x: 0, y: 0};
var circle_clicked_num = -1, circle_moveOver_num = -1, lastMoveOver = -1;
var tags_all = [], tags_contains = [];
var signal_MDS = "initiate", signal_weight = "initiate";

// Circle Class
var Circle = (function(){

	// constructor
	function Circle(user_id, x, y, radius, expert){
	this.user_id = user_id;
	this.x = x;
	this.y = y;
	this.radius = radius;
	this.expert = expert;
	this.color_fill = [];
	if($("#checkbox_real_show").prop("checked") == false && $("#checkbox_machine_show").prop("checked") == false)
		this.color_fill.push("origin:" + color_circle_FF);
	else if($("#checkbox_real_show").prop("checked") == true && $("#checkbox_machine_show").prop("checked") == true){
		if(data_userInfo[data_userId.indexOf(user_id)][0] == 1 && data_userInfo[data_userId.indexOf(user_id)][1] == 1)
			this.color_fill.push("origin:" + color_circle_TT);
		else if(data_userInfo[data_userId.indexOf(user_id)][0] == 1 && data_userInfo[data_userId.indexOf(user_id)][1] == 0)
			this.color_fill.push("origin:" + color_circle_TF);
		else if(data_userInfo[data_userId.indexOf(user_id)][0] == 0 && data_userInfo[data_userId.indexOf(user_id)][1] == 1)
			this.color_fill.push("origin:" + color_circle_FT);
		else
			this.color_fill.push("origin:" + color_circle_FF);
	}
	else if($("#checkbox_real_show").prop("checked") == true && $("#checkbox_machine_show").prop("checked") == false){
		if(data_userInfo[data_userId.indexOf(user_id)][0] == 1)
			this.color_fill.push("origin:" + color_circle_TT);
		else
			this.color_fill.push("origin:" + color_circle_FF);
	}
	else{
		if(data_userInfo[data_userId.indexOf(user_id)][1] == 1)
			this.color_fill.push("origin:" + color_circle_TT);
		else
			this.color_fill.push("origin:" + color_circle_FF);
	}
	this.redrew();
	return (this);
	}
	// Redrew the circle
	Circle.prototype.redrew = function(){
		context.save();
		context.globalAlpha = 0.8;
		context.setLineDash([0, 0]);
		context.lineWidth = 2;
		context.beginPath();
		context.fillStyle = this.color_fill[this.color_fill.length - 1].split(":")[1];
		context.arc(xScale(this.x), yScale(this.y), this.radius, 0, 2 * Math.PI, true);
		context.fill();

		// 附加显示user_id
		// context.font = "10px Microsoft JhengHei";
		// context.fillStyle = "red";
		// context.fillText( this.user_id, xScale(this.x), yScale(this.y) );
		
		context.restore();
		return (this);
	}
	// Judge if the point is inside athe circle
	Circle.prototype.isPointInside = function(x, y){
		var dx = xScale(this.x) - x;
		var dy = yScale(this.y) - y;
		return (dx * dx + dy * dy <= this.radius * this.radius);
	}
	// Push circle's fill color
	Circle.prototype.pushFillColor = function(color){
		var index = this.color_fill.indexOf(color);
		if(index != -1)
			this.color_fill.splice(index, 1);
		this.color_fill.push(color);
	}
	// Pop circle's fill color
	Circle.prototype.popFillColor = function(color){
		var index = this.color_fill.indexOf(color);
		if(index != -1)
			this.color_fill.splice(index, 1);
	}
	return Circle;
})();

// MarqueeTool Class - for the MDS Canvas
var MarqueeTool = (function(){

	// constructor
	function MarqueeTool(type, color_border){
		this.startPos = {x : 0, y : 0};
		this.endPos = {x : 0, y : 0};
		this.type = type;
		if(type.indexOf("marquee_move_highLight") == 0 && $("#marquee_move_highLight_checkbox").prop("checked") == false)
			this.circlesMoveEnabled = false;
		else
			this.circlesMoveEnabled = true;
		this.color_border = color_border;
		this.circles_in = [];
		this.circles_extra = [];
		this.redrew(this.startPos, this.endPos);
		return (this);
	}
	// redrew the MarqueeTool  rectangle.
	MarqueeTool.prototype.redrew = function(startPos, endPos){
		this.getStartAndEndPos(startPos, endPos);
		// circles_in = this.getCirclesInMarqueeTool(this);
		context.save();
		context.setLineDash([1, 2]);
		context.strokeStyle = this.color_border;
		context.beginPath();
		context.strokeRect(this.startPos.x, this.startPos.y, (this.endPos.x - this.startPos.x), (this.endPos.y - this.startPos.y));
		context.restore();
		return (this);
	}
	// get the circles inside the MarqueeTool  rectangle.
	MarqueeTool.prototype.getCirclesInMarqueeTool = function(marqueeTool){
		var circlesInMarqueeTool = marqueeTool.circles_extra.slice(0);
		marqueeTool.circles_in.forEach(function(d){
			if(circlesInMarqueeTool.indexOf(d) == -1)
				circles[d].popFillColor(marqueeTool.type + ":" + marqueeTool.color_border);
		});
		circles.forEach(function(circle, i){
			if(marqueeTool.isCircleInside(circle)){
				if(marqueeTool.type == "marqueeTool_remove"){
					circlesInMarqueeTool.push(i);
					circle.pushFillColor(marqueeTool.type + ":" + marqueeTool.color_border);
				}
				else if(circlesInMarqueeTool.indexOf(i) == -1){
					circlesInMarqueeTool.push(i);
					circle.pushFillColor(marqueeTool.type + ":" + marqueeTool.color_border);
				}
			}
		})

		return circlesInMarqueeTool;
	}
	// To judge if the circle is inside the MarqueeTool rectangle.
	MarqueeTool.prototype.isCircleInside = function(circle){
		if((xScale(circle.x) >= (this.startPos.x + circle.radius))&&(xScale(circle.x) <= (this.endPos.x - circle.radius))
			&&(yScale(circle.y) >= (this.startPos.y + circle.radius))&&(yScale(circle.y) <= (this.endPos.y - circle.radius)))
			return true;
		else
			return false;
	}
	// get the upper left and lower right plots' coordinates of the MarqueeTool rectangle.
	MarqueeTool.prototype.getStartAndEndPos = function(startPos, endPos){
		this.startPos = {x: Math.min(startPos.x, endPos.x), y: Math.min(startPos.y, endPos.y)};
		this.endPos = {x: Math.max(startPos.x, endPos.x), y: Math.max(startPos.y, endPos.y)};
	}

	// reset the marqueeTool
	MarqueeTool.prototype.reset = function(){
		this.startPos = {x: 0, y: 0};
		this.endPos = {x: 0, y: 0};
		var color_border_temp = this.color_border;
		var type = this.type;
		if(this.type != "marquee_remove"){
			this.circles_in.forEach(function(d){	// can not use this.color_border
				circles[d].popFillColor(type + ":" + color_border_temp);
			});
		}
		this.circles_extra = [];
		this.circles_in = [];
		canvasRedrew();
	}

	return MarqueeTool;
})();

// Initiating function: loading the results of the MDS.
function Init(){

	canvas.width = $("#div_middle_canvas").width();
	canvas.height = $("#div_middle_canvas").height();
	canvas_MDS_width = canvas.width;
	canvas_MDS_height = canvas.height;

	dataLoading();
	// Initiate the cheated check box
	$("#checkbox_real_show").prop("checked", true);
	$("#checkbox_machine_show").prop("checked", true);
	$("#checkbox_expert_machine").prop("checked", true);
	$("#checkbox_notExpert_machin").prop("checked", true);
	$("#checkbox_expert").prop("checked", true);
	$("#checkbox_notExpert").prop("checked", true);


	$("#marquee_move_highLight_checkbox").on("click", handleMarqueeMoveHighlightCheckboxClick);
	$("#marquee_move_highLight_checkbox").prop("checked", false); //initiate the checkbox false
	$("#marquee_move_highLight_checkbox").css("display", "none");

	$("#tags_select_checkbox").on("click", handleTagsSelectCheckBoxClick);
	$("#tags_select_checkbox").prop("checked", false); //initiate the checkbox false

	$("#marquee_remove_checkbox").on("click", handleMarqueeRemoveCheckboxClick);
	$("#marquee_remove_checkbox").prop("checked", false); //initiate the checkbox false
	$("#marquee_remove_checkbox").css("display", "none");
	// $("#canvas").on("mousedown", handleMouseDown)
	// $("#canvas").on("mouseup", handleMouseUp);
	$("#canvas").on("mousemove", handleMouseMove_Hover);
	// $("#canvas").on("dblclick", handleMouseDoubleClick);
}
//
function setExpertShow(id){
	if(id == "checkbox_real_show"){	//处理“显示真实分类”被点击
		if($("#checkbox_real_show").prop("checked") == true){
			$("#checkbox_expert").prop("checked", true);
			$("#checkbox_notExpert").prop("checked", true);
			$("#div_checkbox_filter").css("display", "inline-block");
		}
		else{
			// $("#checkbox_expert").prop("checked", false);
			// $("#checkbox_notExpert").prop("checked", false);
			$("#div_checkbox_filter").css("display", "none");
		}
	}
	else if(id == "checkbox_machine_show"){
		if($("#checkbox_machine_show").prop("checked") == true){
			$("#checkbox_expert_machine").prop("checked", true);
			$("#checkbox_notExpert_machine").prop("checked", true);
			$("#div_checkbox_filter_machine").css("display", "inline-block");
		}
		else{
		// 	$("#checkbox_expert_machine").prop("checked", false);
		// 	$("#checkbox_notExpert_machine").prop("checked", false);
			$("#div_checkbox_filter_machine").css("display", "none");
		}
	}

	// 重新设置圆的底色
	if($("#checkbox_real_show").prop("checked") == false && $("#checkbox_machine_show").prop("checked") == false){
		circles_origin.forEach(function(d){
			d.color_fill[0] = "origin:" + color_circle_FF;
		});
		circles.forEach(function(d){
			d.color_fill[0] = "origin:" + color_circle_FF;
		});
	}
	else if($("#checkbox_real_show").prop("checked") == true && $("#checkbox_machine_show").prop("checked") == true){
		circles_origin.forEach(function(d){
			if(data_userInfo[data_userId.indexOf(d.user_id)][0] == 1 && data_userInfo[data_userId.indexOf(d.user_id)][1] == 1)
				d.color_fill[0] = "origin:" + color_circle_TT;
			else if(data_userInfo[data_userId.indexOf(d.user_id)][0] == 1 && data_userInfo[data_userId.indexOf(d.user_id)][1] == 0)
				d.color_fill[0] = "origin:" + color_circle_TF;
			else if(data_userInfo[data_userId.indexOf(d.user_id)][0] == 0 && data_userInfo[data_userId.indexOf(d.user_id)][1] == 1)
				d.color_fill[0] = "origin:" + color_circle_FT;
			else
				d.color_fill[0] = "origin:" + color_circle_FF;
		});
		circles.forEach(function(d){
			if(data_userInfo[data_userId.indexOf(d.user_id)][0] == 1 && data_userInfo[data_userId.indexOf(d.user_id)][1] == 1)
				d.color_fill[0] = "origin:" + color_circle_TT;
			else if(data_userInfo[data_userId.indexOf(d.user_id)][0] == 1 && data_userInfo[data_userId.indexOf(d.user_id)][1] == 0)
				d.color_fill[0] = "origin:" + color_circle_TF;
			else if(data_userInfo[data_userId.indexOf(d.user_id)][0] == 0 && data_userInfo[data_userId.indexOf(d.user_id)][1] == 1)
				d.color_fill[0] = "origin:" + color_circle_FT;
			else
				d.color_fill[0] = "origin:" + color_circle_FF;
		});
	}
	else if($("#checkbox_real_show").prop("checked") == true && $("#checkbox_machine_show").prop("checked") == false){
		circles_origin.forEach(function(d){
			if(data_userInfo[data_userId.indexOf(d.user_id)][0] == 1)
				d.color_fill[0] = "origin:" + color_circle_TT;
			else
				d.color_fill[0] = "origin:" + color_circle_FF;
		});
		circles.forEach(function(d){
			if(data_userInfo[data_userId.indexOf(d.user_id)][0] == 1)
				d.color_fill[0] = "origin:" + color_circle_TT;
			else
				d.color_fill[0] = "origin:" + color_circle_FF;
		});
	}
	else{
		circles_origin.forEach(function(d){
			if(data_userInfo[data_userId.indexOf(d.user_id)][1] == 1)
				d.color_fill[0] = "origin:" + color_circle_TT;
			else
				d.color_fill[0] = "origin:" + color_circle_FF;
		});
		circles.forEach(function(d){
			if(data_userInfo[data_userId.indexOf(d.user_id)][1] == 1)
				d.color_fill[0] = "origin:" + color_circle_TT;
			else
				d.color_fill[0] = "origin:" + color_circle_FF;
		});
	}
	canvasRedrew();
}

// 数据读取函数
function dataLoading(){

	d3.json("static/data/user_info.json", function(data){		// 读取用户Stackoverflow数据
		data_userDetail = data;
		for(p in data_userDetail){
			if(data_userId.indexOf(p) != -1 && JSON.stringify(data_userDetail[p]) != "{}"){
				for(q in data_userDetail[p]["top_tags"]["first"])
					if(tags_all.indexOf(q) == -1)
						tags_all.push(q);
				for(q in data_userDetail[p]["top_tags"]["second"])
					if(tags_all.indexOf(q) == -1)
						tags_all.push(q);
			}
			else{}
		}
		// tags_contains = tags_all.slice(0);	// 深拷贝
		for(var i = 0; i < tags_all.length; i++){	// 初始化标签状态
			$("#div_left_top_tag_content").append("<input type=\"button\" class=\"tags_button_unchoosed\" value=\"" + tags_all[i] + "\" id=\"tags_button_" + tags_all[i] + "\"/>");
			document.getElementById("tags_button_" + tags_all[i]).addEventListener("click", handleTagsButtonClick);
		}
	});

	d3.json("static/data/demo_user30.json",	// 读取用户属性数据
		function(data){
			data_userInfo = data.attr_values;
			data_propertyName = data.attr_name.slice(2);
			data_userId = data.user_id;
			property_display = data_propertyName.slice(0);	// 深拷贝
			for(var i = 0; i < property_display.length; i++){	// Initiate the checkbox in parallel
				$("#div_middle_bottom_property").append("<span><input type=\"checkbox\" id=\"" + "checkbox_parallel_" + property_display[i] + "\"/>" + property_display[i] +"</span><br>");
				$("#checkbox_parallel_" + property_display[i]).prop("checked", "true");
				$("#checkbox_parallel_" + property_display[i]).on("click", handleParallelCheckBoxClick);
				$("#div_filter_container_property").append("<div id=\"div_filter_" + property_display[i] + "\" class=\"filter\"><span class=\"filter_span\">" + property_display[i] + "</span>" + "<div class=\"filter_div\"><input id=\"property_" + property_display[i] + "\" class=\"range_slider\" type=\"hidden\" />" + "</div></div>");
				createFilter(property_display[i]);
			}

			d3.json("static/data/demo_pos30.json",	//Loading position data
				function(data){
					var positions_mds = data.positions;
					weight_MDS = data.weight;
					positions_mds.forEach(function(d){
						d[0] = parseInt(d[0] * 100);
						d[1] = parseInt(d[1] * 100);
					})

					xScale = d3.scale.linear()
										 .domain([d3.min(positions_mds, function(d) { return d[0]; }), d3.max(positions_mds, function(d) { return d[0]; })])
										 .range([padding, canvas_MDS_width - padding]);
					yScale = d3.scale.linear()
										 .domain([d3.min(positions_mds, function(d) { return d[1]; }), d3.max(positions_mds, function(d) { return d[1]; })])
										 .range([padding, canvas_MDS_height - padding]);
					antiXScale = d3.scale.linear()
										 .domain([padding, canvas_MDS_width - padding])
										 .range([d3.min(positions_mds, function(d) { return d[0]; }), d3.max(positions_mds, function(d) { return d[0]; })]);
					antiYScale = d3.scale.linear()
										 .domain([padding, canvas_MDS_height - padding])
										 .range([d3.min(positions_mds, function(d) { return d[1]; }), d3.max(positions_mds, function(d) { return d[1]; })]);

					context = d3.select("#canvas")  // Set the canvas zoom function
							.call(d3.behavior.zoom().x(xScale).y(yScale).scaleExtent([-5000, 5000])
							.on("zoom", handleCanvasZoom))
							.on("dblclick.zoom", null)
							.node()
							.getContext("2d");

					for(p in color_marqueeTool){ // Initiate the marquee tools
						if(p != "marquee_default" && p != "marquee_away_highLight" && p != "marquee_move_highLight")
							marqueeTools[p] = new MarqueeTool(p, color_marqueeTool[p]);
						if(p != "marqueeTool_remove"){
							$("#" + p).click(handleMarqueeToolClick);
							$("#" + p).mouseover(handleMarqueeToolMouseOver);
							$("#" + p).mouseout(handleMarqueeToolMouseOut);
						}
					}
					marqueeTool_remove = new MarqueeTool("marqueeTool_remove", color_marqueeTool["marqueeTool_remove"]);

					positions_mds.forEach(function(d, i){ // Initiate the circles on canvas
						var circle = new Circle(data_userId[i], d[0], d[1], radius, data_userInfo[i][0]);
						circles.push(circle);
					})

					circles_origin = cloneCircleArray(circles);
					displayWeight_MDS(weight_MDS);
					displayParallelCoordinates(circles);
				}
			);

		});

}
// Clone a Circles Array
function cloneCircleArray(circleArray){
	var new_circleArray = [];
	for(var i = 0; i < circleArray.length; i++){
		var circle = new Circle(circleArray[i].user_id, circleArray[i].x, circleArray[i].y, radius, circleArray[i].expert)
		circle.color_fill = circleArray[i].color_fill.slice(0);
		new_circleArray.push(circle);
	}
	return new_circleArray;
}

// Check if circle in any MarqueeTool
function checkCircleInAnyMarqueeTool(marquee_type, circle_num){
	for(p in marqueeTools){
		if(p == "marquee_default" || p == "marquee_away_highLight" || p == "marquee_move_highLight"){
			for(var i = 0; i < marqueeTools[p].length; i++)
				if(marqueeTools[p][i].type != marquee_type && marqueeTools[p][i].circles_in.indexOf(circle_num) != -1)
					return true;
		}
		else if(marqueeTools[p].type != marquee_type && marqueeTools[p].circles_in.indexOf(circle_num) != -1)
			return true;
	}
	return false;
}

// Canvas zoom function
function handleCanvasZoom(){
	if(marqueeTool_activated == ""){
		for(p in marqueeTools){  // Let the marquee tool change with zoom action
			if(p == "marquee_default" || p == "marquee_away_highLight" || p == "marquee_move_highLight"){
				for(var i = 0; i < marqueeTools[p].length; i++){
					marqueeTools[p][i].startPos.x = antiXScale(marqueeTools[p][i].startPos.x);
					marqueeTools[p][i].startPos.y = antiYScale(marqueeTools[p][i].startPos.y);
					marqueeTools[p][i].endPos.x = antiXScale(marqueeTools[p][i].endPos.x);
					marqueeTools[p][i].endPos.y = antiYScale(marqueeTools[p][i].endPos.y);
					marqueeTools[p][i].startPos.x = xScale(marqueeTools[p][i].startPos.x);
					marqueeTools[p][i].startPos.y = yScale(marqueeTools[p][i].startPos.y);
					marqueeTools[p][i].endPos.x = xScale(marqueeTools[p][i].endPos.x);
					marqueeTools[p][i].endPos.y = yScale(marqueeTools[p][i].endPos.y);
				}
			}
			else{
				marqueeTools[p].startPos.x = antiXScale(marqueeTools[p].startPos.x);
				marqueeTools[p].startPos.y = antiYScale(marqueeTools[p].startPos.y);
				marqueeTools[p].endPos.x = antiXScale(marqueeTools[p].endPos.x);
				marqueeTools[p].endPos.y = antiYScale(marqueeTools[p].endPos.y);
				marqueeTools[p].startPos.x = xScale(marqueeTools[p].startPos.x);
				marqueeTools[p].startPos.y = yScale(marqueeTools[p].startPos.y);
				marqueeTools[p].endPos.x = xScale(marqueeTools[p].endPos.x);
				marqueeTools[p].endPos.y = yScale(marqueeTools[p].endPos.y);
			}
		}
		antiXScale.range(xScale.domain());
		antiYScale.range(yScale.domain());
		canvasRedrew();
	}
}

/*
		click event for marquee tools
*/

// Mouse over event
function handleMarqueeToolMouseOver(e){
	var sourse = e.target;
	$("#" + sourse.id).css({"background-color": color_marqueeTool[sourse.id]});
}

// Mouse out event
function handleMarqueeToolMouseOut(e){
	var sourse = e.target;
	if(sourse.id != marqueeTool_activated)
		$("#" + sourse.id).css({"background-color": color_button_normal});
}

// Single click event
function handleMarqueeToolClick(e){

	var sourse = e.target;
	if(sourse.id != marqueeTool_activated){
		// if(marqueeTool_activated == "marquee_default")  //If marqueeTool_activated is marquee, reset it.
		// 	marqueeTools[marqueeTool_activated].reset();
		marqueeTool_activated = sourse.id;
		$("#" + sourse.id).css({"background-color": color_marqueeTool[sourse.id]});
		for(p in color_marqueeTool)
			if(p != marqueeTool_activated)
				$("#" + p).css({"background-color": color_button_normal});
		d3.select("#canvas").on(".zoom", null);  //Turn off the canvas zoom
		$("#canvas").off("mousedown");
		$("#canvas").off("mouseup");
		$("#canvas").off("mousemove");
		$("#canvas").on("mousedown", handleMouseDown);
		$("#canvas").on("mouseup", handleMouseUp);
		$("#canvas").on("mousemove", handleMouseMove_Hover);
	}
	else{
		if(sourse.id != "marquee_default" && sourse.id != "marquee_away_highLight" && sourse.id != "marquee_move_highLight")
			marqueeTools[sourse.id].reset();
		else
			marquee_activated_num = -1;
		$("#" + sourse.id).css({"background-color": color_button_normal});
		marqueeTool_activated = "";
		d3.select("#canvas")  //Turn on the canvas zoom
			.call(d3.behavior.zoom().x(xScale).y(yScale).scaleExtent([-5000, 5000])
			.on("zoom", handleCanvasZoom))
			.on("dblclick.zoom", null);
		$("#canvas").off("mousedown");
		$("#canvas").off("mouseup");
	}
	
	if(marqueeTool_activated == "marquee_move_highLight"){
		$("#marquee_move_highLight_checkbox").css("display", "inline");
	}
	else if(marqueeTool_activated == "marquee_remove"){
		$("#marquee_remove_checkbox").css("display", "inline");
	}
	else{
		$("#marquee_move_highLight_checkbox").css("display", "none");
		$("#marquee_remove_checkbox").css("display", "none");
	}
}

// Handle marquee_move_highLight_checkbox click
function handleMarqueeMoveHighlightCheckboxClick(e){
	if($("#marquee_move_highLight_checkbox").prop("checked") == true)
		for(var i = 0; i < marqueeTools["marquee_move_highLight"].length; i++)
			marqueeTools["marquee_move_highLight"][i].circlesMoveEnabled = true;
	else
		for(var i = 0; i < marqueeTools["marquee_move_highLight"].length; i++)
			marqueeTools["marquee_move_highLight"][i].circlesMoveEnabled = false;
}



/*
		Listeners for the mouse actions in canvas.
*/
// Handle mouse action 
function handleMouseDown(e){
	var pointOnCanvas = getPointOnCanvas(canvas, e.pageX, e.pageY);

	for(var i=0; i<circles.length; i++){
		if(circles[i].isPointInside(pointOnCanvas.x, pointOnCanvas.y)){
				circle_clicked_num = i;
		}
	}

	if(circle_clicked_num >= 0 && circle_clicked_num < circles.length){
		if(e.button == 0){  //handle the left click
			if(marqueeTool_activated != "marquee_default" && marqueeTool_activated != "" && (marqueeTools[marqueeTool_activated].length == 0 || marqueeTools[marqueeTool_activated][0].circles_extra.indexOf(circle_clicked_num) == -1) && !checkCircleInAnyMarqueeTool("", circle_clicked_num)){
				if(marqueeTools[marqueeTool_activated].length == 0){	// no marquee, create one
					marqueeTools[marqueeTool_activated][0] = new MarqueeTool(marqueeTool_activated + "_0", color_marqueeTool[marqueeTool_activated]);
					marquee_activated_num = 0;
				}
				marqueeTools[marqueeTool_activated][0].circles_extra.push(circle_clicked_num);
				circles[circle_clicked_num].pushFillColor(marqueeTools[marqueeTool_activated][0].type + ":" + marqueeTools[marqueeTool_activated][0].color_border);
				marqueeTools[marqueeTool_activated][0].circles_in.push(circle_clicked_num);
				canvasRedrew();
			}
		}
		else if(e.button == 2){  //handle the right click
			if(marqueeTool_activated != "marquee_default" && marqueeTool_activated != "" && marqueeTools[marqueeTool_activated][0].circles_extra.indexOf(circle_clicked_num) != -1){
				marqueeTools[marqueeTool_activated][0].circles_extra.splice(marqueeTools[marqueeTool_activated][0].circles_extra.indexOf(circle_clicked_num), 1);
				circles[circle_clicked_num].popFillColor(marqueeTools[marqueeTool_activated][0].type + ":" + marqueeTools[marqueeTool_activated][0].color_border);
				marqueeTools[marqueeTool_activated][0].circles_in.splice(marqueeTools[marqueeTool_activated][0].circles_in.indexOf(circle_clicked_num), 1);
				canvasRedrew();
			}
		}
		if(marqueeTool_activated.indexOf("marquee_move_highLight") == 0){	// only when marquee_move_highLight is activated, circle can be moved.
			$("#canvas").off("mousemove");
			$("#canvas").on("mousemove", handleMouseMove_Redrew);
		}
	}
	else{	// handle marquee click
		click_startPos = pointOnCanvas;
		if(e.button == 0){	// handle left click
			if(marqueeTool_activated == "marquee_default" || marqueeTool_activated == "marquee_move_highLight" || marqueeTool_activated == "marquee_away_highLight"){
				mouse_drag_type = getMarqueeDefaultMouseType(click_startPos);
				if(mouse_drag_type == mouse_drag_types["out_the_marquee"] && marquee_activated_num < 0){
					marquee_activated_num = marqueeTools[marqueeTool_activated].length;
					// marqueeTools[marqueeTool_activated][marquee_activated_num] = new MarqueeTool(marqueeTool_activated + "_" + marquee_activated_num, color_marqueeTool[marqueeTool_activated]);
					marqueeTools[marqueeTool_activated].push(new MarqueeTool(marqueeTool_activated + "_" + marquee_activated_num, color_marqueeTool[marqueeTool_activated]));
				}
			}
			else
				mouse_drag_type = getMouseType(click_startPos);
		}
		else if(e.button == 2){	// handle right click
			if((marqueeTool_activated == "marquee_default" || marqueeTool_activated == "marquee_move_highLight" || marqueeTool_activated == "marquee_away_highLight") && getMarqueeDefaultMouseType(pointOnCanvas) == mouse_drag_types["marquee_move"]){
					marqueeTools[marqueeTool_activated][marquee_activated_num].reset();
					marqueeTools[marqueeTool_activated].splice(marquee_activated_num, 1);
					setMouseCursor(getMarqueeDefaultMouseType(pointOnCanvas));
					marquee_activated_num = -1;
			}
			else{
				mouse_drag_type = mouse_drag_types["marqueeTool_remove"];
				marquee_activated_num = -1;
			}
		}
		$("#canvas").off("mousemove");
		$("#canvas").on("mousemove", handleMouseMove_MarqueeTool);
	}

}

// Handle the mouse up action
function handleMouseUp(e){
	
	if(circle_clicked_num >= 0 && circle_clicked_num < circles.length){
		$("#canvas").off("mousemove");
		$("#canvas").on("mousemove", handleMouseMove_Hover);
		// canvasRedrew();
		circle_clicked_num = -1;
	}
	else{
		if(e.button == 2){
			// marqueeTool_remove.circles_in.forEach(function(d){
			// 	if(marqueeTools[marqueeTool_activated][marquee_activated_num].circles_in.indexOf(d) != -1){
			// 		marqueeTools[marqueeTool_activated][marquee_activated_num].circles_in.splice(marqueeTools[marqueeTool_activated][marquee_activated_num].circles_in.indexOf(d), 1);
			// 		circles[d].popFillColor(marqueeTools[marqueeTool_activated][marquee_activated_num].type + ":" + marqueeTools[marqueeTool_activated][marquee_activated_num].color_border);
			// 	}
			// 	if(marqueeTools[marqueeTool_activated][marquee_activated_num].circles_extra.indexOf(d) != -1){
			// 		marqueeTools[marqueeTool_activated][marquee_activated_num].circles_extra.splice(marqueeTools[marqueeTool_activated][marquee_activated_num].circles_extra.indexOf(d), 1);
			// 		circles[d].popFillColor(marqueeTools[marqueeTool_activated][marquee_activated_num].type + ":" + marqueeTools[marqueeTool_activated][marquee_activated_num].color_border);
			// 	}
			// });
			marqueeTool_remove.reset();
		}
		if(marqueeTool_activated == "marquee_move_highLight" && marquee_activated_num > -1 && marqueeTools["marquee_move_highLight"][marquee_activated_num].circlesMoveEnabled == true){  // when the move end, reget the circles in marquee_move_highLight
			marqueeTools["marquee_move_highLight"][marquee_activated_num].circles_in = marqueeTools["marquee_move_highLight"][marquee_activated_num].getCirclesInMarqueeTool(marqueeTools["marquee_move_highLight"][marquee_activated_num]);
			canvasRedrew();
		}
		if(marqueeTool_activated == "marquee_remove"){  // To remove the circles in marquee_remove
			var circleSet_temp = cloneCircleArray(circles);
			var circle_in = marqueeTools[marqueeTool_activated].circles_in;
			for(var i = 0; i < circles.length; i++){
				if(flag_maintain_circles_in_marquee){
					var posInCircles = getPosInCircleSet(circles[i], circleSet_temp);
					var posInCircles_origin = getPosInCircleSet(circles[i], circles_origin);
					if(circle_in.indexOf(i) == -1){
						circles_origin[posInCircles_origin].x = circleSet_temp[posInCircles].x;
						circles_origin[posInCircles_origin].y = circleSet_temp[posInCircles].y;
						circleSet_temp.splice(posInCircles, 1);
					}
					else
						circleSet_temp[posInCircles].popFillColor(marqueeTools[marqueeTool_activated].type + ":" + marqueeTools[marqueeTool_activated].color_border);
				}
				else{
					if(circle_in.indexOf(i) != -1){
						var posInCircles = getPosInCircleSet(circles[i], circleSet_temp);
						var posInCircles_origin = getPosInCircleSet(circles[i], circles_origin);
						circles_origin[posInCircles_origin].x = circleSet_temp[posInCircles].x;
						circles_origin[posInCircles_origin].y = circleSet_temp[posInCircles].y;
						circleSet_temp.splice(posInCircles, 1);
					}
				}
			}
			circles = circleSet_temp;
			marqueeTools[marqueeTool_activated].reset();
			displayParallelCoordinates(circles);
		}
		$("#canvas").off("mousemove");
		$("#canvas").on("mousemove", handleMouseMove_Hover);
		clearZeroDefaultMarquee();
		mouse_drag_type = "";

	}
}
// clearZeroDefaultMarquee
function clearZeroDefaultMarquee(e){
	for(var i = 0; i < marqueeTools[marqueeTool_activated].length; i++){
		if(marqueeTools[marqueeTool_activated][i].startPos.x == marqueeTools[marqueeTool_activated][i].endPos.x && marqueeTools[marqueeTool_activated][i].startPos.y == marqueeTools[marqueeTool_activated][i].endPos.y){
			marqueeTools[marqueeTool_activated].splice(i, 1);
		}
	}
}
// Handle drag a circle action
function handleMouseMove_Redrew(e){
	var pointOnCanvas = getPointOnCanvas(canvas, e.pageX, e.pageY);
	circles[circle_clicked_num].x = antiXScale(pointOnCanvas.x);
	circles[circle_clicked_num].y = antiYScale(pointOnCanvas.y);
	canvasRedrew();
}
// Handle the mouse move over a circle action
function handleMouseMove_Hover(e){
	var pointOnCanvas = getPointOnCanvas(canvas, e.pageX, e.pageY);
	
	if(marqueeTool_activated == "marquee_default" || marqueeTool_activated == "marquee_away_highLight" || marqueeTool_activated == "marquee_move_highLight")
		setMouseCursor(getMarqueeDefaultMouseType(pointOnCanvas));
	else
		setMouseCursor(getMouseType(pointOnCanvas));

	for(var i = 0; i < circles.length; i++){
		if(circles[i].isPointInside(pointOnCanvas.x, pointOnCanvas.y)){
				circle_moveOver_num = i;
		}
	}

	if(circle_moveOver_num >= 0 && circle_moveOver_num < circles.length && (lastMoveOver == -1 || circle_moveOver_num == lastMoveOver)){  // mouse is on a circle
		$("#canvas").css("cursor", "default");
		displayUserDetail(circles[circle_moveOver_num].user_id);	// display user detail info
		circles[circle_moveOver_num].pushFillColor("hover:" + color_circle_hover);
		lastMoveOver = circle_moveOver_num;
		circle_moveOver_num = -1;
		canvasRedrew();
	}
	else if(lastMoveOver >= 0 && lastMoveOver < circles.length){  // mouse move out a circle
		circles[lastMoveOver].popFillColor("hover:" + color_circle_hover);
		lastMoveOver = -1;
		canvasRedrew();
	}

}
// Handle the highlighting action
function handleMouseMove_MarqueeTool(e){
	click_endPos = getPointOnCanvas(canvas, e.pageX, e.pageY);
	var active_marqueeTool;
	var x_change = click_endPos.x - click_startPos.x;
	var y_change = click_endPos.y - click_startPos.y;

	if(mouse_drag_type == mouse_drag_types["marqueeTool_remove"])
		active_marqueeTool = marqueeTool_remove;
	else if(marqueeTool_activated == "marquee_default" || marqueeTool_activated == "marquee_away_highLight" || marqueeTool_activated == "marquee_move_highLight"){	// set the active_marqueeTool
		active_marqueeTool = marqueeTools[marqueeTool_activated][marquee_activated_num];
	}
	else
		active_marqueeTool = marqueeTools[marqueeTool_activated];

	if(mouse_drag_type == mouse_drag_types["corner_expand_leftUp"]){
		if(active_marqueeTool.startPos.x + x_change < active_marqueeTool.endPos.x && active_marqueeTool.startPos.y + y_change < active_marqueeTool.endPos.y){
			active_marqueeTool.startPos.x += x_change;
			active_marqueeTool.startPos.y += y_change;
			// canvasRedrew();
		}
	}
	else if(mouse_drag_type == mouse_drag_types["corner_expand_rightUp"]){
		if(active_marqueeTool.startPos.y + y_change < active_marqueeTool.endPos.y && active_marqueeTool.endPos.x + x_change > active_marqueeTool.startPos.x){
			active_marqueeTool.startPos.y += y_change;
			active_marqueeTool.endPos.x += x_change;
			// canvasRedrew();
		}
	}
	else if(mouse_drag_type == mouse_drag_types["corner_expand_rightDown"]){
		if(active_marqueeTool.endPos.x + x_change > active_marqueeTool.startPos.x && active_marqueeTool.endPos.y + y_change > active_marqueeTool.startPos.y){
			active_marqueeTool.endPos.x += x_change;
			active_marqueeTool.endPos.y += y_change;
			// canvasRedrew();
		}
	}
	else if(mouse_drag_type == mouse_drag_types["corner_expand_leftDown"]){
		if(active_marqueeTool.startPos.x + x_change < active_marqueeTool.endPos.x && active_marqueeTool.endPos.y + y_change > active_marqueeTool.startPos.y){
			active_marqueeTool.startPos.x += x_change;
			active_marqueeTool.endPos.y += y_change;
			// canvasRedrew();
		}
	}
	else if(mouse_drag_type == mouse_drag_types["edge_expand_up"]){
		if(active_marqueeTool.startPos.y + y_change < active_marqueeTool.endPos.y){
			active_marqueeTool.startPos.y += y_change;
			// canvasRedrew();
		}
	}
	else if(mouse_drag_type == mouse_drag_types["edge_expand_right"]){
		if(active_marqueeTool.endPos.x + x_change > active_marqueeTool.startPos.x){
			active_marqueeTool.endPos.x += x_change;
			// canvasRedrew();
		}
	}
	else if(mouse_drag_type == mouse_drag_types["edge_expand_down"]){
		if(active_marqueeTool.endPos.y + y_change > active_marqueeTool.startPos.y){
			active_marqueeTool.endPos.y += y_change;
			// canvasRedrew();
		}
	}
	else if(mouse_drag_type == mouse_drag_types["edge_expand_left"]){
		if(active_marqueeTool.startPos.x + x_change < active_marqueeTool.endPos.x){
			active_marqueeTool.startPos.x += x_change;
			// canvasRedrew();
		}
	}
	else if(mouse_drag_type == mouse_drag_types["marquee_move"]){
		if(marqueeTool_activated == "marquee_move_highLight" && marqueeTools["marquee_move_highLight"][marquee_activated_num].circlesMoveEnabled == true){

			active_marqueeTool.circles_in.forEach(function(i){
				if(active_marqueeTool.isCircleInside(circles[i])){	// only circles in marquee_move can move
					circles[i].x = antiXScale(xScale(circles[i].x) + x_change);
					circles[i].y = antiYScale(yScale(circles[i].y) + y_change);
				}
			});

			active_marqueeTool.startPos.x += x_change;
			active_marqueeTool.startPos.y += y_change;
			active_marqueeTool.endPos.x += x_change;
			active_marqueeTool.endPos.y += y_change;

			

			// active_marqueeTool.getCirclesInMarqueeToolEnabled = false;
			// canvasRedrew();
			// active_marqueeTool.getCirclesInMarqueeToolEnabled = true;
		}
		else{
			active_marqueeTool.startPos.x += x_change;
			active_marqueeTool.startPos.y += y_change;
			active_marqueeTool.endPos.x += x_change;
			active_marqueeTool.endPos.y += y_change;
			// canvasRedrew();
		}
	}
	else if(mouse_drag_type == mouse_drag_types["out_the_marquee"]){
		active_marqueeTool.getStartAndEndPos(click_startPos, click_endPos);
		// canvasRedrew();
	}
	else if(mouse_drag_type == mouse_drag_types["marqueeTool_remove"]){
		marqueeTool_remove.getStartAndEndPos(click_startPos, click_endPos);
		marqueeTool_remove.circles_in = marqueeTool_remove.getCirclesInMarqueeTool(marqueeTool_remove);
	}
	if(mouse_drag_type != mouse_drag_types["marqueeTool_remove"]
		&& !(mouse_drag_type == mouse_drag_types["marquee_move"] && marqueeTool_activated == "marquee_move_highLight" && marqueeTools["marquee_move_highLight"][marquee_activated_num].circlesMoveEnabled == true) && marquee_activated_num > -1)
		active_marqueeTool.circles_in = active_marqueeTool.getCirclesInMarqueeTool(active_marqueeTool);
	canvasRedrew();
	
	if(mouse_drag_type != mouse_drag_types["out_the_marquee"] && mouse_drag_type != mouse_drag_types["marqueeTool_remove"])
		click_startPos = click_endPos;
	
}
// set mouse cursor while move the mouse
function setMouseCursor(type){
	switch(type){
		case mouse_drag_types["corner_expand_leftUp"]:
			$("#canvas").css("cursor", "nw-resize");
			break;
		case mouse_drag_types["corner_expand_rightUp"]:
			$("#canvas").css("cursor", "ne-resize");
			break;
		case mouse_drag_types["corner_expand_rightDown"]:
			$("#canvas").css("cursor", "se-resize");
			break;
		case mouse_drag_types["corner_expand_leftDown"]:
			$("#canvas").css("cursor", "sw-resize");
			break;
		case mouse_drag_types["edge_expand_up"]:
			$("#canvas").css("cursor", "n-resize");
			break;
		case mouse_drag_types["edge_expand_right"]:
			$("#canvas").css("cursor", "e-resize");
			break;
		case mouse_drag_types["edge_expand_down"]:
			$("#canvas").css("cursor", "s-resize");
			break;
		case mouse_drag_types["edge_expand_left"]:
			$("#canvas").css("cursor", "w-resize");
			break;
		case mouse_drag_types["marquee_move"]:
			$("#canvas").css("cursor", "move");
			break
		default:
			$("#canvas").css("cursor", "default");
			break;
	}
}

// Get mouse move type for marqueeTool
function getMouseType(pos){
	var threshold = 5;
	var left_up, right_down;

	if(marqueeTool_activated == "") //Judge if the canvas zoom is activated
		return "default";
	else{
		left_up = marqueeTools[marqueeTool_activated].startPos;
		right_down = marqueeTools[marqueeTool_activated].endPos;
	}

	if(Math.pow(pos.x - left_up.x, 2) + Math.pow(pos.y - left_up.y, 2) < threshold * threshold)
		return mouse_drag_types["corner_expand_leftUp"];
	else if(Math.pow(pos.x - right_down.x, 2) + Math.pow(pos.y - left_up.y, 2) < threshold * threshold)
		return mouse_drag_types["corner_expand_rightUp"];
	else if(Math.pow(pos.x - right_down.x, 2) + Math.pow(pos.y - right_down.y, 2) < threshold * threshold)
		return mouse_drag_types["corner_expand_rightDown"];
	else if(Math.pow(pos.x - left_up.x, 2) + Math.pow(pos.y - right_down.y, 2) < threshold * threshold)
		return mouse_drag_types["corner_expand_leftDown"];
	else if(pos.x > left_up.x + threshold && pos.x < right_down.x - threshold && pos.y > left_up.y - threshold && pos.y < left_up.y + threshold)
		return mouse_drag_types["edge_expand_up"];
	else if(pos.x > right_down.x - threshold && pos.x < right_down.x + threshold && pos.y > left_up.y + threshold && pos.y < right_down.y - threshold)
		return mouse_drag_types["edge_expand_right"];
	else if(pos.x > left_up.x + threshold && pos.x < right_down.x - threshold && pos.y > right_down.y - threshold && pos.y < right_down.y + threshold)
		return mouse_drag_types["edge_expand_down"];
	else if(pos.x > left_up.x - threshold && pos.x < left_up.x + threshold && pos.y > left_up.y + threshold && pos.y < right_down.y - threshold)
		return mouse_drag_types["edge_expand_left"];
	else if(pos.x > left_up.x + threshold && pos.x < right_down.x - threshold && pos.y > left_up.y + threshold && pos.y < right_down.y - threshold)
		return mouse_drag_types["marquee_move"];
	else
		return mouse_drag_types["out_the_marquee"];

}
// Get mouse move type for default marqueeTool
function getMarqueeDefaultMouseType(pos){
	var threshold = 5;
	var left_up, right_down;

	if(marqueeTool_activated == "") //Judge if the canvas zoom is activated
		return "default";
	if(marqueeTools[marqueeTool_activated].length == 1 && marqueeTools[marqueeTool_activated][0].startPos.x == marqueeTools[marqueeTool_activated][0].endPos.x && marqueeTools[marqueeTool_activated][0].startPos.y == marqueeTools[marqueeTool_activated][0].endPos.y && marqueeTools[marqueeTool_activated][0].circles_in.length > 0){
		marquee_activated_num = 0;
		return mouse_drag_types["out_the_marquee"];
	}
	// if(marqueeTools["marquee_default"].length == 0)
	// 	marqueeTools["marquee_default"][0] = new MarqueeTool("marquee_default_0", "black");

	for(var i = 0; i < marqueeTools[marqueeTool_activated].length; i++){
		left_up = marqueeTools[marqueeTool_activated][i].startPos;
		right_down = marqueeTools[marqueeTool_activated][i].endPos;

		if(Math.pow(pos.x - left_up.x, 2) + Math.pow(pos.y - left_up.y, 2) < threshold * threshold){
			marquee_activated_num = i;
			return mouse_drag_types["corner_expand_leftUp"];
		}
		else if(Math.pow(pos.x - right_down.x, 2) + Math.pow(pos.y - left_up.y, 2) < threshold * threshold){
			marquee_activated_num = i;
			return mouse_drag_types["corner_expand_rightUp"];
		}
		else if(Math.pow(pos.x - right_down.x, 2) + Math.pow(pos.y - right_down.y, 2) < threshold * threshold){
			marquee_activated_num = i;
			return mouse_drag_types["corner_expand_rightDown"];
		}
		else if(Math.pow(pos.x - left_up.x, 2) + Math.pow(pos.y - right_down.y, 2) < threshold * threshold){
			marquee_activated_num = i;
			return mouse_drag_types["corner_expand_leftDown"];
		}
		else if(pos.x > left_up.x + threshold && pos.x < right_down.x - threshold && pos.y > left_up.y - threshold && pos.y < left_up.y + threshold){
			marquee_activated_num = i;
			return mouse_drag_types["edge_expand_up"];
		}
		else if(pos.x > right_down.x - threshold && pos.x < right_down.x + threshold && pos.y > left_up.y + threshold && pos.y < right_down.y - threshold){
			marquee_activated_num = i;
			return mouse_drag_types["edge_expand_right"];
		}
		else if(pos.x > left_up.x + threshold && pos.x < right_down.x - threshold && pos.y > right_down.y - threshold && pos.y < right_down.y + threshold){
			marquee_activated_num = i;
			return mouse_drag_types["edge_expand_down"];
		}
		else if(pos.x > left_up.x - threshold && pos.x < left_up.x + threshold && pos.y > left_up.y + threshold && pos.y < right_down.y - threshold){
			marquee_activated_num = i;
			return mouse_drag_types["edge_expand_left"];
		}
		else if(pos.x > left_up.x + threshold && pos.x < right_down.x - threshold && pos.y > left_up.y + threshold && pos.y < right_down.y - threshold){
			marquee_activated_num = i;
			return mouse_drag_types["marquee_move"];
		}
		// else{
		// 	marquee_default_num = i;
		// 	return mouse_drag_types["out_the_marquee"];
		// }
	}

	marquee_activated_num = -1;
	return mouse_drag_types["out_the_marquee"];

}

// Canvas redrew
function canvasRedrew(){
	context.clearRect(0, 0, canvas.width, canvas.height);
	
	for(p in marqueeTools){
		if(p == "marquee_default" || p == "marquee_away_highLight" || p == "marquee_move_highLight"){
			for(var  i = 0; i < marqueeTools[p].length; i++)
				marqueeTools[p][i].redrew(marqueeTools[p][i].startPos, marqueeTools[p][i].endPos);
		}
		else
			marqueeTools[p].redrew(marqueeTools[p].startPos, marqueeTools[p].endPos);
	}
	marqueeTool_remove.redrew(marqueeTool_remove.startPos, marqueeTool_remove.endPos);
	circles.forEach(function(d, i){
		d.redrew();
	});

	highlightDataInParallelCoordinate();
}

// To get the coordinate of the mouse in canvas
function getPointOnCanvas(canvas, x, y) {

	 var bbox = canvas.getBoundingClientRect();

	 return{ x: x- bbox.left *(canvas.width / bbox.width),
			y:y - bbox.top  * (canvas.height / bbox.height)
			};

}