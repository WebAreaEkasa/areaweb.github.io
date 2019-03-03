const SSD_MOBILENETV1 = 'ssd_mobilenetv1'
const TINY_FACE_DETECTOR = 'tiny_face_detector'
const MTCNN = 'mtcnn'

let selectedFaceDetector = TINY_FACE_DETECTOR

// ssd_mobilenetv1 options
let minConfidence = 0.5

// tiny_face_detector options
let inputSize = 128
let scoreThreshold = 0.5

//mtcnn options
let minFaceSize = 20

let labeledFaceDescriptors;
let faceMatcher;

$(document).ready(function () {
  run()
})

async function run() {

  await loadModules();

  const labels = getPersonLabels();

  labeledFaceDescriptors = await Promise.all(
    labels.map(async label => {
      // fetch image data from urls and convert blob to HTMLImage element
      const imgUrl = `/data/faces/${label}.jpg`
      const img = await faceapi.fetchImage(imgUrl)

      const fullFaceDescriptions = await faceapi
        .detectAllFaces(img, getFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors()

      if (!fullFaceDescriptions.length) {
        return
      }
      const faceDescriptors = [fullFaceDescriptions[0].descriptor]
      return new faceapi.LabeledFaceDescriptors(label, faceDescriptors)
    })
  )

  const maxDescriptorDistance = 0.6
  faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, maxDescriptorDistance);


  // try to access users webcam and stream the images
  // to the video element
  const stream = await navigator.mediaDevices.getUserMedia({ video: {} })
  const videoEl = $('#inputVideo').get(0)
  videoEl.srcObject = stream

}

function getPersonLabels() {
  return ['crosetti', 'elorriaga'];
}

async function loadModules() {
  if (!isFaceDetectionModelLoaded()) {
    await getCurrentFaceDetectionNet().load('https://webareaekasa.github.io/data/weights/')
    await faceapi.loadFaceLandmarkModel('https://webareaekasa.github.io/data/weights/')
    await faceapi.loadFaceRecognitionModel('https://webareaekasa.github.io/data/weights/')
  }
}

async function onPlay() {
  const videoEl = $('#inputVideo').get(0)
  const canvas = $('#overlay').get(0);

  if (videoEl.paused || videoEl.ended || !isFaceDetectionModelLoaded())
    return setTimeout(() => onPlay())

  const options = getFaceDetectorOptions()
  const results = await faceapi
    .detectAllFaces(videoEl, options)
    .withFaceLandmarks()
    .withFaceDescriptors()

  resizedResults = resizeCanvasAndResults(videoEl, canvas, results)
  const boxesWithText = resizedResults.map(({ detection, descriptor }) =>
    new faceapi.BoxWithText(
      detection.box,
      faceMatcher.findBestMatch(descriptor).toString()
    )
  )
  showDiv(boxesWithText);
  //faceapi.drawDetection(canvas, boxesWithText)

  setTimeout(() => onPlay())
}

function getBoxesWithText(fullFaceDescriptions, results) {
  return results.map((bestMatch, i) => {
    const box = fullFaceDescriptions[i].detection.box
    const text = bestMatch.toString()
    const boxWithText = new faceapi.BoxWithText(box, text)
    return boxWithText;
  })
}
function showDiv(boxesWithText) {
  var personLabels = getPersonLabels();
  if (boxesWithText) {
    $(".jpanel").hide();
    for (var i = 0, len = boxesWithText.length; i < len; i++) {
      var boxDetectedPerson = boxesWithText[i].text;
      for (var k = 0, lenk = personLabels.length; k < lenk; k++) {
        var personLabel = personLabels[k];
        if (boxDetectedPerson.indexOf(personLabel) > -1) {
          $("#" + personLabel).show();
        }
      }
    }
  }
}


function isFaceDetectionModelLoaded() {
  return !!getCurrentFaceDetectionNet().params
}

function getCurrentFaceDetectionNet() {
  if (selectedFaceDetector === SSD_MOBILENETV1) {
    return faceapi.nets.ssdMobilenetv1
  }
  if (selectedFaceDetector === TINY_FACE_DETECTOR) {
    return faceapi.nets.tinyFaceDetector
  }
  if (selectedFaceDetector === MTCNN) {
    return faceapi.nets.mtcnn
  }
}

function getFaceDetectorOptions() {
  return selectedFaceDetector === SSD_MOBILENETV1
    ? new faceapi.SsdMobilenetv1Options({ minConfidence })
    : (
      selectedFaceDetector === TINY_FACE_DETECTOR
        ? new faceapi.TinyFaceDetectorOptions({ inputSize, scoreThreshold })
        : new faceapi.MtcnnOptions({ minFaceSize })
    )
}

function drawDetections(dimensions, canvas, detections) {
  const resizedDetections = resizeCanvasAndResults(dimensions, canvas, detections)
  faceapi.drawDetection(canvas, resizedDetections)
}

function resizeCanvasAndResults(dimensions, canvas, results) {
  const { width, height } = dimensions instanceof HTMLVideoElement
    ? faceapi.getMediaDimensions(dimensions)
    : dimensions
  canvas.width = width
  canvas.height = height

  // resize detections (and landmarks) in case displayed image is smaller than
  // original size
  return faceapi.resizeResults(results, { width, height })
}