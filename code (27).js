// --- START OF FIREBASE CONFIG ---
const firebaseConfig = {
    apiKey: "AIzaSyD6Z59uYvOooPiVcy08Bx5W7JEbGXlwHuE", // Aapka API Key
    authDomain: "ram-6691a.firebaseapp.com",
    databaseURL: "https://ram-6691a-default-rtdb.firebaseio.com",
    projectId: "ram-6691a",
    storageBucket: "ram-6691a.firebasestorage.app",
    messagingSenderId: "851543581094",
    appId: "1:851543581094:web:973ff4b93c94b2fab76f67",
    measurementId: "G-2VMTZ0EQ86"
};

// Initialize Firebase (check if already initialized)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
} else {
    firebase.app(); // if already initialized, use that one
}
const db = firebase.database();
// --- END OF FIREBASE CONFIG ---

// --- START OF MAIN SCRIPT.JS LOGIC ---
document.addEventListener('DOMContentLoaded', () => {
    const MOCK_USER_ID = "testUser123";
    let currentUserProfile = null;
    let taskTimerIntervalId = null;
    let promoTaskTimerIntervalId = null;
    let selectedPlanForActivationModal = null;

    const usersRef = db.ref('users');
    const premiumCodesRef = db.ref('premium_codes');
    let currentUserRef = usersRef.child(MOCK_USER_ID);
    const adminTaskReviewsRef = db.ref('adminTaskReviews');

    // DOM Elements
    const loadingOverlay = document.getElementById('loading-overlay');
    const menuToggleBtn = document.getElementById('menu-toggle-btn');
    const dashboardMenu = document.getElementById('dashboard-menu');
    const profilePicDisplay = document.getElementById('profile-pic-display');
    const profilePicUpload = document.getElementById('profile-pic-upload');
    const userGreeting = document.getElementById('user-greeting');
    const allMenuItems = document.querySelectorAll('.dashboard-menu .menu-item');
    const dashboardProfilePic = document.getElementById('dashboard-profile-pic');
    const dashboardUserName = document.getElementById('dashboard-user-name');
    const dashboardUserPlan = document.getElementById('dashboard-user-plan');
    const balanceAmountDisplay = document.getElementById('balance-amount');
    const currentPlanDisplay = document.getElementById('current-plan-display');
    const homeReferralCodeDisplay = document.getElementById('home-referral-code');
    const homeMessage = document.getElementById('home-message');
    const activatePlanBtnHome = document.getElementById('activate-plan-btn-home');
    const premiumPlanMenuItem = document.getElementById('premium-plan-menu-item');
    const planActionButtons = document.querySelectorAll('.plan-action-btn'); 
    const codeInputAlertModal = document.getElementById('code-input-alert-modal');
    const alertModalTitle = document.getElementById('alert-modal-title');
    const alertModalPlanDetails = document.getElementById('alert-modal-plan-details');
    const alertModalCodeInput = document.getElementById('alert-modal-code-input');
    const alertModalFeedback = document.getElementById('alert-modal-feedback');
    const alertModalSubmitBtn = document.getElementById('alert-modal-submit-btn');
    const alertModalCancelBtn = document.getElementById('alert-modal-cancel-btn');
    const userPlanTaskDisplay = document.getElementById('user-plan-task');
    const taskRewardAmountDisplay = document.getElementById('task-reward-amount');
    const taskTimerDisplay = document.getElementById('task-timer-display');
    const claimRewardBtn = document.getElementById('claim-reward-btn');
    const taskMessage = document.getElementById('task-message');
    const taskReceiverInfo = document.getElementById('task-receiver-info'); 
    const referralCodeText = document.getElementById('referral-code-text');
    const copyReferralCodeBtn = document.getElementById('copy-referral-code-btn');
    const referralBonusAmount = document.getElementById('referral-bonus-amount');
    const totalReferredUsersDisplay = document.getElementById('total-referred-users');
    const totalReferralEarningsDisplay = document.getElementById('total-referral-earnings');
    const earningDetailsView = document.getElementById('earning-details-view');
    const withdrawableBalanceDisplay = document.getElementById('withdrawable-balance');
    const withdrawalForm = document.getElementById('withdrawal-form'); 
    const withdrawalMethodSelect = document.getElementById('withdrawal-method');
    const upiDetailsDiv = document.getElementById('upi-details');
    const bankDetailsDiv = document.getElementById('bank-details');
    const withdrawalMessage = document.getElementById('withdrawal-message');
    const transactionHistoryTableBody = document.getElementById('transaction-history-table').querySelector('tbody');
    const transactionTypeFilter = document.getElementById('transaction-type-filter');
    const taskSubmitContentArea = document.getElementById('task-submit-content-area');
    const taskInstructionsText = document.getElementById('task-instructions-text');
    const translateTaskBtn = document.getElementById('translate-task-btn');
    const urlSubmissionGroup = document.getElementById('url-submission-group');
    const promoUrlInput = document.getElementById('promo-url-input');
    const submitPromoUrlBtn = document.getElementById('submit-promo-url-btn');
    const submissionStatusGroup = document.getElementById('submission-status-group');
    const submissionStatusMessage = document.getElementById('submission-status-message');
    const prizeWonMessage = document.getElementById('prize-won-message');
    const receivePromoPrizeBtn = document.getElementById('receive-promo-prize-btn');
    const nextSubmissionTimerDisplay = document.getElementById('next-submission-timer-display');
    const taskSubmitFeedback = document.getElementById('task-submit-feedback');
    const quickActionButtons = document.querySelectorAll('.quick-action-btn');
    const logoutBtn = document.getElementById('logout-btn');

    // Helper Functions
    const showLoading = (show = true) => { loadingOverlay.style.visibility = show ? 'visible' : 'hidden'; loadingOverlay.style.opacity = show ? '1' : '0';};
    const showInlineFeedback = (element, message, type = 'info', duration = 7000) => { if (!element) return; element.textContent = message; element.className = `feedback-message-inline ${type}`; element.style.display = 'block'; setTimeout(() => { if (element) { element.style.display = 'none'; element.textContent = ''; } }, duration);};
    const formatCurrency = (amount) => `₹${Number(amount || 0).toFixed(2)}`;
    const formatDate = (timestamp) => timestamp ? new Date(timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : 'N/A';

    // Initialization
    async function initializeApp() {
        showLoading(true);
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active-view'));
        document.getElementById('premium-plan-view').classList.add('active-view'); // Default to premium plan until profile loads
        allMenuItems.forEach(mi => mi.classList.remove('active-menu-item'));
        const premiumMenuItem = document.querySelector('.menu-item[data-view="premium-plan"]');
        if(premiumMenuItem) premiumMenuItem.classList.add('active-menu-item');
        
        await loadAndProcessUserProfile();
        setupEventListeners();
        showLoading(false);
    }

    // Firebase User Profile Functions
    async function loadAndProcessUserProfile(isLogout = false) {
        try {
            const snapshot = await currentUserRef.once('value');
            if (snapshot.exists() && !isLogout) {
                currentUserProfile = snapshot.val();
                currentUserProfile.balance = currentUserProfile.balance || 0;
                currentUserProfile.transactionHistory = currentUserProfile.transactionHistory || {};
                currentUserProfile.taskClaimHistory = currentUserProfile.taskClaimHistory || {};
                currentUserProfile.totalReferralEarnings = currentUserProfile.totalReferralEarnings || 0;
                currentUserProfile.totalReferredUsersCount = currentUserProfile.totalReferredUsersCount || 0;
                currentUserProfile.promoTask = currentUserProfile.promoTask || null;
            } else { 
                const defaultProfilePic = `https://ui-avatars.com/api/?name=${MOCK_USER_ID.substring(0,2)}&background=random&color=fff&size=80&font-size=0.5&bold=true`;
                currentUserProfile = {
                    userId: MOCK_USER_ID, email: `${MOCK_USER_ID}@example.com`, profilePicUrl: defaultProfilePic,
                    isPremium: false, planType: null, premiumActivationDate: null, referralCode: null,
                    referredByCode: null, balance: 0, lastTaskClaimTime: null, taskClaimHistory: {},
                    transactionHistory: {}, totalReferralEarnings: 0, totalReferredUsersCount: 0,
                    promoTask: null 
                };
                if (!isLogout) {
                     currentUserProfile.createdAt = firebase.database.ServerValue.TIMESTAMP;
                     await currentUserRef.set(currentUserProfile);
                     const newSnapshot = await currentUserRef.once('value'); currentUserProfile = newSnapshot.val();
                }
            }
            updateUIBasedOnProfile();
        } catch (error) { console.error("Error loading user profile:", error); showInlineFeedback(homeMessage, "Error loading profile.", "error"); showLoading(false); }
    }
    async function updateUserProfile(updates) {
         if (!currentUserRef) return false;
        try {
            await currentUserRef.update(updates);
            currentUserProfile = { ...currentUserProfile, ...updates };
            let needsRefresh = false;
            for (const key in updates) { if (updates[key] === firebase.database.ServerValue.TIMESTAMP) { needsRefresh = true; break; } if (typeof updates[key] === 'object' && updates[key] !== null) { for (const nestedKey in updates[key]) { if(typeof updates[key][nestedKey] === 'object' && updates[key][nestedKey] !== null && updates[key][nestedKey].timestamp === firebase.database.ServerValue.TIMESTAMP){ needsRefresh = true; break; } } } if(needsRefresh) break; }
            if (needsRefresh) { const freshSnapshot = await currentUserRef.once('value'); currentUserProfile = freshSnapshot.val(); }
            updateUIBasedOnProfile(); return true;
        } catch (error) { console.error("Error updating user profile:", error); alert("Error saving data."); return false; }
    }
    
    // UI Update Functions
    function updateUIBasedOnProfile() {
        if (!currentUserProfile) { navigateToView('premium-plan'); lockPremiumFeatures(); return; }
        const displayName = currentUserProfile.email ? currentUserProfile.email.split('@')[0] : 'User';
        const profilePic = currentUserProfile.profilePicUrl || `https://ui-avatars.com/api/?name=${displayName.substring(0,2)}&background=random&color=fff&size=80&font-size=0.5&bold=true`;
        userGreeting.textContent = `Hello, ${displayName}!`;
        profilePicDisplay.src = profilePic.replace('size=80', 'size=42');
        dashboardProfilePic.src = profilePic; dashboardUserName.textContent = displayName;
        const planText = currentUserProfile.isPremium ? currentUserProfile.planType.charAt(0).toUpperCase() + currentUserProfile.planType.slice(1) : 'Basic';
        dashboardUserPlan.textContent = `Plan: ${planText}`;
        dashboardUserPlan.className = `plan-badge ${currentUserProfile.isPremium ? currentUserProfile.planType : 'basic'}`;
        balanceAmountDisplay.textContent = formatCurrency(currentUserProfile.balance);
        currentPlanDisplay.textContent = planText;
        homeReferralCodeDisplay.textContent = currentUserProfile.referralCode || 'N/A';

        if (currentUserProfile.isPremium) {
            premiumPlanMenuItem.style.display = 'none'; 
            if (activatePlanBtnHome) activatePlanBtnHome.style.display = 'none';
            homeMessage.textContent = `You're on the ${planText} plan. Explore and earn!`;
            unlockAllFeatures(); 
            const currentActiveView = document.querySelector('.view.active-view');
            if (!currentActiveView || currentActiveView.id === 'premium-plan-view' || currentActiveView.id === '') {
                navigateToView('home'); 
            }
            setupReferralSystem(); setupTaskReceiver(); setupPromoTaskView();
        } else {
            premiumPlanMenuItem.style.display = 'block'; 
            if (activatePlanBtnHome) activatePlanBtnHome.style.display = 'inline-flex';
            homeMessage.textContent = "Activate your premium plan to unlock all features and start earning.";
            lockPremiumFeatures(); navigateToView('premium-plan');
        }
        withdrawableBalanceDisplay.textContent = formatCurrency(currentUserProfile.balance);
    }
    function unlockAllFeatures() { 
        allMenuItems.forEach(item => {
            item.classList.remove('locked'); 
            if(item.dataset.view === 'home') item.classList.add('active-menu-item'); 
            else item.classList.remove('active-menu-item');
        }); 
    }
    function lockPremiumFeatures() {
        allMenuItems.forEach(item => {
            const viewName = item.dataset.view;
            if (viewName !== 'premium-plan') { item.classList.add('locked'); item.classList.remove('active-menu-item');}
            else {item.classList.remove('locked'); item.classList.add('active-menu-item');} 
        });
        referralCodeText.textContent = 'Activate Premium First'; copyReferralCodeBtn.style.display = 'none';
        if(referralBonusAmount) referralBonusAmount.textContent = 'N/A';
        if(totalReferredUsersDisplay) totalReferredUsersDisplay.textContent = '0';
        if(totalReferralEarningsDisplay) totalReferralEarningsDisplay.textContent = formatCurrency(0);
        const taskReceiverContent = document.getElementById('task-receiver-content');
        if(taskReceiverContent) taskReceiverContent.style.display = 'none';
        if(taskSubmitContentArea) setupPromoTaskView(); // Still call setup for task-submit, it handles non-premium state
    }

    // Event Listeners
    function setupEventListeners() { 
        menuToggleBtn.addEventListener('click', () => { dashboardMenu.classList.toggle('open'); dashboardMenu.setAttribute('aria-hidden', !dashboardMenu.classList.contains('open')); });
        profilePicDisplay.addEventListener('click', () => profilePicUpload.click());
        profilePicUpload.addEventListener('change', handleProfilePicUpload);
        allMenuItems.forEach(item => { 
            item.addEventListener('click', () => {
                if (item.classList.contains('locked')) { alert('This feature is locked. Please activate a premium plan.'); return; }
                navigateToView(item.dataset.view);
                if (window.innerWidth <= 768 && dashboardMenu.classList.contains('open')) { dashboardMenu.classList.remove('open'); dashboardMenu.setAttribute('aria-hidden', 'true'); }
            });
        });
        
        planActionButtons.forEach(button => { 
            button.addEventListener('click', (e) => {
                if (currentUserProfile && currentUserProfile.isPremium) { alert("You already have an active premium plan."); return; }
                selectedPlanForActivationModal = e.target.dataset.plan; const planName = e.target.dataset.planName;
                let planBenefitsMessage = (selectedPlanForActivationModal === "silver") ? "Silver Plan Details:\n- Task Reward: ₹325 every 15 days.\n- Referral Bonus for you: ₹180." : "Gold Plan Details:\n- Task Reward: ₹650 every 15 days.\n- Referral Bonus for you: ₹360.";
                alert(planBenefitsMessage + "\n\nClick OK to proceed to code entry."); 
                alertModalTitle.textContent = `Buy Code for ${planName}`;
                alertModalPlanDetails.textContent = `You are about to activate the ${planName}.`; 
                alertModalCodeInput.value = ''; showInlineFeedback(alertModalFeedback, '', 'info'); 
                alertModalFeedback.style.display = 'none'; codeInputAlertModal.style.display = 'flex';
            });
        });

        alertModalSubmitBtn.addEventListener('click', handleAlertModalCodeSubmission);
        alertModalCancelBtn.addEventListener('click', () => codeInputAlertModal.style.display = 'none');
        codeInputAlertModal.addEventListener('click', (event) => { if (event.target === codeInputAlertModal) codeInputAlertModal.style.display = 'none'; });

        if(logoutBtn) { logoutBtn.addEventListener('click', handleLogout); }
        copyReferralCodeBtn.addEventListener('click', copyReferralLinkToClipboard);
        claimRewardBtn.addEventListener('click', handleClaimReward);
        withdrawalMethodSelect.addEventListener('change', (e) => { upiDetailsDiv.style.display = e.target.value === 'upi' ? 'block' : 'none'; bankDetailsDiv.style.display = e.target.value === 'bank' ? 'block' : 'none'; });
        if (withdrawalForm) { withdrawalForm.addEventListener('submit', handleWithdrawalRequest); }
        transactionTypeFilter.addEventListener('change', renderTransactionHistory);
        if(translateTaskBtn) translateTaskBtn.addEventListener('click', toggleTaskInstructionsLang);
        if(submitPromoUrlBtn) submitPromoUrlBtn.addEventListener('click', handleSubmitPromoUrl);
        if(receivePromoPrizeBtn) receivePromoPrizeBtn.addEventListener('click', handleReceivePromoPrize);
        quickActionButtons.forEach(button => { 
            button.addEventListener('click', (e) => {
                const targetView = e.currentTarget.dataset.targetView;
                if (currentUserProfile && !currentUserProfile.isPremium && targetView !== 'premium-plan') { alert('Please activate your premium plan first.'); navigateToView('premium-plan'); return; }
                if(targetView === 'premium-plan' && currentUserProfile && currentUserProfile.isPremium) { alert("You already have a premium plan!"); return; }
                const targetMenuItem = document.querySelector(`.menu-item[data-view="${targetView}"]`);
                if (targetMenuItem && !targetMenuItem.classList.contains('locked')) { navigateToView(targetView); } 
                else if (targetMenuItem && targetMenuItem.classList.contains('locked')) { alert('This feature is locked. Please activate a premium plan.'); }
            });
        });
    }

    // Logout Handler
    async function handleLogout() { if(confirm("Are you sure you want to logout?")) { currentUserProfile = null; await loadAndProcessUserProfile(true); if (dashboardMenu.classList.contains('open')) { dashboardMenu.classList.remove('open'); dashboardMenu.setAttribute('aria-hidden', 'true'); } } }

    // Profile Pic Upload
    function handleProfilePicUpload(event) { const file = event.target.files[0]; if (file && file.type.startsWith('image/')) { showLoading(true); const reader = new FileReader(); reader.onload = async (e) => { const newPicUrl = e.target.result; const success = await updateUserProfile({ profilePicUrl: newPicUrl }); if (success) { showInlineFeedback(homeMessage, "Profile picture updated! (Local preview)", "success"); } showLoading(false); }; reader.onerror = () => { showInlineFeedback(homeMessage, "Failed to read profile picture.", "error"); showLoading(false); }; reader.readAsDataURL(file); } else { alert("Please select a valid image file."); } }

    // Navigation & View Rendering
    function navigateToView(viewName) { 
        if (currentUserProfile && !currentUserProfile.isPremium && viewName !== 'premium-plan') { viewName = 'premium-plan'; }
        document.querySelectorAll('.view').forEach(view => view.classList.remove('active-view'));
        const targetView = document.getElementById(`${viewName}-view`);
        if (targetView) {
            targetView.classList.add('active-view');
            allMenuItems.forEach(mi => mi.classList.remove('active-menu-item'));
            const activeMenuItem = document.querySelector(`.menu-item[data-view="${viewName}"]`);
            if(activeMenuItem) activeMenuItem.classList.add('active-menu-item');
            if (viewName === 'earning-details' && currentUserProfile && currentUserProfile.isPremium) renderEarningDetails(); 
            if (viewName === 'history' && currentUserProfile && currentUserProfile.isPremium) renderTransactionHistory();
            if (viewName === 'withdrawal' && currentUserProfile && currentUserProfile.isPremium) withdrawableBalanceDisplay.textContent = formatCurrency(currentUserProfile.balance);
            if (viewName === 'referral' && currentUserProfile && currentUserProfile.isPremium) setupReferralSystem();
            if (viewName === 'task-receiver' && currentUserProfile && currentUserProfile.isPremium) setupTaskReceiver();
            if (viewName === 'task-submit' && currentUserProfile) setupPromoTaskView(); // Always setup promo task view
        } else { 
            const defaultView = (currentUserProfile && currentUserProfile.isPremium) ? 'home' : 'premium-plan';
            navigateToView(defaultView);
        }
    }

    // Premium Plan Activation (from Alert-Style Modal)
    async function handleAlertModalCodeSubmission() { 
        const code = alertModalCodeInput.value.trim().toUpperCase();
        if (!code) { showInlineFeedback(alertModalFeedback, "Activation code cannot be empty.", "error"); return; }
        if (!selectedPlanForActivationModal) { showInlineFeedback(alertModalFeedback, "Plan selection error.", "error"); return; }
        showLoading(true); alertModalFeedback.style.display = 'none';
        try {
            const codeSnapshot = await premiumCodesRef.child(code).once('value');
            if (!codeSnapshot.exists()) { showInlineFeedback(alertModalFeedback, 'Invalid Code', 'error'); showLoading(false); return; }
            const codeData = codeSnapshot.val();
            if (codeData.status === 'used') { showInlineFeedback(alertModalFeedback, 'Code Already Used', 'error'); showLoading(false); return; }
            const planToActivate = codeData.planType || selectedPlanForActivationModal; 
            if (!planToActivate) { showInlineFeedback(alertModalFeedback, 'Plan type could not be determined.', 'error'); showLoading(false); return; }
            const userUpdates = { isPremium: true, planType: planToActivate, premiumActivationDate: firebase.database.ServerValue.TIMESTAMP, lastTaskClaimTime: null };
            const codeUpdates = { status: 'used', usedBy: MOCK_USER_ID, usedAt: firebase.database.ServerValue.TIMESTAMP };
            await premiumCodesRef.child(code).update(codeUpdates);
            const userUpdateSuccess = await updateUserProfile(userUpdates); 
            if(userUpdateSuccess) {
                 await generateAndStoreReferralCode();
                codeInputAlertModal.style.display = 'none'; 
                showInlineFeedback(homeMessage, 'Plan Activated Successfully!', 'success', 3000);
            } else {
                await premiumCodesRef.child(code).update({ status: 'unused', usedBy: null, usedAt: null });
                showInlineFeedback(alertModalFeedback, 'Activation failed.', 'error');
            }
        } catch (error) { console.error("Error activating code from modal:", error); showInlineFeedback(alertModalFeedback, "An unexpected error occurred.", "error");
        } finally { showLoading(false); }
    }
    
    // awardReferralBonusToReferrer
    async function awardReferralBonusToReferrer(referrerCodeValue, referredUserId, referredUserPlanType) { 
         if (!referrerCodeValue) return;
        try {
            const usersSnapshot = await usersRef.orderByChild('referralCode').equalTo(referrerCodeValue).limitToFirst(1).once('value');
            if (usersSnapshot.exists()) {
                const referrerId = Object.keys(usersSnapshot.val())[0]; const referrerProfile = usersSnapshot.val()[referrerId];
                if (referrerProfile.userId === referredUserId) { console.log("User cannot refer themselves."); return; }
                if (referrerProfile && referrerProfile.isPremium) {
                    const bonusAmount = referrerProfile.planType === 'gold' ? 360 : 180;
                    const newReferrerBalance = (referrerProfile.balance || 0) + bonusAmount;
                    const transactionId = db.ref().push().key;
                    const referrerUpdates = {
                        balance: newReferrerBalance,
                        [`transactionHistory/${transactionId}`]: { type: 'referral_bonus', amount: bonusAmount, timestamp: firebase.database.ServerValue.TIMESTAMP, fromUser: referredUserId, referredUserPlan: referredUserPlanType, notes: `Bonus for referring ${referredUserId} (${referredUserPlanType} plan)` },
                        totalReferralEarnings: (referrerProfile.totalReferralEarnings || 0) + bonusAmount,
                        totalReferredUsersCount: (referrerProfile.totalReferredUsersCount || 0) + 1
                    };
                    await usersRef.child(referrerId).update(referrerUpdates); console.log(`Awarded ₹${bonusAmount} to referrer ${referrerId}`);
                }
            } else { console.log(`No referrer found with code ${referrerCodeValue}`); }
        } catch (error) { console.error("Error awarding referral bonus:", error); }
    }

    // Referral System
    async function generateAndStoreReferralCode() { if (currentUserProfile && currentUserProfile.isPremium && !currentUserProfile.referralCode) { const planPrefix = currentUserProfile.planType === 'gold' ? 'GPRO' : 'SLVR'; const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase(); const newReferralCode = `${planPrefix}${randomPart}`; await updateUserProfile({ referralCode: newReferralCode }); } }
    function setupReferralSystem() { if (currentUserProfile && currentUserProfile.isPremium && currentUserProfile.referralCode) { referralCodeText.textContent = currentUserProfile.referralCode; copyReferralCodeBtn.style.display = 'inline-flex'; const bonusTheyEarn = currentUserProfile.planType === 'gold' ? 360 : 180; referralBonusAmount.textContent = formatCurrency(bonusTheyEarn); totalReferredUsersDisplay.textContent = currentUserProfile.totalReferredUsersCount || 0; totalReferralEarningsDisplay.textContent = formatCurrency(currentUserProfile.totalReferralEarnings); } }
    function copyReferralLinkToClipboard() { if (currentUserProfile && currentUserProfile.referralCode) { navigator.clipboard.writeText(currentUserProfile.referralCode).then(() => alert(`Referral code "${currentUserProfile.referralCode}" copied!`)).catch(err => { console.error('Failed to copy: ', err); alert('Failed to copy.'); }); } }

    // Task Receiver
    function setupTaskReceiver() { 
        const taskReceiverContent = document.getElementById('task-receiver-content'); 
        if (!currentUserProfile || !currentUserProfile.isPremium) { 
            if(taskReceiverContent) taskReceiverContent.style.display = 'none'; return; 
        } 
        if(taskReceiverContent) taskReceiverContent.style.display = 'block'; 
        const plan = currentUserProfile.planType; 
        const planTextUI = plan.charAt(0).toUpperCase() + plan.slice(1); 
        userPlanTaskDisplay.textContent = planTextUI; 
        const reward = plan === 'gold' ? 650 : 325; 
        taskRewardAmountDisplay.textContent = formatCurrency(reward); 
        
        if(taskReceiverInfo) {
            taskReceiverInfo.innerHTML = `Your <strong>${planTextUI}</strong> plan is active. <br> This plan is valid for 6 months. You will receive <strong>${formatCurrency(reward)}</strong> every 15 days.`;
        }

        if (taskTimerIntervalId) clearInterval(taskTimerIntervalId); 
        updateTaskTimerDisplayLogic(); 
        taskTimerIntervalId = setInterval(updateTaskTimerDisplayLogic, 1000); 
    }
    function updateTaskTimerDisplayLogic() { 
        if (!currentUserProfile || !currentUserProfile.premiumActivationDate) { 
            taskTimerDisplay.textContent = "Plan Not Active"; claimRewardBtn.disabled = true; return; 
        } 
        const fifteenDaysInMillis = 15 * 24 * 60 * 60 * 1000; 
        let nextClaimEpoch;
        if (currentUserProfile.lastTaskClaimTime) {
            nextClaimEpoch = currentUserProfile.lastTaskClaimTime + fifteenDaysInMillis;
        } else { 
            nextClaimEpoch = currentUserProfile.premiumActivationDate + (1 * 1000); 
        }
        
        const now = Date.now(); 
        const timeLeft = nextClaimEpoch - now; 

        if (timeLeft <= 0) { 
            taskTimerDisplay.textContent = "Claim Now!"; 
            taskTimerDisplay.style.color = 'var(--success-color)'; 
            claimRewardBtn.disabled = false; 
            if (taskTimerIntervalId) { clearInterval(taskTimerIntervalId); taskTimerIntervalId = null; } 
        } else { 
            const d = Math.floor(timeLeft / (1000 * 60 * 60 * 24)); const h = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)); const m = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60)); const s = Math.floor((timeLeft % (1000 * 60)) / 1000); 
            taskTimerDisplay.textContent = `${String(d).padStart(2,'0')}d ${String(h).padStart(2,'0')}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`; 
            taskTimerDisplay.style.color = 'var(--danger-color)'; 
            claimRewardBtn.disabled = true; 
        } 
    }
    async function handleClaimReward() { 
        if (!currentUserProfile || !currentUserProfile.isPremium || claimRewardBtn.disabled) return; 
        showLoading(true); 
        const rewardAmount = currentUserProfile.planType === 'gold' ? 650 : 325; 
        const newBalance = (currentUserProfile.balance || 0) + rewardAmount; 
        const claimTimestamp = firebase.database.ServerValue.TIMESTAMP; 
        const transactionId = db.ref().push().key; 
        const updates = { 
            balance: newBalance, 
            lastTaskClaimTime: claimTimestamp, 
            [`taskClaimHistory/${Date.now()}`]: { amount: rewardAmount, plan: currentUserProfile.planType, timestamp: claimTimestamp }, 
            [`transactionHistory/${transactionId}`]: { type: 'task_reward', amount: rewardAmount, timestamp: claimTimestamp, notes: `${currentUserProfile.planType.toUpperCase()} plan task reward` } 
        }; 
        const success = await updateUserProfile(updates); 
        if (success) { 
            showInlineFeedback(taskMessage, `Reward of ${formatCurrency(rewardAmount)} claimed!`, 'success'); 
        } else { 
            showInlineFeedback(taskMessage, "Error claiming reward.", 'error'); 
        } 
        showLoading(false); 
    }

    // Earning Details
    function renderEarningDetails() { 
        earningDetailsView.innerHTML = `
            <div class="earning-main-container">
                <div class="view-header" style="border-bottom:none; margin-bottom:10px;">
                    <h1 id="earning-title" style="text-align:center;">My Earnings</h1>
                    <p style="text-align:center;">Summary of your earnings from rewards and bonuses.</p>
                </div>
                <div class="earning-grid">
                    <div class="earning-box"><h2>Today's Earnings</h2><p class="amount" id="today-earning-amount">0</p><span class="currency">₹</span></div>
                    <div class="earning-box"><h2>Yesterday's Earnings</h2><p class="amount" id="yesterday-earning-amount">0</p><span class="currency">₹</span></div>
                    <div class="earning-box"><h2>Last 7 Days Total</h2><p class="amount" id="seven-day-total-amount">0</p><span class="currency">₹</span></div>
                    <div class="earning-box"><h2>Last 30 Days Total</h2><p class="amount" id="thirty-day-total-amount">0</p><span class="currency">₹</span></div>
                </div>
            </div>`; 
        if (!currentUserProfile || !currentUserProfile.transactionHistory) { animate("today-earning-amount", 0); animate("yesterday-earning-amount", 0); animate("seven-day-total-amount", 0); animate("thirty-day-total-amount", 0); return; }
        const transactions = Object.values(currentUserProfile.transactionHistory).filter(tx => tx.amount > 0);
        const now = new Date(); const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const tomorrowStart = todayStart + (24*60*60*1000); const yesterdayStart = todayStart - (24*60*60*1000);
        const sevenDaysAgoStart = todayStart - (6*24*60*60*1000); const thirtyDaysAgoStart = todayStart - (29*24*60*60*1000);
        let todayEarningsVal = 0, yesterdayEarningsVal = 0, sevenDayTotalVal = 0, thirtyDayTotalVal = 0;
        transactions.forEach(tx => { const txTime = tx.timestamp; if (txTime >= todayStart && txTime < tomorrowStart) todayEarningsVal += tx.amount; if (txTime >= yesterdayStart && txTime < todayStart) yesterdayEarningsVal += tx.amount; if (txTime >= sevenDaysAgoStart && txTime < tomorrowStart) sevenDayTotalVal += tx.amount; if (txTime >= thirtyDaysAgoStart && txTime < tomorrowStart) thirtyDayTotalVal += tx.amount; });
        const animate = (id, end, duration = 1000) => { const el = document.getElementById(id); if (!el) return; let start = 0; const currentText = el.textContent; if (currentText && !isNaN(parseFloat(currentText))) start = parseFloat(currentText); let startTimestamp = null; const step = ts => { if (!startTimestamp) startTimestamp = ts; const progress = Math.min((ts - startTimestamp) / duration, 1); el.textContent = Math.floor(progress * (end - start) + start); if (progress < 1) window.requestAnimationFrame(step); else el.textContent = Math.floor(end); }; window.requestAnimationFrame(step); }; 
        animate("today-earning-amount", todayEarningsVal); animate("yesterday-earning-amount", yesterdayEarningsVal); 
        animate("seven-day-total-amount", sevenDayTotalVal); animate("thirty-day-total-amount", thirtyDayTotalVal); 
    }

    // Withdrawal Logic
    async function handleWithdrawalRequest(event) { event.preventDefault(); showInlineFeedback(withdrawalMessage, "Withdrawal feature is Coming Soon!", "info"); }

    // Transaction History
    function renderTransactionHistory() { transactionHistoryTableBody.innerHTML = ''; if (!currentUserProfile || !currentUserProfile.transactionHistory || Object.keys(currentUserProfile.transactionHistory).length === 0) { transactionHistoryTableBody.innerHTML = '<tr><td colspan="4" class="no-data-message">No transactions recorded yet.</td></tr>'; return; } const filter = transactionTypeFilter.value; const transactions = Object.values(currentUserProfile.transactionHistory).filter(tx => filter === 'all' || tx.type === filter).sort((a, b) => b.timestamp - a.timestamp); if(transactions.length === 0) { transactionHistoryTableBody.innerHTML = `<tr><td colspan="4" class="no-data-message">No transactions match the filter: ${filter.replace("_", " ")}.</td></tr>`; return; } transactions.forEach(tx => { const row = transactionHistoryTableBody.insertRow(); row.insertCell().textContent = formatDate(tx.timestamp); row.insertCell().textContent = tx.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); const amountCell = row.insertCell(); amountCell.textContent = formatCurrency(Math.abs(tx.amount)); amountCell.className = tx.amount > 0 ? 'amount-credit' : 'amount-debit'; row.insertCell().textContent = tx.notes || (tx.status ? `Status: ${tx.status.toUpperCase()}` : 'Completed'); }); }

    // --- Promotional Task Submit Logic ---
    let currentTaskLang = 'en';
    const taskInstructions = { en: "Create a video promoting my app and submit URL", hi: "आप मेरे ऐप के बारे में वीडियो बनाकर URL लिंक नीचे सबमिट करें। आपका लिंक जांचा जाएगा और आप इनाम जीत सकते हैं।" };
    if(translateTaskBtn) { translateTaskBtn.addEventListener('click', toggleTaskInstructionsLang); }
    function toggleTaskInstructionsLang() { currentTaskLang = currentTaskLang === 'en' ? 'hi' : 'en'; taskInstructionsText.textContent = taskInstructions[currentTaskLang]; translateTaskBtn.textContent = currentTaskLang === 'en' ? 'Convert to Hindi' : 'Convert to English'; }
    if(submitPromoUrlBtn) { submitPromoUrlBtn.addEventListener('click', handleSubmitPromoUrl); }
    async function handleSubmitPromoUrl() {
        if (!currentUserProfile || !currentUserProfile.isPremium) { showInlineFeedback(taskSubmitFeedback, "Please activate a premium plan to submit tasks.", "error"); return; }
        const url = promoUrlInput.value.trim();
        if (!url || !(url.toLowerCase().includes('instagram.com/reel/') || url.toLowerCase().includes('instagram.com/p/'))) { showInlineFeedback(taskSubmitFeedback, "Please submit a valid Instagram Reel or Post URL.", "error"); return; }
        const twentyFourHours = 24 * 60 * 60 * 1000; const now = Date.now();
        if (currentUserProfile.promoTask && currentUserProfile.promoTask.prizeClaimedAt && (now - currentUserProfile.promoTask.prizeClaimedAt < twentyFourHours)) { showInlineFeedback(taskSubmitFeedback, "You can submit a new URL after the cooldown period.", "info"); return; }
        if (currentUserProfile.promoTask && currentUserProfile.promoTask.status === 'pending_review') { showInlineFeedback(taskSubmitFeedback, "Your previous submission is still under review.", "info"); return; }
        if (currentUserProfile.promoTask && currentUserProfile.promoTask.status === 'approved') { showInlineFeedback(taskSubmitFeedback, "You have an approved task, please claim your prize first.", "info"); return; }
        showLoading(true); const submissionTimestamp = firebase.database.ServerValue.TIMESTAMP;
        const submissionIdForAdmin = `promo_${MOCK_USER_ID}_${Date.now()}`; 
        const adminSubmissionData = { userId: MOCK_USER_ID, userEmail: currentUserProfile.email || 'N/A', url: url, submittedAt: submissionTimestamp, status: 'pending_review' };
        const userPromoTaskUpdate = { url: url, submittedAt: submissionTimestamp, status: 'pending_review', prizeAmount: null, prizeClaimedAt: null, adminSubmissionId: submissionIdForAdmin };
        try {
            await adminTaskReviewsRef.child(submissionIdForAdmin).set(adminSubmissionData);
            await currentUserRef.child('promoTask').set(userPromoTaskUpdate);
            const snapshot = await currentUserRef.child('promoTask').once('value'); if(snapshot.exists()){ currentUserProfile.promoTask = snapshot.val(); }
            showInlineFeedback(taskSubmitFeedback, "URL submitted for review!", "success"); setupPromoTaskView(); 
        } catch (error) { console.error("Error submitting promo URL:", error); showInlineFeedback(taskSubmitFeedback, "Failed to submit URL.", "error");
        } finally { showLoading(false); }
    }
    function setupPromoTaskView() {
        if (!currentUserProfile) return; 
        const promoTask = currentUserProfile.promoTask;
        urlSubmissionGroup.style.display = 'none'; submissionStatusGroup.style.display = 'none'; receivePromoPrizeBtn.style.display = 'none';
        receivePromoPrizeBtn.disabled = true; receivePromoPrizeBtn.classList.remove('can-claim'); prizeWonMessage.style.display = 'none';
        nextSubmissionTimerDisplay.style.display = 'none'; if (promoTaskTimerIntervalId) clearInterval(promoTaskTimerIntervalId);
        if (!currentUserProfile.isPremium) { submissionStatusGroup.style.display = 'block'; submissionStatusMessage.textContent = "Activate a premium plan to participate."; return; }
        if (promoTask) {
            const twentyFourHours = 24 * 60 * 60 * 1000; const now = Date.now();
            if (promoTask.status === 'prize_claimed' && promoTask.prizeClaimedAt && (now - promoTask.prizeClaimedAt < twentyFourHours)) {
                submissionStatusGroup.style.display = 'block'; submissionStatusMessage.textContent = "You've recently claimed a prize for this task.";
                prizeWonMessage.textContent = `You won: ${formatCurrency(promoTask.prizeAmount || 0)}`; prizeWonMessage.style.display = 'block';
                updatePromoTaskCooldownTimer(promoTask.prizeClaimedAt + twentyFourHours);
                promoTaskTimerIntervalId = setInterval(() => updatePromoTaskCooldownTimer(promoTask.prizeClaimedAt + twentyFourHours), 1000);
            } else if (promoTask.status === 'approved' && promoTask.prizeAmount != null) {
                submissionStatusGroup.style.display = 'block'; submissionStatusMessage.textContent = "Your submission has been approved!";
                receivePromoPrizeBtn.disabled = false; receivePromoPrizeBtn.classList.add('can-claim'); receivePromoPrizeBtn.style.display = 'inline-flex';
            } else if (promoTask.status === 'pending_review') {
                submissionStatusGroup.style.display = 'block'; submissionStatusMessage.textContent = "Your submission is under review. Please wait.";
            } else if (promoTask.status === 'rejected') {
                submissionStatusGroup.style.display = 'block'; submissionStatusMessage.textContent = "Your previous submission was not approved. You can try submitting a new URL.";
                urlSubmissionGroup.style.display = 'block'; promoUrlInput.value = '';
            } else { urlSubmissionGroup.style.display = 'block'; promoUrlInput.value = ''; }
        } else { urlSubmissionGroup.style.display = 'block'; }
    }
    function updatePromoTaskCooldownTimer(endTime) {
        const now = Date.now(); const timeLeft = endTime - now;
        if (timeLeft <= 0) {
            nextSubmissionTimerDisplay.textContent = "You can submit a new task now!"; nextSubmissionTimerDisplay.style.color = 'var(--success-color)';
            if (promoTaskTimerIntervalId) clearInterval(promoTaskTimerIntervalId); setupPromoTaskView(); 
        } else {
            const h = Math.floor((timeLeft % (24*60*60*1000)) / (60*60*1000)); const m = Math.floor((timeLeft % (60*60*1000)) / (60*1000)); const s = Math.floor((timeLeft % (60*1000)) / 1000);
            nextSubmissionTimerDisplay.textContent = `Next submission in: ${String(h).padStart(2,'0')}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`;
            nextSubmissionTimerDisplay.style.display = 'block'; nextSubmissionTimerDisplay.style.color = 'var(--danger-color)';
        }
    }
    if(receivePromoPrizeBtn) { receivePromoPrizeBtn.addEventListener('click', handleReceivePromoPrize); }
    async function handleReceivePromoPrize() {
        if (!currentUserProfile || !currentUserProfile.promoTask || currentUserProfile.promoTask.status !== 'approved' || currentUserProfile.promoTask.prizeAmount == null) { showInlineFeedback(taskSubmitFeedback, "Prize cannot be claimed now.", "error"); return; }
        showLoading(true); const prize = currentUserProfile.promoTask.prizeAmount; const newBalance = (currentUserProfile.balance || 0) + prize;
        const transactionId = db.ref().push().key; const claimTime = firebase.database.ServerValue.TIMESTAMP;
        const updates = {
            balance: newBalance, [`promoTask/status`]: 'prize_claimed', [`promoTask/prizeClaimedAt`]: claimTime,
            [`transactionHistory/${transactionId}`]: { type: 'promo_task_prize', amount: prize, timestamp: claimTime, notes: `Prize for promo video (URL: ${currentUserProfile.promoTask.url.slice(0,30)}...)` }
        };
        const success = await updateUserProfile(updates);
        if (success) { alert(`Congratulations! You have received ${formatCurrency(prize)}`); } 
        else { showInlineFeedback(taskSubmitFeedback, "Failed to claim prize.", "error"); }
        showLoading(false);
    }

    // --- Start the App ---
    initializeApp();
});
// --- END OF MAIN SCRIPT.JS LOGIC ---
</script>
</body>
</html>