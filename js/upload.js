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

const CSV_SEPARATOR = ';';
// presume that csv file contains the column names as the first line
function processDataAsObj (csv) {
  var allTextLines = csv.split(/\r\n|\n/);
  var lines = [];

  //first line of csv
  var keys = allTextLines.shift().split(CSV_SEPARATOR);

  while (allTextLines.length) {
    var arr = allTextLines.shift().split(CSV_SEPARATOR);
    if (arr.length !== keys.length) {
      alert(`Invalid row ${arr.join(CSV_SEPARATOR)}. Mismatch with number of header columns`)
      return;
    }
    var obj = {};
    for (var i = 0; i < keys.length; i++) {
      obj[keys[i]] = arr[i];
    }
    lines.push(obj);
  }
  console.log(lines);
  lines.forEach(line => {
    const { areaRadius, customerNumber, customerName,
      deliveryDetails, isSquareArea, Latitude, Longitude, showOnMyGeoTabByDefault } = line;
    const { zonePoints } = generateZonePoints({ y: Number(Latitude), x: Number(Longitude) }, isSquareArea === "1" ? true : false, areaRadius);
    addZoneViaApi(customerName, customerNumber, deliveryDetails, showOnMyGeoTabByDefault === "1" ? true : false, zonePoints);
  })
  drawOutputAsObj(lines);
}

function errorHandler (evt) {
  if (evt.target.error.name == "NotReadableError") {
    alert("Canno't read file !");
  }
}