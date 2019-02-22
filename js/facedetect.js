var labelImg;
$(document).ready(function() {
  runOnLoad();
})

async function runOnLoad() {
  await loadModels();
  labelImg = await Promise.all(await fecthImages());

// try to access users webcam and stream the images
  // to the video element
 const videoEl = getPlayer();
  navigator.getUserMedia(
    { video: {} },
    stream => videoEl.srcObject = stream,
    err => console.error(err)
)
}

async function onPlay(videoEl) {
  runOnPlay()
  setTimeout(() => onPlay(videoEl), 1000)
}

async function runOnPlay() {
    
  const mtcnnResults = await faceapi.ssdMobilenetv1(document.getElementById('player'))
  //const mtcnnResults = await faceapi.tinyFaceDetector(document.getElementById('player'));

  const input = getPlayer();
  const overlay = getOverlay();
  overlay.width = input.videoWidth;
  overlay.height = input.videoHeight;
  const detectionsForSize = mtcnnResults.map(det => det.forSize(500, 400))

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

  faceapi.drawDetection(overlay, boxesWithText)
}


function getPlayer(){
  return document.getElementById('player');
}

function getOverlay(){
  return document.getElementById('overlay');
}

async function loadModels(){
  const MODELS = "/data/weights/"; // Contains all the weights.

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
    console.log(boxWithText);
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