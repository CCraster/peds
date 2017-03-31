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
//
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
	  	mds_plot = xmlhttp.responseText.split("%")[0];
	  	signal_weight = xmlhttp.responseText.split("%")[1];
	  	console.log(signal_weight);
		showReMDSPlot(mds_plot);
	  }
	}
	xmlhttp.open("POST", url, true);
	xmlhttp.send(JSON.stringify(weight_MDS) + "%" + signal_weight);
}
//
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
	  	// console.log(xmlhttp.responseText);
		signal_MDS = xmlhttp.responseText;
	  }
	}
	xmlhttp.open("POST", url, true);
	xmlhttp.send(JSON.stringify(focusUserId));
}

//
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

// showReMDSPlot
function showReMDSPlot(data_plot){
	data_plot = JSON.parse(data_plot);
	data_plot.positions.forEach(function(d, i){
		circles_origin[i].x = data_plot.positions[i][0];
		circles_origin[i].y = data_plot.positions[i][1];
	})
	weight_MDS = data_plot.weight;
	circles = cloneCircleArray(circles_origin);
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
	canvasRedrew();
}

