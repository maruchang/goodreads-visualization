function onClickHandler(cb) {
	console.log(cb);
	console.log(cb.value);
	console.log(cb.checked);

	var checked = get_currently_selected_genres();
	console.log(checked);

	redraw_chart(checked, []);
}

var colorscale = d3.scale.category10();

var globalData = [];
d3.csv("goodreads_with_kindle_price.csv", function(error, data) {
	if (error) {
		throw error;
	}
	format_prices(data)
	console.log(data);
	globalData = data

	var genres = ['Fantasy', 'Fiction', 'Crime', 'Thriller']

	window.addEventListener('resize', function() {
			var currently_selected = get_currently_selected_genres()
			console.log("Resize: " + currently_selected);
			redraw_chart(currently_selected, [])
	})

	var years = data.map(d => +d.publish_year);
	years = years.filter(function(item, i, ar){ return ar.indexOf(item) === i; });

	populate_pill_values(years);

	redraw_chart(genres, []);
});

function populate_pill_values(years) {
	var data = globalData;

	console.log(data);

	var filtered_years = data.filter(d => years.indexOf(+d.publish_year) != -1)
	console.log(filtered_years);

	var genres = get_all_genres();

	var count_map = {};
	for (i in genres) {
		genre = genres[i];
		count_map[genre] = filtered_years.filter(d => d[genre] == "True").length;
	}

	console.log(count_map);

	$("span.pill").each(function(i, e) {
		e.innerHTML = count_map[e.id]
	});

	console.log(genres);
}

function get_currently_selected_genres() {
	var currently_selected = []
	$("input[type=checkbox]:checked").each(function(i, e) {
		currently_selected.push($(e).attr('value'))
	})

	return currently_selected
}

function get_all_genres() {
	var all_genres = []
	$("input[type=checkbox]").each(function(i, e) {
		all_genres.push($(e).attr('value'))
	})

	return all_genres;
}

function redraw_chart(genres, years) {
	var data = globalData;

	mean_avg_rating_per_genre = calculate_mean_avg_rating_per_genre(data, genres);
	mean_total_reviews_per_genre = calculate_mean_total_reviews_per_genre(data, genres);
	mean_total_ratings_per_genre = calculate_mean_total_ratings_per_genre(data, genres);
	mean_total_pages_per_genre = calculate_mean_total_pages_per_genre(data, genres);
	mean_total_price_per_genre = calculate_mean_price_per_genre(data, genres);

	/*console.log("Mean Average Ratings")
	console.log(mean_avg_rating_per_genre)
	console.log(mean_total_reviews_per_genre)
	console.log(mean_total_ratings_per_genre)
	console.log(mean_total_pages_per_genre)
	console.log("Mean Price")
	console.log(mean_total_price_per_genre)*/

	var d = []
	for (idx in genres) {
		genre = genres[idx]
		d.push([
			{axis:"Average Rating", value: mean_avg_rating_per_genre[genre]},
			{axis:"#Reviews", value: mean_total_reviews_per_genre[genre]},
			{axis:"#Ratings", value: mean_total_ratings_per_genre[genre]},
			{axis: "#Pages", value: mean_total_pages_per_genre[genre]},
			{axis: 'Kindle Price', value: mean_total_price_per_genre[genre]}
		])
	}

	//Options for the Radar chart, other than default
	var mycfg = {
	  w: $("#radar_container").width() - 600,
	  h: $("#radar_container").width() - 600,
	  maxValue: [5, 5000, 80000, 600, 10, 1],
	  levels: 5,
	  ExtraWidthX: 500,
		TranslateX: 250
	}

	//Call function to draw the Radar chart
	RadarChart.draw("#chart", d, mycfg);

	draw_legend(genres, mycfg);
}

function draw_legend(genres, mycfg) {

	var w = mycfg.w;
	var h = mycfg.h;

	var svg = d3.select('#radar_container')
		.select('svg')
		//.append('svg')
		//.attr("width", 100)
		//.attr("height", 200)

	//Create the title for the legend
	/*var text = svg.append("text")
		.attr("class", "title")
		.attr('transform', 'translate(400,15)')
		.attr("x", w - 70)
		.attr("y", 10)
		.attr("font-size", "18px")
		.attr("fill", "#404040")
		.text("Genres");*/

	//Initiate Legend
	var legend = svg.append("g")
		.attr("class", "legend")
		.attr("height", 100)
		.attr("width", 200)
		.attr('transform', 'translate(400,50)')

	//Create colour squares
	legend.selectAll('rect')
	  .data(genres)
	  .enter()
	  .append("rect")
	  .attr("x", w - 65)
	  .attr("y", function(d, i){ return i * 20;})
	  .attr("width", 10)
	  .attr("height", 10)
	  .style("fill", function(d, i){ return colorscale(i);})
	  ;
	//Create text next to squares
	legend.selectAll('text')
	  .data(genres)
	  .enter()
	  .append("text")
	  .attr("x", w - 52)
	  .attr("y", function(d, i){ return i * 20 + 9;})
	  .attr("font-size", "15px")
	  .attr("fill", "#737373")
	  .text(function(d) { return d; })
	  ;
}

function format_prices(data) {
	data.forEach(function(d, i) {
		if (data[i]['kindle_price'] != '') {
			data[i]['kindle_price'] = data[i]['kindle_price'].substr(1)
		}
		else {
			data[i]['kindle_price'] = ''
		}
	});
}

function calculate_mean_avg_rating_per_genre(data, genres) {
	return numerical_mean(data, genres, 'avg_ratings')
}

function calculate_mean_total_reviews_per_genre(data, genres) {
	return numerical_mean(data, genres, 'num_reviews')
}

function calculate_mean_total_ratings_per_genre(data, genres) {
	return numerical_mean(data, genres, 'num_ratings')
}

function calculate_mean_total_pages_per_genre(data, genres) {
	return numerical_mean(data, genres, 'num_pages')
}

function calculate_mean_price_per_genre(data, genres) {
	return numerical_mean(data, genres, 'kindle_price')
}

function numerical_mean(data, genres, field) {
	var genre_mean_values = {}

	for (idx in genres) {
		var genre = genres[idx]
		var field_values = data.filter(d => d[genre] == "True")
														.map(d => +d[field].replace(",", ""))
														.filter(Boolean)
		genre_mean_values[genre] = mean(field_values)
	}

	return genre_mean_values
}

function mean(arr) {
	return sum(arr) / arr.length
}

function sum(arr) {
	var s = arr.reduce(function(previousValue, currentValue){
    return currentValue + previousValue;
	}, 0);

	return s;
}
