/*


*/
var padding = 20;
var text_padding = 3;
var radius = 5;
var canvas = $("#canvas")[0];
var context = canvas.getContext("2d");
var canvas_MDS_width, canvas_MDS_height;
var circles_origin = [], circles = [], weight_MDS = [];
var data_userInfo = [], data_propertyName = [];
var xScale, yScale, antiXScale, antiYScale;
var color_circle_isExpert = "#79C5B7", color_circle_notExpert = "#AAB0B2";
var color_circle_hover = "#ffe66d"
  , color_circle_click = "rgb(150,0,150)"
  , color_circle_doubleClicked = "#E26868";
var color_marqueeTool = {
  "marquee_default": "black",
  "marquee_move": "#132156",
  "marquee_approach_highLight": "#789452",
  "marquee_away_highLight": "#911231",
  "marquee_move_highLight": "#264215",
  "marquee_remove": "#896432"
}, marqueeTools = {}, marqueeTool_activated = "marquee_default", timer_click = null;
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
  "out_the_marquee": 4
},mouse_drag_type = "";
var isExpert = 1, notExpert = 0;
var circles_doubleClicked = [];
var click_startPos = {x: 0, y: 0},click_endPos = {x: 0, y: 0};
var circle_clicked_num = -1, circle_moveOver_num = -1, lastMoveOver = -1;

// Circle Class
var Circle = (function(){

  // constructor
  function Circle(user_id, x, y, radius, expert){
  this.user_id = user_id;
  this.x = x;
  this.y = y;
  this.radius = radius;
  this.expert = expert;
  expert == isExpert ? this.color_fill = color_circle_isExpert : this.color_fill = color_circle_notExpert;
  this.color_hover = this.color_fill;
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
    context.fillStyle = this.color_fill;
    context.strokeStyle = this.color_hover;
    context.arc(xScale(this.x), yScale(this.y), this.radius, 0, 2 * Math.PI, true);
    context.fill();
    context.stroke();

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

  return Circle;
})();

// MarqueeTool Class - for the MDS Canvas
var MarqueeTool = (function(){

  // constructor
  function MarqueeTool(type){
    this.startPos = {x : 0, y : 0};
    this.endPos = {x : 0, y : 0};
    this.type = type;
    this.getCirclesInMarqueeToolEnabled = true;
    this.color_border = color_marqueeTool[this.type];
    this.circles_in = [];
    this.redrew(this.startPos, this.endPos);
    return (this);
  }
  // redrew the MarqueeTool  rectangle.
  MarqueeTool.prototype.redrew = function(startPos, endPos){
    this.getStartAndEndPos(startPos, endPos);
    if(this.getCirclesInMarqueeToolEnabled)
      this.circles_in = this.getCirclesInMarqueeTool(this);
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
    var circlesInMarqueeTool = [];
    // array_parallel_coordinate_highlighted = [];
    // highlightDataInParallelCoordinate(array_parallel_coordinate_highlighted);
    circles.forEach(function(circle, i){
      if(marqueeTool.isCircleInside(circle)){
        circlesInMarqueeTool.push(i);
        // array_parallel_coordinate_highlighted.push(i);
        // highlightDataInParallelCoordinate(array_parallel_coordinate_highlighted);
        circle.color_fill = marqueeTool.color_border;
      }
      else if(circles_doubleClicked.indexOf(i) != -1)
        circle.color_fill = color_circle_doubleClicked;
      else if(!checkCircleInAnyMarqueeTool(i))
        circle.expert == isExpert ? circle.color_fill = color_circle_isExpert : circle.color_fill = color_circle_notExpert;
    })
    // console.log(circlesInMarqueeTool);
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
    canvasRedrew();
  }

  return MarqueeTool;
})();

// Beginning function: loading the results of the MDS.
function Init(){

  canvas.width = $("#div_middle_canvas").width();
  canvas.height = $("#div_middle_canvas").height();
  canvas_MDS_width = canvas.width;
  canvas_MDS_height = canvas.height;
  for(p in color_marqueeTool) // Initiate the marquee tools
    marqueeTools[p] = new MarqueeTool(p);

  dataLoading();
  canvas.addEventListener("mousedown", handleMouseDown, false);
  canvas.addEventListener("mouseup", handleMouseUp, false);
  canvas.addEventListener("mousemove", handleMouseMove_Hover, false);
  canvas.addEventListener("dblclick", handleMouseDoubleClick, false);
  for(p in color_marqueeTool){
    $("#" + p).click(handleMarqueeToolClick);
    $("#" + p).dblclick(handleMarqueeToolDoubleClick);
    $("#" + p).mouseover(handleMarqueeToolMouseOver);
    $("#" + p).mouseout(handleMarqueeToolMouseOut);
  }
  $("#" + marqueeTool_activated).css({"border-color": color_marqueeTool[marqueeTool_activated], "color": color_marqueeTool[marqueeTool_activated]});
}

// dataLoading function
function dataLoading(){

  d3.json("static/data/demo_user30.json", 
    function(data){
      data_userInfo = data.user_info;
      data_propertyName = data.property_name;
    });
  d3.json("static/data/demo_post.json",
    function(data){

      var positions_mds = data.positions;
      weight_MDS = data.weight;
      positions_mds.forEach(function(d){
        d[0] = parseInt(d[0] * 100);
        d[1] = parseInt(d[1] * 100);
      })

      xScale = d3.scale.linear()
                 .domain([d3.min(positions_mds, function(d) { return d[0]; }), d3.max(positions_mds, function(d) { return d[0]; })])
                 .rangeRound([padding, canvas_MDS_width - padding]);
      yScale = d3.scale.linear()
                 .domain([d3.min(positions_mds, function(d) { return d[1]; }), d3.max(positions_mds, function(d) { return d[1]; })])
                 .rangeRound([padding, canvas_MDS_height - padding]);
      antiXScale = d3.scale.linear()
                 .domain([padding, canvas_MDS_width - padding])
                 .rangeRound([d3.min(positions_mds, function(d) { return d[0]; }), d3.max(positions_mds, function(d) { return d[0]; })]);
      antiYScale = d3.scale.linear()
                 .domain([padding, canvas_MDS_height - padding])
                 .rangeRound([d3.min(positions_mds, function(d) { return d[1]; }), d3.max(positions_mds, function(d) { return d[1]; })]);

      positions_mds.forEach(function(d, i){
        var circle = new Circle(i, d[0], d[1], radius, data_userInfo[i][0]);
        circles.push(circle);
      })

      circles_origin = cloneCircleArray(circles);
      // highLightingTool = new HighLightingTool(highLighting_startPos, highLighting_endPos, highLightColor, []);
      displayWeight_MDS(weight_MDS);
      displayParallelCoordinates(circles);
      initFilter(data_userInfo, data_propertyName);
    }
  );

}
// Clone a Circles Array
function cloneCircleArray(circleArray){
  var new_circleArray = [];
  for(var i = 0; i < circleArray.length; i++){
    var circle = new Circle(circleArray[i].user_id, circleArray[i].x, circleArray[i].y, radius, circleArray[i].expert)
    circle.color_fill = circleArray[i].color_fill;
    circle.color_hover = circleArray[i].color_hover;
    new_circleArray.push(circle);
  }
  return new_circleArray;
}

// Check if circle in any MarqueeTool
function checkCircleInAnyMarqueeTool(circle_num){
  for(p in marqueeTools){
    if(marqueeTools[p].circles_in.indexOf(circle_num) != -1)
      return true;
  }
  return false;
}

/*
    click event for marquee tools
*/

// Mouse over event
function handleMarqueeToolMouseOver(e){
  var sourse = e.target;
  $("#" + sourse.id).css({"border-color": color_marqueeTool[sourse.id],
    "color": color_marqueeTool[sourse.id]});
}

// Mouse out event
function handleMarqueeToolMouseOut(e){
  var sourse = e.target;
  if(sourse.id != marqueeTool_activated)
    $("#" + sourse.id).css({"border-color": "#dce1e6", "color": "#8c96a0"});
}

// Single click event
function handleMarqueeToolClick(e){
  clearTimeout(timer_click);
  timer_click = setTimeout(function(){
    var sourse = e.target;
    if(sourse.id != "marquee_default")  // reset the marquee_default if other marqueeTool is activated
      marqueeTools["marquee_default"].reset();
    marqueeTool_activated = sourse.id;
    $("#" + sourse.id).css({"border-color": color_marqueeTool[sourse.id], "color": color_marqueeTool[sourse.id]});
    for(p in color_marqueeTool)
      if(p != marqueeTool_activated)
        $("#" + p).css({"border-color": "#dce1e6", "color": "#8c96a0"});
  }, 250);
  
  
}
// Double click event
function handleMarqueeToolDoubleClick(e){
  var sourse = e.target;
  clearTimeout(timer_click);
  marqueeTools[sourse.id].reset();
  if(sourse.id == marqueeTool_activated){
    $("#" + marqueeTool_activated).css({"border-color": "#dce1e6", "color": "#8c96a0"});
    marqueeTool_activated = "marquee_default";
    $("#" + marqueeTool_activated).css({"border-color": color_marqueeTool[marqueeTool_activated], "color": color_marqueeTool[marqueeTool_activated]});
  }
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
    circles[circle_clicked_num].color_fill = color_circle_click;
    canvasRedrew();
    canvas.removeEventListener("mousemove", handleMouseMove_Hover, false);
    canvas.addEventListener("mousemove", handleMouseMove_Redrew, false);
  }
  else{
    click_startPos = pointOnCanvas;
    mouse_drag_type = getMouseType(click_startPos);
    canvas.removeEventListener("mousemove", handleMouseMove_Hover, false);
    canvas.addEventListener("mousemove", handleMouseMove_MarqueeTool, false);
  }

}
// Handle MouseDoubleClick action
function handleMouseDoubleClick(e){
  var pointOnCanvas = getPointOnCanvas(canvas, e.pageX, e.pageY);
  var circle_doubleClick_num = -1;

  for(var i=0; i < circles.length; i++){
          if(circles[i].isPointInside(pointOnCanvas.x, pointOnCanvas.y)){
              circle_doubleClick_num = i;
          }
  }
  if(circle_doubleClick_num >= 0 && circle_doubleClick_num < circles.length
    && circles_doubleClicked.indexOf(circle_doubleClick_num) == -1){
    circles_doubleClicked.push(circle_doubleClick_num);
    circles[circle_doubleClick_num].color_fill = color_circle_doubleClicked;
    canvasRedrew();
  }
  else if(circle_doubleClick_num >= 0 && circle_doubleClick_num < circles.length
    && circles_doubleClicked.indexOf(circle_doubleClick_num) != -1){
    circles_doubleClicked.splice(circles_doubleClicked.indexOf(circle_doubleClick_num), 1);
    if(highLightingTool.circles_in.indexOf(i) != -1) 
        circles[circle_doubleClick_num].color_fill = highLightColor;
    else
        circles[circle_doubleClick_num].expert == isExpert ? circles[circle_doubleClick_num].color_fill = color_circle_isExpert : circles[circle_doubleClick_num].color_fill = color_circle_notExpert;
    canvasRedrew();
  }
}
// Handle the mouse up action
function handleMouseUp(e){
  
  if(circle_clicked_num >= 0 && circle_clicked_num < circles.length){
    canvas.removeEventListener("mousemove", handleMouseMove_Redrew, false);
    canvas.addEventListener("mousemove", handleMouseMove_Hover, false);
    canvasRedrew();
    circle_clicked_num = -1;
  }
  else{
    if(marqueeTool_activated == "marquee_remove"){  // To remove the circles in marquee_remove
      var circleSet_temp = cloneCircleArray(circles);
      var circle_in = marqueeTools[marqueeTool_activated].circles_in;
      for(var i = 0; i < circle_in.length; i++){
        var posInCircles = getPosInCircleSet(circles[circle_in[i]], circleSet_temp);
        var posInCircles_origin = getPosInCircleSet(circles[circle_in[i]], circles_origin);
        circles_origin[posInCircles_origin].x = circleSet_temp[posInCircles].x;
        circles_origin[posInCircles_origin].y = circleSet_temp[posInCircles].y;
        circleSet_temp.splice(posInCircles, 1);
      }
      circles = circleSet_temp;
      displayParallelCoordinates(circles);
    }
    canvas.removeEventListener("mousemove", handleMouseMove_MarqueeTool, false);
    canvas.addEventListener("mousemove", handleMouseMove_Hover, false);
    mouse_drag_type = "";
    canvasRedrew();
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
  switch(getMouseType(pointOnCanvas)){
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


  for(var i = 0; i < circles.length; i++){
          if(circles[i].isPointInside(pointOnCanvas.x, pointOnCanvas.y)){
              circle_moveOver_num = i;
          }
      }

  if(circle_moveOver_num >= 0 && circle_moveOver_num < circles.length && (lastMoveOver == -1 || circle_moveOver_num == lastMoveOver)){  // mouse is on a circle
    $("#canvas").css("cursor", "default");
    circles[circle_moveOver_num].color_hover = color_circle_hover;
    lastMoveOver = circle_moveOver_num;
    circle_moveOver_num = -1;
    canvasRedrew();
  }
  else if(lastMoveOver >= 0 && lastMoveOver < circles.length){  // mouse move out a circle
    circles[lastMoveOver].expert == isExpert ? circles[lastMoveOver].color_hover = color_circle_isExpert : circles[lastMoveOver].color_hover = color_circle_notExpert;
    lastMoveOver = -1;
    canvasRedrew();
  }

}
// Handle the highlighting action
function handleMouseMove_MarqueeTool(e){
  click_endPos = getPointOnCanvas(canvas, e.pageX, e.pageY);
  var active_marqueeTool = marqueeTools[marqueeTool_activated];
  var x_change = click_endPos.x - click_startPos.x;
  var y_change = click_endPos.y - click_startPos.y;

  if(mouse_drag_type == mouse_drag_types["corner_expand_leftUp"]){
    if(active_marqueeTool.startPos.x + x_change < active_marqueeTool.endPos.x && active_marqueeTool.startPos.y + y_change < active_marqueeTool.endPos.y){
      active_marqueeTool.startPos.x += x_change;
      active_marqueeTool.startPos.y += y_change;
      canvasRedrew();
    }
  }
  else if(mouse_drag_type == mouse_drag_types["corner_expand_rightUp"]){
    if(active_marqueeTool.startPos.y + y_change < active_marqueeTool.endPos.y && active_marqueeTool.endPos.x + x_change > active_marqueeTool.startPos.x){
      active_marqueeTool.startPos.y += y_change;
      active_marqueeTool.endPos.x += x_change;
      canvasRedrew();
    }
  }
  else if(mouse_drag_type == mouse_drag_types["corner_expand_rightDown"]){
    if(active_marqueeTool.endPos.x + x_change > active_marqueeTool.startPos.x && active_marqueeTool.endPos.y + y_change > active_marqueeTool.startPos.y){
      active_marqueeTool.endPos.x += x_change;
      active_marqueeTool.endPos.y += y_change;
      canvasRedrew();
    }
  }
  else if(mouse_drag_type == mouse_drag_types["corner_expand_leftDown"]){
    if(active_marqueeTool.startPos.x + x_change < active_marqueeTool.endPos.x && active_marqueeTool.endPos.y + y_change > active_marqueeTool.startPos.y){
      active_marqueeTool.startPos.x += x_change;
      active_marqueeTool.endPos.y += y_change;
      canvasRedrew();
    }
  }
  else if(mouse_drag_type == mouse_drag_types["edge_expand_up"]){
    if(active_marqueeTool.startPos.y + y_change < active_marqueeTool.endPos.y){
      active_marqueeTool.startPos.y += y_change;
      canvasRedrew();
    }
  }
  else if(mouse_drag_type == mouse_drag_types["edge_expand_right"]){
    if(active_marqueeTool.endPos.x + x_change > active_marqueeTool.startPos.x){
      active_marqueeTool.endPos.x += x_change;
      canvasRedrew();
    }
  }
  else if(mouse_drag_type == mouse_drag_types["edge_expand_down"]){
    if(active_marqueeTool.endPos.y + y_change > active_marqueeTool.startPos.y){
      active_marqueeTool.endPos.y += y_change;
      canvasRedrew();
    }
  }
  else if(mouse_drag_type == mouse_drag_types["edge_expand_left"]){
    if(active_marqueeTool.startPos.x + x_change < active_marqueeTool.endPos.x){
      active_marqueeTool.startPos.x += x_change;
      canvasRedrew();
    }
  }
  else if(mouse_drag_type == mouse_drag_types["marquee_move"]){
    if(marqueeTool_activated == "marquee_move"){

      active_marqueeTool.startPos.x += x_change;
      active_marqueeTool.startPos.y += y_change;
      active_marqueeTool.endPos.x += x_change;
      active_marqueeTool.endPos.y += y_change;

      active_marqueeTool.circles_in.forEach(function(i){
        circles[i].x = antiXScale(xScale(circles[i].x) + x_change);
        circles[i].y = antiYScale(yScale(circles[i].y) + y_change);
      })

      active_marqueeTool.getCirclesInMarqueeToolEnabled = false;
      canvasRedrew();
      active_marqueeTool.getCirclesInMarqueeToolEnabled = true;
    }
    else{
      active_marqueeTool.startPos.x += x_change;
      active_marqueeTool.startPos.y += y_change;
      active_marqueeTool.endPos.x += x_change;
      active_marqueeTool.endPos.y += y_change;
      canvasRedrew();
    }
  }
  else if(mouse_drag_type == mouse_drag_types["out_the_marquee"]){
    active_marqueeTool.startPos = click_startPos;
    active_marqueeTool.endPos = click_endPos;
    canvasRedrew();
  }
  
  if(mouse_drag_type != mouse_drag_types["out_the_marquee"])
    click_startPos = click_endPos;
  
}

// Get mouse move type for marqueeTool
function getMouseType(pos){
  var threshold = 5;
  var left_up = marqueeTools[marqueeTool_activated].startPos;
  var right_down = marqueeTools[marqueeTool_activated].endPos;
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

// Canvas redrew
function canvasRedrew(){
  context.clearRect(0, 0, canvas.width, canvas.height);
  
  for(p in marqueeTools){
    marqueeTools[p].redrew(marqueeTools[p].startPos, marqueeTools[p].endPos);
  }
  circles.forEach(function(d, i){
    d.redrew();
  })

  highlightDataInParallelCoordinate();
}

// To get the coordinate of the mouse in canvas
function getPointOnCanvas(canvas, x, y) {

   var bbox = canvas.getBoundingClientRect();

   return{ x: x- bbox.left *(canvas.width / bbox.width),

           y:y - bbox.top  * (canvas.height / bbox.height)

           };

}