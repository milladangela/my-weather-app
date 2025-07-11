let apiKey = "5f472b7acba333cd8a035ea85a0d4d4c";

function formatDay(timestamp) {
  let date = new Date(timestamp * 1000);
  let day = date.getDay();
  let days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days[day];
}

function formatDate(timestamp) {
  let date = new Date(timestamp);
  let hours = date.getHours();
  if (hours < 10) {
    hours = `0${hours}`;
  }
  let minutes = date.getMinutes();
  if (minutes < 10) {
    minutes = `0${minutes}`;
  }

  let days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  let day = days[date.getDay()];
  return `${day} ${hours}:${minutes}`;
}

function displayTemperature(response) {
  console.log("Weather data received:", response.data);

  let temperatureElement = document.querySelector("#temperature");
  let cityElement = document.querySelector("#city");
  let descriptionElement = document.querySelector("#description");
  let humidityElement = document.querySelector("#humidity");
  let windElement = document.querySelector("#wind");
  let dateElement = document.querySelector("#date");
  let iconElement = document.querySelector("#icon");

  let temperature = Math.round(response.data.main.temp);

  temperatureElement.innerHTML = temperature;
  cityElement.innerHTML = response.data.name;
  descriptionElement.innerHTML = response.data.weather[0].description;
  humidityElement.innerHTML = response.data.main.humidity + "%";
  windElement.innerHTML = Math.round(response.data.wind.speed) + " km/h";
  dateElement.innerHTML = formatDate(response.data.dt * 1000);
  iconElement.setAttribute(
    "src",
    `https://openweathermap.org/img/wn/${response.data.weather[0].icon}@2x.png`
  );
  iconElement.setAttribute("alt", response.data.weather[0].description);
  iconElement.style.display = "block";

  // Get forecast data using the newer API endpoint
  getForecast(response.data.coord);
}

function displayForecast(response) {
  console.log("Forecast data received:", response.data);

  let forecast = response.data.list;
  let forecastElement = document.querySelector("#forecast");

  let forecastHTML = "";
  let dailyForecasts = [];
  let today = new Date().toDateString();
  let processedDays = new Set();

  // Group forecasts by day and get one per day (excluding today)
  forecast.forEach(function(item) {
    let date = new Date(item.dt * 1000);
    let dayKey = date.toDateString();

    // Skip today's forecast and avoid duplicates
    if (dayKey !== today && !processedDays.has(dayKey) && dailyForecasts.length < 3) {
      dailyForecasts.push(item);
      processedDays.add(dayKey);
    }
  });

  // Ensure we have exactly 3 days, if not enough data, use what we have
  dailyForecasts.slice(0, 3).forEach(function (forecastDay) {
    forecastHTML += `
      <div class="forecast-item">
        <div class="forecast-day-info">
          <div class="forecast-day">${formatDay(forecastDay.dt)}</div>
          <img
            src="https://openweathermap.org/img/wn/${forecastDay.weather[0].icon}@2x.png"
            alt="${forecastDay.weather[0].description}"
            class="forecast-icon"
          />
          <div class="forecast-description">${forecastDay.weather[0].description}</div>
        </div>
        <div class="forecast-temps">
          <span class="forecast-temp-max">${Math.round(forecastDay.main.temp_max)}°</span>
          <span class="forecast-temp-min">${Math.round(forecastDay.main.temp_min)}°</span>
        </div>
      </div>
    `;
  });

  console.log(`Generated ${dailyForecasts.length} forecast items`);
  forecastElement.innerHTML = forecastHTML;
}

function getForecast(coordinates) {
  // Using the 5-day forecast API instead of OneCall (which requires subscription)
  let apiUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${coordinates.lat}&lon=${coordinates.lon}&appid=${apiKey}&units=metric`;

  console.log("Fetching forecast from:", apiUrl);

  // Show loading state
  let forecastElement = document.querySelector("#forecast");
  forecastElement.innerHTML = `
    <div class="forecast-loading">
      <div class="loading-spinner"></div>
      <span>Loading forecast...</span>
    </div>
  `;

  axios.get(apiUrl)
    .then(displayForecast)
    .catch(function(error) {
      console.error("Error fetching forecast:", error);
      forecastElement.innerHTML = `
        <div class="forecast-error">
          <i class="fas fa-exclamation-triangle"></i>
          <div>Unable to load forecast</div>
        </div>
      `;
    });
}

function search(city) {
  let apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

  console.log("Fetching weather from:", apiUrl);

  // Show loading state
  document.querySelector("#city").innerHTML = "Loading...";
  document.querySelector("#description").innerHTML = "Getting weather data...";
  document.querySelector("#temperature").innerHTML = "--";
  document.querySelector("#humidity").innerHTML = "--%";
  document.querySelector("#wind").innerHTML = "-- km/h";
  document.querySelector("#date").innerHTML = "Loading...";
  document.querySelector("#icon").style.display = "none";

  axios.get(apiUrl)
    .then(displayTemperature)
    .catch(function(error) {
      console.error("Error fetching weather:", error);
      document.querySelector("#city").innerHTML = "City not found";
      document.querySelector("#description").innerHTML = "Please try again";
      document.querySelector("#temperature").innerHTML = "--";
      document.querySelector("#humidity").innerHTML = "--%";
      document.querySelector("#wind").innerHTML = "-- km/h";
      document.querySelector("#date").innerHTML = "Error";

      let forecastElement = document.querySelector("#forecast");
      forecastElement.innerHTML = `
        <div class="forecast-error">
          <i class="fas fa-exclamation-triangle"></i>
          <div>Unable to load forecast</div>
        </div>
      `;
    });
}

function handleSubmit(event) {
  event.preventDefault();
  let cityInputElement = document.querySelector("#city-input");
  let city = cityInputElement.value.trim();

  if (city) {
    search(city);
    cityInputElement.value = "";
  }
}

function displayLocationTemperature(response) {
  displayTemperature(response);
}

function getCurrentLocation(position) {
  let latitude = position.coords.latitude;
  let longitude = position.coords.longitude;
  let apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`;

  console.log("Fetching location weather from:", apiUrl);

  axios.get(apiUrl)
    .then(displayLocationTemperature)
    .catch(function(error) {
      console.error("Error fetching location weather:", error);
      alert("Unable to get weather for your location. Please try searching for a city.");
    });
}

function getCurrentLocationButton(event) {
  event.preventDefault();

  if (navigator.geolocation) {
    // Show loading state
    document.querySelector("#city").innerHTML = "Getting location...";
    document.querySelector("#description").innerHTML = "Please wait...";

    navigator.geolocation.getCurrentPosition(
      getCurrentLocation,
      function(error) {
        console.error("Geolocation error:", error);
        document.querySelector("#city").innerHTML = "Location Error";
        document.querySelector("#description").innerHTML = "Please search manually";
        alert("Unable to get your location. Please search for a city manually.");
      }
    );
  } else {
    alert("Geolocation is not supported by this browser.");
  }
}

// Event listeners
document.addEventListener("DOMContentLoaded", function() {
  let form = document.querySelector("#search-form");
  if (form) {
    form.addEventListener("submit", handleSubmit);
  }

  let currentLocationButton = document.querySelector("#current-location-button");
  if (currentLocationButton) {
    currentLocationButton.addEventListener("click", getCurrentLocationButton);
  }

  // Initialize with default city
  search("Bilbao");
});
