var api_key = "55c2586d12873c5d39e99b0dea411dc2";

//Get location using geolocation
if(navigator.geolocation){
  navigator.geolocation.getCurrentPosition(getLocation);
}else{
  alert("Geolocation is not supported by this browser!");
}

function getLocation(position) {
  var lat = position.coords.latitude;
  var long = position.coords.longitude;

  var request = new XMLHttpRequest();
  var url = "http://api.openweathermap.org/data/2.5/weather?";
  var finalURL = url + "&lat=" + lat + "&lon=" + long + "&APPID=" + api_key + "&units=metric";

  console.log(finalURL);

  //Request data using finalURL
  request.open('GET', finalURL, false);
  request.send(null);

  //Get data object from API
  var data = JSON.parse(request.response);

  //Calculating temp
  var temp = data.main.temp;
  temp = temp * 9;
  temp = temp / 5;
  temp = Math.round(temp + 32);

  //Retrive humidity and pressure
  var humidity = data.main.humidity;
  var pressure = data.main.pressure;

  //Calculate wind speed
  var windSpeed = data.wind.speed;
  windSpeed = Math.round(windSpeed * 0.621371);

  //Get description of weather
  var main = data.weather[0].main.toUpperCase();
  var description = data.weather[0].description.toUpperCase();

  //Weather Icon Assignments based on description
  if(description == "SCATTERED CLOUDS"){
    document.getElementById("weather-icon").src="images/mostly-cloudy.png"
  }else if(main == "CLOUDS"){
    document.getElementById("weather-icon").src="images/cloudy.png"
  }else if (main == "MIST") {
    document.getElementById("weather-icon").src="images/cloudy.png"
  }else if(main == "RAIN"){
    document.getElementById("weather-icon").src="images/rain.png"
  }else if(main == "CLEAR"){
    document.getElementById("weather-icon").src="images/clear.png"
  }else{
    document.getElementById("weather-icon").src="#"
  }

  //Temp assignments
  document.getElementById("weather").innerHTML = temp + " °F";

}
