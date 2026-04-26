// --- Three.js Background (Interactive Cloth/Mesh Simulation Boilerplate) ---
const initThreeJS = () => {
    const container = document.getElementById('webgl-container');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // Add a stylized red/black grid or cloth mesh here
    const geometry = new THREE.PlaneGeometry(20, 20, 32, 32);
    const material = new THREE.MeshBasicMaterial({ 
        color: 0xff0033, 
        wireframe: true,
        transparent: true,
        opacity: 0.15
    });
    const plane = new THREE.Mesh(geometry, material);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -5;
    scene.add(plane);

    camera.position.z = 10;

    // Minor click animation logic
    window.addEventListener('click', (e) => {
        // Trigger a ripple or wave in your mesh vertices here
        plane.rotation.z += 0.1; 
    });

    const animate = function () {
        requestAnimationFrame(animate);
        plane.rotation.z += 0.001; // Slow ambient rotation
        renderer.render(scene, camera);
    };
    animate();
};

// --- Fetch & Render News ---
const fetchNews = async () => {
    const container = document.getElementById('news-container');
    try {
        const response = await fetch('/api/posts');
        const posts = await response.json();
        
        container.innerHTML = posts.map(post => `
            <article class="liquid-glass rounded-xl p-6 mb-8 transform transition hover:scale-[1.01]">
                ${post.image_data ? `<img src="${post.image_data}" class="w-full h-64 object-cover rounded-lg mb-4 border border-white/10" alt="News Image">` : ''}
                <h2 class="text-3xl font-bold mb-2 text-white drop-shadow-md">${post.title}</h2>
                <p class="text-gray-300 leading-relaxed">${post.content}</p>
                <div class="mt-4 text-xs text-red-500 font-bold uppercase tracking-widest">${new Date(post.created_at).toLocaleDateString()}</div>
            </article>
        `).join('');
    } catch (error) {
        container.innerHTML = `<p class="text-red-500">Failed to load TREY NEWS.</p>`;
    }
};

initThreeJS();
fetchNews();
