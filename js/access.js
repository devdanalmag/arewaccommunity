    // Function to set cookie
    function setCookie(name, value, days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = "expires=" + date.toUTCString();
        document.cookie = name + "=" + value + ";" + expires + ";path=/";
    }

    // Function to get cookie
    function getCookie(name) {
        const cookieName = name + "=";
        const decodedCookie = decodeURIComponent(document.cookie);
        const cookieArray = decodedCookie.split(';');
        for (let i = 0; i < cookieArray.length; i++) {
            let cookie = cookieArray[i];
            while (cookie.charAt(0) === ' ') {
                cookie = cookie.substring(1);
            }
            if (cookie.indexOf(cookieName) === 0) {
                return cookie.substring(cookieName.length, cookie.length);
            }
        }
        return "";
    }

    // Function to delete cookie
    function deleteCookie(name) {
        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    }

    // Main verification logic
    if (!getCookie('PAGEACCESS')) {
        const mycode = prompt("Please enter your Access code:");

        if (mycode === null || mycode.trim() === "") {
            console.log(mycode === null ? "User cancelled the prompt." : "No code entered.");
            deleteCookie('PAGEACCESS');
            alert("Access denied. Redirecting to homepage.");
            window.location.href = "index.html";
        }
        else {
            const trimmedCode = mycode.trim().toUpperCase();

            if (trimmedCode !== "ALP2025") {
                console.log("Invalid code entered: " + trimmedCode);
                deleteCookie('PAGEACCESS');
                alert("Invalid code. Redirecting to homepage.");
                window.location.href = "index.html";
            }
            else {
                console.log("Code verified successfully.");
                setCookie('PAGEACCESS', 'true', 1); // Store for 1 day
            }
        }
    }
