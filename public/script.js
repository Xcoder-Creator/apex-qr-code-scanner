// script.js file

const toggle_screens = () => {
	console.log('sdsd')
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
		console.log(decodeText)
		document.querySelector("#loader_screen").style.display = 'flex';

		await fetch(`https://apex-qr-code-scanner.onrender.com/verify-qr-code`, {
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
				}, 1000);
			} else if (response.code === 404){
				document.querySelector("#error_txt").textContent = 'QR Code Invalid';

				setTimeout(() => {
					document.querySelector("#loader_screen").style.display = 'none';
					document.querySelector("#error_screen").style.display = 'flex';
				}, 1000);
			} else if (response.code === 401){
				alert(JSON.stringify(response));
				document.querySelector("#error_txt").textContent = 'Network Error';

				setTimeout(() => {
					document.querySelector("#loader_screen").style.display = 'none';
					document.querySelector("#error_screen").style.display = 'flex';
				}, 1000);
			}
		})
		.catch((err) => {
			alert(err);
			document.querySelector("#error_txt").textContent = 'Network Error';

			setTimeout(() => {
				document.querySelector("#loader_screen").style.display = 'none';
				document.querySelector("#error_screen").style.display = 'flex';
			}, 1000);
		})
	}

	let htmlscanner = new Html5QrcodeScanner(
		"my-qr-reader",
		{ fps: 10, qrbos: 250 }
	);
	htmlscanner.render(onScanSuccess);
});
