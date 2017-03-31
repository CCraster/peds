
function displayUserDetail(user_id){
	// user_id = "338416";
	if(!(JSON.stringify(data_userDetail[user_id]) == "{}")){
		$("#user_name").text(data_userDetail[user_id]["user_name"]);

		$("#user_reputation").text(data_userDetail[user_id]["reputation"]);
		$("#badge_gold").css("display", "none");
		$("#badge_silver").css("display", "none");
		$("#badge_bronze").css("display", "none");
		for(var p in data_userDetail[user_id]["badges"]){
			$("#badge_" + p).css("display", "inline");
			$("#badge_" + p).text(data_userDetail[user_id]["badges"][p]);
		}
		$("#user_answers").text(data_userDetail[user_id]["stat"]["answers"]);
		$("#user_questions").text(data_userDetail[user_id]["stat"]["questions"]);
		$("#user_people_reached").text(data_userDetail[user_id]["stat"]["people reached"]);

		$("#div_right_middle1").empty();
		for(p in data_userDetail[user_id]["user_links"]){
			$("#div_right_middle1").append("<span>" + p.substring(5, p.length) + ": " + data_userDetail[user_id]["user_links"][p] + "</span><br>");
		}

		$("#div_right_middle2").text(data_userDetail[user_id]["about"]);

		if(data_userDetail[user_id]["total_tags"] > 0){
			$("#label_total_tag").text("(" + data_userDetail[user_id]["total_tags"] + ")");
			for(p in data_userDetail[user_id]["top_tags"]["first"]){
				$("#div_right_bottom_first_span").text(p);
				$("#div_right_bottom_first_score").text(data_userDetail[user_id]["top_tags"]["first"][p]["Score"]);
				$("#div_right_bottom_first_posts").text(data_userDetail[user_id]["top_tags"]["first"][p]["Posts"]);
				$("#div_right_bottom_first_postsp").text(data_userDetail[user_id]["top_tags"]["first"][p]["Posts%"]);
			}
			$("#div_right_bottom_first").css("visibility", "visible");

			if(!(JSON.stringify(data_userDetail[user_id]["top_tags"]["second"]) == "{}")){
				var i = 1;
				for(p in data_userDetail[user_id]["top_tags"]["second"]){
					$("#div_right_bottom_" + i + "_span").text(p);
					$("#div_right_bottom_" + i + "_score").text(data_userDetail[user_id]["top_tags"]["second"][p]["Score"]);
					$("#div_right_bottom_" + i + "_posts").text(data_userDetail[user_id]["top_tags"]["second"][p]["Posts"]);
					$("#div_right_bottom_" + i).css("visibility", "visible");
					++i;
				}
			}
		}
		else{

		}
	}
	else{

	}
	

	// console.log(data_userDetail[user_id]);
}
