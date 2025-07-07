async function loadHTML(url) {
    try {
        const response = await fetch(url);
        const text = await response.text();

        // Optional: extract part of the HTML (e.g. <main>)
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
         // Or any selector
        return doc.querySelector('body')
    } catch (err) {
        console.error('Failed to load content:', err);
        return ""
    }
}

async function loadNewJs(url, targetHead){
    try {
        const response = await fetch(url);
        const jsCode = await response.text();

        const newScriptTag = document.createElement('script');
        newScriptTag.textContent = jsCode;

        /* Make something like this
        // For external script
        if (oldScriptTag.src) {
            newScriptTag.src = oldScriptTag.src;
            newScriptTag.async = oldScriptTag.async;
        // For inline script
        } else {
            newScriptTag.textContent = oldScriptTag.textContent;;
        }
        */

    } catch (err) {
        console.error('Failed to load content:', err);
        return ""
    }

}

async function loadNewContent() {
    const newContent = await loadHTML("index.html")
    const targetBody = document.querySelector('main');
    if (newContent && targetBody) {
        targetBody.innerHTML = newContent.innerHTML;
        const targetHead = document.querySelector('head');

        await loadNewJs("js/main_images.js", targetHead);
        await loadNewJs("js/sidebar.js", targetHead);

        history.pushState(null, '', "index.html");
    }
}


document.addEventListener("DOMContentLoaded", function(){
    let privateKey = null;
    let publicKey = null;

    // Converts PEM to ArrayBuffer
    function pemToArrayBuffer(pem) {
        const base64 = pem
            .replace(/-----BEGIN PRIVATE KEY-----/, '')
            .replace(/-----END PRIVATE KEY-----/, '')
            .replace(/\s/g, '');
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }

    async function importPrivateKey(pemKey) {
        const keyData = pemToArrayBuffer(pemKey);

        return await crypto.subtle.importKey(
            "pkcs8",
            keyData,
            {
                name: "ECDSA",
                namedCurve: "P-256"
            },
            true,
            ["sign"]
        );
    }

    async function exportPublicKeyFromPrivate(privKey) {
        const keyPair = await crypto.subtle.exportKey("jwk", privKey);
        const pubJwk = {
            kty: "EC",
            crv: "P-256",
            x: keyPair.x,
            y: keyPair.y,
            ext: true
        };

        return await crypto.subtle.importKey(
            "jwk",
            pubJwk,
            {
                name: "ECDSA",
                namedCurve: "P-256"
            },
            true,
            ["verify"]
        );
    }

    async function signMessage(privateKey, message) {
        const encoder = new TextEncoder();
        const data = encoder.encode(message);

        const signature = await crypto.subtle.sign(
            {
                name: "ECDSA",
                hash: { name: "SHA-256" }
            },
            privateKey,
            data
        );

        return btoa(String.fromCharCode(...new Uint8Array(signature)));
    }

    async function exportPublicKey(pubKey) {
        const spki = await crypto.subtle.exportKey("spki", pubKey);
        return btoa(String.fromCharCode(...new Uint8Array(spki)));
    }

    document.getElementById("keyFile").addEventListener("change", async (event) => {
        const file = event.target.files[0];
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const pemKey = e.target.result;
                privateKey = await importPrivateKey(pemKey);
                publicKey = await exportPublicKeyFromPrivate(privateKey);
                const loginButton = document.getElementById("loginButton")
                loginButton.classList.add("loginButtonActive");
                console.log("Private key imported.");
            } catch (err) {
                console.error("Failed to import key:", err);
            }
        };

        if (file) reader.readAsText(file);
    });

    document.getElementById("loginForm").addEventListener("submit", async function (event) {
        event.preventDefault();
        if (!privateKey || !publicKey) return;

        const timestamp = Math.floor(Date.now() / 1000).toString();
        const signature = await signMessage(privateKey, timestamp);
        const pubKey = await exportPublicKey(publicKey);

        const payload = {
            timestamp: timestamp,
            signature: signature,
            publicKey: pubKey
        };

        const res = await fetch("https://auth.jacoblounge.pt/login", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        const text = await res.text();
        console.log("Server response:", text);

        //await loadNewContent()
        // TODO: validate credentials here
        // Then trigger transition

        const form = document.getElementById('loginCompleteForm');
        const whiteScreen = document.getElementById('whiteScreen');

        form.classList.add('fade-out');
        // Listen for the end of the opacity transition on the form
        form.addEventListener('transitionend', function handler(e) {
            if (e.propertyName === 'opacity') {  // Ensure it's the opacity transition
                // Remove listener so it only triggers once
                form.removeEventListener('transitionend', handler);

                // Show the white screen overlay
                whiteScreen.classList.add('active');

                // Redirect after white screen fade-in completes (optional)
                whiteScreen.addEventListener('transitionend', function handler2(ev) {
                    if (ev.propertyName === 'opacity') {
                        whiteScreen.removeEventListener('transitionend', handler2);
                        // Redirect now:
                        window.location.replace('/');
                    }
                });
            }
        });
    });
});
