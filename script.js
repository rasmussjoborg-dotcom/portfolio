document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Reveal Animations ---
    const options = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal-active');
                observer.unobserve(entry.target);
            }
        });
    }, options);

    const revealElements = document.querySelectorAll('.reveal-text, .reveal-text-delayed, .project-card, .section-title, .about-content');
    revealElements.forEach(el => observer.observe(el));


    // --- 2. Post AI Carousel (Manual Navigation Only) ---
    const slides = document.querySelectorAll('.carousel-slide');
    const container = document.querySelector('.carousel-slides');
    const prevBtn = document.querySelector('.carousel-arrow-prev');
    const nextBtn = document.querySelector('.carousel-arrow-next');

    if (slides.length > 0) {
        let currentSlide = 0;
        let isAnimating = false;

        function updateCarouselHeight(index) {
            if (!container || !slides[index]) return;
            // Use scrollHeight to get the full height of the content
            const height = slides[index].scrollHeight;
            container.style.height = `${height}px`;
        }

        function showSlide(index, direction = 'next') {
            if (isAnimating) return;
            isAnimating = true;

            const currentSlideEl = slides[currentSlide];
            const nextSlideEl = slides[index];

            // Reset styles that might disturb animations
            slides.forEach(s => {
                s.style.transform = '';
                s.style.opacity = '';
            });

            if (direction === 'next') {
                // NEXT (Down Button): PUSH DOWN
                // New content comes from TOP, Old content falls BELOW

                // 1. Current slide falls BELOW (Exit Down)
                currentSlideEl.classList.add('exit-down');
                currentSlideEl.classList.remove('active');

                // 2. Next slide starts specific setup from TOP
                nextSlideEl.classList.remove('active', 'exit-up', 'exit-down', 'from-bottom');
                nextSlideEl.classList.add('from-top');

                // Force Reflow
                void nextSlideEl.offsetWidth;

                // Animate in
                nextSlideEl.classList.remove('from-top');
                nextSlideEl.classList.add('active');

            } else {
                // PREV (Up Button): PUSH UP
                // New content comes from BOTTOM, Old content goes UP

                // 1. Current slide goes UP (Exit Up)
                currentSlideEl.classList.add('exit-up');
                currentSlideEl.classList.remove('active');

                // 2. Next slide starts setup from BOTTOM
                nextSlideEl.classList.remove('active', 'exit-up', 'exit-down', 'from-top');
                nextSlideEl.classList.add('from-bottom');

                void nextSlideEl.offsetWidth; // Force reflow

                // Animate in
                nextSlideEl.classList.remove('from-bottom');
                nextSlideEl.classList.add('active');
            }

            currentSlide = index;
            updateCarouselHeight(currentSlide);

            setTimeout(() => {
                isAnimating = false;
                // Cleanup current slide classes after animation
                slides.forEach((s, i) => {
                    if (i !== currentSlide) {
                        s.classList.remove('active', 'exit-up', 'exit-down', 'from-top', 'from-bottom');
                    }
                });
            }, 600);
        }

        function nextSlide() {
            let nextIndex = (currentSlide + 1) % slides.length;
            showSlide(nextIndex, 'next');
        }

        function prevSlide() {
            let prevIndex = (currentSlide - 1 + slides.length) % slides.length;
            showSlide(prevIndex, 'prev');
        }

        // Update pill indicator
        function updatePillIndicator(index) {
            const pills = document.querySelectorAll('.pill');
            pills.forEach((pill, i) => {
                if (i === index) {
                    pill.classList.add('active');
                } else {
                    pill.classList.remove('active');
                }
            });
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                prevSlide();
                updatePillIndicator(currentSlide);
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                nextSlide();
                updatePillIndicator(currentSlide);
            });
        }

        // Initialize height and pill indicator
        updateCarouselHeight(0);
        updatePillIndicator(0);

        // Adjust on window resize
        window.addEventListener('resize', () => updateCarouselHeight(currentSlide));
    }


    // --- 3. Stardust Background Animation (Restored) ---
    const canvas = document.getElementById('hero-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let width, height;
        let particles = [];

        // Configuration
        // Particle count is now dynamic in initCanvas
        const connectionDistance = 150;
        const mouseDistance = 200;

        let mouse = { x: null, y: null };

        window.addEventListener('mousemove', (e) => {
            mouse.x = e.x;
            mouse.y = e.y;
        });

        window.addEventListener('resize', initCanvas);

        function initCanvas() {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight * 1.3; // Cover hero + logic section

            // Mobile Optimization: Reduce particles
            const isMobile = width < 768;
            const targetCount = isMobile ? 50 : 120;

            // Only recreate if count drastically changes to avoid flicker usage
            if (particles.length !== targetCount) {
                particles = [];
                // Configuration inside scope
                for (let i = 0; i < targetCount; i++) {
                    particles.push(new Particle());
                }
            }
        }

        class Particle {
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.vx = (Math.random() - 0.5) * 0.5; // Slow movement
                this.vy = (Math.random() - 0.5) * 0.5;
                this.size = Math.random() * 1.5;
                this.color = 'rgba(255, 255, 255, 0.6)'; // Brighter white
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;

                // Wall bounce
                if (this.x < 0 || this.x > width) this.vx *= -1;
                if (this.y < 0 || this.y > height) this.vy *= -1;

                // Mouse Interaction (Subtle avoidance/attraction)
                if (mouse.x != null) {
                    let dx = mouse.x - this.x;
                    let dy = mouse.y - this.y;
                    let distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < mouseDistance) {
                        const forceDirectionX = dx / distance;
                        const forceDirectionY = dy / distance;
                        const force = (mouseDistance - distance) / mouseDistance;
                        const directionX = forceDirectionX * force * 1.5; // Push strength
                        const directionY = forceDirectionY * force * 1.5;

                        this.x -= directionX; // Move away from mouse
                        this.y -= directionY;
                    }
                }
            }

            draw() {
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        function createParticles() {
            particles = [];
            for (let i = 0; i < particleCount; i++) {
                particles.push(new Particle());
            }
        }

        function animate() {
            ctx.clearRect(0, 0, width, height);

            particles.forEach(p => {
                p.update();
                p.draw();
            });

            // Draw connections
            connectParticles();
            requestAnimationFrame(animate);
        }

        function connectParticles() {
            for (let a = 0; a < particles.length; a++) {
                for (let b = a; b < particles.length; b++) {
                    let dx = particles[a].x - particles[b].x;
                    let dy = particles[a].y - particles[b].y;
                    let distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < connectionDistance) {
                        // Opacity based on distance
                        let opacity = 1 - (distance / connectionDistance);
                        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.15})`; // Very subtle lines
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(particles[a].x, particles[a].y);
                        ctx.lineTo(particles[b].x, particles[b].y);
                        ctx.stroke();
                    }
                }
            }
        }

        initCanvas();
        animate();
    }

    // --- 4. Sticky Terminal Top Bar — Typewriter on Scroll ---
    const terminalBar = document.getElementById('stickyTerminalBar');
    const terminalText = document.getElementById('terminalText');

    if (terminalBar && terminalText) {
        const message = 'Is this your vibe? Contact me here';
        let isTyping = false;
        let isDeleting = false;
        let charIndex = 0;
        let typeTimer = null;

        const typeWriter = () => {
            if (charIndex < message.length && !isDeleting) {
                terminalText.textContent = message.substring(0, charIndex + 1);
                charIndex++;
                typeTimer = setTimeout(typeWriter, 45 + Math.random() * 30);
            } else {
                isTyping = false;
                // Stop cursor blink after a short delay
                const cursor = terminalBar.querySelector('.terminal-cursor');
                if (cursor) {
                    setTimeout(() => { cursor.style.animationPlayState = 'paused'; cursor.style.opacity = '0'; }, 2000);
                }
            }
        };

        const deleteWriter = () => {
            // Re-enable cursor blink while deleting
            const cursor = terminalBar.querySelector('.terminal-cursor');
            if (cursor) { cursor.style.animationPlayState = 'running'; cursor.style.opacity = ''; }
            if (charIndex > 0 && isDeleting) {
                charIndex--;
                terminalText.textContent = message.substring(0, charIndex);
                typeTimer = setTimeout(deleteWriter, 20 + Math.random() * 15);
            } else {
                isDeleting = false;
                terminalBar.classList.remove('visible');
            }
        };

        // Show bar on scroll, type text; reverse on scroll back to top
        window.addEventListener('scroll', () => {
            if (window.scrollY > 80) {
                if (!isTyping && !isDeleting && charIndex === 0) {
                    isTyping = true;
                    terminalBar.classList.add('visible');
                    clearTimeout(typeTimer);
                    setTimeout(typeWriter, 400);
                } else if (isDeleting) {
                    // User scrolled back down mid-delete — stop deleting and resume typing
                    isDeleting = false;
                    clearTimeout(typeTimer);
                    isTyping = true;
                    typeWriter();
                } else if (!terminalBar.classList.contains('visible')) {
                    terminalBar.classList.add('visible');
                }
            } else {
                if ((isTyping || charIndex > 0) && !isDeleting) {
                    isTyping = false;
                    isDeleting = true;
                    clearTimeout(typeTimer);
                    deleteWriter();
                }
            }
        });

        // Click scrolls to footer
        terminalBar.addEventListener('click', () => {
            const footer = document.querySelector('footer');
            if (footer) {
                footer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

    // --- 5. Footer Email Copy ---
    const emailBtn = document.getElementById('emailBtn');
    if (emailBtn) {
        emailBtn.addEventListener('click', () => {
            // Obfuscated parts to separate it from simple scrapers
            const user = 'rasmus.sjoborg';
            const domain = 'gmail.com';
            const email = `${user}@${domain}`;

            navigator.clipboard.writeText(email).then(() => {
                const btnText = emailBtn.querySelector('.btn-text');
                btnText.textContent = '[ COPIED! ]';
                emailBtn.classList.add('copied');

                setTimeout(() => {
                    btnText.textContent = '[ COPY_EMAIL ]';
                    emailBtn.classList.remove('copied');
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy: ', err);
                // Fallback for older browsers if needed
                window.location.href = `mailto:${email}`;
            });
        });
    }

    // --- 5b. Metrics Count-Up Animation ---
    const statNumbers = document.querySelectorAll('.stat-number[data-count]');
    if (statNumbers.length) {
        const countUp = (el) => {
            const target = parseInt(el.dataset.count);
            const suffix = el.dataset.suffix || '';
            const duration = 1200;
            const start = performance.now();

            const animate = (now) => {
                const elapsed = now - start;
                const progress = Math.min(elapsed / duration, 1);
                // Ease out cubic
                const eased = 1 - Math.pow(1 - progress, 3);
                const current = Math.round(eased * target);
                el.textContent = current + suffix;
                if (progress < 1) requestAnimationFrame(animate);
            };
            requestAnimationFrame(animate);
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    countUp(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        statNumbers.forEach(el => observer.observe(el));
    }

    // --- 6. Client Project Picker ---
    const pickerBtns = document.querySelectorAll('.nav-item');
    const mediaShells = document.querySelectorAll('.media-shell');

    // --- 6.5. Project Picker Click Handlers ---
    if (pickerBtns.length > 0 && mediaShells.length > 0) {
        pickerBtns.forEach((btn, btnIndex) => {
            btn.addEventListener('click', () => {
                const targetId = btn.getAttribute('data-target');

                // 1. Update Buttons
                pickerBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // 2. Update Media Shells
                mediaShells.forEach(shell => {
                    if (shell.getAttribute('data-id') === targetId) {
                        shell.classList.add('active');
                    } else {
                        shell.classList.remove('active');
                    }
                });
            });
        });
    }

    // --- 7. Project Picker Horizontal Scroll ---
    // (Arrows removed, flex layout now handles full width)

    // --- 8. Hero Audio Player ---
    const audioBtn = document.getElementById('heroAudioBtn');
    const audio = document.getElementById('heroAudio');

    if (audioBtn && audio) {
        const playIcon = audioBtn.querySelector('.audio-icon-play');
        const pauseIcon = audioBtn.querySelector('.audio-icon-pause');
        const audioText = audioBtn.querySelector('.audio-text');
        const originalText = "Listen to the brief (3 min)";

        audioBtn.addEventListener('click', () => {
            // Ensure volume is up
            audio.volume = 1.0;

            if (audio.paused) {
                // Play
                audio.play().then(() => {
                    audioBtn.classList.add('playing');
                    playIcon.style.display = 'none';
                    pauseIcon.style.display = 'block';
                    // Text stays the same
                    audioBtn.setAttribute('aria-label', 'Pause Intro');
                }).catch(err => {
                    console.error("Audio playback failed:", err);
                    audioText.textContent = "Audio not active";
                    setTimeout(() => {
                        audioText.textContent = originalText;
                    }, 2000);
                });
            } else {
                // Pause
                audio.pause();
                audioBtn.classList.remove('playing');
                playIcon.style.display = 'block';
                pauseIcon.style.display = 'none';
                // Text stays the same
                audioBtn.setAttribute('aria-label', 'Play Intro');
            }
        });

        // Reset when audio ends
        // Reset when audio ends
        audio.addEventListener('ended', () => {
            audioBtn.classList.remove('playing');
            playIcon.style.display = 'block';
            pauseIcon.style.display = 'none';
            // Text stays the same
            audioBtn.setAttribute('aria-label', 'Play Intro');
        });

        // Progress Bar Sync
        const progressBar = document.getElementById('audioProgressBar');
        if (progressBar) {
            audio.addEventListener('timeupdate', () => {
                if (audio.duration) {
                    const progress = (audio.currentTime / audio.duration) * 100;
                    progressBar.style.width = `${progress}%`;
                }
            });
        }
    }
    // --- 9. Visuals Carousel — Infinite Loop ---
    const visualsCarousel = document.getElementById('visualsCarousel');
    const visualsPrev = document.getElementById('visualsPrev');
    const visualsNext = document.getElementById('visualsNext');

    if (visualsCarousel) {
        // Clone all cards and append for seamless looping
        const originalCards = Array.from(visualsCarousel.querySelectorAll('.visual-card'));
        const totalOriginals = originalCards.length;

        // Clone cards and append
        originalCards.forEach(card => {
            const clone = card.cloneNode(true);
            clone.setAttribute('aria-hidden', 'true');
            visualsCarousel.appendChild(clone);
        });

        const getCardStep = () => {
            const card = visualsCarousel.querySelector('.visual-card');
            if (!card) return 364;
            const style = getComputedStyle(visualsCarousel);
            const gap = parseFloat(style.gap) || 24;
            return card.offsetWidth + gap;
        };

        // Get the total width of the original set
        const getOriginalWidth = () => getCardStep() * totalOriginals;

        // Start scrolled to the beginning (no offset needed since clones are at the end)
        let isResetting = false;

        // Listen for scroll to detect when we need to loop
        visualsCarousel.addEventListener('scroll', () => {
            if (isResetting) return;
            const originalWidth = getOriginalWidth();
            const maxScroll = visualsCarousel.scrollWidth - visualsCarousel.clientWidth;

            // If scrolled past the original cards into clone territory
            if (visualsCarousel.scrollLeft >= originalWidth) {
                isResetting = true;
                visualsCarousel.style.scrollBehavior = 'auto';
                visualsCarousel.scrollLeft = visualsCarousel.scrollLeft - originalWidth;
                // Force reflow before re-enabling smooth
                void visualsCarousel.offsetHeight;
                visualsCarousel.style.scrollBehavior = 'smooth';
                isResetting = false;
            }
            // If scrolled before start (for backward looping)
            if (visualsCarousel.scrollLeft <= 0) {
                isResetting = true;
                visualsCarousel.style.scrollBehavior = 'auto';
                visualsCarousel.scrollLeft = visualsCarousel.scrollLeft + originalWidth;
                void visualsCarousel.offsetHeight;
                visualsCarousel.style.scrollBehavior = 'smooth';
                isResetting = false;
            }
        });

        // Arrow navigation — just scroll by one card, looping handled by scroll listener
        if (visualsNext) {
            visualsNext.addEventListener('click', () => {
                visualsCarousel.scrollBy({ left: getCardStep(), behavior: 'smooth' });
            });
        }

        if (visualsPrev) {
            visualsPrev.addEventListener('click', () => {
                visualsCarousel.scrollBy({ left: -getCardStep(), behavior: 'smooth' });
            });
        }

        // Drag to scroll
        let isDragging = false;
        let startX;
        let scrollLeft;

        visualsCarousel.addEventListener('mousedown', (e) => {
            isDragging = true;
            visualsCarousel.style.cursor = 'grabbing';
            visualsCarousel.style.scrollBehavior = 'auto';
            startX = e.pageX - visualsCarousel.offsetLeft;
            scrollLeft = visualsCarousel.scrollLeft;
        });

        visualsCarousel.addEventListener('mouseleave', () => {
            isDragging = false;
            visualsCarousel.style.cursor = 'grab';
            visualsCarousel.style.scrollBehavior = 'smooth';
        });

        visualsCarousel.addEventListener('mouseup', () => {
            isDragging = false;
            visualsCarousel.style.cursor = 'grab';
            visualsCarousel.style.scrollBehavior = 'smooth';
        });

        visualsCarousel.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            const x = e.pageX - visualsCarousel.offsetLeft;
            const walk = (x - startX) * 1.5;
            visualsCarousel.scrollLeft = scrollLeft - walk;
        });
    }
});
