var api_key = "55c2586d12873c5d39e99b0dea411dc2";

if(navigator.geolocation){
  navigator.geolocation.getCurrentPosition(getLocation);
}else{
  alert("Geolocation is not supported by this browser");
}

function getLocation(position) {
  var lat = (position.coords.latitude);
  var long = position.coords.longitude;

  console.log(lat);
  console.log(long);

  var request = new XMLHttpRequest();
  var url = "http://api.openweathermap.org/data/2.5/weather?";
  var finalURL = url + "&lat=" + lat + "&lon=" + long + "&APPID=" + api_key + "&units=metric";

  request.open('GET', finalURL, false);
  request.send(null);

  var data = JSON.parse(request.response);
  var temp = data.main.temp;
  temp = temp * 9;
  temp = temp / 5;
  temp = temp + 32;
  var humidity = data.main.humidity;
  var pressure = data.main.pressure;
  var windSpeed = data.wind.speed;
  windSpeed = Math.round(windSpeed * 0.621371);
  var country = data.sys.country;
  var city = data.name;
  var main = data.weather.description;
  document.getElementById("temperature").innerHTML = temp + " °F and " + main;
  document.getElementById("humidity").innerHTML = "Humidity " + humidity;
  document.getElementById("pressure").innerHTML = pressure + " mBar";
  document.getElementById("wind-speed").innerHTML = windSpeed + " MPH";
}
