function initSearch () {

  document.getElementById("search").addEventListener("click", function (event) {
    event.preventDefault();

    var address = document.getElementById("address").value;
    const lat = document.getElementById("cuslatitude").value;
    const long = document.getElementById("cuslongitude").value;

    // Use Geotab API to reverse geocode by street address
    if (address === "" && (lat === "" || long === "")) {
      alert("Address or lat and long is required");
    } else {
      api.call("GetCoordinates", {
        addresses: [address]
      }, function (result) {
        if (result[0] != null) {
          drawZone(result[0]);
          document.getElementById("example-content-details").style.display = "block";
        } else {
          alert("Could not find coordinates for that address");
        }
      }, function (error) {
        alert(error);
      });
    }
  });
  document.getElementById("addZone").addEventListener("click", function (event) {
    event.preventDefault();

    var zoneName = document.getElementById("zoneName").value;
    var customerNumber = document.getElementById("customerNumber").value;
    var deliveryDetails = document.getElementById("deliveryDetails").value;
    var zoneDisplayed = document.getElementById("zoneDisplayed").checked;

    if (zoneName == "") {
      alert("Customer name is required");
      return;
    }

    api.call("Add", {
      typeName: "Zone",
      entity: {
        name: (zoneName + "- [Click here to send whatsapp to " + zoneName + "](https://wa.me/" + customerNumber + "?text=Your%20order%20has%20just%20been%20delivered.%20Thanks!"),
        comment: deliveryDetails,
        externalReference: "",
        mustIdentifyStops: true,
        displayed: zoneDisplayed,
        activeFrom: "1986-01-01T00:00:00.000Z",
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
      alert("Successfully created zone for customer " + zoneName);
    }, function (error) {
      console.log(error);
    });
  });

  document.getElementById("size").addEventListener("change", function (event) {
    if (event.target.value < 1000) {
      document.getElementById("sizeLabel").innerHTML = "Size (" + event.target.value + "m)";
    } else {
      document.getElementById("sizeLabel").innerHTML = "Size (" + (event.target.value / 1000.0).toFixed(2) + "km)";
    }
  });
}
function drawZone (coordinate) {
  var center = new L.LatLng(coordinate.y, coordinate.x);
  var radius = document.getElementById("size").value;

  if (document.getElementById("shape-square").checked) {
    generateSquareZonePoints(coordinate, radius);
  } else {
    generateCircleZonePoints(coordinate, radius);
  }

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