// script.js file
var is_scanning = false;
var audio = document.getElementById("myAudio");

const toggle_screens = () => {
	document.querySelector("#error_screen").style.display = 'none';
	document.querySelector("#loader_screen").style.display = 'none';
	document.querySelector("#success_screen").style.display = 'none';
}

function domReady(fn) {
	if (
		document.readyState === "complete" ||
		document.readyState === "interactive"
	) {
		setTimeout(fn, 1000);
	} else {
		document.addEventListener("DOMContentLoaded", fn);
	}
}

domReady(function () {

	// If found you qr code
	async function onScanSuccess(decodeText, decodeResult) {
		if (is_scanning === false){
			is_scanning = true;
			audio.play();
			document.querySelector("#loader_screen").style.display = 'flex';

			await fetch(`https://apex-qr-code-scanner.onrender.com/api/verify-qr-code`, {
				method: "POST",
				
				body: new URLSearchParams({
					qr_code: decodeText
				})
			})
			.then((res) => {
				if (!res.ok) {
					throw new Error(`HTTP error! Status: ${res.status}`);
				}
				return res.json();
			})
			.then(async (response) => {
				if (response.code === 200){
					let guest_details = response.guest_details;
					let data = `
						<span>Name: ${guest_details.name}</span>
						<span>Phone: ${guest_details.phone_num}</span>
					`
					document.querySelector("#guest_details").innerHTML = data;

					setTimeout(() => {
						document.querySelector("#loader_screen").style.display = 'none';
						document.querySelector("#success_screen").style.display = 'flex';
						is_scanning = false;
					}, 1000);
				} else if (response.code === 404){
					document.querySelector("#error_txt").textContent = 'QR Code Invalid';

					setTimeout(() => {
						document.querySelector("#loader_screen").style.display = 'none';
						document.querySelector("#error_screen").style.display = 'flex';
						is_scanning = false;
					}, 1000);
				} else if (response.code === 401){
					document.querySelector("#error_txt").textContent = 'Network Error';

					setTimeout(() => {
						document.querySelector("#loader_screen").style.display = 'none';
						document.querySelector("#error_screen").style.display = 'flex';
						is_scanning = false;
					}, 1000);
				}
			})
			.catch((err) => {
				document.querySelector("#error_txt").textContent = 'Network Error';

				setTimeout(() => {
					document.querySelector("#loader_screen").style.display = 'none';
					document.querySelector("#error_screen").style.display = 'flex';
					is_scanning = false;
				}, 1000);
			})
		}
	}

	let htmlscanner = new Html5QrcodeScanner(
		"my-qr-reader",
		{ fps: 10, qrbos: 250 }
	);
	htmlscanner.render(onScanSuccess);
});
