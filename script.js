const space = document.getElementById('space');
let currentWishId = null; 

// --- 1. ฟังก์ชันสร้างดาว ---
function createStar(name, text, color, size, isPublic, wishId) {
    const space = document.getElementById('space');
    if (!space) return;

    const star = document.createElement('div');
    star.className = 'star';
    star.innerHTML = '✦'; 
    star.style.color = color;

    // ตั้งค่าขนาด
    if (size === 'random' || size === '') {
        const randomSize = Math.floor(Math.random() * (48 - 16 + 1)) + 16;
        star.style.fontSize = randomSize + 'px';
    } else {
        star.style.fontSize = size;
    }

    star.style.left = (Math.random() * 90 + 5) + 'vw';
    const duration = Math.random() * 10 + 15;
    star.style.animationDuration = duration + 's';

    // การคลิกดาว
    if (isPublic === 'public') {
    star.style.cursor = 'pointer';
    star.onclick = (e) => {
        e.stopPropagation(); // กันไม่ให้เหตุการณ์คลิกไหลไปโดนอย่างอื่น
        console.log("จิ้มโดนดาวไอดี:", wishId);
        openModal(name, text, wishId); 
    };
}
    space.appendChild(star);
    
    setTimeout(() => {
        star.classList.add('fade-out');
    }, (duration - 1.5) * 1000); 

    setTimeout(() => {
        if (star.parentNode) star.remove();
    }, duration * 1000);
}

// --- 2. ฟังก์ชันส่งคำอธิษฐานไป Firebase ---
function sendWish() {
    const nameInput = document.getElementById('userName');
    const textInput = document.getElementById('wishText');
    const colorInput = document.getElementById('starColor');
    const sizeInput = document.getElementById('starSize');
    const privacyInput = document.querySelector('input[name="privacy"]:checked');

    const text = textInput.value.trim();
    if (!text) {
        alert("กรุณาใส่คำอธิษฐานก่อนนะ ✨");
        return;
    }

    const name = nameInput.value.trim() || "ผู้ไม่ประสงค์ออกนาม";
    const color = colorInput.value;
    const selectedSize = sizeInput.value;
    const privacy = privacyInput ? privacyInput.value : "public";

    database.ref('wishes').push({
        name: name,
        text: text,
        color: color,
        size: selectedSize,
        privacy: privacy,
        timestamp: Date.now()
    }).then(() => {
        textInput.value = ""; 
        if(typeof playSound === 'function') playSound('sfx-launch');
    }).catch((err) => {
        console.error('Failed to send wish:', err);
    });
}

// --- 3. ฟังก์ชันเปิด Modal และดึงคอมเมนต์ ---
function openModal(name, text, wishId) {
    if (!wishId) return;

    // ✅ แก้ไขจุดนี้: ถ้ามี id เดิมอยู่จริงค่อยสั่งปิด (เพื่อไม่ให้ส่งค่าว่างไป Firebase)
    if (currentWishId) {
        database.ref(`wishes/${currentWishId}/supports`).off();
    }

    currentWishId = wishId;
    const modal = document.getElementById('wishModal');
    const supportList = document.getElementById('supportList');

    if (!modal || !supportList) return;

    modal.style.display = "block";
    document.getElementById('modalName').innerText = "จาก: " + name;
    document.getElementById('modalText').innerText = text;

    supportList.innerHTML = '<p style="font-size:12px; color:#555;">กำลังดึงข้อความ...</p>';

    // ดึงคอมเมนต์ของดาวดวงปัจจุบัน
    database.ref(`wishes/${wishId}/supports`).on('value', (snapshot) => {
        supportList.innerHTML = "";
        if (!snapshot.exists()) {
            supportList.innerHTML = '<p style="font-size:12px; color:#555;">ยังไม่มีข้อความส่งต่อ... เป็นคนแรกที่ให้กำลังใจดูไหม?</p>';
            return;
        }

        snapshot.forEach((childSnapshot) => {
            const data = childSnapshot.val();
            const div = document.createElement('div');
            div.style = "background: rgba(255,255,255,0.07); padding: 10px; margin-bottom: 8px; border-radius: 12px; font-size: 13px; border-left: 3px solid #f1c40f; text-align: left;";
            div.innerHTML = `<span style="color:#f1c40f; font-size:11px; display:block; margin-bottom:3px;">เพื่อนรักแห่งดวงดาว :</span> ${data.message}`;
            supportList.appendChild(div);
        });
        supportList.scrollTop = supportList.scrollHeight;
    });
}

// --- 4. ฟังก์ชันส่งคอมเมนต์ ---
function sendSupport() {
    const input = document.getElementById('supportInput');
    const message = input.value.trim();
    if (!message || !currentWishId) return;

    database.ref(`wishes/${currentWishId}/supports`).push({
        message: message,
        timestamp: Date.now()
    }).then(() => {
        input.value = ""; // ล้างช่อง
    });
}
// --- 5. ฟังก์ชันกดหัวใจ ---
function giveHeart() {
    if (!currentWishId) return;
    database.ref(`wishes/${currentWishId}/hearts`).transaction((currentHearts) => {
        return (currentHearts || 0) + 1;
    });
    if (typeof playSound === 'function') playSound('sfx-heart');
}

// --- 6. ระบบดาวอัตโนมัติเมื่อโหลดหน้าเว็บ ---
// --- 6. ระบบดาวอัตโนมัติเมื่อโหลดหน้าเว็บ ---
window.onload = function() {
    const systemWishes = [
        ["ระบบ", "ขอให้เป็นวันที่สดใส", "#ffffff", "random", "public"],
        ["ระบบ", "ขอให้ทุกอย่างเป็นไปตามที่ต้องการ", "#ffffff", "random", "public"],
        ["ระบบ", "แค่นี้ก็เก่งมากแล้วนะ", "#ffffff", "random", "public"],
        ["ระบบ", "เราเชื่อในตัวแกนะ", "#ffffff", "random", "public"]
    ];

    systemWishes.forEach((wish, i) => {
        setTimeout(() => {
            createStar(wish[0], wish[1], wish[2], wish[3], wish[4], "system-star");
        }, i * 2500); 
    });

    setInterval(() => {
        const randomIndex = Math.floor(Math.random() * systemWishes.length);
        const wish = systemWishes[randomIndex];
        createStar(wish[0], wish[1], wish[2], "random", "public", "system-star");
    }, 6000); 
}; // <--- ตรวจสอบว่ามี }; ตรงนี้เพื่อปิด window.onload หรือยัง

// --- 7. ระบบเสียงและเพลง ---
function toggleMusic() {
    const music = document.getElementById('bg-music');
    const btn = document.getElementById('music-toggle');
    if (music.paused) {
        music.play();
        music.volume = 0.1;
        btn.innerText = "🔊 ปิดเพลง";
    } else {
        music.pause();
        btn.innerText = "🔈 เปิดเพลง";
    }
}

function enableAutoplay() {
    const music = document.getElementById('bg-music');
    if(!music) return;
    music.volume = 0.1; 
    music.play().then(() => {
        const btn = document.getElementById('music-toggle');
        if (btn) btn.innerHTML = "🔊 ปิดเพลง";
    }).catch(e => console.log("Autoplay blocked"));
}

document.addEventListener('click', enableAutoplay, { once: true });

// --- 8. ดึงดาวจาก Firebase (Online) ---
database.ref('wishes').on('child_added', (snapshot) => {
    const data = snapshot.val();
    const wishId = snapshot.key; 
    if (data.privacy === 'public') {
        createStar(data.name, data.text, data.color, data.size, 'public', wishId);
    }
});
// ฟังก์ชันสำหรับปิดหน้าต่าง (Modal)
// ฟังก์ชันปิดเมื่อกดปุ่ม X
function closeModal() {
    const modal = document.getElementById('wishModal');
    if (modal) {
        modal.style.display = "none";
        // ปิดการดึงข้อมูล Real-time เพื่อประหยัดทรัพยากร
        if (currentWishId) {
            database.ref(`wishes/${currentWishId}/supports`).off();
        }
        currentWishId = null;
    }
}

// ฟังก์ชันปิดเมื่อกดพื้นที่ว่างข้างนอก Modal
function closeModalOutside(event) {
    const modal = document.getElementById('wishModal');
    // ถ้าจุดที่คลิกคือตัวพื้นหลัง Modal (ไม่ใช่กล่องเนื้อหาข้างใน) ให้ปิด
    if (event.target === modal) {
        closeModal();
    }
}