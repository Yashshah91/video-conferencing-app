const APP_ID = "3c836ab18f4549d8b92b64dd7f8a86ba";
const TOKEN = "007eJxTYDjf2PlHzIbh/iFe27cXW6oLXHhsz00of1pxbOV7hu3J754qMBgnWxibJSYZWqSZmJpYplgkWRolmZmkpJinWSRamCUlTvn2Ir0hkJFhnvQ7ZkYGCATxWRhyEzPzGBgA7SoiYQ==";
const CHANNEL = "main";

// User Database (using localStorage)
const USER_DB_KEY = "ivyStreamsUsers";
const DEFAULT_USER = {
    username: "admin",
    password: "yash"  // Default password
};

// Initialize user database if it doesn't exist
if (!localStorage.getItem(USER_DB_KEY)) {
    const users = {};
    users[DEFAULT_USER.username] = { password: DEFAULT_USER.password };
    localStorage.setItem(USER_DB_KEY, JSON.stringify(users));
}

// Get user database
function getUsers() {
    return JSON.parse(localStorage.getItem(USER_DB_KEY));
}

// Check user credentials
function authenticateUser(username, password) {
    const users = getUsers();
    return users[username] && users[username].password === password;
}

// Login functionality
document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorElement = document.getElementById('login-error');
    
    if (authenticateUser(username, password)) {
        document.getElementById('login-overlay').style.display = 'none';
        document.getElementById('main-content').style.display = 'block';
        document.getElementById('current-user').textContent = username;
        errorElement.textContent = '';
    } else {
        errorElement.textContent = 'Incorrect username or password';
        document.getElementById('password').value = '';
    }
});

// Logout functionality
document.getElementById('logout-btn').addEventListener('click', function() {
    // Leave stream if joined
    if (localTracks.length > 0) {
        leaveAndRemoveLocalStream();
    }
    
    document.getElementById('main-content').style.display = 'none';
    document.getElementById('login-overlay').style.display = 'flex';
    document.getElementById('login-form').reset();
});

// Original Agora functionality
const client = AgoraRTC.createClient({mode:'rtc', codec:'vp8'});

let localTracks = [];
let remoteUsers = {};

let joinAndDisplayLocalStream = async () => {
    client.on('user-published', handleUserJoined);
    client.on('user-left', handleUserLeft);
    
    let UID = await client.join(APP_ID, CHANNEL, TOKEN, null);

    localTracks = await AgoraRTC.createMicrophoneAndCameraTracks();

    let player = `<div class="video-container" id="user-container-${UID}">
                    <div class="video-player" id="user-${UID}"></div>
                 </div>`;
    document.getElementById('video-streams').insertAdjacentHTML('beforeend', player);

    localTracks[1].play(`user-${UID}`);
    await client.publish([localTracks[0], localTracks[1]]);
};

let joinStream = async () => {
    await joinAndDisplayLocalStream();
    document.getElementById('join-btn').style.display = 'none';
    document.getElementById('stream-controls').style.display = 'flex';
};

let handleUserJoined = async (user, mediaType) => {
    remoteUsers[user.uid] = user;
    await client.subscribe(user, mediaType);

    if (mediaType === 'video'){
        let player = document.getElementById(`user-container-${user.uid}`);
        if (player != null){
            player.remove();
        }

        player = `<div class="video-container" id="user-container-${user.uid}">
                    <div class="video-player" id="user-${user.uid}"></div> 
                 </div>`;
        document.getElementById('video-streams').insertAdjacentHTML('beforeend', player);
        user.videoTrack.play(`user-${user.uid}`);
    }

    if (mediaType === 'audio'){
        user.audioTrack.play();
    }
};

let handleUserLeft = async (user) => {
    delete remoteUsers[user.uid];
    document.getElementById(`user-container-${user.uid}`).remove();
};

let leaveAndRemoveLocalStream = async () => {
    for(let i = 0; localTracks.length > i; i++){
        localTracks[i].stop();
        localTracks[i].close();
    }

    await client.leave();
    document.getElementById('join-btn').style.display = 'block';
    document.getElementById('stream-controls').style.display = 'none';
    document.getElementById('video-streams').innerHTML = '';
};

let toggleMic = async (e) => {
    if (localTracks[0].muted){
        await localTracks[0].setMuted(false);
        e.target.innerText = 'Mic on';
        e.target.style.backgroundColor = 'cadetblue';
    }else{
        await localTracks[0].setMuted(true);
        e.target.innerText = 'Mic off';
        e.target.style.backgroundColor = '#EE4B2B';
    }
};

let toggleCamera = async (e) => {
    if(localTracks[1].muted){
        await localTracks[1].setMuted(false);
        e.target.innerText = 'Camera on';
        e.target.style.backgroundColor = 'cadetblue';
    }else{
        await localTracks[1].setMuted(true);
        e.target.innerText = 'Camera off';
        e.target.style.backgroundColor = '#EE4B2B';
    }
};

// Event listeners
document.getElementById('join-btn').addEventListener('click', joinStream);
document.getElementById('leave-btn').addEventListener('click', leaveAndRemoveLocalStream);
document.getElementById('mic-btn').addEventListener('click', toggleMic);
document.getElementById('camera-btn').addEventListener('click', toggleCamera);
