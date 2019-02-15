
  $(document).ready(function() {
    run()
  })
      
  async function run() {
    // load the models
    await faceapi.loadMtcnnModel('/data/weights/')
    await faceapi.loadFaceRecognitionModel('/data/weights/')
    
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

  
  
  
