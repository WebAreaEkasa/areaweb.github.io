var labelImg;
var scene;
var camera;
var renderer;
var enumeratorPromise;

$(document).ready(function() {
  runOnLoad();
})

async function runOnLoad() {
  await loadModels();
  labelImg = await Promise.all(await fecthImages());

  navigator.mediaDevices.enumerateDevices()
  .then(function(devices) {
    devices.forEach(function(device) {
      console.log(device.kind + ": " + device.label +
                  " id = " + device.deviceId);
    });
  })
  .catch(function(err) {
    console.log(err.name + ": " + err.message);
  });


  navigator.mediaDevices.enumerateDevices()
  .then(gotDevices)
  .catch(errorDevices);

  var videoSelect = getVideoSelect();
  videoSelect.onchange = start;

  await start(videoSelect);
}

async function start(videoSelect){
  if (window.stream) {
    window.stream.getTracks().forEach(track => {
      track.stop();
    });
  }

  const videoSource = videoSelect.val();
  const constraints = {
    video: {deviceId: videoSource ? {exact: videoSource} : undefined},
    audio: false
  };


  const stream = await navigator.mediaDevices.getUserMedia(constraints);
  handleSuccess(stream);
}


function gotDevices(deviceInfos) {
  var videoSelect = getVideoSelect();
  for (var i = 0; i !== deviceInfos.length; ++i) {
    var deviceInfo = deviceInfos[i];
    var option = document.createElement('option');
    option.value = deviceInfo.deviceId;
    if (deviceInfo.kind === 'videoinput') {
      option.text = deviceInfo.label || 'Camera ' +
        (videoSelect.length + 1);
      videoSelect.append(option);
    }
  }
}

function errorDevices(){
  console.log("Error obteniendo dispositivos");
}

function handleSuccess(stream) {
  const video = getPlayer();
  const videoTracks = stream.getVideoTracks();
  //console.log('Got stream with constraints:', constraints);
  //console.log(`Using video device: ${videoTracks[0].label}`);
  window.stream = stream; // make variable available to browser console
  video.srcObject = stream;
}

async function onPlay(videoEl) {
  runOnPlay()
  setTimeout(() => onPlay(videoEl), 1000)
}

async function runOnPlay() {
    
  //const mtcnnResults = await faceapi.ssdMobilenetv1(document.getElementById('player'))
  //const mtcnnResults = await faceapi.tinyFaceDetector(document.getElementById('player'));

  const input = getPlayer();
  const overlay = getOverlay();
  overlay.width = input.videoWidth;
  overlay.height = input.videoHeight;
  //const detectionsForSize = mtcnnResults.map(det => det.forSize(500, 400))

  //const tinyFaceDetectorOptions = getTinyFaceDetectorOptions();

  //faceapi.drawDetection(overlay, detectionsForSize, { withScore: true })    

  //const fullFaceDescriptions = await faceapi.detectAllFaces(input, tinyFaceDetectorOptions).withFaceLandmarks(true).withFaceDescriptors()
  const fullFaceDescriptions = await faceapi.detectAllFaces(input).withFaceLandmarks().withFaceDescriptors()
      
  var labels = getPersonLabels();

  const labeledFaceDescriptors = await Promise.all(
    labels.map(async label => {

      const img = getLabelImg(label);
      
      // detect the face with the highest score in the image and compute it's landmarks and face descriptor
      //const fullFaceDescription = await faceapi.detectSingleFace(img, tinyFaceDetectorOptions).withFaceLandmarks(true).withFaceDescriptor()
      const fullFaceDescription = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
      
      if (!fullFaceDescription) {
        throw new Error(`no faces detected for ${label}`)
      }
      
      const faceDescriptors = [fullFaceDescription.descriptor]
    // console.log(label)
      return new faceapi.LabeledFaceDescriptors(label, faceDescriptors)
    })
  )

  // 0.6 is a good distance threshold value to judge
  // whether the descriptors match or not
  const maxDescriptorDistance = 0.6;
  const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, maxDescriptorDistance)
  //console.log("face matcher"+faceMatcher)
  const results = fullFaceDescriptions.map(fd => faceMatcher.findBestMatch(fd.descriptor))

  const boxesWithText = getBoxesWithText(fullFaceDescriptions, results);

  //faceapi.drawDetection(overlay, boxesWithText)
  showDiv(boxesWithText);
}


function getPlayer(){
  return document.getElementById('player');
}

function getOverlay(){
  return document.getElementById('overlay');
}

function getVideoSelect(){
  return $("#videoSelect");
}

async function loadModels(){
  const MODELS = "https://webareaekasa.github.io/data/weights/"; // Contains all the weights.

  await faceapi.loadSsdMobilenetv1Model(MODELS)
  await faceapi.loadFaceLandmarkModel(MODELS)
  await faceapi.loadFaceRecognitionModel(MODELS)
    
  // await faceapi.loadTinyFaceDetectorModel(MODELS)
  // await faceapi.loadFaceLandmarkTinyModel(MODELS)
  // await faceapi.loadFaceRecognitionModel(MODELS)
}

function getPersonLabels(){
  return ['elorriaga','crosetti'];
}

function getTinyFaceDetectorOptions(){
  return new faceapi.TinyFaceDetectorOptions();
}

function getBoxesWithText(fullFaceDescriptions, results){
  return results.map((bestMatch, i) => {
    const box = fullFaceDescriptions[i].detection.box
    const text = bestMatch.toString()
    const boxWithText = new faceapi.BoxWithText(box, text)
    //console.log(boxWithText);
    return boxWithText;
  })
}

async function fecthImages(){
  var labels = getPersonLabels();
  return labels.map(async label => {
    // fetch image data from urls and convert blob to HTMLImage element
    const imgUrl = `data/faces/${label}.png`
    const img = await faceapi.fetchImage(imgUrl)
    var labelImg = {label: label, img: img};
    return labelImg;
  });
}


function getLabelImg(label){
  var outcome;
  if(labelImg && label){
    outcome = labelImg.filter(x => x.label == label)[0].img;
  }
  return outcome;
}

function showDiv(boxesWithText){
  var personLabels = getPersonLabels();
  if(boxesWithText){
    $(".jpanel").hide();
    for(var i=0,len=boxesWithText.length;i<len;i++){
      var boxDetectedPerson = boxesWithText[i].text;
      for(var k=0,lenk=personLabels.length;k<lenk;k++){
        var personLabel = personLabels[k];
        if( boxDetectedPerson.indexOf(personLabel) > -1){
          $("#" + personLabel).show();
        }
      }
    }
  }
}