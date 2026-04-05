import { initializeUI, loadData, setCurrentUser, showError } from './ui.js';

window.addEventListener('DOMContentLoaded', async () => {
    initializeUI();

    try {
        await initializeLIFF();
    } catch (error) {
        showError('LIFF 初始化失敗：' + error.message);
    }
});

async function initializeLIFF() {
    await liff.init({ liffId: '2009634981-dMcUA7cL' });

    if (!liff.isInClient()) {
        throw new Error('請在 LINE App 內開啟此頁面');
    }

    if (!liff.isLoggedIn()) {
        liff.login();
        return;
    }

    const profile = await liff.getProfile();
    setCurrentUser({
        userId: profile.userId,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl
    });

    await loadData();
}
