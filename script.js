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

        if (nextBtn) nextBtn.addEventListener('click', nextSlide);
        if (prevBtn) prevBtn.addEventListener('click', prevSlide);

        // Update height on window resize
        window.addEventListener('resize', () => {
            updateCarouselHeight(currentSlide);
        });

        // Initial height set with a small delay to ensure layout is stable
        setTimeout(() => updateCarouselHeight(currentSlide), 100);
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

    // --- 4. Sticky Contact Button ---
    const stickyBtn = document.getElementById('stickyContactBtn');


    if (stickyBtn) {
        // Show/hide on scroll
        window.addEventListener('scroll', () => {
            // If user has scrolled down
            if (window.scrollY > 0) {
                // Show button immediately
                stickyBtn.classList.add('visible');
            } else {
                // Hide button immediately when back at top
                stickyBtn.classList.remove('visible');
            }
        });

        // Scroll to footer on click
        stickyBtn.addEventListener('click', () => {
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
                btnText.textContent = 'Copied!';
                emailBtn.classList.add('copied');

                setTimeout(() => {
                    btnText.textContent = 'Copy Email';
                    emailBtn.classList.remove('copied');
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy: ', err);
                // Fallback for older browsers if needed
                window.location.href = `mailto:${email}`;
            });
        });
    }

    // --- 6. Client Project Picker ---
    const pickerBtns = document.querySelectorAll('.nav-item');
    const mediaShells = document.querySelectorAll('.media-shell');

    if (pickerBtns.length > 0 && mediaShells.length > 0) {
        pickerBtns.forEach(btn => {
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
    const pickerNav = document.querySelector('.picker-nav');
    const pickerPrev = document.querySelector('.picker-arrow-prev');
    const pickerNext = document.querySelector('.picker-arrow-next');

    if (pickerNav && pickerPrev && pickerNext) {
        // Scroll amount (approx width of item + gap)
        const scrollAmount = 200;

        pickerPrev.addEventListener('click', () => {
            pickerNav.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        });

        pickerNext.addEventListener('click', () => {
            pickerNav.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        });

        // Hide/Disable buttons at ends
        const updateButtons = () => {
            const tolerance = 5; // buffer
            const atStart = pickerNav.scrollLeft <= tolerance;
            // Use scrollWidth - clientWidth to check if we are at the end
            const atEnd = Math.abs(pickerNav.scrollWidth - pickerNav.clientWidth - pickerNav.scrollLeft) <= tolerance;

            pickerPrev.style.opacity = atStart ? '0.3' : '1';
            pickerPrev.style.pointerEvents = atStart ? 'none' : 'auto';
            pickerPrev.style.cursor = atStart ? 'default' : 'pointer';

            pickerNext.style.opacity = atEnd ? '0.3' : '1';
            pickerNext.style.pointerEvents = atEnd ? 'none' : 'auto';
            pickerNext.style.cursor = atEnd ? 'default' : 'pointer';
        };

        pickerNav.addEventListener('scroll', updateButtons);
        window.addEventListener('resize', updateButtons);

        // Initial check
        setTimeout(updateButtons, 100);
    }

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
});
