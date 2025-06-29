
        function checkdevices() {
            const devices = document.querySelectorAll('input[name="device"]:checked');
            const selectedDevices = Array.from(devices).map(d => d.value);
            console.log('Selected devices:', selectedDevices);
            if (selectedDevices.includes('android') && selectedDevices.includes('pc')) {
                document.getElementById('course').innerHTML = `
                    <option value="" disabled selected>Select your course</option>
                    <option value="Basics in Artificial Intelligence (AI)">Basics in Artificial Intelligence (AI)</option>
                    <option value="Token & NFT Development">Token & NFT Development</option>
                    <option value="Telegram Mini-App Development">Telegram Mini-App Development</option>
                    <option value="Graphics Design">Graphics Design</option>
                    <option value="Content Creation">Content Creation</option>
                    <option value="Web3 Job Skills">Web3 Job Skills</option>
                    <option value="Airdrop Hunting">Airdrop Hunting</option>
                    <option value="Crypto Trading">Crypto Trading</option>
                `;
            }
            else if (selectedDevices.includes('android')) {
                document.getElementById('course').innerHTML = `
                    <option value="" disabled selected>Select your course</option>
                    <option value="Basics in Artificial Intelligence (AI)">Basics in Artificial Intelligence (AI)</option>
                    <option value="Graphics Design">Graphics Design</option>
                    <option value="Content Creation">Content Creation</option>
                    <option value="Web3 Job Skills">Web3 Job Skills</option>
                    <option value="Airdrop Hunting">Airdrop Hunting</option>
                    <option value="Crypto Trading">Crypto Trading</option>
                `;
            }
            else if (selectedDevices.includes('pc')) {
                document.getElementById('course').innerHTML = `
                    <option value="" disabled selected>Select your course</option>
                    <option value="Basics in Artificial Intelligence (AI)">Basics in Artificial Intelligence (AI)</option>
                    <option value="Token & NFT Development">Token & NFT Development</option>
                    <option value="Telegram Mini-App Development">Telegram Mini-App Development</option>
                    <option value="Graphics Design">Graphics Design</option>
                    <option value="Content Creation">Content Creation</option>
                    <option value="Web3 Job Skills">Web3 Job Skills</option>
                    <option value="Airdrop Hunting">Airdrop Hunting</option>
                    <option value="Crypto Trading">Crypto Trading</option>
                `;
            }
            else {
                document.getElementById('course').innerHTML = `
                    <option value="" disabled selected>Select Device before Course</option>
                `;
            }
            return true;
        }
        // Mobile Menu Toggle
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const navLinks = document.getElementById('navLinks');

        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            mobileMenuBtn.innerHTML = navLinks.classList.contains('active') ?
                '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
        });
        function submitToGoogleSheets(formData) {
            return new Promise((resolve, reject) => {
                const callbackName = 'jsonp_callback_' + Date.now();
                const scriptUrl = buildScriptUrl(formData, callbackName);

                // Create temporary callback function
                window[callbackName] = function (response) {
                    cleanup(callbackName);
                    if (response.success) {
                        resolve(response);
                    } else {
                        reject(new Error(response.error || 'Submission failed'));
                    }
                };

                // Create and inject script tag
                const script = document.createElement('script');
                script.src = scriptUrl;
                script.onerror = () => {
                    cleanup(callbackName);
                    reject(new Error('Network error'));
                };
                document.body.appendChild(script);

                // Cleanup function
                function cleanup(callback) {
                    delete window[callback];
                    document.body.removeChild(script);
                }
            });
        }

        function buildScriptUrl(data, callback) {
            const baseUrl = 'https://script.google.com/macros/s/AKfycbwQCzwQvnvnLvP9fkB32OV6kWz4pUHR4LNyVizB9te5xNT7acihAUXzIjHSC0YSyzp7/exec';
            const params = new URLSearchParams();

            // Add callback parameter
            params.append('callback', callback);

            // Add form data
            for (const key in data) {
                if (Array.isArray(data[key])) {
                    params.append(key, data[key].join(','));
                } else {
                    params.append(key, data[key]);
                }
            }

            return `${baseUrl}?${params.toString()}`;
        }

        // Form submission
        document.getElementById('academyForm').addEventListener('submit', async function (e) {
            e.preventDefault();
            document.querySelectorAll('button[type="submit"]').forEach(btn => {
                btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> SUBMITTING...';
                btn.disabled = true; // Disable submit button to prevent multiple submissions
            });

            // Validate form
            const termsCheckbox = document.getElementById('termsCheckbox');
            const email = document.getElementById('email').value;
            const state = document.getElementById('state').value;
            const course = document.getElementById('course').value;
            const devices = Array.from(document.querySelectorAll('input[name="device"]:checked')).map(el => el.value);
            const whatsapp = document.getElementById('whatsapp').value;

            if (!email || !state || !course || devices.length === 0 || !whatsapp || !termsCheckbox.checked) {
                alert('Please fill all required fields and accept the Terms and Conditions');
                document.querySelectorAll('button[type="submit"]').forEach(btn => {
                    btn.innerHTML = '<i class="fa fa-user-plus" aria-hidden="true"></i> SUBMIT';
                    btn.disabled = false; // Disable submit button to prevent multiple submissions
                });
                return;
            }

            // Collect form data
            const formData = {
                email,
                state,
                course,
                devices: Array.from(devices).map(d => d.value),
                twitter: document.querySelector('.social-handle.twitter input').value,
                facebook: document.querySelector('.social-handle.facebook input').value || '',
                telegram: document.querySelector('.social-handle.telegram input').value,
                discord: document.querySelector('.social-handle.discord input').value,
                whatsapp
            };

            const social = Array.from(document.querySelectorAll(".social-handles input"))
                .map(el => `${el.placeholder}: ${el.value}`);

            const res = await fetch("api/send-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, state, devices, course, social, whatsapp }),
            });

            const result = await res.json();
            if (result.success) {
                document.querySelectorAll('button[type="submit"]').forEach(btn => {
                    btn.innerHTML = '<i class="fa fa-user-plus" aria-hidden="true"></i> SUBMIT';
                    btn.disabled = false; // Disable submit button to prevent multiple submissions
                });
                const loader = showLoader();
                try {
                    await submitToGoogleSheets(formData);
                    showSuccessPopup();
                    e.target.reset();
                } catch (error) {
                    showErrorPopup(error.message || 'An error occurred while submitting the form');
                    document.querySelectorAll('button[type="submit"]').forEach(btn => {
                        btn.innerHTML = '<i class="fa fa-user-plus" aria-hidden="true"></i> SUBMIT';
                        btn.disabled = false; // Enable submit button again
                    });
                    console.log(error.message);
                } finally {
                    loader.remove();
                }                // showSuccessPopup();
                document.getElementById("academyForm").reset();
            } else {
                document.querySelectorAll('button[type="submit"]').forEach(btn => {
                    btn.innerHTML = '<i class="fa fa-user-plus" aria-hidden="true"></i> SUBMIT';
                    btn.disabled = false; // Disable submit button to prevent multiple submissions
                });
                showErrorPopup("An error occurred while submitting the form. Please try again later.");
                console.error(result.error || 'Submission failed');
                // alert("❌ Submission failed. Please try again later.");
            }

            // Here you would typically send the data to your server
            console.log('Form submitted:', formData);

            // Show success message
            // alert('Application submitted successfully! We will contact you via WhatsApp soon.');
            this.reset();
        });

        // Add country code helper for WhatsApp field
        document.getElementById('whatsapp').addEventListener('focus', function () {
            if (!this.value.startsWith('+')) {
                this.value = '+234';
            }
        });

        // Terms and Conditions Modal Functionality
        const termsModal = document.getElementById('termsModal');
        const termsLink = document.getElementById('termsLink');
        const termsClose = document.getElementById('termsClose');
        const termsAccept = document.getElementById('termsAccept');
        const termsCheckbox = document.getElementById('termsCheckbox');

        // Open modal when terms link is clicked
        termsLink.addEventListener('click', function (e) {
            e.preventDefault();
            termsModal.classList.add('active');
        });

        // Close modal when X is clicked
        termsClose.addEventListener('click', function () {
            termsModal.classList.remove('active');
        });

        // Accept terms and close modal
        termsAccept.addEventListener('click', function (e) {
            termsModal.classList.remove('active');
            termsCheckbox.checked = true;
            e.preventDefault();
        });

        // Close modal when clicking outside
        termsModal.addEventListener('click', function (e) {
            if (e.target === termsModal) {
                termsModal.classList.remove('active');
            }
        });

        // Form validation
        // document.getElementById('academyForm').addEventListener('submit', function (e) {
        // if (!termsCheckbox.checked) {
        // e.preventDefault();
        // alert('You must accept the Terms and Conditions to submit your application');
        // termsLink.scrollIntoView({ behavior: 'smooth' });
        // termsLink.style.animation = 'glow 0.5s 3';
        // }
        // });
        function showErrorPopup(message) {
            const popup = document.createElement('div');
            popup.className = 'acc-popup-overlay active';
            popup.innerHTML = `
    <div class="acc-popup-container">
      <div class="acc-popup-icon error" style="color: red;">
        <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
      </div>
      <div class="acc-popup-content">
        <h3>Error</h3>
        <p>${message}</p>
      </div>
      <button class="acc-popup-button" onclick="this.closest('.acc-popup-overlay').remove()">
        Try Again
      </button>
    </div>
  `;
            document.body.appendChild(popup);
        }
        function showSuccessPopup() {
            const popup = document.getElementById('formPopup');
            const closeBtn = document.getElementById('popupClose');

            // Show popup
            popup.classList.add('active');

            // Close functionality
            closeBtn.addEventListener('click', () => {
                popup.classList.remove('active');
            });

            // Close when clicking outside
            popup.addEventListener('click', (e) => {
                if (e.target === popup) {
                    popup.classList.remove('active');
                }
            });
        }
        function showLoader() {
            const loader = document.createElement('div');
            loader.className = 'acc-loader';
            loader.innerHTML = `
    <div class="acc-loader-content">
      <div class="acc-loader-spinner"></div>
      <p>Processing...</p>
    </div>
  `;
            document.body.appendChild(loader);
            return loader;
        }
        // Add glow animation for emphasis
        const style = document.createElement('style');
        style.textContent = `
    @keyframes glow {
    0% { text-shadow: none; }
    50% { text-shadow: 0 0 10px var(--neon-green); }
    100% { text-shadow: none; }
    }
    `;
        document.head.appendChild(style);

