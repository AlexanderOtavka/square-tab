import classnames from "classnames"

import * as Settings from "../Settings"

import pageStyles from "./Page.css"
import weatherIconStyles from "./weather-icons/weather-icons.css"

export default function createWeatherUpdater(
  { $weatherIcon, $temperature },
  weatherStore
) {
  let data = null

  weatherStore.onDataLoad.addListener(newData => {
    data = newData
    updateWeather()
  })

  return {
    updateTempWithUnit
  }

  function updateTempWithUnit(unit) {
    if (!data || !unit) {
      return
    }

    // Ensure against XSS with the cast to Number
    const temperatureC = Number(data.main.temp)
    switch (unit) {
      case Settings.enums.TemperatureUnits.CELSIUS:
        {
          const roundedTempC = Math.round(temperatureC)
          $temperature.innerHTML = `&thinsp;${roundedTempC} &deg;C`
        }
        break
      case Settings.enums.TemperatureUnits.FAHRENHEIT:
        {
          const temperatureF = Math.round((temperatureC * 9) / 5 + 32)
          $temperature.innerHTML = `&thinsp;${temperatureF} &deg;F`
        }
        break
      default:
        console.error("Invalid temperature unit.")
        $temperature.innerHTML = ""
    }
  }

  function updateWeather() {
    if (!data) {
      return
    }

    const iconCode = data.weather[0].id
    const description = data.weather
      .map(condition => condition.description)
      .join(", ")
      // convert description to Title Case
      .replace(
        /\w\S*/g,
        txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
      )

    weatherStore.getSunInfoMS(data).then(({ isDay }) => {
      const iconName = getIconName(iconCode, isDay)
      $weatherIcon.className = iconName
        ? classnames(
            pageStyles.weatherIcon,
            weatherIconStyles["wi"],
            weatherIconStyles[`wi-${iconName}`]
          )
        : ""
      $weatherIcon.setAttribute("tooltip", description)
    })

    updateTempWithUnit(Settings.get(Settings.keys.TEMPERATURE_UNIT))
  }
}

function getIconName(iconCode, isDay) {
  const dayNight = isDay ? "day" : "night-alt"

  // codes listed at: http://openweathermap.org/weather-conditions
  switch (iconCode) {
    case 200:
    case 201:
    case 202:
      return "thunderstorm"
    case 210:
    case 211:
    case 212:
    case 221:
      return "lightning"
    case 230:
    case 231:
    case 232:
      return "storm-showers"
    case 300:
    case 301:
    case 302:
    case 310:
    case 311:
    case 312:
      return "sprinkle"
    case 313:
    case 314:
    case 321:
      return "showers"
    case 500:
    case 501:
    case 502:
    case 503:
    case 504:
    case 511:
      return "rain"
    case 520:
    case 521:
    case 522:
    case 531:
      return "showers"
    case 600:
    case 601:
    case 602:
      return "snow"
    case 611:
    case 612:
      return "sleet"
    case 615:
    case 616:
    case 620:
    case 621:
    case 622:
      return "rain-mix"
    case 701:
    case 741:
      return "fog"
    case 711:
      return "smoke"
    case 721:
      return "dust"
    case 731:
    case 751:
      return "sandstorm"
    case 761:
      return "dust"
    case 762:
      return "volcano"
    case 771:
    case 905:
    case 955:
    case 956:
      return "strong-wind"
    case 781:
    case 900:
      return "tornado"
    case 800:
    case 951:
    case 952:
    case 953:
      return isDay ? "day-sunny" : "night-clear"
    case 801:
      return isDay ? "day-sunny-overcast" : "night-alt-partly-cloudy"
    case 802:
    case 803:
      return `${dayNight}-cloudy`
    case 804:
      return "cloudy"
    case 901:
    case 902:
    case 962:
      return "hurricane"
    case 903:
      return "snowflake-cold"
    case 904:
      return "hot"
    case 906:
      return "hail"
    case 957:
    case 958:
    case 959:
      return "gale-warning"
    case 960:
    case 961:
      return "storm-warning"
    default:
      console.error("Invalid weather icon code.")
      return ""
  }
}
