
console.log(tf);

console.log(handPoseDetection);

let detector;
let wrist, thumb, index, middle, ring, pinky, result, map;

function delta({x: x1, y: y1}, {x: x2, y: y2}) {
  return Math.floor(
    Math.sqrt( (x2 - x1)**2 + (y2 - y1)**2)
  );
}

function render_value(element, value) {
  if (value) { 
    element.value = value;
  } else {
    element.value = "-";
  }
}

const ASL_NUMBERS = {
  "0,0,0,0,0": 0,
  "0,1,0,0,0": 1,
  "0,1,1,0,0": 2,
  "1,1,1,0,0": 3,
  "0,1,1,1,1": 4,
  "1,1,1,1,1": 5,
  "0,1,1,1,0": 6,
  "0,1,1,0,1": 7,
  "0,1,0,1,1": 8,
  "0,0,1,1,1": 9,
  "1,0,0,0,0": 10,
};

async function loop() {
  const hands = await detector.estimateHands(video);

  if (hands && hands[0]) {
    let hand = hands[0];
    window.HAND = hand;

    let keypoints = hand.keypoints;


    let palmDelta = delta(keypoints[0], keypoints[5]);

    // Thumb to index mcp, because you don't bend your thumb to it's mmp
    let thumbDelta = delta(keypoints[5], keypoints[4]);

    let pointerDelta = delta(keypoints[5], keypoints[8]);
    let middleDelta = delta(keypoints[9], keypoints[12]);
    let ringDelta = delta(keypoints[13], keypoints[16]);
    let pinkyDelta = delta(keypoints[17], keypoints[20]);

    render_value(wrist, palmDelta);
    render_value(thumb, thumbDelta);
    render_value(index, pointerDelta);
    render_value(middle, middleDelta);
    render_value(ring, ringDelta);
    render_value(pinky, pinkyDelta);

    let thumbUp = Math.abs(thumbDelta) > Math.abs(palmDelta) * 0.5 ? 1 : 0;
    let pointerUp = Math.abs(pointerDelta) > Math.abs(palmDelta) * 0.5 ? 1 : 0;
    let middleUp = Math.abs(middleDelta) > Math.abs(palmDelta) * 0.5 ? 1 : 0;
    let ringUp = Math.abs(ringDelta) > Math.abs(palmDelta) * 0.5 ? 1 : 0;
    let pinkyUp = Math.abs(pinkyDelta) > Math.abs(palmDelta) * 0.5 ? 1 : 0;

    let value = [thumbUp, pointerUp, middleUp, ringUp, pinkyUp].toString();

    map.value = value;
    result.value = ASL_NUMBERS[value];
  } else {
    render_value(wrist, undefined);
    render_value(thumb, undefined);
    render_value(index, undefined);
    render_value(middle, undefined);
    render_value(ring, undefined);
    render_value(pinky, undefined);
  }


  requestAnimationFrame(loop);
}

async function setup() {


  console.log("loading model");
  const model = handPoseDetection.SupportedModels.MediaPipeHands;
  console.log("loaded model", model);
  const detectorConfig = {
    runtime: 'mediapipe', // or 'tfjs',
    solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands',
    modelType: 'full'
  }

  console.log("creating a detector");
  detector = await handPoseDetection.createDetector(model, detectorConfig);
  console.log("created a detector", detector);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error(
          'Browser API navigator.mediaDevices.getUserMedia not available');
    }

  const videoConfig = {
      'audio': false,
      'video': {
        facingMode: 'user',
      deviceId: 0,
        // Only setting the video to a specified size for large screen, on
        // mobile devices accept the default size.
        // width: 360,
        // height: 270,
        // frameRate: {
        //   ideal: 24,
        // }
      }
    };

      const stream = await navigator.mediaDevices.getUserMedia(videoConfig);
  console.log(stream);

  const video = document.getElementById('video');
  video.srcObject = stream;
  video.width = 360; // videoConfig.video.width;
  video.height = 270; // videoConfig.video.height;
  video.play();

  if (video.readyState < 2) {
    await new Promise((resolve) => {
      video.onloadeddata = () => {
        resolve(video);
      };
    });
  }

  wrist = document.getElementById("wrist");
  thumb = document.getElementById("thumb");
  index = document.getElementById("index");
  middle = document.getElementById("middle");
  ring = document.getElementById("ring");
  pinky = document.getElementById("pinky");
  result = document.getElementById("result");
  map = document.getElementById("map");

  requestAnimationFrame(loop);
}

setup();
