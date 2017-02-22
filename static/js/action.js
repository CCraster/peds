// Submit Plot data to server to refit MDS
function mdsPlot_confirm(){
    var xmlhttp;
    var url = "/";
    var mds_pos = getPlotString(marqueeTools["marquee_default"].circles_in) + "@" 
    + getPlotString(marqueeTools["marquee_move"].circles_in) + "@" + getPlotString(circles_doubleClicked);

	if (window.XMLHttpRequest){// code for IE7+, Firefox, Chrome, Opera, Safari
	  xmlhttp=new XMLHttpRequest();
	}
	else{// code for IE6, IE5
	  xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
	}
	xmlhttp.onreadystatechange=function(){
	  if (xmlhttp.readyState==4 && xmlhttp.status==200){
	  	showReMDSPlot(xmlhttp.responseText);
	  }
	}
	xmlhttp.open("POST", url, true);
	xmlhttp.send(mds_pos);
}

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
		circles[i].x = data_plot.positions[i][0];
		circles[i].y = data_plot.positions[i][1];
	})
	weight_MDS = data_plot.weight;
	displayWeight_MDS(weight_MDS);
	canvasRedrew();
}

