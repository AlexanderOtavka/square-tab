'use strict';

if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(getWeather);
}else{
  alert("Geolocation is not supported by this browser!");
}

function getWeather(position) {
  const api_key = "55c2586d12873c5d39e99b0dea411dc2";
  const lat = position.coords.latitude;
  const long = position.coords.longitude;

  const init = {
    method: 'GET',
    mode: 'cors',
    cache: 'default',
  };

  var url = "http://api.openweathermap.org/data/2.5/weather?";
  const finalURL = url + "&lat=" + lat + "&lon=" + long + "&APPID=" + api_key + "&units=metric";

  fetch(finalURL, init)
    .then(
      function(response) {
      if (response.status !== 200) {
        console.log('Looks like there was a problem. Status Code: ' +
          response.status);
        return;
      }
      response.json().then(function(data) {
        const finalData = (data);
        const temperature = Math.round(((finalData.main.temp * 9) / 5) + 31);
        var main = finalData.weather[0].main.toUpperCase();
        var description = finalData.weather[0].description.toUpperCase();

        let date = new Date();
        let hours = date.getHours();

        if (hours >= 18 && (description === "SCATTERED CLOUDS" || description === "BROKEN CLOUDS" || main === "CLEAR")) {
          if(description === "SCATTERED CLOUDS" || "BROKEN CLOUDS"){
            document.getElementById("weather-icon").src="../images/partly-cloudy-night.png";
          }
          if(main == "CLEAR"){
            document.getElementById("weather-icon").src="../images/clear-night.png";
          }
        }else{
          if(description == "SCATTERED CLOUDS"){
            document.getElementById("weather-icon").src="../images/partly-cloudy.png";
          }else if(main == "CLOUDS"){
            document.getElementById("weather-icon").src="../images/cloudy.png";
          }else if (main == "MIST") {
            document.getElementById("weather-icon").src="../images/cloudy.png";
          }else if(main == "RAIN"){
            document.getElementById("weather-icon").src="../images/rain.png";
          }else if(main == "CLEAR"){
            document.getElementById("weather-icon").src="../images/clear.png";
          }else{
            document.getElementById("weather-icon").src="#";
          }
        }
        document.getElementById("temperature").innerHTML = temperature + " °F";
      });
    }
  );
}
