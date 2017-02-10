/*


*/
var padding = 20;
var text_padding = 3;
var radius = 5;
var canvas = document.getElementById("canvas");
var context = canvas.getContext("2d");
canvas.width = document.getElementById("div_middle_canvas").clientWidth;
canvas.height = document.getElementById("div_middle_canvas").clientHeight;
var canvas_MDS_width = canvas.width;
var canvas_MDS_height = canvas.height;
var circles_origin = [], circles = [], weight_MDS = [];
var data_userInfo = [], data_propertyName = [];
var xScale, yScale, antiXScale, antiYScale;
var color_circle_isExpert = "rgb(123, 321, 111)", color_circle_notExpert = "rgb(200,200,200)";
var color_circle_hover = "rgb(0,150,150)"
  , color_circle_click = "rgb(150,0,150)"
  , color_circle_doubleClicked = "red"
  , highLightColor = "rgb(150,150,0)";
var isExpert = 1, notExpert = 0;
var circles_draged = [], circles_doubleClicked = [];
var highLighting_startPos = {x: 0, y: 0},highLighting_endPos = {x: 0, y: 0};
var highLightingTool;
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

// HighLightingTool Class-to select the focus plots
var HighLightingTool = (function(){

  // constructor
  function HighLightingTool(startPos, endPos, color_border, circles_in){
    this.getStartAndEndPos(startPos, endPos);
    this.color_border = color_border;
    this.circles_in = circles_in;
    this.redrew(this.startPos, this.endPos);
    return (this);
  }
  // redrew the HighLightingTool  rectangle.
  HighLightingTool.prototype.redrew = function(startPos, endPos){
    this.getStartAndEndPos(startPos, endPos);
    this.circles_in = this.getCirclesInHighLightingTool(this);
    context.setLineDash([1, 2]);
    context.strokeStyle = this.color_border;
    context.beginPath();
    context.strokeRect(this.startPos.x, this.startPos.y, (this.endPos.x - this.startPos.x), (this.endPos.y - this.startPos.y));
    context.restore();
    return (this);
  }
  // get the circles inside the HighLightingTool  rectangle.
  HighLightingTool.prototype.getCirclesInHighLightingTool = function(highLightingTool){
    var circlesInHighLightingTool = [];
    array_parallel_coordinate_highlighted = [];
    highlightDataInParallelCoordinate(array_parallel_coordinate_highlighted);
    circles.forEach(function(circle, i){
      if(highLightingTool.isCircleInside(circle)){
        circlesInHighLightingTool.push(i);
        array_parallel_coordinate_highlighted.push(i);
        highlightDataInParallelCoordinate(array_parallel_coordinate_highlighted);
        circle.color_fill = highLightColor;
      }
      else if(circles_doubleClicked.indexOf(i) != -1)
        circle.color_fill = color_circle_doubleClicked;
      else
        circle.expert == isExpert ? circle.color_fill = color_circle_isExpert : circle.color_fill = color_circle_notExpert;
    })
    return circlesInHighLightingTool;
  }
  // To judge if the circle is inside the HighLightingTool rectangle.
  HighLightingTool.prototype.isCircleInside = function(circle){
    if((xScale(circle.x) >= (this.startPos.x + circle.radius))&&(xScale(circle.x) <= (this.endPos.x - circle.radius))
      &&(yScale(circle.y) >= (this.startPos.y + circle.radius))&&(yScale(circle.y) <= (this.endPos.y - circle.radius)))
      return true;
    else
      return false;
  }
  // get the upper left and lower right plots' coordinates of the HighLightingTool rectangle.
  HighLightingTool.prototype.getStartAndEndPos = function(startPos, endPos){
    this.startPos = {x: Math.min(startPos.x, endPos.x), y: Math.min(startPos.y, endPos.y)};
    this.endPos = {x: Math.max(startPos.x, endPos.x), y: Math.max(startPos.y, endPos.y)};
  }

  return HighLightingTool;
})();

// Init
Init();

// Beginning function: loading the results of the MDS.
function Init(){

  dataLoading();
  canvas.addEventListener("mousedown", handleMouseDown, false);
  canvas.addEventListener("mouseup", handleMouseUp, false);
  canvas.addEventListener("mousemove", handleMouseMove_Hover, false);
  canvas.addEventListener("dblclick", handleMouseDoubleClick, false);
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
                 .rangeRound([canvas_MDS_height - padding, padding]);
      antiXScale = d3.scale.linear()
                 .domain([padding, canvas_MDS_width - padding])
                 .rangeRound([d3.min(positions_mds, function(d) { return d[0]; }), d3.max(positions_mds, function(d) { return d[0]; })]);
      antiYScale = d3.scale.linear()
                 .domain([canvas_MDS_height - padding, padding])
                 .rangeRound([d3.min(positions_mds, function(d) { return d[1]; }), d3.max(positions_mds, function(d) { return d[1]; })]);

      positions_mds.forEach(function(d, i){
        var circle = new Circle(i, d[0], d[1], radius, data_userInfo[i][0]);
        circles.push(circle);
      })

      circles_origin = cloneCircleArray(circles);
      highLightingTool = new HighLightingTool(highLighting_startPos, highLighting_endPos, highLightColor, []);
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

/*
  Listeners for the mouse actions.
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
    highLighting_startPos = pointOnCanvas;
    canvas.removeEventListener("mousemove", handleMouseMove_Hover, false);
    canvas.addEventListener("mousemove", handleMouseMove_HighLightingTool, false);
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
    canvas.removeEventListener("mousemove", handleMouseMove_HighLightingTool, false);
    canvas.addEventListener("mousemove", handleMouseMove_Hover, false);
  }
}
// Handle drag a circle action
function handleMouseMove_Redrew(e){
  var pointOnCanvas = getPointOnCanvas(canvas, e.pageX, e.pageY);
  circles[circle_clicked_num].x = antiXScale(pointOnCanvas.x);
  circles[circle_clicked_num].y = antiYScale(pointOnCanvas.y);
  if(circles_draged.indexOf(circle_clicked_num) == -1)
    circles_draged.push(circle_clicked_num);
  canvasRedrew();
}
// Handle the mouse move over a circle action
function handleMouseMove_Hover(e){
  var pointOnCanvas = getPointOnCanvas(canvas, e.pageX, e.pageY);

  for(var i = 0; i < circles.length; i++){
          if(circles[i].isPointInside(pointOnCanvas.x, pointOnCanvas.y)){
              circle_moveOver_num = i;
          }
      }

  if(circle_moveOver_num >= 0 && circle_moveOver_num < circles.length && (lastMoveOver == -1 || circle_moveOver_num == lastMoveOver)){
    circles[circle_moveOver_num].color_hover = color_circle_hover;
    canvasRedrew();
    lastMoveOver = circle_moveOver_num;
    if(array_parallel_coordinate_highlighted.indexOf(circle_moveOver_num) == -1)
      array_parallel_coordinate_highlighted.push(circle_moveOver_num);
    highlightDataInParallelCoordinate(array_parallel_coordinate_highlighted);
    circle_moveOver_num = -1;
  }
  else if(lastMoveOver >= 0 && lastMoveOver < circles.length){
    circles[lastMoveOver].expert == isExpert ? circles[lastMoveOver].color_hover = color_circle_isExpert : circles[lastMoveOver].color_hover = color_circle_notExpert;
    canvasRedrew();
    if(array_parallel_coordinate_highlighted.indexOf(lastMoveOver) != -1 && highLightingTool.circles_in.indexOf(lastMoveOver) == -1)
      array_parallel_coordinate_highlighted.splice(array_parallel_coordinate_highlighted.indexOf(lastMoveOver), 1);
    highlightDataInParallelCoordinate(array_parallel_coordinate_highlighted);
    lastMoveOver = -1;
  }

}
// Handle the highlighting action
function handleMouseMove_HighLightingTool(e){
  highLighting_endPos = getPointOnCanvas(canvas, e.pageX, e.pageY);
  highLightingTool.startPos = highLighting_startPos;
  highLightingTool.endPos = highLighting_endPos;
  canvasRedrew();
}

// Canvas redrew
function canvasRedrew(){
  context.clearRect(0, 0, canvas.width, canvas.height);
  circles.forEach(function(d){
    d.redrew();
  })
  highLightingTool.redrew(highLightingTool.startPos, highLightingTool.endPos);
}

// To get the coordinate of the mouse in canvas
function getPointOnCanvas(canvas, x, y) {

   var bbox = canvas.getBoundingClientRect();

   return{ x: x- bbox.left *(canvas.width / bbox.width),

           y:y - bbox.top  * (canvas.height / bbox.height)

           };

}