// Submit Plot data to server to refit MDS
function mdsPlotConfirm(){
	var xmlhttp;
	var url = "/";
	var mds_pos, mds_message;
	var array_move = [], array_away = [];
	marqueeTools["marquee_move_highLight"].forEach(function(marquee){
		array_move = array_move.concat(marquee.circles_in);
	});
	marqueeTools["marquee_away_highLight"].forEach(function(marquee){
		array_away = array_away.concat(marquee.circles_in);
	});
	mds_pos = "" + "@" + getPlotString(array_move) + "@" + getPlotString(array_away);
	mds_message = mds_pos + "%" + signal_MDS;

	if (window.XMLHttpRequest){// code for IE7+, Firefox, Chrome, Opera, Safari
	  xmlhttp = new XMLHttpRequest();
	}
	else{// code for IE6, IE5
	  xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
	}
	xmlhttp.onreadystatechange = function(){
	  if (xmlhttp.readyState == 4 && xmlhttp.status == 200){
	  	// console.log(xmlhttp.responseText);
		showReMDSPlot(xmlhttp.responseText);
	  }
	}
	xmlhttp.open("POST", url, true);
	xmlhttp.send(mds_message);
}
// 提交修改后的权值，并获取新的布局
function weightConfirm(){
	var xmlhttp;
	var url = "/weightChange";

	if (window.XMLHttpRequest){// code for IE7+, Firefox, Chrome, Opera, Safari
	  xmlhttp = new XMLHttpRequest();
	}
	else{// code for IE6, IE5
	  xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
	}
	xmlhttp.onreadystatechange = function(){
	  if (xmlhttp.readyState == 4 && xmlhttp.status == 200){
	  	showReMDSPlot(xmlhttp.responseText);
	  }
	}
	xmlhttp.open("POST", url, true);
	xmlhttp.send(JSON.stringify(weight_MDS) + "%" + signal_MDS);
}
// 提交关注的用户id
function focusUserConfirm(){
	var xmlhttp;
	var url = "/focusUserChange";
	var focusUserId = {"user_id": []}

	circles.forEach(function(d){
		focusUserId["user_id"].push(d.user_id);
	});

	if (window.XMLHttpRequest){// code for IE7+, Firefox, Chrome, Opera, Safari
	  xmlhttp = new XMLHttpRequest();
	}
	else{// code for IE6, IE5
	  xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
	}
	xmlhttp.onreadystatechange = function(){
	  if (xmlhttp.readyState == 4 && xmlhttp.status == 200){
	  	console.log(xmlhttp.responseText);
		signal_MDS = xmlhttp.responseText;
	  }
	}
	xmlhttp.open("POST", url, true);
	xmlhttp.send(JSON.stringify(focusUserId));
}
// 应用MDS规则到全体用户
function MDSRuleApply(){
	var xmlhttp;
	var url = "/mdsRuleApply";

	if (window.XMLHttpRequest){// code for IE7+, Firefox, Chrome, Opera, Safari
	  xmlhttp = new XMLHttpRequest();
	}
	else{// code for IE6, IE5
	  xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
	}
	xmlhttp.onreadystatechange = function(){
	  if (xmlhttp.readyState == 4 && xmlhttp.status == 200){
	  	showApplyMDSRuleResult(xmlhttp.responseText);
	  	console.log(xmlhttp.responseText);
	  }
	}
	xmlhttp.open("POST", url, true);
	xmlhttp.send(JSON.stringify(weight_MDS));
}

// 把圆的数据转换为字符串数据，进行post传输
function getPlotString(circles_array){
	var str = "";
	circles_array.forEach(function(d, i){
		if(i < circles_array.length - 1){
			str += circles[d].user_id + "=" + (circles[d].x / 100).toFixed(2) + "," + (circles[d].y / 100).toFixed(2) + "&";
		}
		else
			str += circles[d].user_id + "=" + (circles[d].x / 100).toFixed(2) + "," + (circles[d].y / 100).toFixed(2);
	})

	return str;
}

// 根据传回的数据重新展示
function showReMDSPlot(data_plot){
	data_plot = JSON.parse(data_plot);
	data_plot.positions.forEach(function(d, i){
		circles[i].x = d[0];
		circles[i].y = d[1];
	});
	weight_MDS = data_plot.weight;

	xScale = d3.scale.linear()
						 .domain([d3.min(data_plot.positions, function(d) { return d[0]; }), d3.max(data_plot.positions, function(d) { return d[0]; })])
						 .range([padding, canvas_MDS_width - padding]);
	yScale = d3.scale.linear()
						 .domain([d3.min(data_plot.positions, function(d) { return d[1]; }), d3.max(data_plot.positions, function(d) { return d[1]; })])
						 .range([padding, canvas_MDS_height - padding]);
	antiXScale = d3.scale.linear()
						 .domain([padding, canvas_MDS_width - padding])
						 .range([d3.min(data_plot.positions, function(d) { return d[0]; }), d3.max(data_plot.positions, function(d) { return d[0]; })]);
	antiYScale = d3.scale.linear()
						 .domain([padding, canvas_MDS_height - padding])
						 .range([d3.min(data_plot.positions, function(d) { return d[1]; }), d3.max(data_plot.positions, function(d) { return d[1]; })]);
	displayWeight_MDS(weight_MDS);
	resetMarqueePosition();
	canvasRedrew();
}
//	应用MDS规则后的重新展示
function showApplyMDSRuleResult(data_plot){
	data_plot = JSON.parse(data_plot);
	circles = [];
	data_plot.positions.forEach(function(d, i){
		var circle = new Circle(data_userId[i], d[0], d[1], data_userInfo[i][0]);
		circles.push(circle);
	});
	weight_MDS = data_plot.weight;

	xScale = d3.scale.linear()
						 .domain([d3.min(data_plot.positions, function(d) { return d[0]; }), d3.max(data_plot.positions, function(d) { return d[0]; })])
						 .range([padding, canvas_MDS_width - padding]);
	yScale = d3.scale.linear()
						 .domain([d3.min(data_plot.positions, function(d) { return d[1]; }), d3.max(data_plot.positions, function(d) { return d[1]; })])
						 .range([padding, canvas_MDS_height - padding]);
	antiXScale = d3.scale.linear()
						 .domain([padding, canvas_MDS_width - padding])
						 .range([d3.min(data_plot.positions, function(d) { return d[0]; }), d3.max(data_plot.positions, function(d) { return d[0]; })]);
	antiYScale = d3.scale.linear()
						 .domain([padding, canvas_MDS_height - padding])
						 .range([d3.min(data_plot.positions, function(d) { return d[1]; }), d3.max(data_plot.positions, function(d) { return d[1]; })]);
	displayWeight_MDS(weight_MDS);
	resetMarqueePosition();
	canvasRedrew();
}
// 重新设置选框位置
function resetMarqueePosition(){
	for(p in marqueeTools){
		if(p == "marquee_default" || p == "marquee_away_highLight" || p == "marquee_move_highLight"){
			for(var  i = 0; i < marqueeTools[p].length; i++){
				marqueeTools[p][i].startPos.x = d3.min(marqueeTools[p][i].circles_in, function(d){ return xScale(circles[d].x); }) - radius_circle * 2;
				marqueeTools[p][i].startPos.y = d3.min(marqueeTools[p][i].circles_in, function(d){ return yScale(circles[d].y); }) - radius_circle * 2;
				marqueeTools[p][i].endPos.x = d3.max(marqueeTools[p][i].circles_in, function(d){ return xScale(circles[d].x); }) + radius_circle * 2;
				marqueeTools[p][i].endPos.y = d3.max(marqueeTools[p][i].circles_in, function(d){ return yScale(circles[d].y); }) + radius_circle * 2;
				marqueeTools[p][i].getCirclesInMarqueeTool(marqueeTools[p][i]);
			}
		}
	}
}

// 保存系统状态
function systemStatusSave(){
	
}
// 恢复系统状态
function systemStatusRestore(){
	
}

