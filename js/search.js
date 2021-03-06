function initSearch () {
  // Clearning address or lat/long inputs to avoid user confusion when trying to enter both
  document.getElementById('address').addEventListener('change', function (event) {
    document.getElementById('cuslongitude').value = "";
    document.getElementById('cuslatitude').value = "";
  })
  document.getElementById('gpslink').addEventListener('change', function (event) {
    document.getElementById('address').value = "";
	document.getElementById('cuslongitude').value = "";
    document.getElementById('cuslatitude').value = "";
  })
  document.getElementById('cuslongitude').addEventListener('change', function (event) {
    document.getElementById('address').value = "";
  })
  document.getElementById('cuslatitude').addEventListener('change', function (event) {
    document.getElementById('address').value = "";
  })
  document.getElementById("search").addEventListener("click", function (event) {
    event.preventDefault();

    var address = document.getElementById("address").value;
    var lat = document.getElementById("cuslatitude").value;
    var long = document.getElementById("cuslongitude").value;
	var link = document.getElementById("gpslink").value;
	
	if(link != "")
	{
		var lk = link.split("&");
		var str = lk[0];
		var res = str.split("=");
		var parse = res[1];
		var coord = parse.split("%2C");
	}
	
	
	if(lat == "")
	{
		lat = coord[0];
		long = coord[1];
	}
	

    const addressSpecified = address !== "";
    const constantsSpecified = lat !== "" && long !== "";
    // Use Geotab API to reverse geocode by street address
    if (addressSpecified || constantsSpecified) {
      if (addressSpecified) {
        searchWithAddress(address);
      } else {
        searchWithCoordinates(lat, long)
      }
    } else {
      alert("Address or lat and long is required");
    }
  });
  document.getElementById("addZone").addEventListener("click", function (event) {
    event.preventDefault();

    var zoneName = document.getElementById("zoneName").value;
    var customerNumber = document.getElementById("customerNumber").value;
    var deliveryDetails = document.getElementById("deliveryDetails").value;
    var zoneDisplayed = 1;

    if (zoneName == "") {
      alert("Customer name is required");
      return;
    }

    addZoneViaApi(zoneName, customerNumber, deliveryDetails, zoneDisplayed, zonePoints)
      .then(message => alert(message));
  });

  /*document.getElementById("size").addEventListener("change", function (event) {
    if (event.target.value < 1000) {
      document.getElementById("sizeLabel").innerHTML = "Size (" + event.target.value + "m)";
    } else {
      document.getElementById("sizeLabel").innerHTML = "Size (" + (event.target.value / 1000.0).toFixed(2) + "km)";
    }
  });*/
}

function searchWithAddress (address) {
  api.call("GetCoordinates", {
    addresses: [address]
  }, function (result) {
    if (result[0] != null) {
      const { x: long, y: lat } = result[0];
      document.getElementById('cuslatitude').value = lat;
      document.getElementById('cuslongitude').value = long;
      drawZone(result[0]);
      document.getElementById("example-content-details").style.display = "block";
    }
    else {
      alert("Could not find coordinates for that address");
    }
  }, function (error) {
    alert(error);
  });
}

function searchWithCoordinates (lat, long) {
  const coordinate = { y: lat, x: long };
  api.call("GetAddresses", {
    coordinates: [coordinate]
  }, function (result) {
    if (result[0] != null) {
      const { formattedAddress } = result[0];
      document.getElementById("address").value = formattedAddress;
      drawZone(coordinate);
      document.getElementById("example-content-details").style.display = "block";
    }
    else {
      alert("Could not find coordinates for that address");
    }
  }, function (error) {
    alert(error);
  });
}

function addZoneViaApi (zoneName, customerNumber, deliveryDetails, zoneDisplayed, zonePoints) {
  console.debug("ADDING ZONE", zoneName, customerNumber, deliveryDetails, zoneDisplayed, zonePoints);
  var today = new Date().toISOString().slice(0, 19);
  return new Promise((resolve, reject) => {
    api.call("Add", {
      typeName: "Zone",
      entity: {
        name: zoneName,
        comment: (deliveryDetails + " | " + "- [Click here to send whatsapp to " + zoneName + "](https://wa.me/" + customerNumber + "?text=Your%20order%20has%20just%20been%20delivered.%20Thanks!)"),
        externalReference: "",
        mustIdentifyStops: true,
        displayed: zoneDisplayed,
        activeFrom: today,
        activeTo: "2050-01-01T00:00:00.000Z",
        zoneTypes: ["ZoneTypeCustomerId"],
        groups: [{
          id: "GroupCompanyId"
        }],
        points: zonePoints,
        fillColor: {
          r: 233,
          g: 150,
          b: 122,
          a: 255
        }
      }
    }, function (result) {
      resolve("Successfully created zone for customer " + zoneName);
    }, function (error) {
      reject(error);
    });

  })
}

function drawZone (coordinate) {
  var radius = 100;
  const isSquareArea = 0;
  var { center } = generateZonePoints(coordinate, isSquareArea, radius);

  var polygon = [];

  for (var i = 0; i < zonePoints.length; i++) {
    polygon.push([
      zonePoints[i].y, zonePoints[i].x
    ]);
  }

  var shape = L.polygon(polygon);

  layerGroup.clearLayers().addLayer(shape);
  map.setView(center, 13);
}

function generateZonePoints (coordinate, isSquareArea, radius) {
  var center = new L.LatLng(coordinate.y, coordinate.x);
  if (isSquareArea) {
    generateSquareZonePoints(coordinate, radius);
  }
  else {
    generateCircleZonePoints(coordinate, radius);
  }
  return { center, zonePoints };
}

function generateSquareZonePoints (coordinates, radius) {
  var earthRadius = 6371000;

  var x1 = (coordinates.x - toDegrees(radius / earthRadius / Math.cos(toRadians(coordinates.y))));
  var x2 = (coordinates.x + toDegrees(radius / earthRadius / Math.cos(toRadians(coordinates.y))));
  var y1 = (coordinates.y + toDegrees(radius / earthRadius / Math.sin(toRadians(coordinates.x))));
  var y2 = (coordinates.y - toDegrees(radius / earthRadius / Math.sin(toRadians(coordinates.x))));

  zonePoints = [
    { "x": x1, "y": y1 },
    { "x": x2, "y": y1 },
    { "x": x2, "y": y2 },
    { "x": x1, "y": y2 }
  ];
}

function generateCircleZonePoints (coordinate, radius) {
  var earthRadius = 6371000;

  var latitude = toRadians(coordinate.y);
  var longitude = toRadians(coordinate.x);
  var angularDistance = radius / earthRadius;

  zonePoints = [];

  for (var i = 0; i <= 360; i++) {
    var radians = toRadians(i);
    var latitudeRadians = Math.asin(Math.sin(latitude) * Math.cos(angularDistance) + Math.cos(latitude) * Math.sin(angularDistance) * Math.cos(radians));
    var longitudeRadians = longitude + Math.atan2(Math.sin(radians) * Math.sin(angularDistance) * Math.cos(latitude), Math.cos(angularDistance) - Math.sin(latitude) * Math.sin(latitudeRadians));

    zonePoints.push({
      "x": toDegrees(longitudeRadians),
      "y": toDegrees(latitudeRadians)
    });
  }
}

function toDegrees (radians) {
  return radians * 180.0 / Math.PI;
}

function toRadians (degrees) {
  return degrees * (Math.PI / 180.0);
}

function differenceRadians (degrees1, degrees2) {
  return toRadians(degrees1) - toRadians(degrees2);
}
