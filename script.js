document.addEventListener('DOMContentLoaded', function() {
    // 更新所有到期時間的顯示
    function updateExpireTimes() {
        const expireElements = document.querySelectorAll('.expire-time');
        
        expireElements.forEach(element => {
            const expireTime = new Date(element.dataset.expire);
            const now = new Date();
            
            if (now >= expireTime) {
                element.textContent = '已過期';
                element.style.color = '#ff4444';
            } else {
                const hours = expireTime.getHours().toString().padStart(2, '0');
                const minutes = expireTime.getMinutes().toString().padStart(2, '0');
                element.textContent = `${hours}:${minutes} 到期`;
            }
        });
    }

    // 初次執行
    updateExpireTimes();
    
    // 每分鐘更新一次
    setInterval(updateExpireTimes, 60000);

    // 記帳相關的數據結構
    const accountingData = {
        currentExp: 450,
        maxExp: 1000,
        records: [],
        baseExpGain: 50, // 基礎經驗值
        criticalRate: 0.1, // 爆擊率 10%
        criticalMultiplier: 2, // 爆擊倍率
        playerLevel: 1,
        availablePoints: 0,
        stats: {
            finance: 15,
            saving: 25,
            invest: 18
        },
        tempStats: {
            finance: 0,
            saving: 0,
            invest: 0
        }
    };

    // 更新經驗值顯示
    function updateExpDisplay() {
        const expFill = document.querySelector('.exp-fill');
        const expText = document.querySelector('.exp-bar span');
        const percentage = (accountingData.currentExp / accountingData.maxExp) * 100;
        
        expFill.style.width = `${percentage}%`;
        expText.textContent = `EXP: ${accountingData.currentExp}/${accountingData.maxExp}`;
    }

    // 添加記帳記錄
    function addRecord(amount, category, note, date) {
        const record = {
            id: Date.now(),
            amount: amount,
            category: category,
            note: note,
            date: date,
            isCritical: Math.random() < accountingData.criticalRate
        };

        // 計算獲得的經驗值
        let expGain = accountingData.baseExpGain;
        if (record.isCritical) {
            expGain *= accountingData.criticalMultiplier;
        }

        // 更新經驗值
        accountingData.currentExp += expGain;
        if (accountingData.currentExp >= accountingData.maxExp) {
            levelUp();
        } else {
            updateExpDisplay();
        }

        // 更新UI
        displayRecord(record, expGain);
        
        // 保存記錄
        accountingData.records.unshift(record);
        saveToLocalStorage();
    }

    // 顯示記錄在UI上
    function displayRecord(record, expGain, showExpAnimation = true) {
        const recordsList = document.getElementById('recordsList');
        const recordElement = document.createElement('div');
        recordElement.className = 'record-item new';
        
        recordElement.innerHTML = `
            <div class="record-info">
                <span class="date">${record.date}</span>
                <span class="category">${record.category}</span>
                ${record.note ? `<span class="note"> - ${record.note}</span>` : ''}
                <span class="amount">-${record.amount}</span>
            </div>
        `;

        recordsList.insertBefore(recordElement, recordsList.firstChild);

        // 只在新增記錄時顯示經驗值動畫
        if (showExpAnimation && expGain > 0) {
            const expBar = document.querySelector('.exp-bar');
            const expGainElement = document.createElement('div');
            expGainElement.className = `exp-gain ${record.isCritical ? 'critical' : ''}`;
            expGainElement.textContent = record.isCritical ? `爆擊! +${expGain} EXP` : `+${expGain} EXP`;
            expBar.appendChild(expGainElement);

            setTimeout(() => {
                expGainElement.remove();
            }, 2000);
        }

        // 移除新記錄的動畫類別
        setTimeout(() => {
            recordElement.classList.remove('new');
        }, 500);
    }

    // 保存到本地存儲
    function saveToLocalStorage() {
        localStorage.setItem('accountingData', JSON.stringify(accountingData));
    }

    // 從本地存儲加載數據
    function loadFromLocalStorage() {
        const saved = localStorage.getItem('accountingData');
        if (saved) {
            const savedData = JSON.parse(saved);
            Object.assign(accountingData, savedData);
            updateExpDisplay();
            // 更新可用點數顯示
            document.getElementById('availablePoints').textContent = accountingData.availablePoints;
            // 更新所有能力值顯示
            Object.entries(accountingData.stats).forEach(([stat, value]) => {
                document.getElementById(`${stat}Level`).textContent = value;
            });
            // 更新加點按鈕狀態
            updateAddPointButtons();
            // 顯示最近的記錄
            accountingData.records.slice(0, 5).forEach(record => {
                displayRecord(record, 0);
            });
        }
    }

    // 綁定記帳按鈕事件
    document.getElementById('recordBtn').addEventListener('click', function() {
        const amount = parseFloat(document.getElementById('amount').value);
        const category = document.getElementById('category').value;
        const note = document.getElementById('note').value;
        const date = document.getElementById('recordDate').value;

        if (!date) {
            alert('請選擇日期！');
            return;
        }

        if (amount && amount > 0) {
            addRecord(amount, category, note, date);
            // 清空輸入
            document.getElementById('amount').value = '';
            document.getElementById('note').value = '';
        } else {
            alert('請輸入有效金額！');
        }
    });

    // 初始化
    loadFromLocalStorage();

    // 添加升級相關函數
    function levelUp() {
        accountingData.playerLevel++;
        accountingData.availablePoints += 3; // 每次升級獲得3點能力點數
        accountingData.maxExp = Math.floor(accountingData.maxExp * 1.2); // 提高下一級所需經驗
        accountingData.currentExp = 0; // 重置當前經驗值為0
        
        // 更新UI
        document.getElementById('playerLevel').textContent = accountingData.playerLevel;
        document.getElementById('availablePoints').textContent = accountingData.availablePoints;
        updateExpDisplay(); // 更新經驗值顯示
        
        // 啟用加點按鈕
        updateAddPointButtons();
        
        // 顯示升級動畫
        const levelElement = document.getElementById('playerLevel');
        levelElement.classList.add('level-up');
        setTimeout(() => levelElement.classList.remove('level-up'), 500);
        
        // 顯示升級提示
        showLevelUpNotification();
        
        // 保存更新後的數據
        saveToLocalStorage();
    }

    // 更新加點按鈕狀態
    function updateAddPointButtons() {
        const buttons = document.querySelectorAll('.add-point-btn');
        buttons.forEach(btn => {
            if (accountingData.availablePoints > 0) {
                btn.classList.add('active');
                btn.disabled = false;
            } else {
                btn.classList.remove('active');
                btn.disabled = true;
            }
        });
    }

    // 初始化加點系統
    function initStatSystem() {
        const stats = document.querySelectorAll('.stat');
        const confirmContainer = document.querySelector('.confirm-buttons-container');
        const confirmAllBtn = document.querySelector('.confirm-all');
        const cancelAllBtn = document.querySelector('.cancel-all');
        
        // 重置臨時狀態
        function resetTempStats() {
            accountingData.tempStats = {
                finance: 0,
                saving: 0,
                invest: 0
            };
            // 移除所有臨時顯示
            document.querySelectorAll('.temp-point').forEach(el => {
                el.textContent = '';
            });
            confirmContainer.classList.add('hidden');
        }

        // 更新可用點數顯示
        function updateAvailablePoints() {
            document.getElementById('availablePoints').textContent = accountingData.availablePoints;
        }

        // 更新臨時點數顯示
        function updateTempDisplay(statType) {
            const statElement = document.querySelector(`#${statType}Level`).nextElementSibling;
            
            if (accountingData.tempStats[statType] > 0) {
                statElement.textContent = `+${accountingData.tempStats[statType]}`;
            } else {
                statElement.textContent = '';
            }
            updateAvailablePoints(); // 即時更新可用點數
        }

        stats.forEach(stat => {
            const addBtn = stat.querySelector('.add-point-btn');
            const statType = addBtn.dataset.stat;

            addBtn.addEventListener('click', () => {
                if (accountingData.availablePoints > 0) {
                    // 防止重複點擊
                    if (!addBtn.disabled) {
                        accountingData.tempStats[statType]++;
                        accountingData.availablePoints--;
                        updateTempDisplay(statType);
                        confirmContainer.classList.remove('hidden');
                        updateAddPointButtons();
                        
                        // 暫時禁用按鈕，防止連續快速點擊
                        addBtn.disabled = true;
                        setTimeout(() => {
                            addBtn.disabled = false;
                        }, 100);
                    }
                }
            });
        });

        // 確認所有加點
        confirmAllBtn.addEventListener('click', () => {
            Object.entries(accountingData.tempStats).forEach(([stat, points]) => {
                accountingData.stats[stat] += points;
                document.getElementById(`${stat}Level`).textContent = accountingData.stats[stat];
                
                // 更新理財等級帶來的經驗值加成
                if (stat === 'finance') {
                    accountingData.baseExpGain = 50 + (accountingData.stats.finance - 15) * 5;
                }
            });
            
            resetTempStats();
            updateAvailablePoints(); // 確保更新可用點數顯示
            saveToLocalStorage();
        });

        // 取消所有加點
        cancelAllBtn.addEventListener('click', () => {
            // 返還所有臨時分配的點數
            accountingData.availablePoints += Object.values(accountingData.tempStats)
                .reduce((sum, points) => sum + points, 0);
            resetTempStats();
            updateAvailablePoints(); // 更新可用點數顯示
            updateAddPointButtons();
        });

        // 初始化顯示
        document.getElementById('playerLevel').textContent = accountingData.playerLevel;
        updateAvailablePoints();
        updateAddPointButtons();
    }

    // 顯示升級提示
    function showLevelUpNotification() {
        const notification = document.createElement('div');
        notification.className = 'level-up-notification';
        notification.textContent = `恭喜升級！獲得3點能力點數！`;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    initStatSystem();

    // 在 DOMContentLoaded 事件中添加
    function initAvatarUpload() {
        const avatarContainer = document.querySelector('.character-avatar');
        const fileInput = document.getElementById('avatarUpload');
        const avatarImage = document.getElementById('avatarImage');

        // 點擊頭像區域時觸發文件選擇
        avatarContainer.addEventListener('click', () => {
            fileInput.click();
        });

        // 處理文件選擇
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                // 檢查文件類型
                const validTypes = ['image/jpeg', 'image/png'];
                if (!validTypes.includes(file.type)) {
                    alert('只能上傳 JPG 或 PNG 格式的圖片！');
                    fileInput.value = ''; // 清空選擇
                    return;
                }

                // 檢查文件大小（限制為 5MB）
                if (file.size > 5 * 1024 * 1024) {
                    alert('圖片大小不能超過 5MB！');
                    fileInput.value = ''; // 清空選擇
                    return;
                }

                const reader = new FileReader();
                reader.onload = (event) => {
                    // 更新頭像顯示
                    avatarImage.src = event.target.result;
                    
                    // 保存到 localStorage
                    localStorage.setItem('userAvatar', event.target.result);
                };
                reader.readAsDataURL(file);
            }
        });

        // 從 localStorage 加載保存的頭像
        const savedAvatar = localStorage.getItem('userAvatar');
        if (savedAvatar) {
            avatarImage.src = savedAvatar;
        }
    }

    // 在初始化時調用
    initAvatarUpload();

    // 設定日期選擇器的預設值為今天
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('recordDate').value = today;

    // 在 DOMContentLoaded 事件中添加
    function initDateFilter() {
        const startDate = document.getElementById('startDate');
        const endDate = document.getElementById('endDate');
        const filterBtn = document.getElementById('filterBtn');

        // 設置初始日期範圍（預設顯示本月）
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        
        startDate.value = firstDayOfMonth.toISOString().split('T')[0];
        endDate.value = today.toISOString().split('T')[0];

        // 篩選記錄
        function filterRecords() {
            const start = new Date(startDate.value);
            const end = new Date(endDate.value);
            end.setHours(23, 59, 59); // 設置結束日期為當天最後一刻

            // 清空現有記錄
            const recordsList = document.getElementById('recordsList');
            recordsList.innerHTML = '';

            // 篩選並顯示符合日期範圍的記錄
            const filteredRecords = accountingData.records.filter(record => {
                const recordDate = new Date(record.date);
                return recordDate >= start && recordDate <= end;
            });

            // 顯示篩選後的記錄
            filteredRecords.forEach(record => {
                displayRecord(record, 0, false); // 添加第三個參數來控制是否顯示經驗值動畫
            });

            // 如果沒有記錄，顯示提示
            if (filteredRecords.length === 0) {
                const noRecordMsg = document.createElement('div');
                noRecordMsg.className = 'no-record-message';
                noRecordMsg.textContent = '此期間沒有記錄';
                recordsList.appendChild(noRecordMsg);
            }
        }

        // 綁定查詢按鈕事件
        filterBtn.addEventListener('click', filterRecords);
    }

    // 在初始化時調用
    initDateFilter();
}); 