function handleFiles (files) {
  // Check for the various File API support.
  if (window.FileReader) {
    // FileReader are supported.
    getAsText(files[0]);
  } else {
    alert('FileReader are not supported in this browser.');
  }
}

function getAsText (fileToRead) {
  var reader = new FileReader();
  // Handle errors load
  reader.onload = loadHandler;
  reader.onerror = errorHandler;
  // Read file into memory as UTF-8      
  reader.readAsText(fileToRead);
}

function loadHandler (event) {
  var csv = event.target.result;
  processDataAsObj(csv);
}

// presume that csv file contains the column names as the first line
function processDataAsObj (csv) {
  var allTextLines = csv.split(/\r\n|\n/);
  var lines = [];

  //first line of csv
  var keys = allTextLines.shift().split(',');

  while (allTextLines.length) {
    var arr = allTextLines.shift().split(',');
    var obj = {};
    for (var i = 0; i < keys.length; i++) {
      obj[keys[i]] = arr[i];
    }
    lines.push(obj);
  }
  console.log(lines);
  const apiCalls = lines.map(line => {
    const { areaRadius, customerNumber, customerName,
      deliveryDetails, isSquareArea, Latitude, Longitude, showOnMyGeoTabByDefault } = line;
    const { zonePoints } = generateZonePoints({
      y: Number(Latitude),
      x: Number(Longitude)
    },
      isSquareArea === "0" ? false : true,
      areaRadius);
    return addZoneViaApi(customerName, customerNumber, deliveryDetails, showOnMyGeoTabByDefault === "0" ? false : true, zonePoints);
  });
  Promise.all(apiCalls)
    .then(x => alert("File has been processed. All customers added"))
    .catch(err => console.error("An error occured:", err));
}

function errorHandler (evt) {
  if (evt.target.error.name == "NotReadableError") {
    alert("Canno't read file !");
  }
}