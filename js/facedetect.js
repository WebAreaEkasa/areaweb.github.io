
  $(document).ready(function() {
    run()
  })
  
  const mtcnnForwardParams = {
    // number of scaled versions of the input image passed through the CNN
    // of the first stage, lower numbers will result in lower inference time,
    // but will also be less accurate
    maxNumScales: 10,
    // scale factor used to calculate the scale steps of the image
    // pyramid used in stage 1
    scaleFactor: 0.709,
    // the score threshold values used to filter the bounding
    // boxes of stage 1, 2 and 3
    scoreThresholds: [0.6, 0.7, 0.7],
    // mininum face size to expect, the higher the faster processing will be,
    // but smaller faces won't be detected
    minFaceSize: 200
  }

  

  async function run() {
	  
	const MODELS = "/data/weights/"; // Contains all the weights.

    await faceapi.loadMtcnnModel(MODELS)
    await faceapi.loadFaceRecognitionModel(MODELS)
	  
    
    navigator.permissions.query({name:'camera'}).then(function(result) {
      if (result.state == 'granted') {
        alert("granted");
      } else if (result.state == 'prompt') {
        alert("prompt");
      } else if (result.state == 'denied') {
        alert("denied");
      }
      result.onchange = function() {
        alert("change permission");
      };

      var player = document.getElementById('player');

      var handleSuccess = function(stream) {
        player.srcObject = stream;
      };
    
      navigator.mediaDevices.getUserMedia({video: true})
          .then(handleSuccess);
    });
	
  }

  async function run2() {
    var player = document.getElementById('player');

    const mtcnnResults = await faceapi.mtcnn(player, mtcnnForwardParams);
    faceapi.drawDetection('overlay', mtcnnResults.map(res => res.faceDetection), { withScore: false })
    faceapi.drawLandmarks('overlay', mtcnnResults.map(res => res.faceLandmarks), { lineWidth: 4, color: 'red' })

    const alignedFaceBoxes = results.map(
      ({ faceLandmarks }) => faceLandmarks.align()
    )

    const options = new faceapi.MtcnnOptions(mtcnnParams)
    const fullFaceDescriptions = await faceapi.detectAllFaces(player, options).withFaceLandmarks().withFaceDescriptors()

    const labels = ['sheldon' 'raj', 'leonard', 'howard']

    const labeledFaceDescriptors = await Promise.all(
      labels.map(async label => {
        // fetch image data from urls and convert blob to HTMLImage element
        const imgUrl = `${label}.png`
        const img = await faceapi.fetchImage(imgUrl)
        
        // detect the face with the highest score in the image and compute it's landmarks and face descriptor
        const fullFaceDescription = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
        
        if (!fullFaceDescription) {
          throw new Error(`no faces detected for ${label}`)
        }
        
        const faceDescriptors = [fullFaceDescription.descriptor]
        return new faceapi.LabeledFaceDescriptors(label, faceDescriptors)
      })
    )
    
    // 0.6 is a good distance threshold value to judge
    // whether the descriptors match or not
    const maxDescriptorDistance = 0.6
    const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, maxDescriptorDistance)

    const results = fullFaceDescriptions.map(fd => faceMatcher.findBestMatch(fd.descriptor))

    const boxesWithText = results.map((bestMatch, i) => {
      const box = fullFaceDescriptions[i].detection.box
      const text = bestMatch.toString()
      const boxWithText = new faceapi.BoxWithText(box, text)
      return boxWithText
    })
    
    faceapi.drawDetection(canvas, boxesWithText)
  }

  async function onPlay(videoEl) {
    // run face detection & recognition
    // ...
    run2();
    setTimeout(() => onPlay(videoEl))
  }
  
  
  
