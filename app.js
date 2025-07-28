const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const MM_TO_PX = 3.7795;
const CM_TO_PX = MM_TO_PX * 10;
const A4_WIDTH_PX = Math.round(A4_WIDTH_MM * MM_TO_PX);
const A4_HEIGHT_PX = Math.round(A4_HEIGHT_MM * MM_TO_PX);

let cropper = null;
let croppedImage = null;
let uploadedImage = null;

let selectedWidthCm = 3.5;
let selectedHeightCm = 4.5;

const cropImageElement = document.getElementById("cropImage");
const finalizeButton = document.getElementById("finalizeCrop");

function updateCropperAspectRatio() {
  if (!cropper) return;
  selectedWidthCm = parseFloat(document.getElementById("presetWidth").value);
  selectedHeightCm = parseFloat(document.getElementById("presetHeight").value);
  const aspectRatio = selectedWidthCm / selectedHeightCm;
  cropper.setAspectRatio(aspectRatio);
}

document
  .getElementById("presetWidth")
  .addEventListener("input", updateCropperAspectRatio);
document
  .getElementById("presetHeight")
  .addEventListener("input", updateCropperAspectRatio);

document.getElementById("photoInput").addEventListener("change", function (e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (event) {
    cropImageElement.src = event.target.result;
    cropImageElement.style.display = "block";
    cropImageElement.onload = () => {
      selectedWidthCm = parseFloat(
        document.getElementById("presetWidth").value
      );
      selectedHeightCm = parseFloat(
        document.getElementById("presetHeight").value
      );
      const aspectRatio = selectedWidthCm / selectedHeightCm;

      if (cropper) cropper.destroy();
      cropper = new Cropper(cropImageElement, {
        viewMode: 1,
        aspectRatio: aspectRatio,
        autoCropArea: 1,
        movable: true,
        scalable: false,
        zoomable: true,
        rotatable: false,
        cropBoxResizable: true,
        dragMode: "move",
      });
      finalizeButton.disabled = false;
    };
  };
  reader.readAsDataURL(file);
});

finalizeButton.addEventListener("click", () => {
  if (!cropper) return;
  const canvas = cropper.getCroppedCanvas();
  croppedImage = new Image();
  croppedImage.onload = () => {
    uploadedImage = croppedImage;
    document.getElementById("layoutSection").style.display = "block";
    document.getElementById(
      "photoSizeDisplay"
    ).innerText = `${selectedWidthCm} cm x ${selectedHeightCm} cm`;
  };
  croppedImage.src = canvas.toDataURL();
});

function generateLayout() {
  if (!uploadedImage) {
    alert("Please upload and crop the image first.");
    return;
  }

  const gap = parseInt(document.getElementById("gapSize").value);
  const maxCopies = parseInt(document.getElementById("maxCopies").value);

  const marginTop = parseInt(document.getElementById("marginTop").value);
  const marginRight = parseInt(document.getElementById("marginRight").value);
  const marginBottom = parseInt(document.getElementById("marginBottom").value);
  const marginLeft = parseInt(document.getElementById("marginLeft").value);

  const photoWidthPx = Math.round(selectedWidthCm * CM_TO_PX);
  const photoHeightPx = Math.round(selectedHeightCm * CM_TO_PX);

  const canvas = document.getElementById("layoutCanvas");
  canvas.width = A4_WIDTH_PX;
  canvas.height = A4_HEIGHT_PX;
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const usableWidth = A4_WIDTH_PX - marginLeft - marginRight;
  const usableHeight = A4_HEIGHT_PX - marginTop - marginBottom;

  const cols = Math.floor((usableWidth + gap) / (photoWidthPx + gap));
  const rows = Math.floor((usableHeight + gap) / (photoHeightPx + gap));
  const total = cols * rows;

  let drawCount = maxCopies > 0 ? Math.min(maxCopies, total) : total;

  let count = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (count >= drawCount) break;
      const x = marginLeft + c * (photoWidthPx + gap);
      const y = marginTop + r * (photoHeightPx + gap);
      ctx.drawImage(
        uploadedImage,
        0,
        0,
        uploadedImage.width,
        uploadedImage.height,
        x,
        y,
        photoWidthPx,
        photoHeightPx
      );
      count++;
    }
    if (count >= drawCount) break;
  }
}

// PRINT FUNCTION USING IFRAME
function printCanvas() {
  const dataUrl = document.getElementById("layoutCanvas").toDataURL();
  let iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "none";
  document.body.appendChild(iframe);

  iframe.onload = function () {
    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      document.body.removeChild(iframe);
    }, 100);
  };

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(`
    <html>
      <head>
        <title>Print Layout</title>
        <style>
          body { margin: 0; }
          img { max-width: 100vw; max-height: 100vh; display: block; margin: auto; }
        </style>
      </head>
      <body>
        <img src="${dataUrl}" />
      </body>
    </html>
  `);
  doc.close();
}
